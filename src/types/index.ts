export type TimerMode = "pomodoro" | "stopwatch";
export type TimerState = "idle" | "running" | "paused" | "completed";
export type ActiveTab = "timer" | "todos" | "groups";
export type OverlayType =
  | null
  | "stats"
  | "settings"
  | "profile"
  | "sound"
  | "timer-settings"
  | "task-detail"
  | "friends"
  | "notifications"
  | "groups"
  | "command-k"
  | "auth";

export interface User {
  id: string;
  name: string;
  email: string;
  handle: string;
  avatar: string;
  themeColor?: string;
  preferences?: string | null;
  provider: "email" | "google" | "guest";
  createdAt?: string;
}

export interface Task {
  id: string;
  title: string;
  project: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  description?: string;
  assignedTo?: string; // User handle or avatar
}

export interface Friend {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  color: string;
  status: "online" | "focusing" | "break" | "offline" | "paused";
  currentTask?: string;
  timerMinutes?: number;
  timerSeconds?: number;
  mode?: TimerMode;
  timerType?: 'timer' | 'stopwatch';
  isFocusing?: boolean;
  durationMs?: number;
  remainingMs?: number;
  elapsedDurationMs?: number;
  currentTimeMs?: number;
  targetCompletionMs?: number | null;
  startedAtMs?: number | null;
  lastUpdatedMs?: number;
}

export interface GroupMember {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  color: string;
  status: "focusing" | "break" | "idle" | "offline";
  timerTime: string;
  currentTask: string;
  isUser?: boolean;
  isConnected?: boolean;
}

export interface GroupPendingInvite {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  color: string;
  invitedAt: number;
}

export interface Group {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  members: GroupMember[];
  pendingInvites?: GroupPendingInvite[];
  tasks: Task[];
  customLists?: string[];
  activeCount: number;
}

export type SoundCategory = 'Nature' | 'Noise' | 'Frequencies';
export type SoundSourceKind = 'file' | 'noise' | 'binaural' | 'tone';

export interface SoundTrack {
  id: string;
  name: string;
  category: SoundCategory;
  volume: number; // 0 to 100
  isPlaying: boolean;
  type: SoundSourceKind;
  src?: string;
  noiseType?: 'white' | 'pink' | 'brown';
  frequency?: number;
  description?: string;
}

export interface SoundMix {
  id: string;
  name: string;
  sounds: { soundId: string; volume: number }[];
}

export interface ThemeColor {
  id: string;
  name: string;
  hex: string;
  hsl: { h: number; s: number; l: number };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "friend_request" | "friend_accepted" | "group_invite" | "cowork_request" | "timer_complete" | "system";
  read: boolean;
  actionPayload?: any;
}

export interface StatDayData {
  day: string;
  focusMinutes: number;
  stopwatchMinutes: number;
  sessions: number;
  tasksCompleted?: number;
  date?: string;
}

export interface ProjectStat {
  name: string;
  minutes: number;
  color: string;
}
