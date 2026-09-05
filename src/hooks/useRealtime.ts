'use client';

import { useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket/socket-client';
import { useApp } from '@/context/AppContext';
import { Friend } from '@/types';
import { ExactTimerStatePayload } from '@/types/socket';
import { tabSync } from '@/lib/broadcast';

export function useRealtime() {
  const {
    currentUser,
    setFriends,
    setGroups,
    activeGroupId,
    setNotifications,
    setAttachedFriendIds,
    engineState,
    selectedTask,
  } = useApp();

  const isMountedRef = useRef(true);
  const engineStateRef = useRef(engineState);
  engineStateRef.current = engineState;
  const selectedTaskRef = useRef(selectedTask);
  selectedTaskRef.current = selectedTask;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Emit exact timer state changes to connected coworkers
  useEffect(() => {
    if (typeof window === 'undefined' || !currentUser?.id) return;
    try {
      const socket = getSocket();
      if (!socket.connected) {
        socket.connect();
      }

      const durationMs = Number(engineState.durationMs || 1500000);
      const elapsedMs = Number(engineState.elapsedDurationMs || 0);
      const remainingMs = Math.max(0, durationMs - elapsedMs);

      const payload: ExactTimerStatePayload = {
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        userColor: currentUser.themeColor || '#6366f1',
        mode: engineState.mode,
        status: engineState.status,
        phase: engineState.phase,
        durationMs,
        remainingMs,
        elapsedDurationMs: elapsedMs,
        targetCompletionMs: engineState.targetCompletionMs ? Number(engineState.targetCompletionMs) : null,
        timestampMs: Date.now(),
        currentTask: selectedTask?.title || 'Deep focus work',
      };

      socket.emit('timer:sync_state', payload);
      tabSync.publish({
        type: 'FRIEND_TIMER_SYNC',
        payload,
        friendUserId: currentUser.id,
      });
    } catch {}
  }, [
    engineState.status,
    engineState.phase,
    engineState.mode,
    engineState.durationMs,
    engineState.targetCompletionMs,
    currentUser?.id,
    selectedTask?.title,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined' || !currentUser?.id) return;

    // 1. Socket.IO connection
    let socket: any = null;
    let unsubTab: (() => void) | null = null;

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
            color: currentUser.themeColor || '#6366f1',
            status: 'focusing',
            timerTime: '25:00',
            currentTask: selectedTask?.title || 'Deep focus',
            isUser: true,
          },
        });
      }

      // Handler for exact timer sync from a friend (NEVER modifies user's own main timer)
      const handleTimerStateSynced = (payload: ExactTimerStatePayload) => {
        if (!payload || payload.userId === currentUser.id) return;

        let remainingMs = payload.remainingMs;
        if (payload.status === 'running' && payload.targetCompletionMs) {
          remainingMs = Math.max(0, payload.targetCompletionMs - Date.now());
        }
        const totalSecs = Math.ceil(remainingMs / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;

        const isRunning = payload.status === 'running';
        const friendStatus = isRunning
          ? payload.phase === 'short_break' || payload.phase === 'long_break'
            ? 'break'
            : 'focusing'
          : payload.status === 'paused'
          ? 'paused'
          : 'online';

        setFriends((prev) => {
          const exists = prev.some((f) => f.id === payload.userId);
          const updatedData: Partial<Friend> = {
            status: friendStatus as any,
            isFocusing: isRunning && payload.phase === 'focus',
            timerMinutes: mins,
            timerSeconds: secs,
            mode: payload.mode,
            durationMs: payload.durationMs,
            remainingMs: payload.remainingMs,
            targetCompletionMs: payload.targetCompletionMs,
            lastUpdatedMs: payload.timestampMs,
            currentTask: payload.currentTask || (isRunning ? 'Deep focus' : 'Online'),
          };

          if (exists) {
            return prev.map((f) => (f.id === payload.userId ? { ...f, ...updatedData } : f));
          } else {
            return [
              ...prev,
              {
                id: payload.userId,
                name: payload.userName || 'Coworker',
                handle: `@${(payload.userName || 'coworker').toLowerCase().replace(/\s+/g, '_')}`,
                avatar: payload.userAvatar || '🦊',
                color: payload.userColor || '#6366f1',
                ...updatedData,
              } as Friend,
            ];
          }
        });
      };

      // Handler when a coworker requests current state on joining/attaching
      const handleTimerStateRequested = (req: any) => {
        if (!req.targetUserId || req.targetUserId === currentUser.id) {
          const state = engineStateRef.current;
          const task = selectedTaskRef.current;
          const durationMs = Number(state.durationMs || 1500000);
          const elapsedMs = Number(state.elapsedDurationMs || 0);
          const remainingMs = Math.max(0, durationMs - elapsedMs);

          socket.emit('timer:sync_state', {
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            userColor: currentUser.themeColor || '#6366f1',
            mode: state.mode,
            status: state.status,
            phase: state.phase,
            durationMs,
            remainingMs,
            elapsedDurationMs: elapsedMs,
            targetCompletionMs: state.targetCompletionMs ? Number(state.targetCompletionMs) : null,
            timestampMs: Date.now(),
            currentTask: task?.title || 'Deep focus work',
          });
        }
      };

      // Co-work request received
      const handleCoworkRequested = (payload: any) => {
        if (payload.receiverId !== currentUser.id) return;
        setNotifications((prev) => [
          {
            id: `cowork-${Date.now()}`,
            title: 'Co-work Request',
            message: `${payload.senderName} sent you a request to co-work.`,
            type: 'cowork_request',
            time: 'Just now',
            read: false,
            actionPayload: {
              senderId: payload.senderId,
              senderName: payload.senderName,
              senderAvatar: payload.senderAvatar,
              senderColor: payload.senderColor,
              receiverId: payload.receiverId,
            },
          },
          ...prev,
        ]);
      };

      // Co-work accepted: attach on both sides
      const handleCoworkAccepted = (payload: any) => {
        const isSender = payload.senderId === currentUser.id;
        const isReceiver = payload.receiverId === currentUser.id;
        if (!isSender && !isReceiver) return;

        const partnerId = isSender ? payload.receiverId : payload.senderId;
        setAttachedFriendIds((prev) => (prev.includes(partnerId) ? prev : [...prev, partnerId]));

        // Request exact state from the partner so no state is guessed
        socket.emit('timer:request_state', {
          requesterId: currentUser.id,
          targetUserId: partnerId,
        });
      };

      // Co-work disconnected: detach on both sides
      const handleCoworkDisconnected = (payload: any) => {
        const isUser = payload.userId === currentUser.id;
        const isTarget = payload.targetUserId === currentUser.id;
        if (!isUser && !isTarget) return;

        const toRemove = isUser ? payload.targetUserId : payload.userId;
        setAttachedFriendIds((prev) => prev.filter((id) => id !== toRemove));
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

      socket.on('timer:state_synced', handleTimerStateSynced);
      socket.on('timer:state_requested', handleTimerStateRequested);
      socket.on('cowork:requested', handleCoworkRequested);
      socket.on('cowork:accepted', handleCoworkAccepted);
      socket.on('cowork:disconnected', handleCoworkDisconnected);
      socket.on('friend:request_received', handleFriendRequestReceived);

      // Multi-tab channel fallback for multi-user local testing
      unsubTab = tabSync.subscribe((msg) => {
        if (msg.type === 'FRIEND_TIMER_SYNC' && msg.friendUserId !== currentUser.id) {
          handleTimerStateSynced(msg.payload);
        } else if (msg.type === 'COWORK_DISCONNECT_SYNC') {
          const targetId = msg.payload?.targetFriendId;
          if (targetId) {
            setAttachedFriendIds((prev) => prev.filter((id) => id !== targetId));
          }
        }
      });
    } catch (err) {
      console.warn('Socket realtime connection error:', err);
    }

    // 2. Periodic poll for notifications & friends
    const pollInterval = setInterval(async () => {
      if (!isMountedRef.current || !currentUser?.id) return;
      try {
        const notifRes = await fetch(`/api/notifications?userId=${encodeURIComponent(currentUser.id)}`);
        const notifData = await notifRes.json();
        if (notifData.success && Array.isArray(notifData.data)) {
          setNotifications(notifData.data);
        }

        const friendsRes = await fetch(`/api/friends?userId=${encodeURIComponent(currentUser.id)}`);
        const friendsData = await friendsRes.json();
        if (friendsData.success && Array.isArray(friendsData.data)) {
          setFriends((prev) => {
            // Merge with existing state to avoid clobbering active websocket timer state
            return friendsData.data.map((f: Friend) => {
              const existing = prev.find((p) => p.id === f.id);
              if (existing && (existing.targetCompletionMs || existing.status === 'paused')) {
                return { ...f, ...existing };
              }
              return f;
            });
          });
        }
      } catch {}
    }, 3500);

    return () => {
      clearInterval(pollInterval);
      if (unsubTab) unsubTab();
      if (socket) {
        try {
          socket.off('timer:state_synced');
          socket.off('timer:state_requested');
          socket.off('cowork:requested');
          socket.off('cowork:accepted');
          socket.off('cowork:disconnected');
          socket.off('friend:request_received');
        } catch {}
      }
    };
  }, [currentUser?.id, activeGroupId, setFriends, setGroups, setNotifications, setAttachedFriendIds]);
}
