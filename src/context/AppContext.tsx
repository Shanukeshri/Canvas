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
} from '@/types';
import {
  INITIAL_TASKS,
  INITIAL_FRIENDS,
  INITIAL_GROUPS,
  INITIAL_SOUNDS,
  INITIAL_NOTIFICATIONS,
  INITIAL_STATS_WEEK,
} from '@/lib/mock-data';

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

  // Tasks State
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  toggleTaskComplete: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (task: Task) => void;
  reorderTasks: (tasks: Task[]) => void;

  // Friends & Attached Friend Bubbles State
  friends: Friend[];
  attachedFriendIds: string[];
  toggleAttachFriend: (friendId: string) => void;
  acceptFriendRequest: (friendId: string) => void;
  declineFriendRequest: (friendId: string) => void;

  // Groups State
  groups: Group[];
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
  markNotificationRead: (id: string) => void;

  // Stats
  weeklyStats: StatDayData[];
  totalFocusMinutesToday: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Navigation & Overlays
  const [activeTab, setActiveTab] = useState<ActiveTab>('timer');
  const [overlay, setOverlay] = useState<OverlayType>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);

  // Tasks
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(INITIAL_TASKS[0]);

  // Timer configuration
  const [timerMode, setTimerMode] = useState<TimerMode>('pomodoro');
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [focusDurationMinutes, setFocusDurationMinutes] = useState<number>(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState<number>(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState<number>(15);
  const [targetSessions, setTargetSessions] = useState<number>(4);
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(2);
  const [isBreakPhase, setIsBreakPhase] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);

  // Attached friend bubbles around user's timer
  const [attachedFriendIds, setAttachedFriendIds] = useState<string[]>(['friend-1', 'friend-2']);

  // Friends & Groups
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [activeGroupId, setActiveGroupId] = useState<string>('group-1');

  // Notifications & Stats
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [weeklyStats, setWeeklyStats] = useState<StatDayData[]>(INITIAL_STATS_WEEK);
  const [totalFocusMinutesToday, setTotalFocusMinutesToday] = useState<number>(222);

  // Sounds
  const [sounds, setSounds] = useState<SoundTrack[]>(INITIAL_SOUNDS);
  const [isMasterMuted, setIsMasterMuted] = useState<boolean>(false);

  // Audio Context Ref for ambient audio synthesis
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodesRef = useRef<{ [key: string]: { gain: GainNode; source?: any } }>({});

  // Synchronize remaining time when focus duration changes in idle state
  useEffect(() => {
    if (timerState === 'idle') {
      setRemainingSeconds((isBreakPhase ? shortBreakMinutes : focusDurationMinutes) * 60);
    }
  }, [focusDurationMinutes, shortBreakMinutes, timerState, isBreakPhase]);

  // Timer Tick Interval Effect
  useEffect(() => {
    let interval: any = null;
    if (timerState === 'running') {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            // Timer complete!
            setTimerState('completed');
            if (!isBreakPhase && timerMode === 'pomodoro') {
              setSessionsCompleted((s) => s + 1);
              setTotalFocusMinutesToday((m) => m + focusDurationMinutes);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState, isBreakPhase, timerMode, focusDurationMinutes]);

  // Friends Independent Timer Tick Effect (Friends run their own sessions autonomously)
  useEffect(() => {
    const friendInterval = setInterval(() => {
      setFriends((prevFriends) =>
        prevFriends.map((f) => {
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
              // Transition between focus session and break autonomously
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

  // Ambient Web Audio API Synthesizer Engine
  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (!ctx) return;

      sounds.forEach((sound) => {
        if (!soundNodesRef.current[sound.id]) {
          const gainNode = ctx.createGain();
          gainNode.gain.setValueAtTime(0, ctx.currentTime);
          gainNode.connect(ctx.destination);

          // Create synthetic noise buffer for pleasant ambient sound
          const bufferSize = 2 * ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            // Brown/Pink noise filtering simulation
            output[i] = (Math.random() * 2 - 1) * 0.1;
          }

          const whiteNoise = ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;
          whiteNoise.loop = true;
          whiteNoise.connect(gainNode);
          whiteNoise.start();

          soundNodesRef.current[sound.id] = { gain: gainNode, source: whiteNoise };
        }

        const node = soundNodesRef.current[sound.id];
        if (node) {
          const targetVol = isMasterMuted || !sound.isPlaying ? 0 : (sound.volume / 100) * 0.15;
          node.gain.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.1);
        }
      });
    } catch (err) {
      console.warn('Audio Synthesis initialization note:', err);
    }
  }, [sounds, isMasterMuted]);

  const startTimer = () => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    if (timerState === 'completed' || remainingSeconds === 0) {
      setIsBreakPhase(false);
      setRemainingSeconds(focusDurationMinutes * 60);
    }
    setTimerState('running');
  };

  const pauseTimer = () => {
    setTimerState('paused');
  };

  const resetTimer = () => {
    setTimerState('idle');
    setIsBreakPhase(false);
    setRemainingSeconds(focusDurationMinutes * 60);
  };

  const startBreak = () => {
    setIsBreakPhase(true);
    setRemainingSeconds(shortBreakMinutes * 60);
    setTimerState('running');
  };

  const closeOverlay = () => setOverlay(null);

  // Task Actions
  const addTask = (newTaskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const toggleTaskComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? 'Just now' : undefined } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTask = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const reorderTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
  };

  // Friend Attachment
  const toggleAttachFriend = (friendId: string) => {
    setAttachedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const acceptFriendRequest = (friendId: string) => {
    setFriends((prev) =>
      prev.map((f) => (f.id === friendId ? { ...f, status: 'online' } : f))
    );
  };

  const declineFriendRequest = (friendId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
  };

  // Group ASCII Code Generator Helper
  const generateGroupCode = () => {
    const specialChars = '#!$&*?~^%@-_+=';
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    const all = specialChars + letters + numbers;
    
    // Pick at least 1 special char, 1 number, and fill up to 8 chars
    let code = '';
    code += specialChars[Math.floor(Math.random() * specialChars.length)];
    code += letters[Math.floor(Math.random() * letters.length)];
    code += letters[Math.floor(Math.random() * letters.length)].toUpperCase();
    code += numbers[Math.floor(Math.random() * numbers.length)];
    code += specialChars[Math.floor(Math.random() * specialChars.length)];
    code += letters[Math.floor(Math.random() * letters.length)];
    code += numbers[Math.floor(Math.random() * numbers.length)];
    code += specialChars[Math.floor(Math.random() * specialChars.length)];
    return code;
  };

  // Group Actions
  const addGroupTask = (groupId: string, taskTitle: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const newGTask: Task = {
            id: `gtask-${Date.now()}`,
            title: taskTitle,
            project: g.customLists?.[0] || 'General',
            priority: 'medium',
            dueDate: 'Today',
            completed: false,
            assignedTo: 'Alex Johnson',
          };
          return { ...g, tasks: [newGTask, ...g.tasks] };
        }
        return g;
      })
    );
  };

  const addGroupTaskFull = (groupId: string, taskData: Omit<Task, 'id'>) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const newGTask: Task = {
            ...taskData,
            id: `gtask-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          };
          return { ...g, tasks: [newGTask, ...g.tasks] };
        }
        return g;
      })
    );
  };

  const toggleGroupTaskComplete = (groupId: string, taskId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            tasks: g.tasks.map((t) =>
              t.id === taskId
                ? { ...t, completed: !t.completed, completedAt: !t.completed ? 'Just now' : undefined }
                : t
            ),
          };
        }
        return g;
      })
    );
  };

  const deleteGroupTask = (groupId: string, taskId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            tasks: g.tasks.filter((t) => t.id !== taskId),
          };
        }
        return g;
      })
    );
  };

  const updateGroupTask = (groupId: string, updatedTask: Task) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            tasks: g.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
          };
        }
        return g;
      })
    );
  };

  const reorderGroupTasks = (groupId: string, newTasks: Task[]) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return { ...g, tasks: newTasks };
        }
        return g;
      })
    );
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
      prev.map((g) => {
        if (g.id === groupId && g.customLists) {
          return { ...g, customLists: g.customLists.filter((name) => name !== listName) };
        }
        return g;
      })
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
          id: 'user-self',
          name: 'Alex Johnson',
          handle: '@alexdev',
          avatar: '🦊',
          color: '#E63946',
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
  };

  const joinGroup = (code: string): boolean => {
    const normalized = code.trim().toLowerCase();
    const existing = groups.find((g) => g.code.toLowerCase() === normalized);
    if (existing) {
      setActiveGroupId(existing.id);
      return true;
    }
    return false;
  };

  // Sound Actions
  const setSoundVolume = (id: string, volume: number) => {
    setSounds((prev) =>
      prev.map((s) => (s.id === id ? { ...s, volume, isPlaying: volume > 0 ? s.isPlaying : false } : s))
    );
  };

  const toggleSoundPlay = (id: string) => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setSounds((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isPlaying: !s.isPlaying } : s))
    );
  };

  const toggleMasterMute = () => {
    setIsMasterMuted((prev) => !prev);
  };

  // Notification Actions
  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
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
        tasks,
        addTask,
        toggleTaskComplete,
        deleteTask,
        updateTask,
        reorderTasks,
        friends,
        attachedFriendIds,
        toggleAttachFriend,
        acceptFriendRequest,
        declineFriendRequest,
        groups,
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
        markNotificationRead,
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
