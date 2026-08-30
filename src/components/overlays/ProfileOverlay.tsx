'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  X,
  User,
  Flame,
  Check,
  Pipette,
  Smile,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

const EMOJI_OPTIONS = [
  '🦊', '🐱', '🐼', '🦁', '🦉', '🐺', '🐸', '🐨',
  '👩🏻‍💻', '👨🏻‍🎨', '👩🏼‍🔬', '👨🏽‍💻', '🧙‍♂️', '🥷', '🧑‍🚀', '🧘',
  '⚡', '🌌', '🔥', '✨', '🚀', '🎯', '🌿', '🪐',
  '🌊', '💎', '☕', '🎧', '🔮', '💡', '🌈', '🍀',
];

export function ProfileOverlay() {
  const { overlay, closeOverlay, totalFocusMinutesToday, userAvatar, setUserAvatar } = useApp();
  const { theme, setTheme, setCustomColor, customHex, presetThemes } = useTheme();

  const [displayName, setDisplayName] = useState('Alex Serene');
  const [username, setUsername] = useState('@alex_s');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close emoji tooltip when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    }
    if (isEmojiPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEmojiPickerOpen]);

  if (overlay !== 'profile') return null;

  return (
    <div
      onClick={closeOverlay}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="bg-surface-container-lowest/95 backdrop-blur-2xl border border-surface-variant/40 rounded-3xl shadow-2xl w-full max-w-[480px] flex flex-col z-50 overflow-hidden select-none animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-variant/30 bg-surface-container-lowest/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border border-surface-variant/40 shadow-sm"
              style={{ backgroundColor: theme.hex + '15', color: theme.hex }}
            >
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-on-surface">Profile & Color Themes</h2>
              <p className="text-[11px] text-outline">Personal identity & canvas aesthetics</p>
            </div>
          </div>
          <button
            onClick={closeOverlay}
            aria-label="Close modal"
            className="p-1.5 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Unscrollable Content Area */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Avatar Section */}
          <div className="p-3 rounded-2xl bg-surface-container-low/70 border border-surface-variant/40 flex items-center justify-between shadow-sm relative">
            <div className="flex items-center gap-3.5">
              <div className="relative" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
                  className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-3xl shadow-md transition-all hover:scale-105 active:scale-95 group relative cursor-pointer"
                  style={{ backgroundColor: theme.hex + '20', borderColor: theme.hex }}
                  title="Click to choose new profile emoji"
                >
                  <span>{userAvatar}</span>
                  <div
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-surface border border-surface-variant shadow-sm text-[10px] opacity-90 group-hover:scale-110 transition-transform"
                    style={{ color: theme.hex }}
                  >
                    <Smile className="w-3 h-3" />
                  </div>
                </button>

                {/* Emoji Selection Tooltip */}
                {isEmojiPickerOpen && (
                  <div className="absolute left-0 top-full mt-2 z-50 w-64 p-2.5 bg-surface-container-highest/98 backdrop-blur-2xl border border-surface-variant rounded-2xl shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between px-1 pb-1 border-b border-surface-variant/40">
                      <span className="text-[10px] font-bold text-on-surface flex items-center gap-1">
                        <Sparkles className="w-3 h-3" style={{ color: theme.hex }} /> Choose Profile Icon
                      </span>
                      <span className="text-[9px] text-outline font-mono">32 Emojis</span>
                    </div>

                    <div className="grid grid-cols-8 gap-1 max-h-36 overflow-y-auto p-0.5 no-scrollbar">
                      {EMOJI_OPTIONS.map((emoji) => {
                        const isSelected = userAvatar === emoji;
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setUserAvatar(emoji);
                              setIsEmojiPickerOpen(false);
                            }}
                            className={clsx(
                              'w-6 h-6 rounded-md text-sm flex items-center justify-center transition-all hover:scale-125 cursor-pointer',
                              isSelected
                                ? 'bg-surface-container-low ring-1.5 ring-primary scale-110 shadow-xs'
                                : 'hover:bg-surface-container-low/80'
                            )}
                            title={`Choose ${emoji}`}
                          >
                            {emoji}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">{displayName}</span>
                <span className="text-[11px] text-outline font-mono">{username}</span>
                <span className="text-[10px] text-outline mt-0.5">Click icon to change avatar</span>
              </div>
            </div>

            {/* User Stats Pill */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container border border-surface-variant/50 text-[10px] font-semibold text-outline">
                <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-amber-400">14d Streak</span>
              </div>
              <span className="text-[10px] font-mono font-medium" style={{ color: theme.hex }}>
                48 Sessions
              </span>
            </div>
          </div>

          {/* Input Fields */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-outline" htmlFor="displayName">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="text-xs bg-surface-container border border-surface-variant/50 rounded-xl px-3 py-1.5 text-on-surface focus:outline-none focus:border-primary transition-colors font-medium"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-outline" htmlFor="username">
                Handle
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-xs bg-surface-container border border-surface-variant/50 rounded-xl px-3 py-1.5 text-on-surface focus:outline-none focus:border-primary transition-colors font-mono"
              />
            </div>
          </div>

          {/* 24 Harmonious Color Swatches */}
          <div className="space-y-2 pt-2 border-t border-surface-variant/30">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider">
                Theme & Accent Color
              </label>
              <span className="text-[11px] font-mono font-medium" style={{ color: theme.hex }}>
                {theme.id === 'custom' ? `Custom (${customHex})` : theme.name}
              </span>
            </div>

            <div className="grid grid-cols-8 gap-1.5 p-2.5 rounded-2xl bg-surface-container-low/70 border border-surface-variant/40 shadow-sm">
              {presetThemes.map((p) => {
                const isSelected = theme.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setTheme(p)}
                    className={clsx(
                      'w-full aspect-square rounded-xl transition-all flex items-center justify-center relative border border-white/10 shadow-2xs',
                      isSelected
                        ? 'scale-110 ring-2 ring-offset-1 ring-offset-surface ring-primary'
                        : 'hover:scale-105 opacity-85 hover:opacity-100'
                    )}
                    style={{ backgroundColor: p.hex }}
                    title={`${p.name} (${p.hex})`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </button>
                );
              })}

              {/* Custom Color Wheel */}
              <label
                className={clsx(
                  'w-full aspect-square rounded-xl transition-all flex items-center justify-center relative cursor-pointer border border-white/20 overflow-hidden shadow-2xs',
                  theme.id === 'custom' &&
                    'scale-110 ring-2 ring-offset-1 ring-offset-surface ring-primary'
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
                  <Check className="w-3 h-3 text-white drop-shadow-md stroke-[3] z-10 pointer-events-none" />
                ) : (
                  <Pipette className="w-2.5 h-2.5 text-white drop-shadow-md z-10 pointer-events-none" />
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2.5 px-5 py-3 border-t border-surface-variant/30 bg-surface-container-lowest/80 shrink-0">
          <button
            onClick={closeOverlay}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-outline hover:text-on-surface border border-surface-variant hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={closeOverlay}
            className="px-5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: theme.hex }}
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
