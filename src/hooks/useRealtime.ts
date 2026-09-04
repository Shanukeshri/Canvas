'use client';

import { useEffect } from 'react';
import { getSocket } from '@/lib/socket/socket-client';
import { useApp } from '@/context/AppContext';

export function useRealtime() {
  const {
    currentUser,
    setFriends,
    setGroups,
    activeGroupId,
    setNotifications,
  } = useApp();

  useEffect(() => {
    if (typeof window === 'undefined' || !currentUser) return;

    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    // Join current user room & active group room
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

    // Listen to friend timer updates
    const handleTimerStarted = (payload: any) => {
      setFriends((prev) =>
        prev.map((f) =>
          f.id === payload.userId
            ? {
                ...f,
                status: 'focusing',
                isFocusing: true,
                timerMinutes: Math.floor(payload.durationMs / (60 * 1000)),
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

    return () => {
      socket.off('timer:started', handleTimerStarted);
      socket.off('timer:paused', handleTimerPaused);
      socket.off('friend:request_received', handleFriendRequestReceived);
    };
  }, [currentUser, activeGroupId, setFriends, setGroups, setNotifications]);
}
