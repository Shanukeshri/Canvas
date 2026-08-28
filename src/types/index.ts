export type TimerMode = 'pomodoro' | 'stopwatch';
export type TimerState = 'idle' | 'running' | 'paused' | 'completed';
export type ActiveTab = 'timer' | 'todos' | 'groups';
export type OverlayType = 
  | null 
  | 'stats' 
  | 'settings' 
  | 'profile' 
  | 'sound' 
  | 'timer-settings' 
  | 'task-detail' 
  | 'friends' 
  | 'notifications' 
  | 'command-k';

export interface Task {
  id: string;
  title: string;
  project: string;
  priority: 'low' | 'medium' | 'high';
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
  status: 'online' | 'focusing' | 'break' | 'offline';
  currentTask?: string;
  timerMinutes?: number;
  timerSeconds?: number;
  mode?: TimerMode;
  isFocusing?: boolean;
}

export interface GroupMember {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  color: string;
  status: 'focusing' | 'break' | 'idle' | 'offline';
  timerTime: string;
  currentTask: string;
  isUser?: boolean;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  members: GroupMember[];
  tasks: Task[];
  activeCount: number;
}

export interface SoundTrack {
  id: string;
  name: string;
  category: 'Nature' | 'Ambient' | 'Noise';
  volume: number; // 0 to 100
  isPlaying: boolean;
  type: 'rain' | 'fireplace' | 'brown' | 'white' | 'pink' | 'ocean' | 'library' | 'cafe';
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
  type: 'friend_request' | 'group_invite' | 'timer_complete' | 'system';
  read: boolean;
  actionPayload?: any;
}

export interface StatDayData {
  day: string;
  focusMinutes: number;
  stopwatchMinutes: number;
  sessions: number;
  tasksCompleted: number;
}

export interface ProjectStat {
  name: string;
  minutes: number;
  color: string;
}
