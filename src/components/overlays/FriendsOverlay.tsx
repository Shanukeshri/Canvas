'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Search,
  X,
  Check,
  Timer,
  UserPlus,
  Users,
  Sparkles,
  ArrowRight,
  Flame,
} from 'lucide-react';
import clsx from 'clsx';

export function FriendsOverlay() {
  const {
    overlay,
    closeOverlay,
    friends,
    attachedFriendIds,
    toggleAttachFriend,
    acceptFriendRequest,
    declineFriendRequest,
    setActiveTab,
  } = useApp();
  const { theme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [newFriendHandle, setNewFriendHandle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (overlay !== 'friends') return null;

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const focusingFriends = filteredFriends.filter((f) => f.status === 'focusing');
  const availableFriends = filteredFriends.filter((f) => f.status !== 'focusing');

  return (
    <div
      onClick={closeOverlay}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-[520px] bg-surface-container-lowest/95 backdrop-blur-2xl border border-surface-variant/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 z-50 max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & Search */}
        <div className="p-5 pb-4 border-b border-surface-variant/30 bg-surface-container-lowest/80 flex flex-col gap-3 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border border-surface-variant/40 shadow-sm"
                style={{ backgroundColor: theme.hex + '15', color: theme.hex }}
              >
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-on-surface">Focus Friends</h2>
                <p className="text-xs text-outline">Shared presence & accountability circles</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="p-2 rounded-xl text-outline hover:text-primary hover:bg-surface-container transition-colors flex items-center gap-1.5 text-xs font-semibold"
                style={showAddForm ? { color: theme.hex } : {}}
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Friend</span>
              </button>
              <button
                onClick={closeOverlay}
                aria-label="Close"
                className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Add Form */}
          {showAddForm && (
            <div className="p-3 rounded-2xl bg-surface-container-low/90 border border-surface-variant/40 flex items-center gap-2 animate-in fade-in duration-150">
              <input
                type="text"
                value={newFriendHandle}
                onChange={(e) => setNewFriendHandle(e.target.value)}
                placeholder="Enter handle e.g. @sarah_dev..."
                className="flex-1 bg-surface-container border border-surface-variant/50 rounded-xl px-3 py-1.5 text-xs text-on-surface placeholder:text-outline outline-none focus:border-primary font-mono"
              />
              <button
                onClick={() => {
                  setNewFriendHandle('');
                  setShowAddForm(false);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: theme.hex }}
              >
                Send Invite
              </button>
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low/70 border border-surface-variant/40 rounded-xl pl-9 pr-4 py-2 text-xs text-on-surface placeholder:text-outline focus:border-primary outline-none transition-colors"
              placeholder="Search friends by name or handle..."
              type="text"
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Incoming Requests */}
          <section className="space-y-2">
            <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
              Incoming Requests (1)
            </span>
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-surface-variant/40 bg-surface-container-low/70 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-surface-container border border-surface-variant/40 flex items-center justify-center text-lg shadow-sm">
                  👩🏻‍🎨
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">Elena Rostova</p>
                  <p className="text-[11px] text-outline">Mutuals: David Kim, Sarah Chen</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => declineFriendRequest('elena-req')}
                  aria-label="Decline"
                  className="p-1.5 rounded-xl border border-surface-variant/50 text-outline hover:text-error hover:bg-surface-container transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={() => acceptFriendRequest('elena-req')}
                  aria-label="Accept"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity flex items-center gap-1"
                  style={{ backgroundColor: theme.hex }}
                >
                  <Check className="w-3.5 h-3.5" /> Accept
                </button>
              </div>
            </div>
          </section>

          {/* Active Now (Focusing) */}
          <section className="space-y-2.5">
            <span className="text-[11px] font-semibold text-outline uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.hex }} />
              Focusing Now ({focusingFriends.length})
            </span>

            <div className="space-y-2">
              {focusingFriends.map((friend) => {
                const isAttached = attachedFriendIds.includes(friend.id);
                return (
                  <div
                    key={friend.id}
                    className="p-3.5 rounded-2xl border border-surface-variant/40 bg-surface-container-low/60 hover:border-primary/40 transition-all flex flex-col gap-2.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className="w-10 h-10 rounded-2xl border flex items-center justify-center text-lg shadow-sm"
                            style={{
                              backgroundColor: friend.color + '20',
                              borderColor: friend.color + '60',
                            }}
                          >
                            {friend.avatar}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-surface-container-highest rounded-full flex items-center justify-center border border-surface-variant text-[9px]">
                            <Timer className="w-2.5 h-2.5" style={{ color: theme.hex }} />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface">{friend.name}</p>
                          <p className="text-[11px] text-outline">
                            {friend.currentTask || 'Deep Flow'} • {friend.timerMinutes || 25}m left
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          toggleAttachFriend(friend.id);
                          closeOverlay();
                          setActiveTab('timer');
                        }}
                        className={clsx(
                          'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm',
                          isAttached
                            ? 'bg-surface-container border border-primary text-primary font-bold'
                            : 'text-white hover:opacity-90'
                        )}
                        style={!isAttached ? { backgroundColor: theme.hex } : { color: theme.hex }}
                      >
                        {isAttached ? 'On Canvas' : 'Attach Orbit'}
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: '65%',
                          backgroundColor: friend.color || theme.hex,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Online / Available */}
          <section className="space-y-2">
            <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
              Available Friends ({availableFriends.length})
            </span>

            <div className="space-y-1.5">
              {availableFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-surface-variant/20 hover:border-surface-variant/60 hover:bg-surface-container-low/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className="w-9 h-9 rounded-2xl border border-surface-variant/40 flex items-center justify-center text-base"
                        style={{ backgroundColor: friend.color + '15' }}
                      >
                        {friend.avatar}
                      </div>
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-surface-container-lowest" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-on-surface">{friend.name}</p>
                      <p className="text-[10px] text-outline font-mono">{friend.handle}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      toggleAttachFriend(friend.id);
                      closeOverlay();
                      setActiveTab('timer');
                    }}
                    className="p-2 rounded-xl text-outline hover:text-primary hover:bg-surface-container transition-colors"
                    title="Invite to Canvas Orbit"
                  >
                    <Timer className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-surface-variant/30 bg-surface-container-lowest/80 flex items-center justify-between text-xs text-outline shrink-0">
          <span>{friends.length} focus connections</span>
          <button
            onClick={closeOverlay}
            className="hover:text-primary transition-colors underline underline-offset-2"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
