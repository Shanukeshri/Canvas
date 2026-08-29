'use client';

import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { OrbitBubbles } from './OrbitBubbles';
import { Plus } from 'lucide-react';
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
    friends,
    attachedFriendIds,
    setOverlay,
  } = useApp();

  const { theme } = useTheme();

  // Trigger subtle celebration burst on session completion
  useEffect(() => {
    if (timerState === 'completed') {
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: [theme.hex, '#ffffff', '#e2e8f0'],
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

  const clickTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Direct click handler (Play / Pause / Resume)
  const handleTimerClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    clickTimeoutRef.current = setTimeout(() => {
      if (timerState === 'idle' || timerState === 'paused') {
        startTimer();
      } else if (timerState === 'running') {
        pauseTimer();
      } else if (timerState === 'completed') {
        startBreak();
      }
      clickTimeoutRef.current = null;
    }, 220);
  };

  // Double click handler (Reset)
  const handleTimerDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    resetTimer();
  };

  return (
    <main className="flex-1 h-screen w-full relative bg-surface select-none overflow-hidden flex items-center justify-center p-6 md:p-8">
      {/* Floating & Repelling Circular Friend Timers Layer (Zen Minimalist) */}
      <OrbitBubbles attachedFriends={attachedFriends} />

      {/* Focus Task Heading */}
      <div className="absolute top-[calc((50vh-207px)/2)] lg:top-[calc((50vh-265px)/2)] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10 pointer-events-none w-full max-w-3xl px-6">
        <span className="font-body-lg text-sm md:text-base lg:text-lg font-medium text-on-surface-variant tracking-wide truncate block opacity-80">
          {selectedTask ? selectedTask.title : 'Deep Focus Session'}
        </span>
      </div>

      {/* Center Primary Timer Ring: Minimalist Zen Design with Zero Glows */}
      <button
        id="main-timer-ring"
        type="button"
        onClick={handleTimerClick}
        onDoubleClick={handleTimerDoubleClick}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-[414px] h-[414px] lg:w-[530px] lg:h-[530px] z-30 cursor-pointer group active:scale-[0.99] transition-transform select-none bg-transparent border-none p-0 outline-none focus:outline-none"
        title="Click to Start/Pause • Double-click to Reset"
      >
        {/* SVG Progress Circle Ring — Minimalist Precision */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-300 group-hover:scale-[1.008]"
          preserveAspectRatio="xMidYMid meet"
          viewBox="0 0 100 100"
        >
          {/* Outer track */}
          <circle
            className="text-outline-variant opacity-30"
            cx="50"
            cy="50"
            fill="none"
            r="48"
            stroke="currentColor"
            strokeWidth="0.6"
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
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>

        {/* Center Content */}
        <div className="flex flex-col items-center justify-center z-10 space-y-2 pointer-events-none">
          <span className="font-label-md text-xs lg:text-sm text-outline tracking-[0.28em] uppercase transition-colors group-hover:text-primary">
            {timerState === 'idle' && 'FOCUS'}
            {timerState === 'running' && (isBreakPhase ? 'REST' : 'FOCUS')}
            {timerState === 'paused' && 'PAUSED'}
            {timerState === 'completed' && 'DONE'}
          </span>

          <span className="font-timer-display text-[78px] lg:text-[100px] leading-none text-primary tabular-nums tracking-tighter transition-all group-hover:opacity-95 font-light">
            {formatTime(remainingSeconds)}
          </span>

          {/* Session Indicator Dots */}
          {timerMode === 'pomodoro' && (
            <div className="flex items-center gap-2 pt-3">
              {Array.from({ length: targetSessions }).map((_, idx) => (
                <span
                  key={idx}
                  className={clsx(
                    'w-1.5 h-1.5 rounded-full transition-all',
                    idx < sessionsCompleted ? 'bg-primary scale-125' : 'bg-outline-variant opacity-40'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </button>

      {/* Floating Invite / Add Friends Plus Button in Bottom Right */}
      <button
        onClick={() => setOverlay('friends')}
        aria-label="Invite Friends & Add to Window"
        className="fixed bottom-7 right-7 w-11 h-11 rounded-full bg-surface-container-low border border-surface-variant flex items-center justify-center text-outline hover:text-primary hover:border-primary transition-all duration-300 shadow-sm z-30 group cursor-pointer"
        title="Invite friends & add to canvas"
      >
        <Plus className="w-4 h-4 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300 text-primary" />
      </button>
    </main>
  );
}
