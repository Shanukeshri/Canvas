'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { OrbitBubbles } from './OrbitBubbles';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Plus,
  CheckCircle2,
  ChevronDown,
  Check,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import confetti from 'canvas-confetti';

export function ImmersiveTimer() {
  const {
    timerState,
    timerMode,
    remainingSeconds,
    focusDurationMinutes,
    shortBreakMinutes,
    sessionsCompleted,
    targetSessions,
    isBreakPhase,
    startTimer,
    pauseTimer,
    resetTimer,
    startBreak,
    selectedTask,
    setSelectedTask,
    tasks,
    setOverlay,
    friends,
    attachedFriendIds,
    sounds,
    isMasterMuted,
  } = useApp();

  const { theme } = useTheme();

  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [showContextRadial, setShowContextRadial] = useState(false);

  // Trigger confetti burst on completion
  useEffect(() => {
    if (timerState === 'completed') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: [theme.hex, '#ffffff', '#ffd700'],
        });
      } catch (e) {
        console.log('Confetti trigger', e);
      }
    }
  }, [timerState, theme.hex]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // SVG Progress Ring calculation
  const totalSecs = (isBreakPhase ? shortBreakMinutes : focusDurationMinutes) * 60;
  const progressPercent = totalSecs > 0 ? ((totalSecs - remainingSeconds) / totalSecs) * 100 : 0;
  const strokeDashoffset = 301.59 - (301.59 * progressPercent) / 100;

  const attachedFriends = friends.filter((f) => attachedFriendIds.includes(f.id));
  const activeSounds = sounds.filter((s) => s.isPlaying);

  const handleCircleClick = () => {
    if (timerState === 'idle') {
      startTimer();
    } else if (timerState === 'running') {
      setShowContextRadial((prev) => !prev);
    } else if (timerState === 'paused') {
      startTimer();
    } else if (timerState === 'completed') {
      startBreak();
    }
  };

  return (
    <main className="flex-1 md:ml-[80px] h-screen flex flex-col items-center justify-center relative bg-surface select-none overflow-hidden">
      {/* Background Subtle Gradient Radial Glow */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[140px] opacity-15 pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: theme.hex }}
      />

      {/* Orbital Friend Bubbles Layer */}
      <OrbitBubbles attachedFriends={attachedFriends} />

      {/* Top Ambient Bar (Sound Pill & Friend Invite) */}
      <div className="absolute top-8 flex items-center gap-3 z-20">
        {/* Sound Mixer Pill */}
        <button
          onClick={() => setOverlay('sound')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-outline-variant bg-surface-container-lowest/80 backdrop-blur-md font-label-md text-label-md text-on-surface hover:border-primary/50 transition-all shadow-[0_4px_20px_rgba(45,10,10,0.04)] group"
        >
          <Volume2 className={clsx('w-3.5 h-3.5 text-primary', activeSounds.length > 0 && !isMasterMuted && 'animate-pulse')} />
          <span>
            {isMasterMuted || activeSounds.length === 0
              ? 'Ambient Muted'
              : `${activeSounds.length} Sounds Active`}
          </span>
        </button>

        {/* Mode Pill */}
        <button
          onClick={() => setOverlay('timer-settings')}
          className="px-3.5 py-1.5 rounded-full border border-outline-variant bg-surface-container-lowest/80 backdrop-blur-md font-label-md text-label-md font-semibold text-primary uppercase tracking-wider hover:border-primary/50 transition-all shadow-[0_4px_20px_rgba(45,10,10,0.04)]"
        >
          {isBreakPhase ? 'Break Phase' : timerMode === 'pomodoro' ? 'Pomodoro' : 'Stopwatch'}
        </button>
      </div>

      {/* Focus Task Subtitle / Selected Task Title */}
      <div className="mb-xl text-center z-10">
        <span className="font-body-lg text-body-lg text-outline tracking-wide">
          {selectedTask ? selectedTask.title : 'Deep Focus Session'}
        </span>
      </div>

      {/* Center Primary Timer Ring */}
      <div className="relative flex flex-col items-center justify-center w-[360px] h-[360px] lg:w-[480px] lg:h-[480px] z-10">
        {/* SVG Progress Circle Ring */}
        <svg
          onClick={handleCircleClick}
          className="absolute inset-0 w-full h-full cursor-pointer transition-transform duration-300 hover:scale-[1.01]"
          preserveAspectRatio="xMidYMid meet"
          viewBox="0 0 100 100"
        >
          {/* Outer track */}
          <circle
            className="text-outline-variant opacity-40"
            cx="50"
            cy="50"
            fill="none"
            r="48"
            stroke="currentColor"
            strokeWidth="0.75"
          />
          {/* Dynamic progress arc */}
          <circle
            className="text-primary -rotate-90 origin-center transition-all duration-700 ease-out"
            cx="50"
            cy="50"
            fill="none"
            r="48"
            stroke="currentColor"
            strokeDasharray="301.59"
            strokeDashoffset={strokeDashoffset}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>

        {/* Center Content */}
        <div
          onClick={handleCircleClick}
          className="flex flex-col items-center justify-center z-10 space-y-sm cursor-pointer"
        >
          <span className="font-label-md text-label-md text-outline tracking-[0.2em] uppercase">
            {timerState === 'idle' && 'FOCUS'}
            {timerState === 'running' && (isBreakPhase ? 'REST' : 'FOCUS')}
            {timerState === 'paused' && 'PAUSED'}
            {timerState === 'completed' && 'DONE'}
          </span>

          <span className="font-timer-display text-timer-display text-primary tabular-nums tracking-tighter">
            {formatTime(remainingSeconds)}
          </span>

          {/* Session Indicator Dots */}
          {timerMode === 'pomodoro' && (
            <div className="flex items-center gap-1.5 pt-2">
              {Array.from({ length: targetSessions }).map((_, idx) => (
                <span
                  key={idx}
                  className={clsx(
                    'w-1.5 h-1.5 rounded-full transition-all',
                    idx < sessionsCompleted
                      ? 'bg-primary scale-125'
                      : 'bg-outline-variant'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Radial Context Expansion Menu (when clicked while running or paused) */}
      {(showContextRadial || timerState === 'paused') && (
        <div className="flex items-center gap-3 mt-6 z-20 animate-in fade-in zoom-in-95 duration-200">
          {timerState === 'running' ? (
            <button
              onClick={pauseTimer}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface text-label-md font-label-md hover:border-primary transition-all shadow-[0_4px_20px_rgba(45,10,10,0.06)]"
            >
              <Pause className="w-4 h-4 text-primary" /> Pause
            </button>
          ) : (
            <button
              onClick={startTimer}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-all shadow-[0_4px_20px_rgba(45,10,10,0.08)]"
            >
              <Play className="w-4 h-4" /> Resume
            </button>
          )}

          <button
            onClick={resetTimer}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-on-surface text-label-md font-label-md transition-all shadow-[0_4px_20px_rgba(45,10,10,0.06)]"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      )}

      {/* Task Picker Dropdown Below Timer */}
      <div className="relative mt-6 z-30">
        <button
          onClick={() => setShowTaskPicker((prev) => !prev)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-lowest/90 border border-outline-variant hover:border-primary/50 text-label-md text-on-surface transition-all backdrop-blur-md shadow-[0_4px_20px_rgba(45,10,10,0.04)]"
        >
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className="max-w-[220px] truncate">
            {selectedTask ? selectedTask.title : 'Select a focus task...'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant" />
        </button>

        {showTaskPicker && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-surface-container-lowest border border-outline-variant rounded-xl p-2 shadow-[0_8px_32px_rgba(45,10,10,0.08)] z-40 flex flex-col gap-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <span className="text-label-md font-label-md uppercase tracking-wider text-on-surface-variant px-3 py-1">
              Active Tasks
            </span>
            {tasks
              .filter((t) => !t.completed)
              .map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    setSelectedTask(task);
                    setShowTaskPicker(false);
                  }}
                  className={clsx(
                    'flex items-center justify-between p-2.5 rounded-lg text-left text-body-md text-sm transition-all',
                    selectedTask?.id === task.id
                      ? 'bg-primary-container text-primary font-medium'
                      : 'text-on-surface hover:bg-surface-container-low'
                  )}
                >
                  <span className="truncate">{task.title}</span>
                  {selectedTask?.id === task.id && <Check className="w-3.5 h-3.5 flex-shrink-0 text-primary" />}
                </button>
              ))}
            <button
              onClick={() => {
                setOverlay('task-detail');
                setShowTaskPicker(false);
              }}
              className="mt-1 p-2 rounded-lg text-center text-label-md font-label-md text-primary hover:bg-surface-container-low transition-all border border-dashed border-outline-variant"
            >
              + Create / Edit Task Details
            </button>
          </div>
        )}
      </div>

      {/* Floating Invite Button at Bottom Right (from immersive_timer_crimson HTML) */}
      <button
        onClick={() => setOverlay('friends')}
        aria-label="Invite Friend"
        className="fixed bottom-xl right-xl w-12 h-12 rounded-full bg-surface border border-outline-variant flex items-center justify-center text-outline hover:text-primary hover:border-primary transition-all duration-300 shadow-[0_4px_20px_rgba(45,10,10,0.08)] z-20 group"
        title="Invite friend to focus session"
      >
        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
      </button>
    </main>
  );
}
