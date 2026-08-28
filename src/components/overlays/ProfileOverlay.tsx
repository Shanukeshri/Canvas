'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { X, Camera, Check } from 'lucide-react';
import clsx from 'clsx';

export function ProfileOverlay() {
  const { overlay, closeOverlay } = useApp();
  const { theme, setTheme, presetThemes } = useTheme();

  const [displayName, setDisplayName] = useState('Alex Serene');
  const [username, setUsername] = useState('@alex_s');
  const [avatar, setAvatar] = useState('🦊');

  if (overlay !== 'profile') return null;

  return (
    <div className="fixed inset-0 bg-surface-dim/40 backdrop-blur-sm z-50 flex items-center justify-center p-gutter animate-in fade-in duration-200">
      {/* Profile Overlay Modal matching profile_overlay_crimson */}
      <div
        className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(45,10,10,0.08)] w-full max-w-[480px] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 z-50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-lg border-b border-outline-variant">
          <h2 className="font-headline-md text-headline-md text-primary tracking-tight">Profile</h2>
          <button
            onClick={closeOverlay}
            aria-label="Close modal"
            className="text-on-surface-variant hover:text-primary transition-colors duration-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-lg space-y-xl">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-sm">
            <div className="relative group cursor-pointer">
              <div
                className="w-24 h-24 rounded-full border border-outline-variant flex items-center justify-center text-4xl shadow-sm transition-transform group-hover:scale-105"
                style={{ backgroundColor: theme.hex + '25', borderColor: theme.hex }}
              >
                {avatar}
              </div>
              <div className="absolute inset-0 bg-primary/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Camera className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {['🦊', '👩🏻‍💻', '👨🏻‍🎨', '👩🏼‍🔬', '👨🏽‍💻', '⚡'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setAvatar(emoji)}
                  className={clsx(
                    'w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all',
                    avatar === emoji ? 'bg-primary-container text-primary scale-110' : 'hover:bg-surface-container'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <span className="font-label-md text-label-md text-on-surface-variant">Update Avatar</span>
          </div>

          {/* Input Fields */}
          <div className="space-y-lg">
            {/* Display Name */}
            <div className="flex flex-col space-y-xs">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="displayName">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="font-body-md text-body-md bg-transparent border-0 border-b border-outline-variant px-0 py-sm focus:ring-0 focus:border-primary transition-colors duration-300 text-primary outline-none"
              />
            </div>
            {/* Username */}
            <div className="flex flex-col space-y-xs">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="font-body-md text-body-md bg-transparent border-0 border-b border-outline-variant px-0 py-sm focus:ring-0 focus:border-primary transition-colors duration-300 text-primary outline-none"
              />
            </div>
          </div>

          {/* Profile Color Grid (24 themes) */}
          <div className="space-y-sm pt-sm">
            <label className="font-label-md text-label-md text-on-surface-variant block mb-md">
              Profile Color / Theme
            </label>
            <div className="grid grid-cols-6 gap-sm">
              {presetThemes.map((p) => {
                const isSelected = theme.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setTheme(p)}
                    className={clsx(
                      'w-8 h-8 rounded-full transition-all flex items-center justify-center',
                      isSelected ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-110 opacity-90 hover:opacity-100'
                    )}
                    style={{ backgroundColor: p.hex }}
                    title={`${p.name} (${p.hex})`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-md p-lg border-t border-outline-variant bg-surface-container-lowest rounded-b-xl">
          <button
            onClick={closeOverlay}
            className="px-lg py-sm rounded-lg font-label-md text-label-md text-primary bg-transparent border border-outline-variant hover:bg-surface-container transition-colors duration-300"
          >
            Cancel
          </button>
          <button
            onClick={closeOverlay}
            className="px-lg py-sm rounded-lg font-label-md text-label-md text-on-primary bg-primary hover:opacity-90 transition-opacity duration-300 shadow-[0_4px_20px_rgba(45,10,10,0.08)]"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
