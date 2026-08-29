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
  Keyboard,
  Moon,
  Sun,
  Bell,
  Sparkles,
  Sliders,
  RotateCcw,
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
    targetSessions,
    setTargetSessions,
  } = useApp();

  const { theme, setTheme, customHex, setCustomColor, isDarkMode, toggleDarkMode, presetThemes } =
    useTheme();

  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'timer' | 'sounds' | 'appearance' | 'shortcuts'
  >('timer');
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);
  const [autoStartFocus, setAutoStartFocus] = useState(false);
  const [soundChime, setSoundChime] = useState('tibetan');

  if (overlay !== 'settings' && overlay !== 'timer-settings') return null;

  return (
    <div
      onClick={closeOverlay}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-4xl bg-surface-container-lowest/95 backdrop-blur-2xl border border-surface-variant/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[760px] animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation Sidebar */}
        <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-surface-variant/30 bg-surface-container-low/60 flex flex-col p-5 gap-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center border border-surface-variant/40 shadow-sm"
                style={{ backgroundColor: theme.hex + '15', color: theme.hex }}
              >
                <Sliders className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-on-surface">Preferences</h2>
            </div>
            <button
              onClick={closeOverlay}
              className="md:hidden text-outline hover:text-on-surface p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-row md:flex-col gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'timer', label: 'Timer & Intervals', icon: Timer },
              { id: 'sounds', label: 'Audio & Chimes', icon: Volume2 },
              { id: 'appearance', label: 'Theme & Colors', icon: Palette },
              { id: 'shortcuts', label: 'Shortcuts Guide', icon: Keyboard },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSettingsTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSettingsTab(tab.id as typeof activeSettingsTab)}
                  className={clsx(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all text-left whitespace-nowrap',
                    isActive
                      ? 'bg-surface-container text-primary shadow-sm border border-surface-variant/50'
                      : 'text-outline hover:bg-surface-container/50 hover:text-on-surface'
                  )}
                  style={isActive ? { color: theme.hex } : {}}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col justify-between">
          <div className="space-y-6">
            {/* TAB 1: TIMER DEFAULTS */}
            {activeSettingsTab === 'timer' && (
              <section className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-base font-bold text-on-surface mb-1">Timer & Flow Intervals</h3>
                  <p className="text-xs text-outline">
                    Customize your deep work session and rest cycle durations.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Focus Duration */}
                  <div className="p-4 rounded-2xl bg-surface-container-low/70 border border-surface-variant/40 flex flex-col justify-between gap-3 shadow-sm">
                    <span className="text-xs font-semibold text-outline">Focus Session</span>
                    <div className="flex items-baseline gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={focusDurationMinutes}
                        onChange={(e) => setFocusDurationMinutes(Number(e.target.value))}
                        className="w-20 bg-surface-container border border-surface-variant/50 rounded-xl focus:border-primary text-2xl font-bold font-mono text-on-surface py-1 px-2.5 outline-none text-center"
                      />
                      <span className="text-xs text-outline font-medium">mins</span>
                    </div>
                  </div>

                  {/* Short Break */}
                  <div className="p-4 rounded-2xl bg-surface-container-low/70 border border-surface-variant/40 flex flex-col justify-between gap-3 shadow-sm">
                    <span className="text-xs font-semibold text-outline">Short Break</span>
                    <div className="flex items-baseline gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={shortBreakMinutes}
                        onChange={(e) => setShortBreakMinutes(Number(e.target.value))}
                        className="w-20 bg-surface-container border border-surface-variant/50 rounded-xl focus:border-primary text-2xl font-bold font-mono text-on-surface py-1 px-2.5 outline-none text-center"
                      />
                      <span className="text-xs text-outline font-medium">mins</span>
                    </div>
                  </div>

                  {/* Long Break */}
                  <div className="p-4 rounded-2xl bg-surface-container-low/70 border border-surface-variant/40 flex flex-col justify-between gap-3 shadow-sm">
                    <span className="text-xs font-semibold text-outline">Long Break</span>
                    <div className="flex items-baseline gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={longBreakMinutes}
                        onChange={(e) => setLongBreakMinutes(Number(e.target.value))}
                        className="w-20 bg-surface-container border border-surface-variant/50 rounded-xl focus:border-primary text-2xl font-bold font-mono text-on-surface py-1 px-2.5 outline-none text-center"
                      />
                      <span className="text-xs text-outline font-medium">mins</span>
                    </div>
                  </div>
                </div>

                {/* Target Sessions */}
                <div className="p-4 rounded-2xl bg-surface-container-low/70 border border-surface-variant/40 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-xs font-semibold text-on-surface block">
                      Daily Target Sessions
                    </span>
                    <span className="text-[11px] text-outline">
                      Goal for daily Pomodoros before celebrating
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="16"
                      value={targetSessions}
                      onChange={(e) => setTargetSessions(Number(e.target.value))}
                      className="w-16 bg-surface-container border border-surface-variant/50 rounded-xl text-center font-mono font-bold text-on-surface py-1 text-sm outline-none"
                    />
                    <span className="text-xs text-outline font-medium">rounds</span>
                  </div>
                </div>

                {/* Automation Switches */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-4 border border-surface-variant/40 rounded-2xl bg-surface-container-low/70 shadow-sm">
                    <div>
                      <span className="text-xs font-semibold text-on-surface block">
                        Auto-start Break Timers
                      </span>
                      <span className="text-[11px] text-outline">
                        Automatically transition into rest phase when focus session completes
                      </span>
                    </div>
                    <button
                      onClick={() => setAutoStartBreaks(!autoStartBreaks)}
                      className={clsx(
                        'w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0',
                        autoStartBreaks ? 'bg-primary' : 'bg-surface-container-high'
                      )}
                      style={autoStartBreaks ? { backgroundColor: theme.hex } : {}}
                    >
                      <span
                        className={clsx(
                          'w-5 h-5 rounded-full bg-white transition-transform shadow-md',
                          autoStartBreaks ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-surface-variant/40 rounded-2xl bg-surface-container-low/70 shadow-sm">
                    <div>
                      <span className="text-xs font-semibold text-on-surface block">
                        Auto-resume Focus after Break
                      </span>
                      <span className="text-[11px] text-outline">
                        Automatically restart the next focus timer when break finishes
                      </span>
                    </div>
                    <button
                      onClick={() => setAutoStartFocus(!autoStartFocus)}
                      className={clsx(
                        'w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0',
                        autoStartFocus ? 'bg-primary' : 'bg-surface-container-high'
                      )}
                      style={autoStartFocus ? { backgroundColor: theme.hex } : {}}
                    >
                      <span
                        className={clsx(
                          'w-5 h-5 rounded-full bg-white transition-transform shadow-md',
                          autoStartFocus ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* TAB 2: SOUNDS & CHIMES */}
            {activeSettingsTab === 'sounds' && (
              <section className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-base font-bold text-on-surface mb-1">Audio & Chime Bells</h3>
                  <p className="text-xs text-outline">
                    Fine-tune notification bells and meditative transition chimes.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-surface-container-low/70 border border-surface-variant/40 space-y-3 shadow-sm">
                    <span className="text-xs font-semibold text-on-surface block">
                      Session Completion Chime
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'tibetan', label: 'Tibetan Singing Bowl', desc: 'Soft harmonic decay' },
                        { id: 'zen-bell', label: 'Zen Temple Bell', desc: 'Deep single chime' },
                        { id: 'marimba', label: 'Soft Marimba', desc: 'Warm melodic chord' },
                        { id: 'silent', label: 'Muted / Visual Only', desc: 'Silent screen glow' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSoundChime(item.id)}
                          className={clsx(
                            'p-3 rounded-xl border text-left transition-all',
                            soundChime === item.id
                              ? 'bg-surface-container border-primary shadow-sm'
                              : 'bg-surface-container-lowest/60 border-surface-variant/40 hover:bg-surface-container'
                          )}
                          style={soundChime === item.id ? { borderColor: theme.hex } : {}}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-on-surface">
                              {item.label}
                            </span>
                            {soundChime === item.id && (
                              <Check className="w-3.5 h-3.5" style={{ color: theme.hex }} />
                            )}
                          </div>
                          <span className="text-[10px] text-outline mt-0.5 block">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* TAB 3: THEMES & APPEARANCE */}
            {activeSettingsTab === 'appearance' && (
              <section className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-base font-bold text-on-surface mb-1">
                    Appearance & 24 Color Palettes
                  </h3>
                  <p className="text-xs text-outline">
                    Choose an accent shade to automatically tint background glow, buttons, and timers.
                  </p>
                </div>

                {/* 24 Palette Swatches */}
                <div className="p-4 rounded-2xl bg-surface-container-low/70 border border-surface-variant/40 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-on-surface">Theme Presets</span>
                    <span className="text-xs font-mono font-medium" style={{ color: theme.hex }}>
                      {theme.id === 'custom' ? `Custom (${customHex})` : theme.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 pt-1">
                    {presetThemes.map((p) => {
                      const isSelected = theme.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setTheme(p)}
                          className={clsx(
                            'w-full aspect-square rounded-2xl flex items-center justify-center transition-all relative border border-white/10 shadow-sm',
                            isSelected
                              ? 'scale-110 ring-2 ring-offset-2 ring-offset-surface ring-primary'
                              : 'hover:scale-105 opacity-85 hover:opacity-100'
                          )}
                          style={{ backgroundColor: p.hex }}
                          title={`${p.name} (${p.hex})`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </button>
                      );
                    })}

                    {/* Custom Color Wheel */}
                    <label
                      className={clsx(
                        'w-full aspect-square rounded-2xl flex items-center justify-center transition-all cursor-pointer relative border border-white/20 overflow-hidden shadow-sm',
                        theme.id === 'custom' &&
                          'scale-110 ring-2 ring-offset-2 ring-offset-surface ring-primary'
                      )}
                      style={{
                        background:
                          'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)',
                      }}
                      title="Custom Color Wheel Picker"
                    >
                      <input
                        type="color"
                        value={customHex}
                        onChange={(e) => setCustomColor(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                      <Pipette className="w-3.5 h-3.5 text-white drop-shadow-md z-10 pointer-events-none" />
                    </label>
                  </div>
                </div>

                {/* Dark / Light Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low/70 border border-surface-variant/40 shadow-sm">
                  <div>
                    <span className="text-xs font-semibold text-on-surface block">
                      Interface Theme Mode
                    </span>
                    <span className="text-[11px] text-outline">
                      {isDarkMode ? 'Dark Focus (High contrast, quiet presence)' : 'Soft Day mode'}
                    </span>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className="px-4 py-2 rounded-xl bg-surface-container border border-surface-variant text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-all flex items-center gap-2 shadow-sm"
                  >
                    {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                    <span>{isDarkMode ? 'Switch to Light' : 'Switch to Dark'}</span>
                  </button>
                </div>
              </section>
            )}

            {/* TAB 4: KEYBOARD SHORTCUTS */}
            {activeSettingsTab === 'shortcuts' && (
              <section className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-base font-bold text-on-surface mb-1">Keyboard Shortcuts</h3>
                  <p className="text-xs text-outline">
                    Navigate without touching the mouse to stay in deep flow.
                  </p>
                </div>

                <div className="space-y-2">
                  {[
                    { key: 'Space', action: 'Start / Pause Focus Timer' },
                    { key: 'D / Double Click', action: 'Reset Timer to default duration' },
                    { key: 'Cmd + K / Ctrl + K', action: 'Open Global Command Palette' },
                    { key: '1, 2, 3', action: 'Switch to Solo Timer, Todos, Focus Groups' },
                    { key: 'N', action: 'Quick Add Task (on Todos page)' },
                    { key: 'M', action: 'Toggle Master Audio Mute' },
                    { key: 'Esc', action: 'Close active overlay or modal' },
                  ].map((sc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/70 border border-surface-variant/30"
                    >
                      <span className="text-xs text-on-surface">{sc.action}</span>
                      <kbd className="px-2.5 py-1 rounded-lg bg-surface-container text-[11px] font-mono font-bold text-primary border border-surface-variant/50 shadow-inner">
                        {sc.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-surface-variant/30 mt-6">
            <button
              onClick={closeOverlay}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-outline hover:text-on-surface border border-surface-variant hover:bg-surface-container transition-colors"
            >
              Close
            </button>
            <button
              onClick={closeOverlay}
              className="px-6 py-2 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: theme.hex }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
