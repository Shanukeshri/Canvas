import { Friend, Group, GroupMember, Task } from './index';

export type TimerEventType = 'play' | 'pause' | 'reset' | 'mode_change' | 'sync';

export interface TimerEventPayload {
  userId: string;
  userHandle: string;
  userName: string;
  userAvatar: string;
  userColor: string;
  sessionId: string;
  event?: TimerEventType;
  timerType?: 'timer' | 'stopwatch';
  mode: 'pomodoro' | 'stopwatch';
  phase: 'focus' | 'short_break' | 'long_break' | 'none';
  durationMs: number;
  currentTimeMs?: number;
  elapsedDurationMs: number;
  targetCompletionMs?: number;
  startedAtMs?: number;
  timestampMs: number;
  eventId: string;
}

export interface ExactTimerStatePayload {
  userId: string;
  userName?: string;
  userAvatar?: string;
  userColor?: string;
  event?: TimerEventType;
  timerType?: 'timer' | 'stopwatch';
  mode: 'pomodoro' | 'stopwatch';
  status: 'idle' | 'running' | 'paused' | 'completed';
  phase: 'focus' | 'short_break' | 'long_break' | 'none';
  durationMs: number;
  remainingMs: number;
  currentTimeMs?: number;
  elapsedDurationMs: number;
  targetCompletionMs?: number | null;
  startedAtMs?: number | null;
  timestampMs: number;
  currentTask?: string;
}

export interface ClientToServerEvents {
  // Timer Sync
  'timer:start': (payload: TimerEventPayload) => void;
  'timer:pause': (payload: TimerEventPayload) => void;
  'timer:resume': (payload: TimerEventPayload) => void;
  'timer:stop': (payload: TimerEventPayload) => void;
  'timer:complete': (payload: TimerEventPayload) => void;
  'timer:heartbeat': (payload: { userId: string; timestampMs: number; elapsedMs: number }) => void;
  'timer:sync_state': (payload: ExactTimerStatePayload) => void;
  'timer:event': (payload: ExactTimerStatePayload) => void;
  'timer:request_state': (payload: { requesterId: string; targetUserId: string }) => void;

  // Co-working Orbit Events
  'cowork:request': (payload: {
    senderId: string;
    senderName: string;
    senderAvatar: string;
    senderColor: string;
    receiverId: string;
  }) => void;
  'cowork:accept': (payload: {
    senderId: string;
    receiverId: string;
    senderName?: string;
    senderAvatar?: string;
    senderColor?: string;
    receiverName?: string;
    receiverAvatar?: string;
    receiverColor?: string;
    senderFriendData?: Friend;
    receiverFriendData?: Friend;
  }) => void;
  'cowork:decline': (payload: { senderId: string; receiverId: string }) => void;
  'cowork:disconnect': (payload: { userId: string; targetUserId: string }) => void;

  // Groups
  'group:join': (payload: { groupId: string; user: GroupMember }) => void;
  'group:leave': (payload: { groupId: string; userId: string }) => void;
  'group:task_update': (payload: { groupId: string; task: Task; action: 'create' | 'update' | 'delete' | 'complete' }) => void;

  // Presence
  'presence:heartbeat': (payload: { userId: string; activeGroupId?: string }) => void;
  'presence:status': (payload: { userId: string; status: 'online' | 'focusing' | 'break' | 'offline'; currentTask?: string }) => void;

  // Multi-tab Sync
  'tab:ping': (payload: { tabId: string }) => void;
}

export interface ServerToClientEvents {
  // Timer Broadcasts
  'timer:started': (payload: TimerEventPayload) => void;
  'timer:paused': (payload: TimerEventPayload) => void;
  'timer:resumed': (payload: TimerEventPayload) => void;
  'timer:stopped': (payload: TimerEventPayload) => void;
  'timer:completed': (payload: TimerEventPayload) => void;
  'timer:state_synced': (payload: ExactTimerStatePayload) => void;
  'timer:event_synced': (payload: ExactTimerStatePayload) => void;
  'timer:state_requested': (payload: { requesterId: string; targetUserId: string }) => void;

  // Co-working Orbit Broadcasts
  'cowork:requested': (payload: {
    senderId: string;
    senderName: string;
    senderAvatar: string;
    senderColor: string;
    receiverId: string;
    timestampMs: number;
  }) => void;
  'cowork:accepted': (payload: {
    senderId: string;
    receiverId: string;
    senderName?: string;
    senderAvatar?: string;
    senderColor?: string;
    receiverName?: string;
    receiverAvatar?: string;
    receiverColor?: string;
    senderFriendData?: Friend;
    receiverFriendData?: Friend;
    timestampMs: number;
  }) => void;
  'cowork:declined': (payload: { senderId: string; receiverId: string; timestampMs: number }) => void;
  'cowork:disconnected': (payload: { userId: string; targetUserId: string; timestampMs: number }) => void;

  // Groups Broadcasts
  'group:member_joined': (payload: { groupId: string; member: GroupMember; timestampMs: number }) => void;
  'group:member_left': (payload: { groupId: string; userId: string; timestampMs: number }) => void;
  'group:task_changed': (payload: { groupId: string; task: Task; action: 'create' | 'update' | 'delete' | 'complete'; timestampMs: number }) => void;
  'group:sync': (payload: { group: Group }) => void;

  // Friends & Notifications
  'friend:request_received': (payload: { requestId: string; sender: Friend; timestampMs: number }) => void;
  'friend:request_accepted': (payload: { friendshipId: string; friend: Friend; timestampMs: number }) => void;
  'friend:status_changed': (payload: { friendId: string; status: 'online' | 'focusing' | 'break' | 'offline'; currentTask?: string; timerTime?: string }) => void;

  // Presence
  'presence:update': (payload: { onlineUserIds: string[] }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  sessionId: string;
}
