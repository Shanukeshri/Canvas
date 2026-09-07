'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  ActiveTab,
  OverlayType,
  TimerMode,
  TimerState,
  Task,
  Friend,
  Group,
  GroupMember,
  SoundTrack,
  NotificationItem,
  StatDayData,
  User,
} from '@/types';
import { getSocket } from '@/lib/socket/socket-client';
import { INITIAL_SOUNDS } from '@/lib/mock-data';
import { SOUND_CATALOG } from '@/features/sounds/sounds';
import {
  createInitialTimerState,
  startTimer as engineStartTimer,
  pauseTimer as enginePauseTimer,
  resetTimer as engineResetTimer,
  computeTimerSnapshot,
  TimerEngineState,
  calculateFocusContributionMs,
} from '@/features/timer/timer-engine';
import { tabSync } from '@/lib/broadcast';
import { useTheme } from '@/context/ThemeContext';
import { audioEngine } from '@/features/sounds/audio-engine';
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  toggleTaskCompleteAction,
  reorderTasksAction,
} from '@/features/tasks/actions';
import {
  createGroupAction,
  joinGroupByCodeAction,
  leaveGroupAction,
  inviteFriendToGroupAction,
} from '@/features/groups/actions';
import {
  acceptFriendRequestAction,
  declineFriendRequestAction,
} from '@/features/friends/actions';
import { updateUserPreferencesAction } from '@/features/users/actions';
import { recordFocusSessionAction, saveTimerStateCheckpointAction } from '@/features/timer/actions';
import { markNotificationReadAction, removeNotificationAction } from '@/features/notifications/actions';

export const EMPTY_WEEK_STATS: StatDayData[] = [
  { day: 'Mon', focusMinutes: 0, stopwatchMinutes: 0, sessions: 0, date: '' },
  { day: 'Tue', focusMinutes: 0, stopwatchMinutes: 0, sessions: 0, date: '' },
  { day: 'Wed', focusMinutes: 0, stopwatchMinutes: 0, sessions: 0, date: '' },
  { day: 'Thu', focusMinutes: 0, stopwatchMinutes: 0, sessions: 0, date: '' },
  { day: 'Fri', focusMinutes: 0, stopwatchMinutes: 0, sessions: 0, date: '' },
  { day: 'Sat', focusMinutes: 0, stopwatchMinutes: 0, sessions: 0, date: '' },
  { day: 'Sun', focusMinutes: 0, stopwatchMinutes: 0, sessions: 0, date: '' },
];

const TIMER_STORAGE_KEY = 'canvas_timer_engine_state_v1';
const LEGACY_TIMER_STORAGE_KEY = 'zen_timer_engine_state_v1';

interface AppContextType {
  // Navigation & Overlays
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  overlay: OverlayType;
  setOverlay: (overlay: OverlayType) => void;
  closeOverlay: () => void;
  selectedTaskDetail: Task | null;
  setSelectedTaskDetail: (task: Task | null) => void;

  // Timer State
  timerMode: TimerMode;
  setTimerMode: (mode: TimerMode) => void;
  timerState: TimerState;
  setTimerState: (state: TimerState) => void;
  focusDurationMinutes: number;
  setFocusDurationMinutes: (mins: number) => void;
  shortBreakMinutes: number;
  setShortBreakMinutes: (mins: number) => void;
  longBreakMinutes: number;
  setLongBreakMinutes: (mins: number) => void;
  targetSessions: number;
  setTargetSessions: (count: number) => void;
  remainingSeconds: number;
  setRemainingSeconds: React.Dispatch<React.SetStateAction<number>>;
  sessionsCompleted: number;
  isBreakPhase: boolean;
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  startBreak: () => void;
  engineState: TimerEngineState;

  // Tasks State
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (task: Omit<Task, 'id'>) => void;
  toggleTaskComplete: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (task: Task) => void;
  reorderTasks: (tasks: Task[]) => void;

  // Friends & Attached Friend Bubbles State
  friends: Friend[];
  setFriends: React.Dispatch<React.SetStateAction<Friend[]>>;
  attachedFriendIds: string[];
  setAttachedFriendIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleAttachFriend: (friendId: string) => void;
  attachFriend: (friendId: string) => void;
  detachFriend: (friendId: string) => void;
  acceptFriendRequest: (friendId: string) => void;
  declineFriendRequest: (friendId: string) => void;

  // Groups State
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  activeGroupId: string;
  setActiveGroupId: (id: string) => void;
  addGroupTask: (groupId: string, taskTitle: string) => void;
  addGroupTaskFull: (groupId: string, task: Omit<Task, 'id'>) => void;
  toggleGroupTaskComplete: (groupId: string, taskId: string) => void;
  deleteGroupTask: (groupId: string, taskId: string) => void;
  updateGroupTask: (groupId: string, task: Task) => void;
  reorderGroupTasks: (groupId: string, tasks: Task[]) => void;
  addGroupCustomList: (groupId: string, listName: string) => void;
  deleteGroupCustomList: (groupId: string, listName: string) => void;
  createGroup: (data: { name: string; description?: string; category?: string; code?: string }) => Group;
  leaveGroup: (groupId: string) => void;
  joinGroup: (code: string) => boolean;
  generateGroupCode: () => string;
  inviteMemberToGroup: (groupId: string, member: { id?: string; name: string; handle?: string; avatar?: string; color?: string }) => void;
  acceptGroupInvitation: (groupId: string, memberData?: Partial<GroupMember>) => void;

  // Sound Mixer State
  sounds: SoundTrack[];
  setSoundVolume: (id: string, volume: number) => void;
  toggleSoundPlay: (id: string) => void;
  isMasterMuted: boolean;
  toggleMasterMute: () => void;
  stopAllSounds: () => void;

  // Notifications
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  markNotificationRead: (id: string) => void;
  removeNotification: (id: string) => void;

