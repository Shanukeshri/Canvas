'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  X,
  Play,
  Pause,
  Music,
  Volume2,
  VolumeX,
  CloudRain,
  Flame,
  Waves,
  Wind,
  Radio,
  Sparkles,
  Zap,
  Moon,
  Headphones,
  Disc,
} from 'lucide-react';
import clsx from 'clsx';
import { SoundCategory } from '@/types';

export function SoundMixerOverlay() {
  const {
    overlay,
    closeOverlay,
    sounds,
    setSoundVolume,
    toggleSoundPlay,
    isMasterMuted,
    toggleMasterMute,
    stopAllSounds,
  } = useApp();
  const { theme } = useTheme();

  const [activeCategory, setActiveCategory] = useState<'All' | SoundCategory>('All');

  if (overlay !== 'sound') return null;

  const activeSounds = sounds.filter((s) => s.isPlaying);
  const filteredSounds =
    activeCategory === 'All' ? sounds : sounds.filter((s) => s.category === activeCategory);

  const getSoundIcon = (id: string, type?: string) => {
    if (id === 'rain') return <CloudRain className="w-4 h-4" />;
    if (id === 'ocean') return <Waves className="w-4 h-4" />;
    if (id === 'fireplace') return <Flame className="w-4 h-4" />;
    if (id === 'white') return <Wind className="w-4 h-4" />;
    if (id === 'pink') return <Radio className="w-4 h-4" />;
    if (id === 'brown') return <Disc className="w-4 h-4" />;
    if (id === 'gamma') return <Zap className="w-4 h-4" />;
    if (id === 'alpha') return <Sparkles className="w-4 h-4" />;
    if (id === 'theta') return <Moon className="w-4 h-4" />;
    if (id === 'solfeggio-852') return <Music className="w-4 h-4" />;
    if (type === 'binaural') return <Headphones className="w-4 h-4" />;
    return <Music className="w-4 h-4" />;
  };

  const applyPreset = (presetName: string) => {
    if (presetName === 'mute-all') {
      stopAllSounds();
      return;
    }

    const presetTargets: Record<string, { activeIds: string[]; volumes: Record<string, number> }> = {
      'deep-calm': {
        activeIds: ['rain', 'brown', 'alpha'],
        volumes: { rain: 60, brown: 35, alpha: 25 },
      },
      'theta-dream': {
        activeIds: ['ocean', 'theta'],
        volumes: { ocean: 55, theta: 30 },
      },
      'peak-cognition': {
        activeIds: ['white', 'gamma'],
        volumes: { white: 20, gamma: 25 },
      },
      'serene-852': {
        activeIds: ['fireplace', 'solfeggio-852'],
        volumes: { fireplace: 45, 'solfeggio-852': 20 },
      },
    };

    const target = presetTargets[presetName];
    if (!target) return;

    sounds.forEach((s) => {
      const shouldPlay = target.activeIds.includes(s.id);
      const targetVol = target.volumes[s.id] ?? s.volume;
      setSoundVolume(s.id, targetVol);
      if (s.isPlaying !== shouldPlay) {
        toggleSoundPlay(s.id);
      }
    });
  };

  return (
    <div
      onClick={closeOverlay}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-[660px] bg-surface-container-lowest/95 backdrop-blur-2xl border border-surface-variant/40 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-6 py-5 border-b border-surface-variant/30 flex items-center justify-between bg-surface-container-lowest/80 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border border-surface-variant/40 shadow-sm"
              style={{ backgroundColor: theme.hex + '15', color: theme.hex }}
            >
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-on-surface">Ambient Sound Studio</h2>
                {activeSounds.length > 0 && !isMasterMuted && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm flex items-center gap-1"
                    style={{ backgroundColor: theme.hex }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {activeSounds.length} Active
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={closeOverlay}
            aria-label="Close"
            className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Atmosphere Presets */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
              Atmosphere Presets
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'deep-calm', label: 'Deep Calm', icon: '🌧️' },
                { id: 'theta-dream', label: 'Theta Surf', icon: '🌊' },
                { id: 'peak-cognition', label: 'Gamma Alert', icon: '⚡' },
                { id: 'serene-852', label: '852 Hz Serene', icon: '🔥' },
                { id: 'mute-all', label: 'Silence All', icon: '🤫' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className="px-3 py-2.5 rounded-xl bg-surface-container-low/80 hover:bg-surface-container border border-surface-variant/40 hover:border-primary/40 text-xs font-medium text-on-surface flex items-center gap-2 transition-all group shadow-2xs"
                >
                  <span className="text-sm">{preset.icon}</span>
                  <span className="truncate group-hover:text-primary transition-colors">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex gap-1.5 border-b border-surface-variant/30 pb-3 overflow-x-auto no-scrollbar">
            {(['All', 'Nature', 'Noise', 'Frequencies'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={clsx(
                  'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0',
                  activeCategory === cat
                    ? 'bg-surface-container text-primary font-semibold border border-surface-variant shadow-sm'
                    : 'text-outline hover:text-on-surface hover:bg-surface-container/50'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Binaural Beats Headphone Tip */}
          {(activeCategory === 'All' || activeCategory === 'Frequencies') && (
            <div className="p-3 rounded-2xl bg-surface-container-low/60 border border-surface-variant/30 flex items-center gap-3 text-xs text-outline">
              <Headphones className="w-4 h-4 text-primary shrink-0" style={{ color: theme.hex }} />
              <span>
                <strong>Headphones Recommended:</strong> Binaural beats (Gamma, Alpha, Theta) work through stereo frequency separation between ears.
              </span>
            </div>
          )}

          {/* Sound Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredSounds.map((sound) => {
              const isPlaying = sound.isPlaying && !isMasterMuted;
              return (
                <div
                  key={sound.id}
                  className={clsx(
                    'p-4 rounded-2xl border transition-all flex flex-col gap-3',
                    isPlaying
                      ? 'bg-surface-container-low border-primary/60 shadow-md ring-1 ring-primary/30'
                      : 'bg-surface-container-lowest/60 border-surface-variant/30 hover:border-surface-variant/70 hover:bg-surface-container-lowest'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={clsx(
                          'w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0',
                          isPlaying
                            ? 'bg-primary/20 text-primary border border-primary/40'
                            : 'bg-surface-container text-outline border border-surface-variant/40'
                        )}
                        style={isPlaying ? { color: theme.hex, borderColor: theme.hex + '60' } : {}}
                      >
                        {getSoundIcon(sound.id, sound.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-semibold text-on-surface truncate">
                            {sound.name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-outline truncate">
                          {sound.description || sound.category}
                        </p>
                      </div>
                    </div>

                    {/* Play/Pause Button */}
                    <button
                      onClick={() => toggleSoundPlay(sound.id)}
                      className={clsx(
                        'w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-xs shrink-0',
                        isPlaying
                          ? 'bg-primary text-on-primary scale-105'
                          : 'bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface'
                      )}
                      style={isPlaying ? { backgroundColor: theme.hex } : {}}
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                  </div>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setSoundVolume(sound.id, sound.volume > 0 ? 0 : 40)}
                      className="text-outline hover:text-on-surface transition-colors"
                      title={sound.volume === 0 ? 'Unmute' : 'Mute'}
                    >
                      {sound.volume === 0 ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sound.volume}
                      onChange={(e) => setSoundVolume(sound.id, Number(e.target.value))}
                      className="flex-1 h-1.5 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
                      style={{ accentColor: theme.hex }}
                    />

                    <span className="text-[10px] font-mono text-outline w-7 text-right">
                      {sound.volume}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with Master Mute Toggle */}
        <footer className="p-4 border-t border-surface-variant/30 bg-surface-container-lowest/80 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMasterMute}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                isMasterMuted
                  ? 'bg-error/15 text-error border-error/30'
                  : 'bg-surface-container text-on-surface border-surface-variant/40 hover:border-primary/40'
              )}
            >
              {isMasterMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isMasterMuted ? 'Muted All' : 'Master Audio Active'}</span>
            </button>
          </div>

          <span className="text-[11px] text-outline font-mono">
            {activeSounds.length} playing
          </span>
        </footer>
      </div>
    </div>
  );
}
