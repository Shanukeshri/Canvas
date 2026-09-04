'use client';

import { useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket/socket-client';
import { useApp } from '@/context/AppContext';
import { Friend } from '@/types';

export function useRealtime() {
  const {
    currentUser,
    setFriends,
    setGroups,
    activeGroupId,
    setNotifications,
    setAttachedFriendIds,
  } = useApp();

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !currentUser?.id) return;

    // 1. Socket.IO connection (if available)
    let socket: any = null;
    try {
      socket = getSocket();
      if (!socket.connected) {
        socket.connect();
      }

      socket.emit('presence:heartbeat', {
        userId: currentUser.id,
        activeGroupId: activeGroupId || undefined,
      });

      if (activeGroupId) {
        socket.emit('group:join', {
          groupId: activeGroupId,
          user: {
            id: currentUser.id,
            name: currentUser.name,
            handle: currentUser.handle,
            avatar: currentUser.avatar,
            color: '#6366f1',
            status: 'focusing',
            timerTime: '25:00',
            currentTask: 'Deep focus',
            isUser: true,
          },
        });
      }

      const handleTimerStarted = (payload: any) => {
        setFriends((prev) =>
          prev.map((f) =>
            f.id === payload.userId
              ? {
                  ...f,
                  status: 'focusing',
                  isFocusing: true,
                  timerMinutes: Math.floor((payload.durationMs || 1500000) / (60 * 1000)),
                  timerSeconds: 0,
                }
              : f
          )
        );
      };

      const handleTimerPaused = (payload: any) => {
        setFriends((prev) =>
          prev.map((f) =>
            f.id === payload.userId
              ? {
                  ...f,
                  status: 'online',
                  isFocusing: false,
                }
              : f
          )
        );
      };

      const handleFriendRequestReceived = (payload: any) => {
        setNotifications((prev) => [
          {
            id: payload.requestId,
            title: 'New Friend Request',
            message: `${payload.sender.name} sent you a friend request.`,
            type: 'friend_request',
            time: 'Just now',
            read: false,
            actionPayload: { requestId: payload.requestId, senderId: payload.sender.id },
          },
          ...prev,
        ]);
      };

      socket.on('timer:started', handleTimerStarted);
      socket.on('timer:paused', handleTimerPaused);
      socket.on('friend:request_received', handleFriendRequestReceived);
    } catch (err) {
      console.warn('Socket realtime connection error:', err);
    }

    // 2. Periodic sync fallback (every 3.5 seconds) ensuring cross-user sync works everywhere
    const pollInterval = setInterval(async () => {
      if (!isMountedRef.current || !currentUser?.id) return;
      try {
        // Sync notifications
        const notifRes = await fetch(`/api/notifications?userId=${encodeURIComponent(currentUser.id)}`);
        const notifData = await notifRes.json();
        if (notifData.success && Array.isArray(notifData.data)) {
          setNotifications(notifData.data);
        }

        // Sync friends
        const friendsRes = await fetch(`/api/friends?userId=${encodeURIComponent(currentUser.id)}`);
        const friendsData = await friendsRes.json();
        if (friendsData.success && Array.isArray(friendsData.data)) {
          setFriends(friendsData.data);
        }
      } catch {
        // silent catch on background poll
      }
    }, 3500);

    return () => {
      clearInterval(pollInterval);
      if (socket) {
        try {
          socket.off('timer:started');
          socket.off('timer:paused');
          socket.off('friend:request_received');
        } catch {}
      }
    };
  }, [currentUser?.id, activeGroupId, setFriends, setGroups, setNotifications]);
}
