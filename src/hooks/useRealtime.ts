'use client';

import { useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket/socket-client';
import { useApp } from '@/context/AppContext';
import { Friend } from '@/types';
import { ExactTimerStatePayload, TimerEventType } from '@/types/socket';
import { tabSync } from '@/lib/broadcast';

export function useRealtime() {
  const {
    currentUser,
    setFriends,
    setGroups,
    activeGroupId,
    setNotifications,
    attachedFriendIds,
    setAttachedFriendIds,
    attachFriend,
    detachFriend,
    engineState,
    selectedTask,
  } = useApp();

  const isMountedRef = useRef(true);
  const engineStateRef = useRef(engineState);
  engineStateRef.current = engineState;
  const selectedTaskRef = useRef(selectedTask);
  selectedTaskRef.current = selectedTask;
  const lastEmittedStatusRef = useRef<string>(engineState.status);
  const lastEmittedModeRef = useRef<string>(engineState.mode);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Helper to build current timer payload with millisecond precision
  const buildCurrentTimerPayload = (event: TimerEventType): ExactTimerStatePayload => {
    const state = engineStateRef.current;
    const task = selectedTaskRef.current;
    const isStopwatch = state.mode === 'stopwatch';
    const durationMs = Number(state.durationMs || 0);
    const elapsedMs = Number(state.elapsedDurationMs || 0);
    const remainingMs = isStopwatch ? 0 : Math.max(0, durationMs - elapsedMs);
    const currentTimeMs = isStopwatch ? elapsedMs : remainingMs;

    return {
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Coworker',
      userAvatar: currentUser?.avatar || '🦊',
      userColor: currentUser?.themeColor || '#6366f1',
      event,
      timerType: isStopwatch ? 'stopwatch' : 'timer',
      mode: state.mode,
      status: state.status,
      phase: state.phase,
      durationMs,
      remainingMs: Math.max(0, remainingMs),
      currentTimeMs: Math.max(0, currentTimeMs),
      elapsedDurationMs: Math.max(0, elapsedMs),
      targetCompletionMs: isStopwatch
        ? null
        : 'targetCompletionMs' in state && state.targetCompletionMs
        ? Number(state.targetCompletionMs)
        : null,
      startedAtMs: 'startedAtMs' in state ? Number((state as any).startedAtMs) : null,
      timestampMs: Date.now(),
      currentTask: task?.title || 'Deep focus work',
    };
  };

  // Emit timer state ONLY on discrete events (play, pause, reset, mode_change) - NOT continuous ticks!
  useEffect(() => {
    if (typeof window === 'undefined' || !currentUser?.id) return;
    try {
      const socket = getSocket(currentUser.id);
      if (!socket.connected) {
        socket.connect();
      }

      // Determine the specific event
      let event: TimerEventType = 'sync';
      if (lastEmittedModeRef.current !== engineState.mode) {
        event = 'mode_change';
      } else if (lastEmittedStatusRef.current !== engineState.status) {
        if (engineState.status === 'running') event = 'play';
        else if (engineState.status === 'paused') event = 'pause';
        else if (engineState.status === 'idle') event = 'reset';
      }

      lastEmittedStatusRef.current = engineState.status;
      lastEmittedModeRef.current = engineState.mode;

      const payload = buildCurrentTimerPayload(event);

      socket.emit('timer:event', payload);
      socket.emit('timer:sync_state', payload);
      tabSync.publish({
        type: 'TIMER_EVENT_SYNC',
        payload,
        friendUserId: currentUser.id,
      });
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
    'targetCompletionMs' in engineState ? (engineState as any).targetCompletionMs : null,
    currentUser?.id,
    selectedTask?.title,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined' || !currentUser?.id) return;

    // 1. Socket.IO connection
    let socket: any = null;
    let unsubTab: (() => void) | null = null;

    try {
      socket = getSocket(currentUser.id);
      if (!socket.connected) {
        socket.connect();
      }

      const emitHeartbeat = () => {
        socket.emit('presence:heartbeat', {
          userId: currentUser.id,
          activeGroupId: activeGroupId || undefined,
        });
      };

      socket.on('connect', emitHeartbeat);
      emitHeartbeat();

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

        const isRunning = payload.status === 'running';
        const isStopwatch = payload.timerType === 'stopwatch' || payload.mode === 'stopwatch';

        let friendMinutes = 0;
        let friendSeconds = 0;
        let remainingMs = 0;
        let elapsedMs = 0;

        if (isStopwatch) {
          if (isRunning) {
            const startedAt = payload.startedAtMs || (payload.timestampMs - (payload.currentTimeMs || 0));
            elapsedMs = Math.max(0, Date.now() - startedAt);
          } else {
            elapsedMs = Math.max(0, payload.currentTimeMs ?? payload.elapsedDurationMs ?? 0);
          }
          const totalSecs = Math.max(0, Math.floor(elapsedMs / 1000));
          friendMinutes = Math.floor(totalSecs / 60);
          friendSeconds = totalSecs % 60;
          remainingMs = 0;
        } else {
          if (isRunning) {
            const targetComp = payload.targetCompletionMs || (payload.timestampMs + (payload.currentTimeMs || payload.remainingMs || 0));
            remainingMs = Math.max(0, targetComp - Date.now());
          } else {
            remainingMs = Math.max(0, payload.currentTimeMs ?? payload.remainingMs ?? 0);
          }
          const totalSecs = Math.max(0, Math.ceil(remainingMs / 1000));
          friendMinutes = Math.floor(totalSecs / 60);
          friendSeconds = totalSecs % 60;
          elapsedMs = Math.max(0, (payload.durationMs || 0) - remainingMs);
        }

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
            timerMinutes: Math.max(0, friendMinutes),
            timerSeconds: Math.max(0, friendSeconds),
            mode: payload.mode,
            timerType: isStopwatch ? 'stopwatch' : 'timer',
            durationMs: payload.durationMs,
            remainingMs: Math.max(0, remainingMs),
            currentTimeMs: isStopwatch ? Math.max(0, elapsedMs) : Math.max(0, remainingMs),
            elapsedDurationMs: Math.max(0, elapsedMs),
            targetCompletionMs: isStopwatch ? null : payload.targetCompletionMs,
            startedAtMs: isStopwatch ? (payload.startedAtMs || Date.now() - elapsedMs) : null,
            lastUpdatedMs: Date.now(),
            currentTask: payload.currentTask || (isRunning ? 'Deep focus' : 'Online'),
          };

          if (exists) {
            return prev.map((f) => (f.id === payload.userId ? { ...f, ...updatedData } : f));
          }
          return prev;
        });
      };

      // Handler when a coworker requests current state on joining/attaching
      const handleTimerStateRequested = (req: any) => {
        if (!req.targetUserId || req.targetUserId === currentUser.id) {
          const payload = buildCurrentTimerPayload('sync');
          socket.emit('timer:event', payload);
          socket.emit('timer:sync_state', payload);
        }
      };

      // Co-work request received
      const handleCoworkRequested = (payload: any) => {
        if (payload.receiverId !== currentUser.id) return;
        const newNotif = {
          id: `cowork-${Date.now()}`,
          title: 'Co-work Request',
          message: `${payload.senderName || 'A friend'} sent you a request to co-work.`,
          type: 'cowork_request' as const,
          time: 'Just now',
          read: false,
          actionPayload: {
            senderId: payload.senderId,
            senderName: payload.senderName || 'Friend',
            senderAvatar: payload.senderAvatar || '🦊',
            senderColor: payload.senderColor || '#6366f1',
            receiverId: payload.receiverId,
          },
        };
        setNotifications((prev) => {
          if (prev.some((n) => n.actionPayload?.senderId === payload.senderId && n.type === 'cowork_request')) {
            return prev;
          }
          return [newNotif, ...prev];
        });
      };

      // Co-work accepted: attach on both sides bidirectional!
      const handleCoworkAccepted = (payload: any) => {
        const isSender = payload.senderId === currentUser.id;
        const isReceiver = payload.receiverId === currentUser.id;
        if (!isSender && !isReceiver) return;

        const partnerId = isSender ? payload.receiverId : payload.senderId;
        const partnerName = isSender ? (payload.receiverName || 'Coworker') : (payload.senderName || 'Coworker');
        const partnerAvatar = isSender ? (payload.receiverAvatar || '🦊') : (payload.senderAvatar || '🦊');
        const partnerColor = isSender ? (payload.receiverColor || '#6366f1') : (payload.senderColor || '#6366f1');

        // 1. Attach friend on this side & persist
        attachFriend(partnerId);

        // 2. Ensure partner exists in friends state
        setFriends((prev) => {
          if (prev.some((f) => f.id === partnerId)) return prev;
          return [
            ...prev,
            {
              id: partnerId,
              name: partnerName,
              handle: `@${partnerName.toLowerCase().replace(/\s+/g, '_')}`,
              avatar: partnerAvatar,
              color: partnerColor,
              status: 'focusing',
              timerMinutes: 25,
              timerSeconds: 0,
              mode: 'pomodoro',
              isFocusing: true,
            } as Friend,
          ];
        });

        // 3. Immediately emit own current timer state to the partner
        const myStatePayload = buildCurrentTimerPayload('sync');
        socket.emit('timer:event', myStatePayload);
        socket.emit('timer:sync_state', myStatePayload);

        // 4. Request partner's exact state
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
        detachFriend(toRemove);
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
      socket.on('timer:event_synced', handleTimerStateSynced);
      socket.on('timer:state_requested', handleTimerStateRequested);
      socket.on('cowork:requested', handleCoworkRequested);
      socket.on('cowork:accepted', handleCoworkAccepted);
      socket.on('cowork:disconnected', handleCoworkDisconnected);
      socket.on('friend:request_received', handleFriendRequestReceived);

      // Multi-tab channel fallback for multi-user local testing
      unsubTab = tabSync.subscribe((msg) => {
        if (
          (msg.type === 'FRIEND_TIMER_SYNC' || msg.type === 'TIMER_EVENT_SYNC') &&
          msg.friendUserId !== currentUser.id
        ) {
          handleTimerStateSynced(msg.payload);
        } else if (msg.type === 'COWORK_ACCEPTED_SYNC') {
          handleCoworkAccepted(msg.payload);
        } else if (msg.type === 'COWORK_REQUEST_SYNC') {
          if (msg.receiverId === currentUser.id) {
            handleCoworkRequested(msg.payload);
          }
        } else if (msg.type === 'COWORK_ORBIT_SYNC') {
          const ids = msg.payload?.attachedFriendIds || [];
          ids.forEach((id: string) => attachFriend(id));
        } else if (msg.type === 'FRIEND_REQUEST_SYNC') {
          if (msg.payload?.receiverId === currentUser.id) {
            handleFriendRequestReceived({
              requestId: `freq-${Date.now()}`,
              sender: msg.payload.sender,
            });
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
          setNotifications((prev) => {
            const unpersisted = prev.filter((p) => !notifData.data.some((n: any) => n.id === p.id));
            return [...unpersisted, ...notifData.data];
          });
        }

        const friendsRes = await fetch(`/api/friends?userId=${encodeURIComponent(currentUser.id)}`);
        const friendsData = await friendsRes.json();
        if (friendsData.success && Array.isArray(friendsData.data)) {
          setFriends((prev) => {
            const merged = friendsData.data.map((f: Friend) => {
              const existing = prev.find((p) => p.id === f.id);
              if (existing && (existing.targetCompletionMs || existing.status === 'paused' || existing.startedAtMs)) {
                return { ...f, ...existing };
              }
              return f;
            });
            const extra = prev.filter(
              (p) => attachedFriendIds.includes(p.id) && !friendsData.data.some((f: Friend) => f.id === p.id)
            );
            return [...merged, ...extra];
          });
        }
      } catch {}
    }, 3500);

    return () => {
      clearInterval(pollInterval);
      if (unsubTab) unsubTab();
      if (socket) {
        try {
          socket.off('connect');
          socket.off('timer:state_synced');
          socket.off('timer:event_synced');
          socket.off('timer:state_requested');
          socket.off('cowork:requested');
          socket.off('cowork:accepted');
          socket.off('cowork:disconnected');
          socket.off('friend:request_received');
        } catch {}
      }
    };
  }, [currentUser?.id, activeGroupId, attachFriend, detachFriend, setFriends, setGroups, setNotifications]);
}
