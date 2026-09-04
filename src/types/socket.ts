import { Friend, Group, GroupMember, Task } from './index';

export interface TimerEventPayload {
  userId: string;
  userHandle: string;
  userName: string;
  userAvatar: string;
  userColor: string;
  sessionId: string;
  mode: 'pomodoro' | 'stopwatch';
  phase: 'focus' | 'short_break' | 'long_break' | 'none';
  durationMs: number;
  elapsedDurationMs: number;
  targetCompletionMs?: number;
  timestampMs: number;
  eventId: string;
}

export interface ClientToServerEvents {
  // Timer Sync
  'timer:start': (payload: TimerEventPayload) => void;
  'timer:pause': (payload: TimerEventPayload) => void;
  'timer:resume': (payload: TimerEventPayload) => void;
  'timer:stop': (payload: TimerEventPayload) => void;
  'timer:complete': (payload: TimerEventPayload) => void;
  'timer:heartbeat': (payload: { userId: string; timestampMs: number; elapsedMs: number }) => void;

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
