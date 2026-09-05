'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  ActiveTab,
  OverlayType,
  TimerMode,
  TimerState,
  Task,
  Friend,
  Group,
  SoundTrack,
  NotificationItem,
  StatDayData,
  User,
} from '@/types';
import { INITIAL_SOUNDS } from '@/lib/mock-data';
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
} from '@/features/groups/actions';
import {
  acceptFriendRequestAction,
  declineFriendRequestAction,
} from '@/features/friends/actions';
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

const TIMER_STORAGE_KEY = 'zen_timer_engine_state_v1';

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

  // Sound Mixer State
  sounds: SoundTrack[];
  setSoundVolume: (id: string, volume: number) => void;
  toggleSoundPlay: (id: string) => void;
  isMasterMuted: boolean;
  toggleMasterMute: () => void;

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

  // Stats
  weeklyStats: StatDayData[];
  totalFocusMinutesToday: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { setTheme, setCustomColor, presetThemes } = useTheme();

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
        const saved = localStorage.getItem(TIMER_STORAGE_KEY);
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

  // Sounds
  const [sounds, setSounds] = useState<SoundTrack[]>(INITIAL_SOUNDS);
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
        if (typeof window !== 'undefined') {
          localStorage.setItem('zen_current_user_v1', JSON.stringify(data.user));
        }
      } else if (data.status === 'expired_refresh') {
        setCurrentUser(null);
        setIsAuthenticated(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('zen_current_user_v1');
        }
        setAuthNotice('Your session has expired. Please sign in to continue.');
      } else {
        // no_token
        setCurrentUser(null);
        setIsAuthenticated(false);
        if (typeof window !== 'undefined') {
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
            const raw = localStorage.getItem(`zen_attached_friends_${userId}`);
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
    const newState = createInitialTimerState(
      mode,
      isBreakPhase ? 'short_break' : 'focus',
      isBreakPhase ? shortBreakMinutes : focusDurationMinutes
    );
    setEngineState(newState);
    tabSync.publish({ type: 'TIMER_STATE_SYNC', payload: newState, userId: currentUser?.id || 'guest' });
  };

  const setTimerState = (status: TimerState) => {
    if (status === 'idle') resetTimer();
    else if (status === 'running') startTimer();
    else if (status === 'paused') pauseTimer();
  };

  // Sync Timer on duration changes in IDLE
  useEffect(() => {
    if (engineState.status === 'idle') {
      const durationMins = isBreakPhase ? shortBreakMinutes : focusDurationMinutes;
      const newState = createInitialTimerState(
        engineState.mode,
        isBreakPhase ? 'short_break' : 'focus',
        durationMins
      );
      setEngineState(newState);
      setRemainingSeconds(durationMins * 60);
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
        setRemainingSeconds(snapshot.remainingSeconds);
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
        if (snapshot.remainingSeconds !== lastSecondReported) {
          lastSecondReported = snapshot.remainingSeconds;
          setRemainingSeconds(snapshot.remainingSeconds);
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
            const addedMinutes = Math.round(snapshot.elapsedMs / (60 * 1000));
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
          // If friend has targetCompletionMs (real coworker timer synced), compute exact remaining time
          if (f.targetCompletionMs && (f.status === 'focusing' || f.isFocusing)) {
            const remMs = Math.max(0, f.targetCompletionMs - Date.now());
            const totalSecs = Math.ceil(remMs / 1000);
            return {
              ...f,
              timerMinutes: Math.floor(totalSecs / 60),
              timerSeconds: totalSecs % 60,
            };
          }

          // If friend is paused or online, do not decrement!
          if (f.status === 'paused' || (f as any).status === 'online') {
            return f;
          }

          if (f.status === 'focusing' || f.status === 'break') {
            const mins = f.timerMinutes ?? 25;
            const secs = f.timerSeconds ?? 0;
            const totalSecs = mins * 60 + secs;
            if (totalSecs > 1) {
              const nextTotal = totalSecs - 1;
              return {
                ...f,
                timerMinutes: Math.floor(nextTotal / 60),
                timerSeconds: nextTotal % 60,
              };
            } else {
              if (f.status === 'focusing') {
                return {
                  ...f,
                  status: 'break',
                  isFocusing: false,
                  timerMinutes: 5,
                  timerSeconds: 0,
                  currentTask: 'Taking a 5m break',
                };
              } else {
                return {
                  ...f,
                  status: 'focusing',
                  isFocusing: true,
                  timerMinutes: 25,
                  timerSeconds: 0,
                  currentTask: 'Deep Focus Session',
                };
              }
            }
          }
          return f;
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
      const durationMins = isBreakPhase ? shortBreakMinutes : focusDurationMinutes;
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
    setRemainingSeconds(snapshot.remainingSeconds);
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
    setRemainingSeconds(snapshot.remainingSeconds);
    tabSync.publish({ type: 'TIMER_STATE_SYNC', payload: nextState, userId: currentUser?.id || 'guest' });

    if (currentUser) {
      saveTimerStateCheckpointAction(currentUser.id, nextState).catch(() => {});
    }
  };

  const resetTimer = () => {
    // Record partial session contribution before resetting
    const contributionMs = calculateFocusContributionMs(engineState, Date.now());
    if (contributionMs > 10000 && currentUser) {
      const addedMinutes = Math.round(contributionMs / (60 * 1000));
      setTotalFocusMinutesToday((m) => m + addedMinutes);
      recordFocusSessionAction(currentUser.id, {
        type: engineState.mode,
        taskId: selectedTask?.id || null,
        groupId: activeGroupId || null,
        startedAtMs: 'startedAtMs' in engineState ? (engineState as any).startedAtMs : Date.now() - contributionMs,
        endedAtMs: Date.now(),
        elapsedDurationMs: contributionMs,
        status: 'interrupted',
      }).catch(() => {});
    }

    setIsBreakPhase(false);
    const durationMins = focusDurationMinutes;
    const nextState = engineResetTimer(engineState, durationMins);
    setEngineState(nextState);
    setRemainingSeconds(durationMins * 60);
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
  const toggleAttachFriend = (friendId: string) => {
    setAttachedFriendIds((prev) => {
      const next = prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId];
      if (currentUser?.id && typeof window !== 'undefined') {
        localStorage.setItem(`zen_attached_friends_${currentUser.id}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const acceptFriendRequest = (friendId: string) => {
    setFriends((prev) => prev.map((f) => (f.id === friendId ? { ...f, status: 'online' } : f)));
    if (currentUser) {
      acceptFriendRequestAction(currentUser.id, friendId).catch((e) => console.error(e));
    }
  };

  const declineFriendRequest = (friendId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    if (currentUser) {
      declineFriendRequestAction(currentUser.id, friendId).catch((e) => console.error(e));
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
          id: currentUser?.id || 'user-default',
          name: currentUser?.name || 'Alex Serene',
          handle: currentUser?.handle || '@alex_s',
          avatar: currentUser?.avatar || '🦊',
          color: '#6366f1',
          status: 'focusing',
          timerTime: '25:00',
          currentTask: 'Focusing in room',
          isUser: true,
        },
      ],
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
      }).catch((e) => console.error(e));
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

  // Sound Engine Controls
  const setSoundVolume = (id: string, volume: number) => {
    setSounds((prev) =>
      prev.map((s) => (s.id === id ? { ...s, volume, isPlaying: volume > 0 ? s.isPlaying : false } : s))
    );
    if (audioEngine) {
      audioEngine.setTrackVolume(id, volume);
    }
  };

  const toggleSoundPlay = (id: string) => {
    setSounds((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextPlaying = !s.isPlaying;
          if (audioEngine) {
            if (nextPlaying) audioEngine.playTrack({ ...s, isPlaying: true });
            else audioEngine.stopTrack(s.id);
          }
          return { ...s, isPlaying: nextPlaying };
        }
        return s;
      })
    );
  };

  const toggleMasterMute = () => {
    setIsMasterMuted((prev) => {
      const next = !prev;
      if (audioEngine) audioEngine.toggleMute(next);
      return next;
    });
  };

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
        sounds,
        setSoundVolume,
        toggleSoundPlay,
        isMasterMuted,
        toggleMasterMute,
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
