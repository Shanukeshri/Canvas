import { SoundTrack } from '@/types';

interface ActiveTrack {
  trackId: string;
  gainNode: GainNode;
  baseVolumeScalar: number;
  sourceNodes: AudioNode[];
  cleanup: () => void;
}

export class WebAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private activeTracks: Map<string, ActiveTrack> = new Map();
  private desiredTracks: Set<string> = new Set();
  private sessionCounters: Map<string, number> = new Map();
  private audioBufferCache: Map<string, AudioBuffer> = new Map();
  private bufferLoadingPromises: Map<string, Promise<AudioBuffer>> = new Map();
  private isMuted: boolean = false;
  private masterVolume: number = 0.8;
  private workletLoaded: boolean = false;
  private workletLoadingPromise: Promise<void> | null = null;

  /**
   * Lazy single AudioContext initializer.
   * Master Pipeline:
   * Track Source -> Track Gain -> Master Gain -> DynamicsCompressor -> Destination
   */
  public initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Master Gain Node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : this.masterVolume,
        this.ctx.currentTime
      );

      // Dynamics Compressor (Limiter) to prevent clipping when stacking multiple tracks
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      // Pre-warm static buffers in background
      this.preloadNatureBuffers();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch((e) => console.warn('Could not resume AudioContext:', e));
    }

    return this.ctx;
  }

  private preloadNatureBuffers() {
    if (!this.ctx) return;
    const files = ['/audio/rain.opus', '/audio/ocean.opus', '/audio/fireplace.opus'];
    files.forEach((src) => {
      this.loadAudioBuffer(this.ctx!, src).catch(() => {});
    });
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.masterVolume,
        this.ctx.currentTime,
        0.05
      );
    }
  }

  public toggleMute(muted?: boolean): boolean {
    this.isMuted = muted !== undefined ? muted : !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.masterVolume,
        this.ctx.currentTime,
        0.05
      );
    }
    return this.isMuted;
  }

  public setTrackVolume(trackId: string, volumePercent: number) {
    const track = this.activeTracks.get(trackId);
    if (track && this.ctx) {
      const targetGain = Math.max(0, Math.min(1, volumePercent / 100)) * track.baseVolumeScalar;
      track.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      track.gainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Main playback dispatcher.
   */
  public async playTrack(track: SoundTrack) {
    const ctx = this.initContext();

    // 1. Mark this track as desired to be playing
    this.desiredTracks.add(track.id);

    // 2. Increment session counter to cancel any in-flight loads
    const sessionId = (this.sessionCounters.get(track.id) || 0) + 1;
    this.sessionCounters.set(track.id, sessionId);

    // 3. Immediately stop any active node for this track to prevent duplicates
    this.stopTrackNodesImmediately(track.id);

    // 4. Create dedicated track gain node
    const gainNode = ctx.createGain();
    const baseScalar = this.getBaseScalarForTrack(track);
    const targetGain = Math.max(0, Math.min(1, track.volume / 100)) * baseScalar;

    gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
    gainNode.connect(this.masterGain!);

    try {
      if (track.type === 'file' && track.src) {
        await this.playNatureFileSound(ctx, track.src, track.id, gainNode, targetGain, baseScalar, sessionId);
      } else if (track.type === 'noise' && track.noiseType) {
        await this.playNoiseSound(ctx, track.noiseType, track.id, gainNode, targetGain, baseScalar, sessionId);
      } else if (track.type === 'binaural') {
        const beatFreq = track.frequency || (track.id === 'gamma' ? 40 : track.id === 'theta' ? 6 : 10);
        this.playBinauralBeat(ctx, beatFreq, track.id, gainNode, targetGain, baseScalar, sessionId);
      } else if (track.type === 'tone') {
        const freq = track.frequency || 852;
        this.playPureTone(ctx, freq, track.id, gainNode, targetGain, baseScalar, sessionId);
      }
    } catch (err) {
      console.error(`Failed to play track ${track.name} (${track.id}):`, err);
      try {
        gainNode.disconnect();
      } catch {}
    }
  }

  public stopTrack(trackId: string) {
    // 1. Mark as no longer desired to play & cancel in-flight loads
    this.desiredTracks.delete(trackId);
    this.sessionCounters.set(trackId, (this.sessionCounters.get(trackId) || 0) + 1);

    // 2. Fetch and remove active track
    const active = this.activeTracks.get(trackId);
    if (!active) return;
    this.activeTracks.delete(trackId);

    // 3. Immediate smooth audio fade out
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        active.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        const currentGain = active.gainNode.gain.value;
        active.gainNode.gain.setValueAtTime(currentGain, this.ctx.currentTime);
        active.gainNode.gain.linearRampToValueAtTime(0.00001, this.ctx.currentTime + 0.08);
      } catch {}
    }

    // 4. Schedule source stop on audio clock
    if (this.ctx) {
      const stopTime = this.ctx.currentTime + 0.09;
      active.sourceNodes.forEach((node) => {
        if ('stop' in node && typeof (node as any).stop === 'function') {
          try {
            (node as any).stop(stopTime);
          } catch {}
        }
      });
    }

    // 5. Cleanup connections
    setTimeout(() => {
      try {
        active.cleanup();
        active.gainNode.disconnect();
      } catch {}
    }, 100);
  }

  private stopTrackNodesImmediately(trackId: string) {
    const active = this.activeTracks.get(trackId);
    if (!active) return;
    this.activeTracks.delete(trackId);
    try {
      if (this.ctx) {
        active.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        active.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      active.cleanup();
      active.gainNode.disconnect();
    } catch {}
  }

  public stopAll() {
    this.desiredTracks.clear();
    const ids = Array.from(this.activeTracks.keys());
    for (const id of ids) {
      this.stopTrack(id);
    }
  }

  public isTrackPlaying(trackId: string): boolean {
    return this.activeTracks.has(trackId);
  }

  // --- Track Type Implementations ---

  /**
   * 1. Nature Sounds: Decodes static .opus audio files into AudioBuffers and loops them seamlessly.
   */
  private async playNatureFileSound(
    ctx: AudioContext,
    src: string,
    trackId: string,
    gainNode: GainNode,
    targetGain: number,
    baseScalar: number,
    sessionId: number
  ) {
    const buffer = await this.loadAudioBuffer(ctx, src);

    // Abort if user clicked Pause while loading
    if (this.sessionCounters.get(trackId) !== sessionId || !this.desiredTracks.has(trackId)) {
      try {
        gainNode.disconnect();
      } catch {}
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    source.connect(gainNode);
    source.start();

    // Smooth fade in
    gainNode.gain.cancelScheduledValues(ctx.currentTime);
    gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.15);

    this.activeTracks.set(trackId, {
      trackId,
      gainNode,
      baseVolumeScalar: baseScalar,
      sourceNodes: [source],
      cleanup: () => {
        try {
          source.stop();
          source.disconnect();
        } catch {}
      },
    });
  }

  /**
   * 2. Noise: Generates White, Pink, or Brown noise via AudioWorklet with seamless continuous buffer fallback.
   */
  private async playNoiseSound(
    ctx: AudioContext,
    noiseType: 'white' | 'pink' | 'brown',
    trackId: string,
    gainNode: GainNode,
    targetGain: number,
    baseScalar: number,
    sessionId: number
  ) {
    await this.ensureWorklet(ctx);

    if (this.sessionCounters.get(trackId) !== sessionId || !this.desiredTracks.has(trackId)) {
      try {
        gainNode.disconnect();
      } catch {}
      return;
    }

    let sourceNodes: AudioNode[] = [];
    let cleanup: () => void;

    if (this.workletLoaded && typeof AudioWorkletNode !== 'undefined') {
      try {
        const workletNode = new AudioWorkletNode(ctx, 'noise-processor', {
          processorOptions: { type: noiseType },
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [2],
        });

        // Crucial fix: connect a ConstantSourceNode(0) into worklet input to prevent Chromium GC/sleep
        const dummyInput = ctx.createConstantSource();
        dummyInput.offset.setValueAtTime(0, ctx.currentTime);
        dummyInput.connect(workletNode);
        dummyInput.start();

        workletNode.connect(gainNode);
        sourceNodes = [dummyInput, workletNode];

        cleanup = () => {
          try {
            dummyInput.stop();
            dummyInput.disconnect();
          } catch {}
          try {
            workletNode.disconnect();
          } catch {}
        };
      } catch {
        const fallback = this.createSeamlessNoiseSource(ctx, noiseType);
        fallback.source.connect(gainNode);
        sourceNodes = [fallback.source];
        cleanup = fallback.cleanup;
      }
    } else {
      const fallback = this.createSeamlessNoiseSource(ctx, noiseType);
      fallback.source.connect(gainNode);
      sourceNodes = [fallback.source];
      cleanup = fallback.cleanup;
    }

    gainNode.gain.cancelScheduledValues(ctx.currentTime);
    gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.15);

    this.activeTracks.set(trackId, {
      trackId,
      gainNode,
      baseVolumeScalar: baseScalar,
      sourceNodes,
      cleanup,
    });
  }

  /**
   * 3. Binaural Beats: Stereo separation using ChannelMerger.
   * Left Ear = 200 Hz, Right Ear = 200 + beatFrequency Hz.
   */
  private playBinauralBeat(
    ctx: AudioContext,
    beatFrequency: number,
    trackId: string,
    gainNode: GainNode,
    targetGain: number,
    baseScalar: number,
    sessionId: number
  ) {
    if (this.sessionCounters.get(trackId) !== sessionId || !this.desiredTracks.has(trackId)) {
      try {
        gainNode.disconnect();
      } catch {}
      return;
    }

    const baseFrequency = 200;

    const leftOsc = ctx.createOscillator();
    const rightOsc = ctx.createOscillator();

    leftOsc.type = 'sine';
    rightOsc.type = 'sine';

    leftOsc.frequency.setValueAtTime(baseFrequency, ctx.currentTime);
    rightOsc.frequency.setValueAtTime(baseFrequency + beatFrequency, ctx.currentTime);

    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    leftGain.gain.setValueAtTime(0.5, ctx.currentTime);
    rightGain.gain.setValueAtTime(0.5, ctx.currentTime);

    // Stereo channel merger (Channel 0 = Left, Channel 1 = Right)
    const merger = ctx.createChannelMerger(2);

    leftOsc.connect(leftGain);
    leftGain.connect(merger, 0, 0); // Left channel

    rightOsc.connect(rightGain);
    rightGain.connect(merger, 0, 1); // Right channel

    merger.connect(gainNode);

    leftOsc.start();
    rightOsc.start();

    gainNode.gain.cancelScheduledValues(ctx.currentTime);
    gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.15);

    this.activeTracks.set(trackId, {
      trackId,
      gainNode,
      baseVolumeScalar: baseScalar,
      sourceNodes: [leftOsc, rightOsc],
      cleanup: () => {
        try {
          leftOsc.stop();
          leftOsc.disconnect();
        } catch {}
        try {
          rightOsc.stop();
          rightOsc.disconnect();
        } catch {}
        try {
          leftGain.disconnect();
          rightGain.disconnect();
          merger.disconnect();
        } catch {}
      },
    });
  }

  /**
   * 4. Solfeggio 852 Hz Tone: Pure mono/stereo sine oscillator tone.
   */
  private playPureTone(
    ctx: AudioContext,
    frequency: number,
    trackId: string,
    gainNode: GainNode,
    targetGain: number,
    baseScalar: number,
    sessionId: number
  ) {
    if (this.sessionCounters.get(trackId) !== sessionId || !this.desiredTracks.has(trackId)) {
      try {
        gainNode.disconnect();
      } catch {}
      return;
    }

    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    oscillator.connect(gainNode);
    oscillator.start();

    gainNode.gain.cancelScheduledValues(ctx.currentTime);
    gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.15);

    this.activeTracks.set(trackId, {
      trackId,
      gainNode,
      baseVolumeScalar: baseScalar,
      sourceNodes: [oscillator],
      cleanup: () => {
        try {
          oscillator.stop();
          oscillator.disconnect();
        } catch {}
      },
    });
  }

  // --- Helpers & Caching ---

  private getBaseScalarForTrack(track: SoundTrack): number {
    if (track.type === 'tone') return 0.15;
    if (track.type === 'binaural') return 0.2;
    if (track.type === 'noise') return 0.8;
    return 1.0;
  }

  private async loadAudioBuffer(ctx: AudioContext, src: string): Promise<AudioBuffer> {
    const cached = this.audioBufferCache.get(src);
    if (cached) return cached;

    const existingPromise = this.bufferLoadingPromises.get(src);
    if (existingPromise) return existingPromise;

    const loadPromise = (async () => {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Failed to load audio from ${src}: HTTP ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      this.audioBufferCache.set(src, decoded);
      this.bufferLoadingPromises.delete(src);
      return decoded;
    })();

    this.bufferLoadingPromises.set(src, loadPromise);
    return loadPromise;
  }

  private async ensureWorklet(ctx: AudioContext): Promise<void> {
    if (this.workletLoaded) return;
    if (!this.workletLoadingPromise && ctx.audioWorklet) {
      this.workletLoadingPromise = ctx.audioWorklet
        .addModule('/audio/noise-processor.js')
        .then(() => {
          this.workletLoaded = true;
        })
        .catch((err) => {
          console.warn('Could not register noise-processor AudioWorklet, using seamless buffer generator:', err);
          this.workletLoaded = false;
        });
    }
    if (this.workletLoadingPromise) {
      await this.workletLoadingPromise;
    }
  }

  private createSeamlessNoiseSource(
    ctx: AudioContext,
    type: 'white' | 'pink' | 'brown'
  ): { source: AudioBufferSourceNode; cleanup: () => void } {
    const duration = 6;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let lastBrownLeft = 0.0;
    let lastBrownRight = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const wL = Math.random() * 2 - 1;
      const wR = Math.random() * 2 - 1;

      if (type === 'white') {
        left[i] = wL * 0.25;
        right[i] = wR * 0.25;
      } else if (type === 'pink') {
        b0 = 0.99886 * b0 + wL * 0.0555179;
        b1 = 0.99332 * b1 + wL * 0.0750759;
        b2 = 0.969 * b2 + wL * 0.153852;
        b3 = 0.8665 * b3 + wL * 0.3104856;
        b4 = 0.55 * b4 + wL * 0.5329522;
        b5 = -0.7616 * b5 - wL * 0.016898;
        left[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + wL * 0.5362) * 0.11;
        right[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + wR * 0.5362) * 0.11;
        b6 = wL * 0.115926;
      } else if (type === 'brown') {
        lastBrownLeft = (lastBrownLeft + 0.02 * wL) / 1.02;
        lastBrownRight = (lastBrownRight + 0.02 * wR) / 1.02;
        left[i] = lastBrownLeft * 3.2;
        right[i] = lastBrownRight * 3.2;
      }
    }

    // Crossfade loop boundaries (0.25s) to guarantee zero click on loop
    const fadeSamples = Math.floor(ctx.sampleRate * 0.25);
    for (let i = 0; i < fadeSamples; i++) {
      const ratio = i / fadeSamples;
      const endIdx = bufferSize - fadeSamples + i;
      left[endIdx] = left[endIdx] * (1 - ratio) + left[i] * ratio;
      right[endIdx] = right[endIdx] * (1 - ratio) + right[i] * ratio;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.start();

    return {
      source,
      cleanup: () => {
        try {
          source.stop();
          source.disconnect();
        } catch {}
      },
    };
  }

  public playTing() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.5);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain!);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.5);
  }
}

export const audioEngine = typeof window !== 'undefined' ? new WebAudioEngine() : null;
