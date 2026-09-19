'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { OrbitBubbles } from './OrbitBubbles';
import { Plus, PictureInPicture2 } from 'lucide-react';
import clsx from 'clsx';
import { useDocumentPiP } from '@/hooks/useDocumentPiP';

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
  const { pipWindow, requestPiP, closePiP } = useDocumentPiP();

  // Format MM:SS
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // SVG Progress Ring calculation
  const totalSecs = (isBreakPhase ? shortBreakMinutes : focusDurationMinutes) * 60;
  const isStopwatch = timerMode === 'stopwatch';
  const progressPercent = isStopwatch
    ? 100
    : totalSecs > 0
    ? Math.min(100, Math.max(0, ((totalSecs - Math.max(0, remainingSeconds)) / totalSecs) * 100))
    : 0;
  // In stopwatch mode, the progress circle is static and always complete (offset = 0)
  const strokeDashoffset = isStopwatch
    ? 0
    : Math.max(0, Math.min(301.59, 301.59 - (301.59 * progressPercent) / 100));

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

  const handlePipClick = () => {
    if (pipWindow) {
      closePiP();
    } else {
      requestPiP({ width: 350, height: 350 });
    }
  };

  const renderTimerContent = (isPip: boolean) => (
    <main className={clsx(
      "flex-1 w-full relative bg-surface select-none overflow-hidden flex items-center justify-center p-6 md:p-8",
      isPip ? "h-full min-h-screen" : "h-screen"
    )}>
      {/* Floating & Repelling Circular Friend Timers Layer (Canvas Minimalist) */}
      <OrbitBubbles attachedFriends={attachedFriends} isPip={isPip} />

      {/* Focus Task Heading */}
      {!isPip && (
        <div className="absolute top-[calc((50vh-207px)/2)] lg:top-[calc((50vh-265px)/2)] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10 pointer-events-none w-full max-w-3xl px-6">
          <span
            className="font-body-lg text-sm md:text-base lg:text-lg font-medium tracking-wide truncate block"
            style={{ color: 'var(--primary)' }}
          >
            {selectedTask ? selectedTask.title : 'Deep Focus Session'}
          </span>
        </div>
      )}

      {/* Center Primary Timer Ring: Minimalist Canvas Design with Rich Theme Presence */}
      <button
        id="main-timer-ring"
        type="button"
        onClick={handleTimerClick}
        onDoubleClick={handleTimerDoubleClick}
        className={clsx(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-30 cursor-pointer group active:scale-[0.99] transition-transform select-none bg-transparent border-none p-0 outline-none focus:outline-none",
          isPip ? "w-[80vmin] h-[80vmin]" : "w-[414px] h-[414px] lg:w-[530px] lg:h-[530px]"
        )}
        title="Click to Start/Pause • Double-click to Reset"
      >
        {/* Subtle Tinted Inner Canvas Disc */}
        <div
          className="absolute inset-6 rounded-full border border-surface-variant/20 pointer-events-none transition-colors opacity-[0.05]"
          style={{ backgroundColor: theme.hex }}
        />

        {/* SVG Progress Circle Ring — Minimalist Precision with User Theme Color */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-300 group-hover:scale-[1.008]"
          preserveAspectRatio="xMidYMid meet"
          viewBox="0 0 100 100"
        >
          {/* Outer track tinted with user theme color */}
          <circle
            cx="50"
            cy="50"
            fill="none"
            r="48"
            stroke={theme.hex}
            strokeOpacity={0.22}
            strokeWidth="0.75"
          />
          {/* Dynamic progress arc in vibrant theme color */}
          <circle
            className="-rotate-90 origin-center transition-all duration-700 ease-out"
            cx="50"
            cy="50"
            fill="none"
            r="48"
            stroke={theme.hex}
            strokeDasharray="301.59"
            strokeDashoffset={strokeDashoffset}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>

        {/* Center Content */}
        <div className="flex flex-col items-center justify-center z-10 space-y-2 pointer-events-none">
          {/* Main Timer label: Only FOCUS or BREAK */}
          <span
            className={clsx(
              "tracking-[0.28em] uppercase font-medium transition-colors",
              isPip ? "text-[4vmin]" : "font-label-md text-xs lg:text-sm",
              timerState === 'paused' && "opacity-70"
            )}
            style={{ color: timerState === 'paused' ? 'var(--outline)' : theme.hex }}
          >
            {isBreakPhase ? 'BREAK' : 'FOCUS'}
          </span>

          <span
            className={clsx(
              "leading-none tabular-nums tracking-tighter transition-all group-hover:opacity-95 font-light",
              isPip ? "text-[20vmin]" : "font-timer-display text-[78px] lg:text-[100px]",
              timerState === 'paused' && "opacity-50"
            )}
            style={{ color: timerState === 'paused' ? 'var(--outline)' : 'var(--timer-digits, var(--primary))' }}
          >
            {formatTime(Math.max(0, remainingSeconds))}
          </span>

          {/* Session Indicator Dots in User Theme Color for Pomodoro */}
          {timerMode === 'pomodoro' && (
            <div className={clsx("flex items-center gap-2", isPip ? "pt-[2vmin]" : "pt-3")}>
              {Array.from({ length: targetSessions }).map((_, idx) => (
                <span
                  key={idx}
                  className={clsx(
                    'rounded-full transition-all',
                    isPip ? "w-[1.5vmin] h-[1.5vmin]" : "w-2 h-2",
                    idx < sessionsCompleted ? 'scale-125' : 'opacity-30'
                  )}
                  style={{
                    backgroundColor: idx < sessionsCompleted ? theme.hex : 'var(--outline-variant)',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </button>

      {/* Floating Invite / Add Friends Plus Button in Bottom Right */}
      {!isPip && (
        <div className="fixed bottom-7 right-7 flex flex-col gap-3 z-30">
          <button
            onClick={handlePipClick}
            aria-label="Pop Out Timer"
            className="w-11 h-11 rounded-full bg-surface-container-low border border-surface-variant flex items-center justify-center text-outline hover:text-primary hover:border-primary transition-all duration-300 shadow-sm group cursor-pointer"
            title="Pop out timer (Picture-in-Picture)"
          >
            <PictureInPicture2 className="w-4 h-4 group-hover:scale-110 transition-all duration-300 text-primary" />
          </button>
          
          <button
            onClick={() => setOverlay('friends')}
            aria-label="Invite Friends & Add to Window"
            className="w-11 h-11 rounded-full bg-surface-container-low border border-surface-variant flex items-center justify-center text-outline hover:text-primary hover:border-primary transition-all duration-300 shadow-sm group cursor-pointer"
            title="Invite friends & add to canvas"
          >
            <Plus className="w-4 h-4 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300 text-primary" />
          </button>
        </div>
      )}
    </main>
  );

  if (pipWindow) {
    return (
      <>
        {createPortal(renderTimerContent(true), pipWindow.document.body)}
        <div className="flex-1 h-screen w-full bg-surface flex flex-col items-center justify-center">
          <div className="text-center space-y-4">
            <PictureInPicture2 className="w-12 h-12 mx-auto text-outline" />
            <h2 className="text-xl font-medium text-on-surface">Timer is running in floating window</h2>
            <p className="text-outline max-w-sm mx-auto">
              You can resize and move the floating window anywhere on your screen.
            </p>
            <button
              onClick={closePiP}
              className="mt-6 px-4 py-2 bg-surface-container-highest hover:bg-surface-variant rounded-full text-sm font-medium transition-colors"
            >
              Bring Timer Back
            </button>
          </div>
        </div>
      </>
    );
  }

  return renderTimerContent(false);
}
