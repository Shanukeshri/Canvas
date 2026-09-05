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
  LogOut,
  LogIn,
} from 'lucide-react';
import clsx from 'clsx';
import { updateProfileAction, updateUserThemeAction } from '@/features/users/actions';



const EMOJI_OPTIONS = [
  '🦊', '🐱', '🐼', '🦁', '🦉', '🐺', '🐸', '🐨',
  '👩🏻‍💻', '👨🏻‍🎨', '👩🏼‍🔬', '👨🏽‍💻', '🧙‍♂️', '🥷', '🧑‍🚀', '🧘',
  '⚡', '🌌', '🔥', '✨', '🚀', '🎯', '🌿', '🪐',
  '🌊', '💎', '☕', '🎧', '🔮', '💡', '🌈', '🍀',
];

export function ProfileOverlay() {
  const {
    overlay,
    closeOverlay,
    userAvatar,
    setUserAvatar,
    currentUser,
    setCurrentUser,
    isAuthenticated,
    logout,
    openAuthModal,
  } = useApp();
  const { theme, setTheme, setCustomColor, customHex, presetThemes } = useTheme();

  const [displayName, setDisplayName] = useState(currentUser?.name || 'Alex Serene');
  const [username, setUsername] = useState(currentUser?.handle || '@alex_s');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userStats, setUserStats] = useState<{ streakDays: number; totalSessions: number }>({
    streakDays: 0,
    totalSessions: 0,
  });
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Sync with currentUser and load color profile
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.name);
      setUsername(currentUser.handle);
      if (currentUser.themeColor) {
        const found = presetThemes.find((p) => p.hex.toLowerCase() === currentUser.themeColor?.toLowerCase());
        if (found) {
          setTheme(found);
        } else {
          setCustomColor(currentUser.themeColor);
        }
      }
    }
  }, [currentUser]);

  // Fetch real statistics when profile overlay is open
  useEffect(() => {
    if (overlay !== 'profile') return;
    const userId = currentUser?.id || 'user-default';
    fetch(`/api/statistics?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.metrics) {
          setUserStats({
            streakDays: res.data.metrics.streakDays ?? 0,
            totalSessions: res.data.metrics.totalSessions ?? 0,
          });
        }
      })
      .catch(() => {});
  }, [overlay, currentUser?.id]);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="bg-surface-container-lowest/95 backdrop-blur-2xl border border-surface-variant/40 rounded-3xl shadow-2xl w-full max-w-[520px] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 z-50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-variant/30 bg-surface-container-lowest/80 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border border-surface-variant/40 shadow-sm"
              style={{ backgroundColor: theme.hex + '15', color: theme.hex }}
            >
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">Profile & 24 Color Themes</h2>
              <p className="text-xs text-outline">Your personal identity & dynamic canvas aesthetics</p>
            </div>
          </div>
          <button
            onClick={closeOverlay}
            aria-label="Close modal"
            className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Avatar Section: Click avatar to open emoji tooltip */}
          <div className="p-5 rounded-3xl bg-surface-container-low/70 border border-surface-variant/40 flex flex-col items-center gap-3 shadow-sm relative">
            <div className="relative" ref={emojiPickerRef}>
              <button
                type="button"
                onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
                className="w-20 h-20 rounded-3xl border-2 flex items-center justify-center text-4xl shadow-md transition-all hover:scale-105 active:scale-95 group relative cursor-pointer"
                style={{ backgroundColor: theme.hex + '20', borderColor: theme.hex }}
                title="Click to choose new profile icon"
              >
                <span>{userAvatar}</span>
                {/* Small subtle badge on avatar */}
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-surface border border-surface-variant shadow-sm text-xs opacity-90 group-hover:scale-110 transition-transform"
                  style={{ color: theme.hex }}
                >
                  <Smile className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Emoji Selection Tooltip / Popover */}
              {isEmojiPickerOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 z-50 w-72 p-3 bg-surface-container-highest/98 backdrop-blur-2xl border border-surface-variant rounded-2xl shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1 pb-1 border-b border-surface-variant/40">
                    <span className="text-[11px] font-bold text-on-surface flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" style={{ color: theme.hex }} /> Choose Profile Icon
                    </span>
                    <span className="text-[10px] text-outline font-mono">32 Emojis</span>
                  </div>

                  <div className="grid grid-cols-8 gap-1.5 max-h-48 overflow-y-auto p-1 no-scrollbar">
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
                            'w-7 h-7 rounded-lg text-base flex items-center justify-center transition-all hover:scale-125 cursor-pointer',
                            isSelected
                              ? 'bg-surface-container-low ring-2 ring-primary scale-110 shadow-xs'
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

            <span className="text-xs text-outline font-medium">Click icon to choose avatar</span>

            {/* User Stats Pill */}
            <div className="mt-0.5 flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-surface-variant/50 text-[11px] font-semibold text-outline">
              <span className="flex items-center gap-1 text-amber-400">
                <Flame className="w-3.5 h-3.5 fill-amber-400" /> {userStats.streakDays} Day Streak
              </span>
              <span>•</span>
              <span style={{ color: theme.hex }}>{userStats.totalSessions} Total Sessions</span>
            </div>
          </div>

          {/* Input Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-outline" htmlFor="displayName">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="text-xs bg-surface-container border border-surface-variant/50 rounded-xl px-3.5 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors font-medium"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-outline" htmlFor="username">
                Handle
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-xs bg-surface-container border border-surface-variant/50 rounded-xl px-3.5 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors font-mono"
              />
            </div>
          </div>

          {/* 24 Harmonious Color Swatches */}
          <div className="space-y-3 pt-3 border-t border-surface-variant/30">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Active Theme & Accent Tint
              </label>
              <span className="text-xs font-mono font-medium" style={{ color: theme.hex }}>
                {theme.id === 'custom' ? `Custom (${customHex})` : theme.name}
              </span>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 p-4 rounded-2xl bg-surface-container-low/70 border border-surface-variant/40 shadow-sm">
              {presetThemes.map((p) => {
                const isSelected = theme.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setTheme(p)}
                    className={clsx(
                      'w-full aspect-square rounded-2xl transition-all flex items-center justify-center relative border border-white/10 shadow-sm',
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
                  'w-full aspect-square rounded-2xl transition-all flex items-center justify-center relative cursor-pointer border border-white/20 overflow-hidden shadow-sm',
                  theme.id === 'custom' &&
                    'scale-110 ring-2 ring-offset-2 ring-offset-surface ring-primary'
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

          {/* Account Status & Authentication Section */}
          <div className="p-4 rounded-2xl bg-surface-container-low/70 border border-surface-variant/40 flex items-center justify-between shadow-sm">
            {isAuthenticated && currentUser ? (
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center border border-surface-variant shadow-xs shrink-0"
                  style={{ backgroundColor: theme.hex + '15', color: theme.hex }}
                >
                  {currentUser.provider === 'google' ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-on-surface">
                      {currentUser.provider === 'google' ? 'Google Account' : 'Zen Account'}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold"
                      style={{ backgroundColor: theme.hex + '20', color: theme.hex }}
                    >
                      Active
                    </span>
                  </div>
                  <span className="text-[11px] text-outline font-mono truncate max-w-[210px]">
                    {currentUser.email}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-outline">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-on-surface">Guest Mode</span>
                  <span className="text-[11px] text-outline">Session not synced to cloud</span>
                </div>
              </div>
            )}

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  if (showLogoutConfirm) {
                    logout();
                    setShowLogoutConfirm(false);
                  } else {
                    setShowLogoutConfirm(true);
                  }
                }}
                className={clsx(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border',
                  showLogoutConfirm
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse'
                    : 'text-outline hover:text-rose-400 hover:bg-rose-500/10 border-surface-variant/60'
                )}
                title="Log out of current account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{showLogoutConfirm ? 'Confirm Logout?' : 'Logout'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer"
                style={{ backgroundColor: theme.hex }}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-surface-variant/30 bg-surface-container-lowest/80 shrink-0">
          <div>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  logout();
                  openAuthModal('login');
                }}
                className="text-xs font-medium text-outline hover:text-on-surface transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Switch Account</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={closeOverlay}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:text-on-surface border border-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (currentUser) {
                  const updated = {
                    ...currentUser,
                    name: displayName,
                    handle: username,
                    avatar: userAvatar,
                    themeColor: theme.hex,
                  };
                  setCurrentUser(updated);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('zen_current_user_v1', JSON.stringify(updated));
                  }
                  try {
                    await updateProfileAction(currentUser.id, {
                      name: displayName,
                      handle: username,
                      avatar: userAvatar,
                      themeColor: theme.hex,
                    });
                  } catch (err) {
                    console.warn('Update profile error:', err);
                  }
                }
                closeOverlay();
              }}
              className="px-6 py-2 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
              style={{ backgroundColor: theme.hex }}
            >
              Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
