export interface AudioTrackConfig {
  id: string;
  name: string;
  category: 'Nature' | 'Ambient' | 'Noise';
  type: 'white' | 'pink' | 'brown' | 'rain' | 'fireplace' | 'ocean' | 'library' | 'cafe';
  volume: number; // 0 to 100
  isPlaying: boolean;
  blobUrl?: string;
}

class ZenAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: Map<
    string,
    {
      gainNode: GainNode;
      sourceNode?: AudioNode;
      cleanup?: () => void;
    }
  > = new Map();
  private isMuted: boolean = false;
  private masterVolume: number = 0.8;

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
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

  public toggleMute(muted?: boolean) {
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
    const entry = this.activeNodes.get(trackId);
    if (entry && this.ctx) {
      const gain = Math.max(0, Math.min(1, volumePercent / 100));
      entry.gainNode.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.05);
    }
  }

  public playTrack(track: AudioTrackConfig) {
    const ctx = this.initContext();
    this.stopTrack(track.id);

    const gainNode = ctx.createGain();
    const gain = Math.max(0, Math.min(1, track.volume / 100));
    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.connect(this.masterGain!);

    if (track.type === 'white') {
      const noise = this.createWhiteNoiseNode(ctx);
      noise.connect(gainNode);
      this.activeNodes.set(track.id, {
        gainNode,
        sourceNode: noise,
        cleanup: () => {
          noise.stop();
          noise.disconnect();
        },
      });
    } else if (track.type === 'pink') {
      const noise = this.createPinkNoiseNode(ctx);
      noise.connect(gainNode);
      this.activeNodes.set(track.id, {
        gainNode,
        sourceNode: noise,
        cleanup: () => {
          noise.stop();
          noise.disconnect();
        },
      });
    } else if (track.type === 'brown') {
      const noise = this.createBrownNoiseNode(ctx);
      noise.connect(gainNode);
      this.activeNodes.set(track.id, {
        gainNode,
        sourceNode: noise,
        cleanup: () => {
          noise.stop();
          noise.disconnect();
        },
      });
    } else {
      // Procedural synthetic ambient simulation or audio source fallback
      const ambientNode = this.createProceduralAmbient(ctx, track.type);
      ambientNode.connect(gainNode);
      this.activeNodes.set(track.id, {
        gainNode,
        sourceNode: ambientNode,
        cleanup: () => {
          if ('stop' in ambientNode) (ambientNode as AudioBufferSourceNode).stop();
          ambientNode.disconnect();
        },
      });
    }
  }

  public stopTrack(trackId: string) {
    const entry = this.activeNodes.get(trackId);
    if (entry) {
      if (entry.cleanup) {
        entry.cleanup();
      }
      entry.gainNode.disconnect();
      this.activeNodes.delete(trackId);
    }
  }

  public stopAll() {
    for (const trackId of Array.from(this.activeNodes.keys())) {
      this.stopTrack(trackId);
    }
  }

  // --- Procedural Generators ---

  private createWhiteNoiseNode(ctx: AudioContext): AudioBufferSourceNode {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.start();
    return source;
  }

  private createPinkNoiseNode(ctx: AudioContext): AudioBufferSourceNode {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.start();
    return source;
  }

  private createBrownNoiseNode(ctx: AudioContext): AudioBufferSourceNode {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Gain boost for brown noise
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.start();
    return source;
  }

  private createProceduralAmbient(
    ctx: AudioContext,
    type: 'rain' | 'fireplace' | 'ocean' | 'library' | 'cafe'
  ): AudioNode {
    // Generate filtered atmospheric noise tailored to the ambient type
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    let lastLeft = 0;
    let lastRight = 0;
    for (let i = 0; i < bufferSize; i++) {
      const wL = Math.random() * 2 - 1;
      const wR = Math.random() * 2 - 1;
      if (type === 'rain') {
        left[i] = (lastLeft + 0.08 * wL) / 1.08;
        right[i] = (lastRight + 0.08 * wR) / 1.08;
      } else if (type === 'ocean') {
        const swell = (Math.sin(i / (ctx.sampleRate * 0.4)) + 1) * 0.5;
        left[i] = ((lastLeft + 0.03 * wL) / 1.03) * (0.6 + swell * 0.4);
        right[i] = ((lastRight + 0.03 * wR) / 1.03) * (0.6 + swell * 0.4);
      } else if (type === 'fireplace') {
        const crackle = Math.random() > 0.997 ? (Math.random() * 2 - 1) * 2.5 : 0;
        left[i] = (lastLeft + 0.02 * wL) / 1.02 + crackle;
        right[i] = (lastRight + 0.02 * wR) / 1.02 + crackle;
      } else {
        // Cafe / Library gentle murmur
        left[i] = (lastLeft + 0.04 * wL) / 1.04;
        right[i] = (lastRight + 0.04 * wR) / 1.04;
      }
      lastLeft = left[i];
      lastRight = right[i];
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.start();

    // Biquad filter for smooth acoustic tone
    const filter = ctx.createBiquadFilter();
    filter.type = type === 'fireplace' ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(type === 'fireplace' ? 800 : 1200, ctx.currentTime);

    source.connect(filter);
    return filter;
  }
}

export const audioEngine = typeof window !== 'undefined' ? new ZenAudioEngine() : null;
