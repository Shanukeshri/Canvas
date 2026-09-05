'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { OrbitBubbles } from '@/components/timer/OrbitBubbles';
import { ZenTodoListBoard } from '@/components/todos/ZenTodoListBoard';
import { Friend } from '@/types';
import {
  Users,
  ArrowLeftRight,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import clsx from 'clsx';
import confetti from 'canvas-confetti';

export function ZenGroupsPage() {
  const {
    groups,
    activeGroupId,
    setOverlay,
    addGroupTaskFull,
    toggleGroupTaskComplete,
    deleteGroupTask,
    reorderGroupTasks,
    addGroupCustomList,
    deleteGroupCustomList,
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
  } = useApp();

  const { theme } = useTheme();

  // Collapsible right todo list panel state
  const [isTodoListOpen, setIsTodoListOpen] = useState(true);

  // Find active group or default to first group
  const currentGroup = groups.find((g) => g.id === activeGroupId) || groups[0];

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
    const nonNeg = Math.max(0, secs);
    const minutes = Math.floor(nonNeg / 60);
    const seconds = nonNeg % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // SVG Progress Ring calculation
  const totalSecs = (isBreakPhase ? shortBreakMinutes : focusDurationMinutes) * 60;
  const isStopwatch = timerMode === 'stopwatch';
  const progressPercent = isStopwatch
    ? Math.min(100, Math.max(0, ((remainingSeconds % 60) / 60) * 100))
    : totalSecs > 0
    ? Math.min(100, Math.max(0, ((totalSecs - Math.max(0, remainingSeconds)) / totalSecs) * 100))
    : 0;
  const strokeDashoffset = Math.max(0, Math.min(301.59, 301.59 - (301.59 * progressPercent) / 100));

  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleTimerDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    resetTimer();
  };

  if (!currentGroup) {
    return (
      <div className="flex-1 h-screen flex flex-col items-center justify-center p-8 bg-zen-bg select-none animate-in fade-in duration-300 text-center gap-4">
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-xl"
          style={{ backgroundColor: theme.hex }}
        >
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-display text-primary">No Active Focus Group</h2>
        <p className="text-sm text-on-surface-variant max-w-md">
          Join or create a shared focus group with independent timers and group task boards.
        </p>
        <button
          onClick={() => setOverlay('groups')}
          className="px-6 py-3 rounded-2xl bg-primary text-on-primary font-semibold text-sm shadow-md hover:opacity-90 transition-all"
        >
          Open Focus Groups Overlay
        </button>
      </div>
    );
  }

  // Convert other group members to Friend items for OrbitBubbles
  const groupFriends: Friend[] = (currentGroup.members || [])
    .filter((m) => !m.isUser)
    .map((m) => {
      const parts = m.timerTime?.split(':') || ['25', '00'];
      const mins = parseInt(parts[0], 10) || 25;
      const secs = parseInt(parts[1], 10) || 0;
      return {
        id: m.id,
        name: m.name,
        handle: m.handle,
        avatar: m.avatar,
        color: m.color,
        status: m.status === 'break' ? 'break' : 'focusing',
        currentTask: m.currentTask || 'Focusing',
        timerMinutes: mins,
        timerSeconds: secs,
        mode: 'pomodoro',
        isFocusing: m.status === 'focusing',
      };
    });

  const uncompletedTasksCount = currentGroup.tasks.filter((t) => !t.completed).length;

  return (
    <div className="flex-1 h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-zen-bg select-none animate-in fade-in duration-300">
      {/* ================= PART 1: TIMER PART (Clean, No Top Heading) ================= */}
      <section className={clsx('h-full relative bg-surface overflow-hidden flex flex-col transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]', isTodoListOpen ? 'flex-1 lg:flex-[2] lg:w-[65%]' : 'w-full flex-1')}>
        {/* Floating Quick Action: Switch Group (Top Left) */}
        <div className="absolute top-5 left-6 z-30">
          <button
            onClick={() => setOverlay('groups')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high/80 hover:bg-surface-container backdrop-blur-md border border-outline-variant text-xs font-semibold text-primary transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            title="Switch Focus Group"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
            <span>Switch Group</span>
          </button>
        </div>

        {/* Floating Quick Action: Open Sidebar (Top Right, when collapsed) */}
        {!isTodoListOpen && (
          <div className="absolute top-5 right-6 z-30">
            <button
              onClick={() => setIsTodoListOpen(true)}
              className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-surface-container-high/80 hover:bg-surface-container backdrop-blur-md border border-outline-variant text-primary hover:scale-105 active:scale-95 transition-all shadow-sm"
              title="Open Group Tasks"
              aria-label="Open Group Tasks"
            >
              <PanelRightOpen className="w-4 h-4 text-primary" />
              {uncompletedTasksCount > 0 && (
                <span
                  className="absolute top-2 right-2 w-2 h-2 rounded-full"
                  style={{ backgroundColor: theme.hex }}
                />
              )}
            </button>
          </div>
        )}

        {/* Main Immersive Canvas Area */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4 md:p-6">
          {/* Floating Orbit Member Bubbles Layer */}
          <OrbitBubbles attachedFriends={groupFriends} compact={isTodoListOpen} />

          {/* Center Primary Timer Ring: Proportionally Scaled */}
          <button
            id="main-timer-ring"
            type="button"
            onClick={handleTimerClick}
            onDoubleClick={handleTimerDoubleClick}
            className={clsx(
              'flex flex-col items-center justify-center z-30 cursor-pointer group active:scale-[0.99] transition-all select-none bg-transparent border-none p-0 outline-none focus:outline-none relative',
              isTodoListOpen
                ? 'w-[230px] h-[230px] md:w-[260px] md:h-[260px] lg:w-[280px] lg:h-[280px]'
                : 'w-[320px] h-[320px] md:w-[380px] md:h-[380px] lg:w-[420px] lg:h-[420px]'
            )}
            title="Click to Start/Pause • Double-click to Reset"
          >
            {/* Subtle Inner Canvas Disc */}
            <div
              className="absolute inset-4 rounded-full border border-surface-variant/20 pointer-events-none transition-colors opacity-[0.05]"
              style={{ backgroundColor: theme.hex }}
            />

            {/* SVG Progress Circle Ring */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-300 group-hover:scale-[1.008]"
              preserveAspectRatio="xMidYMid meet"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                fill="none"
                r="48"
                stroke={theme.hex}
                strokeOpacity={0.22}
                strokeWidth="0.75"
              />
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
            <div className="flex flex-col items-center justify-center z-10 space-y-1 pointer-events-none">
              <span
                className={clsx(
                  'font-label-md tracking-[0.24em] uppercase font-medium transition-colors',
                  isTodoListOpen ? 'text-[10px] md:text-[11px]' : 'text-xs md:text-sm',
                  timerState === 'paused' && 'opacity-70'
                )}
                style={{ color: timerState === 'paused' ? 'var(--outline)' : theme.hex }}
              >
                {timerState === 'idle' && (timerMode === 'stopwatch' ? 'STOPWATCH' : 'GROUP FOCUS')}
                {timerState === 'running' && (timerMode === 'stopwatch' ? 'FLOW' : isBreakPhase ? 'REST' : 'FOCUS')}
                {timerState === 'paused' && 'PAUSED'}
                {timerState === 'completed' && 'DONE'}
              </span>

              <span
                className={clsx(
                  'font-timer-display leading-none tabular-nums tracking-tighter transition-all group-hover:opacity-95 font-light',
                  isTodoListOpen
                    ? 'text-[48px] md:text-[56px] lg:text-[62px]'
                    : 'text-[64px] md:text-[76px] lg:text-[88px]',
                  timerState === 'paused' && 'opacity-50'
                )}
                style={{ color: timerState === 'paused' ? 'var(--outline)' : 'var(--timer-digits, var(--primary))' }}
              >
                {formatTime(remainingSeconds)}
              </span>

              {/* Session Indicator Dots */}
              {timerMode === 'pomodoro' && (
                <div className="flex items-center gap-1.5 pt-1">
                  {Array.from({ length: targetSessions }).map((_, idx) => (
                    <span
                      key={idx}
                      className={clsx(
                        'rounded-full transition-all',
                        isTodoListOpen ? 'w-1.5 h-1.5' : 'w-2 h-2',
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
        </div>
      </section>

      {/* ================= PART 2: TODO LIST PART (Collapsible Sidebar) ================= */}
      <section
        className={clsx(
          'h-full flex flex-col bg-surface-container-lowest/50 backdrop-blur-sm overflow-hidden shrink-0',
          'transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]',
          isTodoListOpen
            ? 'w-full lg:w-[360px] xl:w-[400px] 2xl:w-[440px] opacity-100 border-t lg:border-t-0 lg:border-l border-surface-variant/40 translate-x-0'
            : 'w-0 min-w-0 max-w-0 opacity-0 border-none pointer-events-none translate-x-8'
        )}
      >
        <div className="w-full h-full min-h-0 flex flex-col overflow-hidden">
          <ZenTodoListBoard
            title="Group Tasks"
            tasks={currentGroup.tasks || []}
            onAddTask={(task) => addGroupTaskFull(currentGroup.id, task)}
            onToggleComplete={(taskId) => toggleGroupTaskComplete(currentGroup.id, taskId)}
            onDeleteTask={(taskId) => deleteGroupTask(currentGroup.id, taskId)}
            onReorderTasks={(tasks) => reorderGroupTasks(currentGroup.id, tasks)}
            customLists={currentGroup.customLists || ['Backlog', 'In Progress', 'Done']}
            onAddCustomList={(name) => addGroupCustomList(currentGroup.id, name)}
            onDeleteCustomList={(name) => deleteGroupCustomList(currentGroup.id, name)}
            isGroupMode={true}
            compactMode={true}
            defaultProject={currentGroup.name}
            headerRightContent={
              <button
                onClick={() => setIsTodoListOpen(false)}
                className="w-7 h-7 flex items-center justify-center text-outline hover:text-primary rounded-xl hover:bg-surface-container-high border border-transparent hover:border-outline-variant transition-all shrink-0"
                title="Collapse Tasks Sidebar"
                aria-label="Collapse Tasks Sidebar"
              >
                <PanelRightClose className="w-4 h-4 text-outline hover:text-primary" />
              </button>
            }
          />
        </div>
      </section>
    </div>
  );
}
