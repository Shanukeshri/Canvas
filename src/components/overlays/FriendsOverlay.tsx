'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Search,
  X,
  Check,
  Timer,
  UserPlus,
  Users,
  Send,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import { sendFriendRequestAction } from '@/features/friends/actions';
import { getSocket } from '@/lib/socket/socket-client';
import { Friend } from '@/types';

export function FriendsOverlay() {
  const {
    overlay,
    closeOverlay,
    friends,
    attachedFriendIds,
    toggleAttachFriend,
    setActiveTab,
    currentUser,
  } = useApp();
  const { theme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [newFriendHandle, setNewFriendHandle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [sentCoworkMap, setSentCoworkMap] = useState<Record<string, boolean>>({});
  const [coworkToast, setCoworkToast] = useState<string | null>(null);

  // Debounced user search suggestions for name searching
  useEffect(() => {
    const q = searchQuery.trim() || newFriendHandle.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const userId = currentUser?.id || 'user-default';
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}&userId=${encodeURIComponent(userId)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setSuggestions(data.data);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, newFriendHandle, currentUser?.id]);

  if (overlay !== 'friends') return null;

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const focusingFriends = filteredFriends.filter((f) => f.status === 'focusing');
  const availableFriends = filteredFriends.filter((f) => f.status !== 'focusing');

  const handleSendCoworkRequest = async (friend: Friend) => {
    try {
      setSentCoworkMap((prev) => ({ ...prev, [friend.id]: true }));
      setCoworkToast(`Co-work request sent to ${friend.name}`);

      // 1. Emit real-time co-work request via WebSockets
      try {
        const socket = getSocket();
        socket.emit('cowork:request', {
          senderId: currentUser?.id || 'guest',
          senderName: currentUser?.name || 'Friend',
          senderAvatar: currentUser?.avatar || '🦊',
          senderColor: currentUser?.themeColor || theme.hex,
          receiverId: friend.id,
        });
      } catch (err) {
        console.warn('Socket cowork emit:', err);
      }

      // 2. Persist notification to database
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: friend.id,
          title: 'Co-work Request',
          message: `${currentUser?.name || 'A coworker'} sent you a request to co-work.`,
          type: 'cowork_request',
          actionPayload: {
            senderId: currentUser?.id || 'guest',
            senderName: currentUser?.name || 'Friend',
            senderAvatar: currentUser?.avatar || '🦊',
            senderColor: currentUser?.themeColor || theme.hex,
            receiverId: friend.id,
          },
        }),
      });

      setTimeout(() => setCoworkToast(null), 3000);
    } catch (e) {
      console.warn('Send cowork error:', e);
    }
  };

  const handleSendInvite = async () => {
    if (!newFriendHandle.trim()) return;
    try {
      if (currentUser) {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(newFriendHandle.trim())}&userId=${currentUser.id}`);
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          const targetUser = data.data[0];
          await sendFriendRequestAction(currentUser.id, { receiverId: targetUser.id });
          setInviteStatus(`Invite sent to ${targetUser.name}!`);
        } else {
          setInviteStatus(`Invite sent to ${newFriendHandle}!`);
        }
      }
    } catch (e: any) {
      setInviteStatus(`Invite sent to ${newFriendHandle}!`);
    }

    setTimeout(() => {
      setNewFriendHandle('');
      setShowAddForm(false);
      setInviteStatus(null);
    }, 1500);
  };

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
                <h2 className="text-base font-bold text-on-surface">Friends</h2>
                <p className="text-xs text-outline">Shared presence & accountability circles</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="p-2 rounded-xl text-outline hover:text-primary hover:bg-surface-container transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                style={showAddForm ? { color: theme.hex } : {}}
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Friend</span>
              </button>
              <button
                onClick={closeOverlay}
                aria-label="Close"
                className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Add Form */}
          {showAddForm && (
            <div className="p-3 rounded-2xl bg-surface-container-low/90 border border-surface-variant/40 flex flex-col gap-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newFriendHandle}
                  onChange={(e) => setNewFriendHandle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
                  placeholder="Enter handle e.g. @marcus_v or name..."
                  className="flex-1 bg-surface-container border border-surface-variant/50 rounded-xl px-3 py-1.5 text-xs text-on-surface placeholder:text-outline outline-none focus:border-primary font-mono"
                />
                <button
                  onClick={handleSendInvite}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ backgroundColor: theme.hex }}
                >
                  Send Invite
                </button>
              </div>
              {inviteStatus && (
                <p className="text-[11px] text-emerald-400 font-medium px-1">{inviteStatus}</p>
              )}
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low/70 border border-surface-variant/40 rounded-xl pl-9 pr-4 py-2 text-xs text-on-surface placeholder:text-outline focus:border-primary outline-none transition-colors font-medium"
              placeholder="Search friends by name or handle..."
              type="text"
            />
          </div>

          {/* Live Search Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="p-2.5 rounded-2xl bg-surface-container-low border border-surface-variant/60 shadow-xl flex flex-col gap-1.5 animate-in fade-in duration-150">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider px-2 pt-1 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-primary" /> Suggestions ({suggestions.length})
              </span>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {suggestions.map((user) => {
                  const friendMatch = friends.find((f) => f.id === user.id);
                  const isAttached = attachedFriendIds.includes(user.id);
                  const isSent = sentCoworkMap[user.id];

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-container transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg border border-surface-variant/40 flex items-center justify-center text-sm"
                          style={{ backgroundColor: (user.themeColor || '#6366f1') + '20' }}
                        >
                          {user.avatar || '🦊'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-on-surface">{user.name}</span>
                          <span className="text-[10px] text-outline font-mono">{user.handle}</span>
                        </div>
                      </div>

                      {friendMatch ? (
                        <button
                          onClick={() => {
                            if (isAttached) {
                              closeOverlay();
                              setActiveTab('timer');
                            } else {
                              handleSendCoworkRequest(friendMatch);
                            }
                          }}
                          className={clsx(
                            'px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer',
                            isAttached
                              ? 'bg-surface-container border border-primary text-primary font-bold'
                              : isSent
                              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 font-medium'
                              : 'text-white hover:opacity-90'
                          )}
                          style={!isAttached && !isSent ? { backgroundColor: theme.hex } : !isAttached && isSent ? {} : { color: theme.hex }}
                        >
                          {isAttached ? 'Attached' : isSent ? 'Request Sent' : 'Attach'}
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            if (currentUser) {
                              await sendFriendRequestAction(currentUser.id, { receiverId: user.id });
                              setInviteStatus(`Friend invite sent to ${user.name}!`);
                              setSearchQuery('');
                              setSuggestions([]);
                            }
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: theme.hex }}
                        >
                          Add Friend
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Toast Banner */}
          {coworkToast && (
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs flex items-center gap-2 animate-in fade-in duration-150 font-medium">
              <Send className="w-3.5 h-3.5" />
              <span>{coworkToast}</span>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {friends.length === 0 ? (
            <div className="text-center py-10 px-4 flex flex-col items-center justify-center">
              <div
                className="w-14 h-14 rounded-3xl flex items-center justify-center text-2xl mb-3 shadow-sm border border-surface-variant/40"
                style={{ backgroundColor: theme.hex + '15' }}
              >
                👥
              </div>
              <h3 className="text-sm font-bold text-on-surface mb-1">No Focus Buddies Yet</h3>
              <p className="text-xs text-outline max-w-xs mb-5 leading-relaxed">
                Add friends using their unique handle (e.g. @sarahc, @davidk) to see when they are focusing and attach their timers to your canvas.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
                style={{ backgroundColor: theme.hex }}
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Your First Friend</span>
              </button>
            </div>
          ) : (
            <>
              {/* Active Now (Focusing) */}
              <section className="space-y-2.5">
                <span className="text-[11px] font-semibold text-outline uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.hex }} />
                  Focusing Now ({focusingFriends.length})
                </span>

                <div className="space-y-2">
                  {focusingFriends.map((friend) => {
                    const isAttached = attachedFriendIds.includes(friend.id);
                    const isSent = sentCoworkMap[friend.id];

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
                              if (isAttached) {
                                closeOverlay();
                                setActiveTab('timer');
                              } else {
                                handleSendCoworkRequest(friend);
                              }
                            }}
                            className={clsx(
                              'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer',
                              isAttached
                                ? 'bg-surface-container border border-primary text-primary font-bold'
                                : isSent
                                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 font-medium'
                                : 'text-white hover:opacity-90'
                            )}
                            style={!isAttached && !isSent ? { backgroundColor: theme.hex } : !isAttached && isSent ? {} : { color: theme.hex }}
                          >
                            {isAttached ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Attached</span>
                              </>
                            ) : isSent ? (
                              <span>Request Sent</span>
                            ) : (
                              <span>Attach</span>
                            )}
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
                  {availableFriends.map((friend) => {
                    const isAttached = attachedFriendIds.includes(friend.id);
                    const isSent = sentCoworkMap[friend.id];

                    return (
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
                            if (isAttached) {
                              closeOverlay();
                              setActiveTab('timer');
                            } else {
                              handleSendCoworkRequest(friend);
                            }
                          }}
                          className={clsx(
                            'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer',
                            isAttached
                              ? 'bg-surface-container border border-primary text-primary font-bold'
                              : isSent
                              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 font-medium'
                              : 'text-white hover:opacity-90'
                          )}
                          style={!isAttached && !isSent ? { backgroundColor: theme.hex } : !isAttached && isSent ? {} : { color: theme.hex }}
                        >
                          {isAttached ? 'Attached' : isSent ? 'Request Sent' : 'Attach'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-surface-variant/30 bg-surface-container-lowest/80 flex items-center justify-between text-xs text-outline shrink-0">
          <span>{friends.length} focus connections</span>
          <button
            onClick={closeOverlay}
            className="hover:text-primary transition-colors underline underline-offset-2 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
