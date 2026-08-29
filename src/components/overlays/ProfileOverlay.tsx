'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { X, Camera, Check, Pipette } from 'lucide-react';
import clsx from 'clsx';

export function ProfileOverlay() {
  const { overlay, closeOverlay } = useApp();
  const { theme, setTheme, setCustomColor, customHex, presetThemes } = useTheme();

  const [displayName, setDisplayName] = useState('Alex Serene');
  const [username, setUsername] = useState('@alex_s');
  const [avatar, setAvatar] = useState('🦊');

  if (overlay !== 'profile') return null;

  return (
    <div
      onClick={closeOverlay}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div
        className="bg-surface-container-low border border-surface-variant rounded-2xl shadow-xl w-full max-w-[480px] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 z-50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-variant">
          <div>
            <h2 className="font-headline-md text-base md:text-lg text-primary font-semibold tracking-tight">
              Profile & Identity
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Your profile color generates your entire minimalist zen UI theme.
            </p>
          </div>
          <button
            onClick={closeOverlay}
            aria-label="Close modal"
            className="text-on-surface-variant hover:text-primary transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-2">
            <div className="relative group cursor-pointer">
              <div
                className="w-20 h-20 rounded-full border border-surface-variant flex items-center justify-center text-3xl transition-transform group-hover:scale-105"
                style={{ backgroundColor: theme.hex + '20', borderColor: theme.hex }}
              >
                {avatar}
              </div>
              <div className="absolute inset-0 bg-primary/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Camera className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {['🦊', '👩🏻‍💻', '👨🏻‍🎨', '👩🏼‍🔬', '👨🏽‍💻', '⚡'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setAvatar(emoji)}
                  className={clsx(
                    'w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all',
                    avatar === emoji
                      ? 'bg-surface-container border border-primary/40 scale-110'
                      : 'hover:bg-surface-container'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <span className="text-xs text-on-surface-variant">Update Avatar</span>
          </div>

          {/* Input Fields */}
          <div className="space-y-4">
            {/* Display Name */}
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-on-surface-variant" htmlFor="displayName">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="text-xs bg-surface border border-surface-variant rounded-xl px-3 py-2 text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            {/* Username */}
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-on-surface-variant" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-xs bg-surface border border-surface-variant rounded-xl px-3 py-2 text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* 24 Accent Themes: 23 Predefined + 1 Custom Color Wheel */}
          <div className="space-y-2 pt-2 border-t border-surface-variant">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-primary uppercase tracking-wider">
                Theme & Profile Color (24 Choices)
              </label>
              <span className="text-[11px] text-on-surface-variant">
                {theme.id === 'custom' ? `Custom (${theme.hex})` : theme.name}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2.5">
              {/* 23 Predefined Colors */}
              {presetThemes.map((p) => {
                const isSelected = theme.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setTheme(p)}
                    className={clsx(
                      'w-8 h-8 rounded-full transition-all flex items-center justify-center relative border border-white/10',
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-offset-surface ring-primary scale-110 shadow-sm'
                        : 'hover:scale-105 opacity-85 hover:opacity-100'
                    )}
                    style={{ backgroundColor: p.hex }}
                    title={`${p.name} (${p.hex})`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                );
              })}

              {/* 24th Choice: Custom Color Wheel / Picker */}
              <label
                className={clsx(
                  'w-8 h-8 rounded-full transition-all flex items-center justify-center relative cursor-pointer border border-white/20 overflow-hidden',
                  theme.id === 'custom'
                    ? 'ring-2 ring-offset-2 ring-offset-surface ring-primary scale-110 shadow-sm'
                    : 'hover:scale-105 opacity-85 hover:opacity-100'
                )}
                style={{
                  background:
                    'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)',
                }}
                title={`Custom Color Wheel (${customHex})`}
              >
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
                {theme.id === 'custom' ? (
                  <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[3] z-10 pointer-events-none" />
                ) : (
                  <Pipette className="w-3 h-3 text-white drop-shadow-md z-10 pointer-events-none" />
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-surface-variant bg-surface-container-low">
          <button
            onClick={closeOverlay}
            className="px-4 py-2 rounded-xl text-xs font-medium text-on-surface-variant hover:text-on-surface border border-surface-variant hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={closeOverlay}
            className="px-5 py-2 rounded-xl text-xs font-medium text-on-primary bg-primary hover:opacity-90 transition-opacity shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
