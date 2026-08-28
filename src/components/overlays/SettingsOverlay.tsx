'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Timer,
  Volume2,
  Palette,
  X,
  Check,
  Pipette,
} from 'lucide-react';
import clsx from 'clsx';

export function SettingsOverlay() {
  const {
    overlay,
    closeOverlay,
    focusDurationMinutes,
    setFocusDurationMinutes,
    shortBreakMinutes,
    setShortBreakMinutes,
    longBreakMinutes,
    setLongBreakMinutes,
  } = useApp();

  const { theme, setTheme, customHex, setCustomColor, isDarkMode, toggleDarkMode, presetThemes } =
    useTheme();

  const [activeSettingsTab, setActiveSettingsTab] = useState<'timer' | 'sounds' | 'appearance'>('timer');
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);

  if (overlay !== 'settings' && overlay !== 'timer-settings') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-gutter bg-surface-dim/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Main Settings Panel (Bento-style layout matching timer_settings_overlay_crimson/screen.png) */}
      <div
        className="w-full max-w-4xl bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(45,10,10,0.08)] overflow-hidden flex flex-col md:flex-row h-full max-h-[720px] animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Internal Sidebar Navigation */}
        <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-outline-variant bg-surface-bright flex flex-col p-lg gap-sm shrink-0">
          <div className="flex items-center justify-between mb-md">
            <h2 className="font-headline-md text-headline-md text-primary font-medium tracking-tight">
              Settings
            </h2>
            <button
              onClick={closeOverlay}
              className="md:hidden text-secondary hover:text-primary p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-row md:flex-col gap-xs overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveSettingsTab('timer')}
              className={clsx(
                'flex items-center gap-sm px-md py-sm rounded-lg font-label-md text-label-md transition-colors text-left whitespace-nowrap',
                activeSettingsTab === 'timer'
                  ? 'bg-surface-container-high text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
              )}
            >
              <Timer className="w-4 h-4" />
              Timer
            </button>
            <button
              onClick={() => setActiveSettingsTab('sounds')}
              className={clsx(
                'flex items-center gap-sm px-md py-sm rounded-lg font-label-md text-label-md transition-colors text-left whitespace-nowrap',
                activeSettingsTab === 'sounds'
                  ? 'bg-surface-container-high text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
              )}
            >
              <Volume2 className="w-4 h-4" />
              Sounds
            </button>
            <button
              onClick={() => setActiveSettingsTab('appearance')}
              className={clsx(
                'flex items-center gap-sm px-md py-sm rounded-lg font-label-md text-label-md transition-colors text-left whitespace-nowrap',
                activeSettingsTab === 'appearance'
                  ? 'bg-surface-container-high text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
              )}
            >
              <Palette className="w-4 h-4" />
              Appearance
            </button>
          </nav>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 p-lg md:p-xl overflow-y-auto bg-surface-container-lowest flex flex-col justify-between">
          <div className="space-y-xl">
            {/* TAB 1: TIMER DEFAULTS */}
            {activeSettingsTab === 'timer' && (
              <section className="space-y-lg">
                <div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-xs font-medium">
                    Timer Defaults
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                    Configure your standard session lengths.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                  {/* Focus Duration */}
                  <div className="bg-surface border border-outline-variant p-md rounded-lg flex flex-col justify-between">
                    <span className="font-label-md text-label-md text-on-surface-variant mb-md">Focus</span>
                    <div className="flex items-end gap-xs">
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={focusDurationMinutes}
                        onChange={(e) => setFocusDurationMinutes(Number(e.target.value))}
                        className="w-16 bg-transparent border-b border-outline-variant focus:border-primary text-headline-lg font-headline-lg text-primary py-xs px-0 outline-none text-center"
                      />
                      <span className="font-body-md text-body-md text-secondary pb-sm">min</span>
                    </div>
                  </div>

                  {/* Short Break */}
                  <div className="bg-surface border border-outline-variant p-md rounded-lg flex flex-col justify-between">
                    <span className="font-label-md text-label-md text-on-surface-variant mb-md">Short Break</span>
                    <div className="flex items-end gap-xs">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={shortBreakMinutes}
                        onChange={(e) => setShortBreakMinutes(Number(e.target.value))}
                        className="w-16 bg-transparent border-b border-outline-variant focus:border-primary text-headline-lg font-headline-lg text-primary py-xs px-0 outline-none text-center"
                      />
                      <span className="font-body-md text-body-md text-secondary pb-sm">min</span>
                    </div>
                  </div>

                  {/* Long Break */}
                  <div className="bg-surface border border-outline-variant p-md rounded-lg flex flex-col justify-between">
                    <span className="font-label-md text-label-md text-on-surface-variant mb-md">Long Break</span>
                    <div className="flex items-end gap-xs">
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={longBreakMinutes}
                        onChange={(e) => setLongBreakMinutes(Number(e.target.value))}
                        className="w-16 bg-transparent border-b border-outline-variant focus:border-primary text-headline-lg font-headline-lg text-primary py-xs px-0 outline-none text-center"
                      />
                      <span className="font-body-md text-body-md text-secondary pb-sm">min</span>
                    </div>
                  </div>
                </div>

                {/* Auto-start Breaks Toggle */}
                <div className="flex items-center justify-between p-md border border-outline-variant rounded-lg bg-surface">
                  <div>
                    <span className="block font-body-md text-body-md text-primary font-medium">
                      Auto-start Breaks
                    </span>
                    <span className="block font-label-md text-label-md text-on-surface-variant mt-xs">
                      Automatically begin break timer when focus ends
                    </span>
                  </div>
                  <button
                    onClick={() => setAutoStartBreaks(!autoStartBreaks)}
                    className={clsx(
                      'w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5',
                      autoStartBreaks ? 'bg-primary' : 'bg-surface-variant'
                    )}
                  >
                    <span
                      className={clsx(
                        'w-5 h-5 rounded-full bg-white transition-transform shadow-sm',
                        autoStartBreaks ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>
              </section>
            )}

            {/* TAB 2: SOUNDS */}
            {activeSettingsTab === 'sounds' && (
              <section className="space-y-lg">
                <div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-xs font-medium">
                    Sound Settings
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                    Configure chime frequencies and ambient default parameters.
                  </p>
                </div>
                <div className="space-y-md bg-surface p-lg rounded-lg border border-outline-variant">
                  <div className="flex items-center justify-between">
                    <span className="font-body-md text-body-md text-primary">Session End Chime</span>
                    <span className="font-label-md text-label-md text-secondary">Tibetan Bowl (Soft)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body-md text-body-md text-primary">Ticking Sound</span>
                    <span className="font-label-md text-label-md text-secondary">Disabled (Zen Calm)</span>
                  </div>
                </div>
              </section>
            )}

            {/* TAB 3: APPEARANCE & THEMES */}
            {activeSettingsTab === 'appearance' && (
              <section className="space-y-lg">
                <div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-xs font-medium">
                    Appearance & 24 Color Themes
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                    Choose from 23 harmonious Zen presets or pick a custom accent tint.
                  </p>
                </div>

                {/* 23 Preset Colors Grid */}
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 p-3 rounded-lg bg-surface border border-outline-variant">
                  {presetThemes.map((p) => {
                    const isSelected = theme.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setTheme(p)}
                        className={clsx(
                          'w-full aspect-square rounded-full flex items-center justify-center transition-all relative',
                          isSelected ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105 opacity-90'
                        )}
                        style={{ backgroundColor: p.hex }}
                        title={`${p.name} (${p.hex})`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}

                  {/* Custom Color Wheel Selector */}
                  <label
                    className={clsx(
                      'w-full aspect-square rounded-full flex items-center justify-center transition-all cursor-pointer relative border border-dashed border-outline-variant hover:border-primary bg-surface-container',
                      theme.id === 'custom' && 'ring-2 ring-offset-2 ring-primary'
                    )}
                    title="Custom Color Wheel Picker"
                  >
                    <input
                      type="color"
                      value={customHex}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                    <Pipette className="w-3.5 h-3.5 text-primary" />
                  </label>
                </div>

                {/* Light / Dark Mode Switch */}
                <div className="flex items-center justify-between p-md rounded-lg bg-surface border border-outline-variant">
                  <div>
                    <span className="block font-body-md text-body-md text-primary font-medium">
                      Theme Mode
                    </span>
                    <span className="block font-label-md text-label-md text-on-surface-variant mt-xs">
                      {isDarkMode ? 'Dark mode (high contrast)' : 'Light mode (Crimson Zen soft)'}
                    </span>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className="px-4 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-label-md font-label-md text-primary hover:bg-surface-container-high transition-all"
                  >
                    Toggle {isDarkMode ? 'Light' : 'Dark'}
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-md pt-lg border-t border-outline-variant mt-8">
            <button
              onClick={closeOverlay}
              className="px-lg py-sm rounded-lg bg-transparent border border-outline-variant text-primary font-label-md text-label-md hover:bg-surface-container transition-colors"
            >
              Discard
            </button>
            <button
              onClick={closeOverlay}
              className="px-lg py-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity shadow-[0px_4px_20px_rgba(45,10,10,0.08)]"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
