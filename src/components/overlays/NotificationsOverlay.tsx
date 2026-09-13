'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Bell,
  Check,
  X,
  Clock,
  Users,
  Sparkles,
  ArrowRight,
  UserPlus,
  Flame,
  Timer,
} from 'lucide-react';
import clsx from 'clsx';
import { getSocket } from '@/lib/socket/socket-client';
import { tabSync } from '@/lib/broadcast';

export function NotificationsOverlay() {
  const {
    overlay,
    closeOverlay,
    notifications,
    setNotifications,
    markNotificationRead,
    removeNotification,
    setActiveTab,
    acceptFriendRequest,
    declineFriendRequest,
    setActiveGroupId,
    currentUser,
    setAttachedFriendIds,
    attachFriend,
    setFriends,
    acceptGroupInvitation,
  } = useApp();
  const { theme } = useTheme();

  // Fresh fetch from database whenever overlay opens
  React.useEffect(() => {
    if (overlay === 'notifications' && currentUser?.id) {
      fetch(`/api/notifications?userId=${encodeURIComponent(currentUser.id)}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setNotifications(res.data);
          }
        })
        .catch(() => {});
    }
  }, [overlay, currentUser?.id, setNotifications]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'invites' | 'milestones'>('all');

  if (overlay !== 'notifications') return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === 'unread') return !notif.read;
    if (activeFilter === 'invites') return notif.type === 'group_invite' || notif.type === 'friend_request' || notif.type === 'cowork_request';
    if (activeFilter === 'milestones') return notif.type === 'timer_complete';
    return true;
  });

  const getNotifIcon = (type?: string) => {
    switch (type) {
      case 'group_invite':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'friend_request':
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'friend_accepted':
        return <Check className="w-4 h-4 text-emerald-400" />;
      case 'cowork_request':
        return <Timer className="w-4 h-4 text-emerald-400" />;
      case 'timer_complete':
        return <Flame className="w-4 h-4 text-amber-400" />;
      default:
        return <Clock className="w-4 h-4 text-primary" />;
    }
  };

  const handleAction = async (notif: (typeof notifications)[0]) => {
    // 1. Immediately remove from local state so user sees it disappear right away
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    // 2. Immediately delete from DB
    removeNotification(notif.id);

    if (notif.type === 'group_invite') {
      const groupId = notif.actionPayload?.groupId;
      const invitee = {
        id: notif.actionPayload?.inviteeId || currentUser?.id,
        name: notif.actionPayload?.inviteeName || currentUser?.name || 'Member',
        handle: notif.actionPayload?.inviteeHandle || currentUser?.handle || '@member',
        avatar: notif.actionPayload?.inviteeAvatar || currentUser?.avatar || '🦊',
        color: notif.actionPayload?.inviteeColor || currentUser?.themeColor || '#6366f1',
      };

      if (groupId) {
        await acceptGroupInvitation(groupId, invitee, notif.actionPayload?.invitationId || notif.id);
      }
      closeOverlay();
    } else if (notif.type === 'friend_request') {
      const targetId = notif.actionPayload?.requestId || notif.actionPayload?.senderId || notif.id;
      acceptFriendRequest(targetId);
      closeOverlay();
    } else if (notif.type === 'cowork_request') {
      const senderId = notif.actionPayload?.senderId;
      const senderName = notif.actionPayload?.senderName || 'Coworker';
      const senderAvatar = notif.actionPayload?.senderAvatar || '🦊';
      const senderColor = notif.actionPayload?.senderColor || '#6366f1';

      if (senderId) {
        attachFriend(senderId);

        setFriends((prev) => {
          if (prev.some((f) => f.id === senderId)) return prev;
          return [
            ...prev,
            {
              id: senderId,
              name: senderName,
              handle: `@${senderName.toLowerCase().replace(/\s+/g, '_')}`,
              avatar: senderAvatar,
              color: senderColor,
              status: 'focusing',
              timerMinutes: 25,
              timerSeconds: 0,
              mode: 'pomodoro',
              isFocusing: true,
            } as any,
          ];
        });

        const acceptPayload = {
          senderId,
          receiverId: currentUser?.id || 'guest',
          senderName,
          senderAvatar,
          senderColor,
          receiverName: currentUser?.name || 'Coworker',
          receiverAvatar: currentUser?.avatar || '🦊',
          receiverColor: currentUser?.themeColor || theme.hex,
        };

        try {
          const socket = getSocket(currentUser?.id);
          socket.emit('cowork:accept', acceptPayload);
        } catch {}

        tabSync.publish({
          type: 'COWORK_ACCEPTED_SYNC',
          payload: acceptPayload,
          userId: currentUser?.id || '',
        });
      }
      setActiveTab('timer');
      closeOverlay();
    }
  };


  return (
    <div
      onClick={closeOverlay}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-[520px] bg-surface-container-lowest/95 backdrop-blur-xl border border-surface-variant/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (No sub-heading, no Mark Read button) */}
        <div className="p-5 pb-4 border-b border-surface-variant/30 flex flex-col gap-3 bg-surface-container-lowest/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border border-surface-variant/40 shadow-sm"
                style={{ backgroundColor: theme.hex + '15', color: theme.hex }}
              >
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-on-surface">Notifications</h2>
                  {unreadCount > 0 && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: theme.hex }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={closeOverlay}
                className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'all', label: `All (${notifications.length})` },
                { id: 'unread', label: `Unread (${unreadCount})` },
                { id: 'invites', label: 'Invites & Social' },
                { id: 'milestones', label: 'Milestones' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0',
                  activeFilter === tab.id
                    ? 'bg-surface-container text-primary font-semibold border border-surface-variant/60 shadow-sm'
                    : 'text-outline hover:text-on-surface hover:bg-surface-container/50'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center border border-surface-variant/40 mb-3 shadow-inner"
                style={{ backgroundColor: theme.hex + '10' }}
              >
                <Sparkles className="w-6 h-6" style={{ color: theme.hex }} />
              </div>
              <h3 className="text-sm font-semibold text-on-surface">All quiet & peaceful</h3>
              <p className="text-xs text-outline mt-1 max-w-xs">
                No notifications in this filter. Time to return to deep flow.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isUnread = !notif.read;
              return (
                <div
                  key={notif.id}
                  onClick={() => markNotificationRead(notif.id)}
                  className={clsx(
                    'group relative p-3.5 rounded-2xl border transition-all flex gap-3 items-center justify-between',
                    isUnread
                      ? 'bg-surface-container-low/90 border-surface-variant hover:border-primary/50 shadow-sm'
                      : 'bg-surface-container-lowest/60 border-surface-variant/20 hover:border-surface-variant/50 opacity-80 hover:opacity-100'
                  )}
                >
                  {/* Left Accent indicator for unread */}
                  {isUnread && (
                    <div
                      className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
                      style={{ backgroundColor: theme.hex }}
                    />
                  )}

                  {/* Icon Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center shrink-0 border border-surface-variant/40">
                    {getNotifIcon(notif.type)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={clsx(
                          'text-xs font-semibold truncate',
                          isUnread ? 'text-on-surface' : 'text-on-surface-variant'
                        )}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-outline shrink-0 font-mono">{notif.time}</span>
                    </div>
                    <p className="text-[11px] text-outline mt-0.5 leading-relaxed break-words">
                      {notif.message}
                    </p>

                    {/* Actionable buttons for invites */}
                    {notif.type === 'group_invite' && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(notif);
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: theme.hex }}
                        >
                          <Check className="w-3 h-3" /> Accept & Join Room
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notif.id);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    {notif.type === 'friend_request' && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(notif);
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: theme.hex }}
                        >
                          <Check className="w-3 h-3" /> Accept
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const targetId = notif.actionPayload?.requestId || notif.actionPayload?.senderId || notif.id;
                            declineFriendRequest(targetId);
                            removeNotification(notif.id);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-outline hover:text-error hover:bg-surface-container transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {notif.type === 'friend_accepted' && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                          <Check className="w-3 h-3" /> Focus Buddies Connected
                        </span>
                      </div>
                    )}

                    {notif.type === 'cowork_request' && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(notif);
                          }}
                          className="px-3.5 py-1 rounded-lg text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
                          style={{ backgroundColor: theme.hex }}
                        >
                          <Check className="w-3.5 h-3.5" /> Accept Co-work
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const senderId = notif.actionPayload?.senderId;
                            if (senderId) {
                              try {
                                const socket = getSocket();
                                socket.emit('cowork:decline', {
                                  senderId,
                                  receiverId: currentUser?.id || 'guest',
                                });
                              } catch {}
                            }
                            removeNotification(notif.id);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-outline hover:text-error hover:bg-surface-container transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tick/Check button at right edge to read and remove notification */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notif.id);
                    }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-outline/60 hover:text-emerald-500 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 transition-all shrink-0 self-center group/tick"
                    title="Mark read & remove"
                    aria-label="Mark read and remove notification"
                  >
                    <Check className="w-4 h-4 group-hover/tick:scale-110 transition-transform" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-surface-variant/30 bg-surface-container-lowest/80 flex items-center justify-between text-[11px] text-outline px-5">
          <span>{notifications.length} total notifications</span>
          <button
            onClick={closeOverlay}
            className="hover:text-primary transition-colors underline underline-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
