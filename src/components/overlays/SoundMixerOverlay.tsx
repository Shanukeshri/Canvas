'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  CloudRain,
  Flame,
  Trees,
  Wind,
  Waves,
  Coffee,
  Radio,
  Bird,
} from 'lucide-react';
import clsx from 'clsx';

export function SoundMixerOverlay() {
  const {
    overlay,
    closeOverlay,
    sounds,
    setSoundVolume,
    toggleSoundPlay,
    isMasterMuted,
    toggleMasterMute,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<'All' | 'Nature' | 'Ambient' | 'Noise'>('All');
  const [masterVolume, setMasterVolume] = useState(80);

  if (overlay !== 'sound') return null;

  const activeSounds = sounds.filter((s) => s.isPlaying);
  const filteredSounds =
    activeCategory === 'All' ? sounds : sounds.filter((s) => s.category === activeCategory);

  const getSoundIcon = (id: string) => {
    switch (id) {
      case 'rain':
        return <CloudRain className="w-4 h-4" />;
      case 'fire':
        return <Flame className="w-4 h-4" />;
      case 'forest':
        return <Trees className="w-4 h-4" />;
      case 'wind':
        return <Wind className="w-4 h-4" />;
      case 'waves':
        return <Waves className="w-4 h-4" />;
      case 'cafe':
        return <Coffee className="w-4 h-4" />;
      case 'birds':
        return <Bird className="w-4 h-4" />;
      default:
        return <Radio className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-dim/40 backdrop-blur-sm px-lg animate-in fade-in duration-200">
      {/* Modal Container matching sound_mixer_overlay_crimson */}
      <div
        className="w-full max-w-[560px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex justify-between items-center px-lg py-md border-b border-outline-variant bg-surface-container-lowest shrink-0">
          <div className="flex items-center gap-sm">
            <Volume2 className="w-5 h-5 text-primary" />
            <h2 className="font-headline-md text-headline-md text-primary tracking-tight">Soundscapes</h2>
          </div>
          <button
            onClick={closeOverlay}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors duration-300 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-lg py-xl space-y-xl">
          {/* Current Mix Section */}
          <section>
            <div className="flex justify-between items-end mb-md">
              <h3 className="font-label-md text-label-md text-secondary uppercase tracking-widest">Current Mix</h3>
              <span className="font-label-md text-label-md text-secondary">
                {activeSounds.length} Active
              </span>
            </div>

            <div className="space-y-sm bg-surface rounded-lg border border-outline-variant p-md">
              {activeSounds.length === 0 ? (
                <span className="text-body-md text-sm text-on-surface-variant italic">
                  No atmospheric sound active. Select below to synthesize audio.
                </span>
              ) : (
                activeSounds.map((sound) => (
                  <div key={sound.id} className="flex items-center gap-md group">
                    <div className="text-primary shrink-0">{getSoundIcon(sound.id)}</div>
                    <span className="font-body-md text-body-md text-primary w-28 truncate font-medium">
                      {sound.name}
                    </span>
                    <div className="flex-1 flex items-center h-4">
                      <div className="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${sound.volume}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-label-md text-label-md text-secondary w-8 text-right font-mono">
                      {sound.volume}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Categories */}
          <section>
            <div className="flex gap-sm border-b border-outline-variant pb-sm mb-lg overflow-x-auto no-scrollbar">
              {(['All', 'Nature', 'Ambient', 'Noise'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={clsx(
                    'px-md py-sm rounded-full font-label-md text-label-md transition-colors duration-300 shrink-0',
                    activeCategory === cat
                      ? 'bg-primary-container text-on-primary-container font-medium'
                      : 'text-secondary hover:text-primary hover:bg-surface-container-low'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sound Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {filteredSounds.map((sound) => {
                const isPlaying = sound.isPlaying && !isMasterMuted;
                return (
                  <div
                    key={sound.id}
                    className={clsx(
                      'p-md rounded-lg border transition-all duration-300',
                      isPlaying
                        ? 'border-primary bg-surface shadow-sm'
                        : 'border-outline-variant bg-surface-container-lowest hover:bg-surface'
                    )}
                  >
                    <div className="flex justify-between items-start mb-md">
                      <div className="flex items-center gap-sm">
                        <div
                          className={clsx(
                            'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                            isPlaying ? 'bg-surface-container-high text-primary' : 'border border-outline-variant text-secondary'
                          )}
                        >
                          {getSoundIcon(sound.id)}
                        </div>
                        <span className="font-body-md text-body-md text-primary font-medium">
                          {sound.name}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleSoundPlay(sound.id)}
                        className={clsx(
                          'w-8 h-8 rounded-full flex items-center justify-center transition-opacity',
                          isPlaying
                            ? 'bg-primary text-on-primary hover:opacity-90'
                            : 'border border-outline-variant text-secondary hover:text-primary hover:border-primary'
                        )}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-sm">
                      <Volume2 className="w-3.5 h-3.5 text-secondary shrink-0" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sound.volume}
                        onChange={(e) => setSoundVolume(sound.id, Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer: Master Volume */}
        <footer className="p-lg border-t border-outline-variant bg-surface shrink-0">
          <div className="flex items-center gap-md">
            <button onClick={toggleMasterMute} className="text-primary hover:opacity-80 transition-opacity">
              {isMasterMuted ? <VolumeX className="w-5 h-5 text-error" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={isMasterMuted ? 0 : masterVolume}
                onChange={(e) => setMasterVolume(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer relative z-10"
              />
            </div>
            <span className="font-label-md text-label-md text-primary w-12 text-right font-mono">
              {isMasterMuted ? 'Muted' : `${masterVolume}%`}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