  // User Profile & Authentication
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAuthenticated: boolean;
  userAvatar: string;
  setUserAvatar: (avatar: string) => void;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register', notice?: string) => void;
  authNotice: string | null;
  setAuthNotice: (notice: string | null) => void;
  isCheckingAuth: boolean;
  checkAuthStatus: () => Promise<void>;
  loginWithGoogle: () => void;
  login: (email: string, password?: string) => Promise<void>;
  register: (data: { name: string; email: string; handle?: string; avatar?: string; password?: string }) => Promise<void>;
  logout: () => void;

  // Preferences & Persistence
  saveUserPreferences: (preferences: Record<string, any>) => void;

  // Stats
  weeklyStats: StatDayData[];
  totalFocusMinutesToday: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { setTheme, setCustomColor, setIsDarkMode, presetThemes } = useTheme();

  // Navigation & Overlays
  const [activeTab, setActiveTab] = useState<ActiveTab>('timer');
  const [overlay, setOverlay] = useState<OverlayType>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Sync theme whenever currentUser loads with saved themeColor
  useEffect(() => {
    if (currentUser?.themeColor) {
      const found = presetThemes.find((p) => p.hex.toLowerCase() === currentUser.themeColor?.toLowerCase());
      if (found) {
        setTheme(found);
      } else {
        setCustomColor(currentUser.themeColor);
      }
    }
  }, [currentUser?.themeColor]);

  // Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Timer Configuration
  const [focusDurationMinutes, setFocusDurationMinutes] = useState<number>(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState<number>(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState<number>(15);
  const [targetSessions, setTargetSessions] = useState<number>(4);
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0);
  const [isBreakPhase, setIsBreakPhase] = useState<boolean>(false);

  // Pure Timestamp-Driven Timer Engine State
  const [engineState, setEngineState] = useState<TimerEngineState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved =
          localStorage.getItem(TIMER_STORAGE_KEY) ||
          localStorage.getItem(LEGACY_TIMER_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as TimerEngineState;
          // Reconcile snapshot against current timestamp nowMs
          const snapshot = computeTimerSnapshot(parsed, Date.now());
          return snapshot.state;
        }
      } catch (e) {
        console.warn('Failed to recover timer state from localStorage:', e);
      }
    }
    return createInitialTimerState('pomodoro', 'focus', 25);
  });

  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);

  // Attached friend bubbles around user's timer (clean by default)
  const [attachedFriendIds, setAttachedFriendIds] = useState<string[]>([]);

  // Friends & Groups (clean by default)
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>('');

  // Notifications & Stats (clean by default)
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<StatDayData[]>(EMPTY_WEEK_STATS);
  const [totalFocusMinutesToday, setTotalFocusMinutesToday] = useState<number>(0);

  // User Profile
  const [userAvatar, setUserAvatar] = useState<string>('🦊');

  // Sounds: strictly all off (isPlaying: false) on initial load, but configured volumes persist locally
  const [sounds, setSounds] = useState<SoundTrack[]>(() => {
    let savedVolumes: Record<string, number> = {};
    if (typeof window !== 'undefined') {
      try {
        const raw =
          localStorage.getItem('canvas_sound_volumes_v2') ||
          localStorage.getItem('zen_sound_volumes_v2');
        if (raw) savedVolumes = JSON.parse(raw);
      } catch {}
    }
    return SOUND_CATALOG.map((s) => ({
      ...s,
      volume: typeof savedVolumes[s.id] === 'number' ? savedVolumes[s.id] : s.volume,
      isPlaying: false, // Never auto-start; always all off on load/entry
    }));
  });
  const [isMasterMuted, setIsMasterMuted] = useState<boolean>(false);

  // Checkpoint ref to avoid DB spam
  const lastCheckpointTimeRef = useRef<number>(Date.now());

  // Derive timerMode and timerState from pure engineState
  const timerMode = engineState.mode;
  const timerState = engineState.status;

  // Restore authenticated user using token verification
  const checkAuthStatus = async () => {
    setIsCheckingAuth(true);
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      if (data.success && (data.status === 'authenticated' || data.status === 'refreshed') && data.user) {
        setCurrentUser(data.user);
        setUserAvatar(data.user.avatar || '🦊');
        setIsAuthenticated(true);
        if (data.user.preferences) {
          try {
            const prefs = JSON.parse(data.user.preferences);
            if (prefs.focusDurationMinutes) setFocusDurationMinutes(prefs.focusDurationMinutes);
            if (prefs.shortBreakMinutes) setShortBreakMinutes(prefs.shortBreakMinutes);
            if (prefs.longBreakMinutes) setLongBreakMinutes(prefs.longBreakMinutes);
            if (prefs.targetSessions) setTargetSessions(prefs.targetSessions);
            // Restore dark mode preference from DB
            if (typeof prefs.isDarkMode === 'boolean') setIsDarkMode(prefs.isDarkMode);
            // Restore timer mode from DB
            if (prefs.timerMode === 'stopwatch') {
              const durationMins = 0;
              const initial = createInitialTimerState('stopwatch', 'focus', durationMins);
              setEngineState(initial);
              setRemainingSeconds(0);
            }
          } catch {}
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('canvas_current_user_v1', JSON.stringify(data.user));
          localStorage.setItem('zen_current_user_v1', JSON.stringify(data.user));
        }
      } else if (data.status === 'expired_refresh') {
        setCurrentUser(null);
        setIsAuthenticated(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('canvas_current_user_v1');
          localStorage.removeItem('zen_current_user_v1');
        }
        setAuthNotice('Your session has expired. Please sign in to continue.');
      } else {
        // no_token
        setCurrentUser(null);
        setIsAuthenticated(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('canvas_current_user_v1');
          localStorage.removeItem('zen_current_user_v1');
        }
      }
    } catch (e) {
      console.warn('Auth status check error:', e);
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Fetch real data from database whenever currentUser changes
  useEffect(() => {
    if (!currentUser?.id) {
      setTasks([]);
      setSelectedTask(null);
      setFriends([]);
      setAttachedFriendIds([]);
      setGroups([]);
      setActiveGroupId('');
      setNotifications([]);
      setWeeklyStats(EMPTY_WEEK_STATS);
      setTotalFocusMinutesToday(0);
      return;
    }
    const userId = currentUser.id;

    // 1. Fetch Real Tasks
    fetch(`/api/tasks?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setTasks(res.data);
          setSelectedTask(res.data[0] || null);
        }
      })
      .catch((e) => console.warn('Failed to fetch tasks:', e));

    // 2. Fetch Real Groups
    fetch(`/api/groups?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setGroups(res.data);
          setActiveGroupId(res.data[0]?.id || '');
        }
      })
      .catch((e) => console.warn('Failed to fetch groups:', e));

    // 3. Fetch Real Friends & Saved Attached Friends
    fetch(`/api/friends?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setFriends(res.data);
          let savedAttached: string[] = [];
          try {
            const raw =
              localStorage.getItem(`canvas_attached_friends_${userId}`) ||
              localStorage.getItem(`zen_attached_friends_${userId}`);
            if (raw) savedAttached = JSON.parse(raw);
          } catch {}
          const validAttached = savedAttached.filter((id) => res.data.some((f: Friend) => f.id === id));
          setAttachedFriendIds(validAttached);
        }
      })
      .catch((e) => console.warn('Failed to fetch friends:', e));

    // 4. Fetch Real Notifications
    fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setNotifications(res.data);
        }
      })
      .catch((e) => console.warn('Failed to fetch notifications:', e));

    // 5. Fetch Real Weekly Statistics
    fetch(`/api/statistics?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.weeklyStats) {
          setWeeklyStats(res.data.weeklyStats);
          const todayStat = res.data.weeklyStats[res.data.weeklyStats.length - 1];
          if (todayStat) {
            setTotalFocusMinutesToday(todayStat.focusMinutes + todayStat.stopwatchMinutes);
          }
        }
      })
      .catch((e) => console.warn('Failed to fetch stats:', e));
  }, [currentUser?.id]);

  const setTimerMode = (mode: TimerMode) => {
    if (engineState.mode === mode) return;

    // Record partial session contribution before switching modes
    const contributionMs = calculateFocusContributionMs(engineState, Date.now());
    if (contributionMs >= 5000 && currentUser) {
      const addedMinutes = Math.max(1, Math.round(contributionMs / (60 * 1000)));
      setTotalFocusMinutesToday((m) => m + addedMinutes);
      recordFocusSessionAction(currentUser.id, {
        type: engineState.mode,
        taskId: selectedTask?.id || null,
        groupId: activeGroupId || null,
        startedAtMs: 'startedAtMs' in engineState ? (engineState as any).startedAtMs : Date.now() - contributionMs,
        endedAtMs: Date.now(),
        elapsedDurationMs: contributionMs,
        status: engineState.mode === 'stopwatch' ? 'completed' : 'interrupted',
      }).catch(() => {});
    }

    setIsBreakPhase(false);
    const durationMins = mode === 'stopwatch' ? 0 : focusDurationMinutes;
    const newState = createInitialTimerState(mode, 'focus', durationMins);
    setEngineState(newState);
    setRemainingSeconds(mode === 'stopwatch' ? 0 : durationMins * 60);
    tabSync.publish({ type: 'TIMER_STATE_SYNC', payload: newState, userId: currentUser?.id || 'guest' });

    if (currentUser) {
      saveTimerStateCheckpointAction(currentUser.id, newState).catch(() => {});
    }
  };

  const setTimerState = (status: TimerState) => {
    if (status === 'idle') resetTimer();
    else if (status === 'running') startTimer();
    else if (status === 'paused') pauseTimer();
  };

  // Sync Timer on duration changes in IDLE
  useEffect(() => {
    if (engineState.status === 'idle') {
      if (engineState.mode === 'stopwatch') {
        setRemainingSeconds(0);
        return;
      }
      const durationMins = isBreakPhase ? shortBreakMinutes : focusDurationMinutes;
      const newState = createInitialTimerState(
        engineState.mode,
        isBreakPhase ? 'short_break' : 'focus',
        durationMins
      );
      setEngineState(newState);
      setRemainingSeconds(Math.max(0, durationMins * 60));
    }
  }, [focusDurationMinutes, shortBreakMinutes, isBreakPhase, engineState.status, engineState.mode]);

  // Persist engineState to localStorage & broadcast across tabs
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(engineState));
    }
  }, [engineState]);

  // Multi-tab sync subscription - ONLY sync main timer if published by the SAME user!
  useEffect(() => {
    const unsubscribe = tabSync.subscribe((msg) => {
      if (msg.type === 'TIMER_STATE_SYNC') {
        if (msg.userId && currentUser?.id && msg.userId !== currentUser.id) {
          return;
        }
        const snapshot = computeTimerSnapshot(msg.payload, Date.now());
        setEngineState(snapshot.state);
        const displaySecs =
          snapshot.state.mode === 'stopwatch'
            ? Math.max(0, snapshot.elapsedSeconds)
            : Math.max(0, snapshot.remainingSeconds);
        setRemainingSeconds(displaySecs);
      }
    });
    return unsubscribe;
  }, [currentUser?.id]);

  // Main High-Precision Timestamp Animation / Interval Loop
  useEffect(() => {
    let animationId: number;
    let lastSecondReported = -1;

    const tick = () => {
      const now = Date.now();
      const snapshot = computeTimerSnapshot(engineState, now);

      if (engineState.status === 'running') {
        const currentSecs =
          engineState.mode === 'stopwatch'
            ? Math.max(0, snapshot.elapsedSeconds)
            : Math.max(0, snapshot.remainingSeconds);

        if (currentSecs !== lastSecondReported) {
          lastSecondReported = currentSecs;
          setRemainingSeconds(currentSecs);
        }

        // Periodic checkpoint to DB / statistics (every 30s)
        if (now - lastCheckpointTimeRef.current > 30000 && currentUser) {
          lastCheckpointTimeRef.current = now;
          saveTimerStateCheckpointAction(currentUser.id, snapshot.state).catch(() => {});
        }

        // Check completion transition
        if (snapshot.isCompleted && (engineState.status as string) !== 'completed') {
          setEngineState(snapshot.state);
          tabSync.publish({ type: 'TIMER_STATE_SYNC', payload: snapshot.state, userId: currentUser?.id || 'guest' });

          if (!isBreakPhase && engineState.mode === 'pomodoro') {
            setSessionsCompleted((s) => s + 1);
            const addedMinutes = Math.max(1, Math.round(snapshot.elapsedMs / (60 * 1000)));
            setTotalFocusMinutesToday((m) => m + addedMinutes);

            // Record authoritative FocusSession in DB
            if (currentUser) {
              recordFocusSessionAction(currentUser.id, {
                type: 'pomodoro',
                taskId: selectedTask?.id || null,
                groupId: activeGroupId || null,
                startedAtMs: 'startedAtMs' in snapshot.state ? snapshot.state.startedAtMs : now,
                endedAtMs: now,
                elapsedDurationMs: snapshot.elapsedMs,
                status: 'completed',
              }).catch(() => {});
            }
          }
          return;
        }
      }

      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [engineState, isBreakPhase, currentUser, selectedTask, activeGroupId]);

  // Friends Autonomous Independent Focus Sessions Loop
  useEffect(() => {
    const friendInterval = setInterval(() => {
      setFriends((prevFriends) =>
        prevFriends.map((f) => {
          // If friend is paused, offline, or online (idle), do not tick
          if (f.status === 'paused' || f.status === 'offline' || (f as any).status === 'online') {
            return f;
          }

          const isRunning = f.status === 'focusing' || f.status === 'break' || f.isFocusing;
          if (!isRunning) return f;

          const isStopwatch = f.mode === 'stopwatch' || f.timerType === 'stopwatch';

          if (isStopwatch) {
            let elapsedMs = 0;
            if (f.startedAtMs) {
              elapsedMs = Math.max(0, Date.now() - f.startedAtMs);
            } else if (f.lastUpdatedMs) {
              const delta = Math.max(0, Date.now() - f.lastUpdatedMs);
              elapsedMs = Math.max(0, (f.elapsedDurationMs || 0) + delta);
            } else {
              const curSecs = (f.timerMinutes ?? 0) * 60 + (f.timerSeconds ?? 0);
              elapsedMs = Math.max(0, (curSecs + 1) * 1000);
            }
            const totalSecs = Math.max(0, Math.floor(elapsedMs / 1000));
            return {
              ...f,
              elapsedDurationMs: elapsedMs,
              currentTimeMs: elapsedMs,
              timerMinutes: Math.floor(totalSecs / 60),
              timerSeconds: totalSecs % 60,
            };
          } else {
            // Pomodoro countdown
            let remainingMs = 0;
            if (f.targetCompletionMs) {
              remainingMs = Math.max(0, f.targetCompletionMs - Date.now());
            } else {
              const curSecs = (f.timerMinutes ?? 25) * 60 + (f.timerSeconds ?? 0);
              remainingMs = Math.max(0, (curSecs - 1) * 1000);
            }
            const totalSecs = Math.max(0, Math.ceil(remainingMs / 1000));
            if (totalSecs <= 0 && f.targetCompletionMs) {
              return {
                ...f,
                status: f.status === 'focusing' ? 'break' : 'online',
                isFocusing: false,
                timerMinutes: 0,
                timerSeconds: 0,
                remainingMs: 0,
                currentTimeMs: 0,
              };
            }
            return {
              ...f,
              remainingMs,
              currentTimeMs: remainingMs,
              timerMinutes: Math.floor(totalSecs / 60),
              timerSeconds: totalSecs % 60,
            };
          }
        })
      );
    }, 1000);

    return () => clearInterval(friendInterval);
  }, []);

  // Timer Control Methods
  const startTimer = () => {
    const now = Date.now();
    let nextState = engineState;

    if (engineState.status === 'completed' || engineState.status === 'idle') {
      const durationMins = engineState.mode === 'stopwatch' ? 0 : (isBreakPhase ? shortBreakMinutes : focusDurationMinutes);
      const initial = createInitialTimerState(
        engineState.mode,
        isBreakPhase ? 'short_break' : 'focus',
        durationMins
      );
      nextState = engineStartTimer(initial, now);
    } else if (engineState.status === 'paused') {
      nextState = engineStartTimer(engineState, now);
    }

    setEngineState(nextState);
    const snapshot = computeTimerSnapshot(nextState, now);
    const displaySecs = nextState.mode === 'stopwatch' ? Math.max(0, snapshot.elapsedSeconds) : Math.max(0, snapshot.remainingSeconds);
    setRemainingSeconds(displaySecs);
    tabSync.publish({ type: 'TIMER_STATE_SYNC', payload: nextState, userId: currentUser?.id || 'guest' });

    if (currentUser) {
      saveTimerStateCheckpointAction(currentUser.id, nextState).catch(() => {});
    }
  };

  const pauseTimer = () => {
    const now = Date.now();
    const nextState = enginePauseTimer(engineState, now);
    setEngineState(nextState);
    const snapshot = computeTimerSnapshot(nextState, now);
    const displaySecs = nextState.mode === 'stopwatch' ? Math.max(0, snapshot.elapsedSeconds) : Math.max(0, snapshot.remainingSeconds);
    setRemainingSeconds(displaySecs);
    tabSync.publish({ type: 'TIMER_STATE_SYNC', payload: nextState, userId: currentUser?.id || 'guest' });

    // If in stopwatch mode, record contribution on pause if >= 5s
    if (nextState.mode === 'stopwatch' && currentUser) {
      const contributionMs = calculateFocusContributionMs(engineState, now);
      if (contributionMs >= 5000) {
        const addedMinutes = Math.max(1, Math.round(contributionMs / (60 * 1000)));
        setTotalFocusMinutesToday((m) => m + addedMinutes);
        recordFocusSessionAction(currentUser.id, {
          type: 'stopwatch',
          taskId: selectedTask?.id || null,
          groupId: activeGroupId || null,
          startedAtMs: 'startedAtMs' in engineState ? (engineState as any).startedAtMs : now - contributionMs,
          endedAtMs: now,
          elapsedDurationMs: contributionMs,
          status: 'completed',
        }).catch(() => {});
      }
    }

    if (currentUser) {
      saveTimerStateCheckpointAction(currentUser.id, nextState).catch(() => {});
    }
  };

  const resetTimer = () => {
    // Record partial session contribution before resetting
    const contributionMs = calculateFocusContributionMs(engineState, Date.now());
    if (contributionMs >= 5000 && currentUser) {
      const addedMinutes = Math.max(1, Math.round(contributionMs / (60 * 1000)));
      setTotalFocusMinutesToday((m) => m + addedMinutes);
      recordFocusSessionAction(currentUser.id, {
        type: engineState.mode,
        taskId: selectedTask?.id || null,
        groupId: activeGroupId || null,
        startedAtMs: 'startedAtMs' in engineState ? (engineState as any).startedAtMs : Date.now() - contributionMs,
        endedAtMs: Date.now(),
        elapsedDurationMs: contributionMs,
        status: engineState.mode === 'stopwatch' ? 'completed' : 'interrupted',
      }).catch(() => {});
    }

    setIsBreakPhase(false);
    const durationMins = engineState.mode === 'stopwatch' ? 0 : focusDurationMinutes;
    const nextState = engineResetTimer(engineState, durationMins);
    setEngineState(nextState);
    setRemainingSeconds(engineState.mode === 'stopwatch' ? 0 : Math.max(0, durationMins * 60));
    tabSync.publish({ type: 'TIMER_STATE_SYNC', payload: nextState, userId: currentUser?.id || 'guest' });

    if (currentUser) {
      saveTimerStateCheckpointAction(currentUser.id, nextState).catch(() => {});
    }
  };

  const startBreak = () => {
    setIsBreakPhase(true);
    const initial = createInitialTimerState('pomodoro', 'short_break', shortBreakMinutes);
    const running = engineStartTimer(initial, Date.now());
    setEngineState(running);
    setRemainingSeconds(shortBreakMinutes * 60);
    tabSync.publish({ type: 'TIMER_STATE_SYNC', payload: running, userId: currentUser?.id || 'guest' });
  };

  const closeOverlay = () => setOverlay(null);

  // Task Mutations with Optimistic Updates & Server Actions
  const addTask = (newTaskData: Omit<Task, 'id'>) => {
    const tempId = `task-${Date.now()}`;
    const newTask: Task = { ...newTaskData, id: tempId };
    setTasks((prev) => [newTask, ...prev]);

    if (currentUser) {
      createTaskAction(currentUser.id, {
        title: newTaskData.title,
        project: newTaskData.project,
        priority: newTaskData.priority,
        dueDate: newTaskData.dueDate,
        description: newTaskData.description,
      }).then((res) => {
        if (res.success && res.task) {
          setTasks((prev) => prev.map((t) => (t.id === tempId ? { ...t, id: res.task.id } : t)));
        }
      }).catch((e) => console.error('createTaskAction error:', e));
    }
  };

  const toggleTaskComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined }
          : t
      )
    );

    if (currentUser) {
      toggleTaskCompleteAction(currentUser.id, id).catch((e) => console.error(e));
    }
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (currentUser) {
      deleteTaskAction(currentUser.id, id).catch((e) => console.error(e));
    }
  };

  const updateTask = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    if (currentUser) {
      updateTaskAction(currentUser.id, updatedTask).catch((e) => console.error(e));
    }
  };

  const reorderTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    if (currentUser) {
      reorderTasksAction(currentUser.id, newTasks.map((t) => t.id)).catch((e) => console.error(e));
    }
  };

  // Friends & Attached Bubbles
  const attachFriend = (friendId: string) => {
    setAttachedFriendIds((prev) => {
      if (prev.includes(friendId)) return prev;
      const next = [...prev, friendId];
      if (currentUser?.id && typeof window !== 'undefined') {
        localStorage.setItem(`canvas_attached_friends_${currentUser.id}`, JSON.stringify(next));
        localStorage.setItem(`zen_attached_friends_${currentUser.id}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const detachFriend = (friendId: string) => {
    setAttachedFriendIds((prev) => {
      const next = prev.filter((id) => id !== friendId);
      if (currentUser?.id && typeof window !== 'undefined') {
        localStorage.setItem(`canvas_attached_friends_${currentUser.id}`, JSON.stringify(next));
        localStorage.setItem(`zen_attached_friends_${currentUser.id}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const toggleAttachFriend = (friendId: string) => {
    setAttachedFriendIds((prev) => {
      const next = prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId];
      if (currentUser?.id && typeof window !== 'undefined') {
        localStorage.setItem(`canvas_attached_friends_${currentUser.id}`, JSON.stringify(next));
        localStorage.setItem(`zen_attached_friends_${currentUser.id}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const saveUserPreferences = useCallback(
    (preferences: Record<string, any>) => {
      if (currentUser?.id) {
        updateUserPreferencesAction(currentUser.id, preferences).catch((e) =>
          console.warn('Failed to save preferences:', e)
        );
      }
    },
    [currentUser?.id]
  );

  const acceptFriendRequest = async (friendId: string) => {
    if (currentUser) {
      try {
        await fetch('/api/friends', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, requestId: friendId, action: 'accept' }),
        });
        const res = await fetch(`/api/friends?userId=${encodeURIComponent(currentUser.id)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setFriends(data.data);
        }
      } catch (e) {
        console.error('acceptFriendRequest error:', e);
      }
    }
  };

  const declineFriendRequest = async (friendId: string) => {
    if (currentUser) {
      try {
        await fetch('/api/friends', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, requestId: friendId, action: 'decline' }),
        });
        const res = await fetch(`/api/friends?userId=${encodeURIComponent(currentUser.id)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setFriends(data.data);
        }
      } catch (e) {
        console.error('declineFriendRequest error:', e);
      }
    }
  };

  // Group Code Generator
  const generateGroupCode = () => {
    const specialChars = '#!$&*?~^%@-_+=';
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    let code = '#';
    for (let i = 0; i < 6; i++) {
      code += (letters + numbers + specialChars).charAt(Math.floor(Math.random() * (letters.length + numbers.length)));
    }
    return code;
  };

  // Group Operations
  const addGroupTask = (groupId: string, taskTitle: string) => {
    const tempId = `gtask-${Date.now()}`;
    const newGTask: Task = {
      id: tempId,
      title: taskTitle,
      project: 'General',
      priority: 'medium',
      dueDate: 'Today',
      completed: false,
      assignedTo: currentUser?.name || 'Alex Serene',
    };

    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, tasks: [newGTask, ...g.tasks] } : g))
    );

    if (currentUser) {
      createTaskAction(currentUser.id, {
        title: taskTitle,
        groupId,
        project: 'General',
        priority: 'medium',
      }).catch((e) => console.error(e));
    }
  };

  const addGroupTaskFull = (groupId: string, taskData: Omit<Task, 'id'>) => {
    const tempId = `gtask-${Date.now()}`;
    const newGTask: Task = { ...taskData, id: tempId };
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, tasks: [newGTask, ...g.tasks] } : g))
    );

    if (currentUser) {
      createTaskAction(currentUser.id, {
        ...taskData,
        groupId,
      }).catch((e) => console.error(e));
    }
  };

  const toggleGroupTaskComplete = (groupId: string, taskId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              tasks: g.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined }
                  : t
              ),
            }
          : g
      )
    );

    if (currentUser) {
      toggleTaskCompleteAction(currentUser.id, taskId).catch((e) => console.error(e));
    }
  };

  const deleteGroupTask = (groupId: string, taskId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, tasks: g.tasks.filter((t) => t.id !== taskId) } : g
      )
    );

    if (currentUser) {
      deleteTaskAction(currentUser.id, taskId).catch((e) => console.error(e));
    }
  };

  const updateGroupTask = (groupId: string, updatedTask: Task) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              tasks: g.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
            }
          : g
      )
    );

    if (currentUser) {
      updateTaskAction(currentUser.id, updatedTask).catch((e) => console.error(e));
    }
  };

  const reorderGroupTasks = (groupId: string, newTasks: Task[]) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, tasks: newTasks } : g))
    );

    if (currentUser) {
      reorderTasksAction(currentUser.id, newTasks.map((t) => t.id), groupId).catch((e) => console.error(e));
    }
  };

  const addGroupCustomList = (groupId: string, listName: string) => {
    const trimmed = listName.trim();
    if (!trimmed) return;
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const current = g.customLists || [];
          if (!current.includes(trimmed)) {
            return { ...g, customLists: [...current, trimmed] };
          }
        }
        return g;
      })
    );
  };

  const deleteGroupCustomList = (groupId: string, listName: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId && g.customLists
          ? { ...g, customLists: g.customLists.filter((name) => name !== listName) }
          : g
      )
    );
  };

  const createGroup = (data: { name: string; description?: string; category?: string; code?: string }): Group => {
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name: data.name.trim(),
      code: data.code?.trim() || generateGroupCode(),
      description: data.description?.trim() || 'Collaborative focus group with independent timers and shared board.',
      category: data.category?.trim() || 'Productivity',
      activeCount: 1,
      customLists: ['Backlog', 'In Progress', 'Done'],
      members: [
        {
          id: currentUser?.id || 'guest',
          name: currentUser?.name || 'User',
          handle: currentUser?.handle || '@user',
          avatar: currentUser?.avatar || '🦊',
          color: currentUser?.themeColor || '#6366f1',
          status: 'focusing',
          timerTime: '25:00',
          currentTask: 'Focusing in room',
          isUser: true,
          isConnected: true,
        },
      ],
      pendingInvites: [],
      tasks: [],
    };

    setGroups((prev) => [newGroup, ...prev]);
    setActiveGroupId(newGroup.id);

    if (currentUser) {
      createGroupAction(currentUser.id, {
        name: data.name,
        description: data.description,
        category: data.category,
        code: newGroup.code,
      })
        .then((res) => {
          if (res?.success && res.group?.id) {
            setGroups((prev) =>
              prev.map((g) => (g.id === newGroup.id ? { ...g, id: res.group.id } : g))
            );
            setActiveGroupId((prev) => (prev === newGroup.id ? res.group.id : prev));
          }
        })
        .catch((e) => console.error(e));
    }

    return newGroup;
  };

  const leaveGroup = (groupId: string) => {
    setGroups((prev) => {
      const remaining = prev.filter((g) => g.id !== groupId);
      if (activeGroupId === groupId && remaining.length > 0) {
        setActiveGroupId(remaining[0].id);
      }
      return remaining;
    });

    if (currentUser) {
      leaveGroupAction(currentUser.id, groupId).catch((e) => console.error(e));
    }
  };

  const inviteMemberToGroup = (
    groupId: string,
    member: { id?: string; name: string; handle?: string; avatar?: string; color?: string }
  ) => {
    const inviteeId = member.id || `member-${Date.now()}`;
    const cleanHandle = member.handle || `@${member.name.toLowerCase().replace(/\s+/g, '')}`;
    const cleanAvatar = member.avatar || '🦊';
    const cleanColor = member.color || '#6366f1';

    const targetGroup = groups.find((g) => g.id === groupId);
    const groupName = targetGroup?.name || 'Focus Group';

    const invitationItem = {
      id: inviteeId,
      name: member.name,
      handle: cleanHandle,
      avatar: cleanAvatar,
      color: cleanColor,
      invitedAt: Date.now(),
    };

    // 1. Add to pendingInvites ONLY - DO NOT add to group.members yet
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const currentPending = g.pendingInvites || [];
        if (currentPending.some((p) => p.id === inviteeId || p.handle === cleanHandle)) {
          return g;
        }
        return {
          ...g,
          pendingInvites: [...currentPending, invitationItem],
        };
      })
    );

    // 2. Create notification item
    const notifId = `ginvite-${Date.now()}`;
    const inviteNotification: NotificationItem = {
      id: notifId,
      title: 'Group Room Invitation',
      message: `${currentUser?.name || 'You'} invited ${member.name} to join "${groupName}".`,
      time: 'Just now',
      read: false,
      type: 'group_invite',
      actionPayload: {
        invitationId: notifId,
        groupId,
        groupName,
        inviterId: currentUser?.id || 'host',
        inviterName: currentUser?.name || 'Peer',
        inviterAvatar: currentUser?.avatar || '🦊',
        inviterColor: currentUser?.themeColor || '#6366f1',
        inviteeId,
        inviteeName: member.name,
        inviteeHandle: cleanHandle,
        inviteeAvatar: cleanAvatar,
        inviteeColor: cleanColor,
      },
    };

    setNotifications((prev) => [inviteNotification, ...prev]);

    // 3. Broadcast notification
    tabSync.publish({
      type: 'GROUP_INVITE_SYNC',
      payload: inviteNotification,
      receiverId: inviteeId,
      userId: currentUser?.id || 'guest',
    });

    try {
      const socket = getSocket(currentUser?.id || 'guest');
      socket.emit('cowork:request', {
        senderId: currentUser?.id || 'host',
        senderName: currentUser?.name || 'Peer',
        senderAvatar: currentUser?.avatar || '🦊',
        senderColor: currentUser?.themeColor || '#6366f1',
        receiverId: inviteeId,
      });
    } catch {}

    if (currentUser && member.id && !member.id.startsWith('member-') && !member.id.startsWith('invited-')) {
      inviteFriendToGroupAction(currentUser.id, groupId, member.id).catch(() => {});
    }
  };

  const acceptGroupInvitation = (groupId: string, memberData?: Partial<GroupMember>) => {
    const memberId = memberData?.id || currentUser?.id || `user-${Date.now()}`;
    const memberName = memberData?.name || currentUser?.name || 'Peer';
    const memberHandle = memberData?.handle || currentUser?.handle || `@${memberName.toLowerCase().replace(/\s+/g, '')}`;
    const memberAvatar = memberData?.avatar || currentUser?.avatar || '🦊';
    const memberColor = memberData?.color || currentUser?.themeColor || '#6366f1';

    const newMember: GroupMember = {
      id: memberId,
      name: memberName,
      handle: memberHandle,
      avatar: memberAvatar,
      color: memberColor,
      status: 'focusing',
      timerTime: '25:00',
      currentTask: 'Focusing with group',
      isUser: memberId === (currentUser?.id || 'user-self'),
      isConnected: true, // Mark connected upon accepting!
    };

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const filteredPending = (g.pendingInvites || []).filter(
          (p) => p.id !== memberId && p.handle !== memberHandle
        );
        if (g.members.some((m) => m.id === memberId)) {
          return {
            ...g,
            members: g.members.map((m) =>
              m.id === memberId ? { ...m, isConnected: true, status: 'focusing' } : m
            ),
            pendingInvites: filteredPending,
          };
        }
        return {
          ...g,
          members: [...g.members, newMember],
          activeCount: g.members.length + 1,
          pendingInvites: filteredPending,
        };
      })
    );

    setActiveGroupId(groupId);
    setActiveTab('groups');

    tabSync.publish({
      type: 'GROUP_MEMBER_JOINED_SYNC',
      payload: { groupId, member: newMember },
      userId: memberId,
    });

    try {
      const socket = getSocket(currentUser?.id || 'guest');
      socket.emit('group:join', {
        groupId,
        user: newMember,
      });
    } catch {}
  };

  const joinGroup = (code: string): boolean => {
    const normalized = code.trim().toLowerCase();
    const existing = groups.find((g) => g.code.toLowerCase() === normalized);
    if (existing) {
      setActiveGroupId(existing.id);
      if (currentUser) {
        joinGroupByCodeAction(currentUser.id, code).catch((e) => console.error(e));
      }
      return true;
    }
    return false;
  };

  // Sound Engine Controls - strictly local, no external server/socket sync
  const setSoundVolume = (id: string, volume: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(volume)));
    setSounds((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, volume: clamped, isPlaying: clamped > 0 ? s.isPlaying : false } : s
      );
      if (typeof window !== 'undefined') {
        try {
          const volumesObj = updated.reduce<Record<string, number>>((acc, curr) => {
            acc[curr.id] = curr.volume;
            return acc;
          }, {});
          localStorage.setItem('canvas_sound_volumes_v2', JSON.stringify(volumesObj));
          localStorage.setItem('zen_sound_volumes_v2', JSON.stringify(volumesObj));
        } catch {}
      }
      return updated;
    });

    if (audioEngine) {
      audioEngine.setTrackVolume(id, clamped);
      if (clamped === 0) {
        audioEngine.stopTrack(id);
      }
    }
  };

  const toggleSoundPlay = (id: string) => {
    const current = sounds.find((s) => s.id === id);
    if (!current) return;

    const nextPlaying = !current.isPlaying;

    // Trigger audio engine outside of React functional state updater
    if (audioEngine) {
      if (nextPlaying) {
        audioEngine.playTrack({ ...current, isPlaying: true });
      } else {
        audioEngine.stopTrack(id);
      }
    }

    setSounds((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isPlaying: nextPlaying } : s))
    );
  };

  const stopAllSounds = () => {
    if (audioEngine) {
      audioEngine.stopAll();
    }
    setSounds((prev) => prev.map((s) => ({ ...s, isPlaying: false })));
  };

  const toggleMasterMute = () => {
    setIsMasterMuted((prev) => {
      const next = !prev;
      if (audioEngine) audioEngine.toggleMute(next);
      return next;
    });
  };

  // Stop all audio on page unload/unmount so nothing plays when leaving
  useEffect(() => {
    const handleUnload = () => {
      if (audioEngine) {
        audioEngine.stopAll();
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      if (audioEngine) {
        audioEngine.stopAll();
      }
    };
  }, []);

  // Notification Operations
  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (currentUser) {
      markNotificationReadAction(currentUser.id, id).catch((e) => console.error(e));
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (currentUser) {
      removeNotificationAction(currentUser.id, id).catch((e) => console.error(e));
    }
  };

  // Authentication Flow
  const openAuthModal = (mode: 'login' | 'register' = 'login', notice?: string) => {
    setAuthModalMode(mode);
    setAuthNotice(notice || null);
    setOverlay('auth');
  };

  const loginWithGoogle = () => {
    openAuthModal(
      'login',
      'Google OAuth requires configured Google Client ID in .env. Please sign in or register with email below.'
    );
  };

  const login = async (email: string, password?: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password: password || '' }),
    });
    const data = await res.json();
    if (!data.success || !data.user) {
      throw new Error(data.error || 'Login failed. Please check your credentials.');
    }
    const loggedUser = data.user;
    if (typeof window !== 'undefined') {
      localStorage.setItem('canvas_current_user_v1', JSON.stringify(loggedUser));
      localStorage.setItem('zen_current_user_v1', JSON.stringify(loggedUser));
    }
    setCurrentUser(loggedUser);
    setUserAvatar(loggedUser.avatar || '🦊');
    setIsAuthenticated(true);
    setAuthNotice(null);
    closeOverlay();
  };

  const register = async (data: { name: string; email: string; handle?: string; avatar?: string; password?: string }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success || !result.user) {
      throw new Error(result.error || 'Registration failed.');
    }
    const registeredUser = result.user;
    if (data.avatar) setUserAvatar(data.avatar);
    if (typeof window !== 'undefined') {
      localStorage.setItem('canvas_current_user_v1', JSON.stringify(registeredUser));
      localStorage.setItem('zen_current_user_v1', JSON.stringify(registeredUser));
    }
    setCurrentUser(registeredUser);
    setUserAvatar(registeredUser.avatar || '🦊');
    setIsAuthenticated(true);
    setAuthNotice(null);
    closeOverlay();
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('canvas_current_user_v1');
      localStorage.removeItem('zen_current_user_v1');
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
    setTasks([]);
    setSelectedTask(null);
    setFriends([]);
    setAttachedFriendIds([]);
    setGroups([]);
    setActiveGroupId('');
    setNotifications([]);
    setWeeklyStats(EMPTY_WEEK_STATS);
    setTotalFocusMinutesToday(0);
    closeOverlay();
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        overlay,
        setOverlay,
        closeOverlay,
        selectedTaskDetail,
        setSelectedTaskDetail,
        timerMode,
        setTimerMode,
        timerState,
        setTimerState,
        focusDurationMinutes,
        setFocusDurationMinutes,
        shortBreakMinutes,
        setShortBreakMinutes,
        longBreakMinutes,
        setLongBreakMinutes,
        targetSessions,
        setTargetSessions,
        remainingSeconds,
        setRemainingSeconds,
        sessionsCompleted,
        isBreakPhase,
        selectedTask,
        setSelectedTask,
        startTimer,
        pauseTimer,
        resetTimer,
        startBreak,
        engineState,
        tasks,
        setTasks,
        addTask,
        toggleTaskComplete,
        deleteTask,
        updateTask,
        reorderTasks,
        friends,
        setFriends,
        attachedFriendIds,
        setAttachedFriendIds,
        toggleAttachFriend,
        attachFriend,
        detachFriend,
        acceptFriendRequest,
        declineFriendRequest,
        groups,
        setGroups,
        activeGroupId,
        setActiveGroupId,
        addGroupTask,
        addGroupTaskFull,
        toggleGroupTaskComplete,
        deleteGroupTask,
        updateGroupTask,
        reorderGroupTasks,
        addGroupCustomList,
        deleteGroupCustomList,
        createGroup,
        leaveGroup,
        joinGroup,
        generateGroupCode,
        inviteMemberToGroup,
        acceptGroupInvitation,
        sounds,
        setSoundVolume,
        toggleSoundPlay,
        isMasterMuted,
        toggleMasterMute,
        stopAllSounds,
        notifications,
        setNotifications,
        markNotificationRead,
        removeNotification,
        currentUser,
        setCurrentUser,
        isAuthenticated,
        userAvatar,
        setUserAvatar,
        authModalMode,
        openAuthModal,
        authNotice,
        setAuthNotice,
        isCheckingAuth,
        checkAuthStatus,
        loginWithGoogle,
        login,
        register,
        logout,
        weeklyStats,
        totalFocusMinutesToday,
        saveUserPreferences,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
