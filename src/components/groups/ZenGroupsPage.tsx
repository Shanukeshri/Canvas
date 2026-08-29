'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { OrbitBubbles } from '@/components/timer/OrbitBubbles';
import { ZenTodoListBoard } from '@/components/todos/ZenTodoListBoard';
import { Friend } from '@/types';
import {
  Users,
  Copy,
  Check,
  KeyRound,
  Layers,
  ArrowLeftRight,
  Plus,
  Play,
  Pause,
  RotateCcw,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import clsx from 'clsx';
import confetti from 'canvas-confetti';

export function ZenGroupsPage() {
  const {
    groups,
    activeGroupId,
    setActiveGroupId,
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

  // Copied code feedback state
  const [copiedCode, setCopiedCode] = useState(false);

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

  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
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
      {/* ================= PART 1: TIMER PART ================= */}
      <section className={clsx('h-full relative bg-surface overflow-hidden flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]', isTodoListOpen ? 'flex-1 lg:flex-[2] lg:w-[65%]' : 'w-full flex-1')}>
        {/* Top Header Bar for Group */}
        <header className="shrink-0 z-20 px-6 py-4 border-b border-surface-variant/30 flex flex-wrap items-center justify-between gap-3 bg-surface/80 backdrop-blur-md">
          {/* Left: Group Name + ASCII Group Code Badge */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg md:text-xl font-bold font-display text-primary tracking-tight truncate">
                  {currentGroup.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 shrink-0">
                  {currentGroup.category}
                </span>
              </div>

              {/* ASCII Group Code badge directly below group name */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => handleCopyCode(currentGroup.code)}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-surface-container border border-outline-variant hover:border-primary text-xs font-mono font-bold text-primary transition-all group/badge"
                  title="Click to copy ASCII group code"
                >
                  <KeyRound className="w-3 h-3 text-primary" />
                  <span>Code: {currentGroup.code}</span>
                  {copiedCode ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-sans font-semibold ml-1">
                      <Check className="w-3 h-3" /> Copied
                    </span>
                  ) : (
                    <Copy className="w-2.5 h-2.5 text-outline group-hover/badge:text-primary transition-colors ml-0.5" />
                  )}
                </button>

                <span className="text-xs text-on-surface-variant">
                  {currentGroup.members.length} members ({currentGroup.activeCount} online)
                </span>
              </div>
            </div>
          </div>

          {/* Right: Switch Group + Single Toggle Icon when collapsed */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOverlay('groups')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container border border-outline-variant text-xs font-semibold text-primary transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              title="Open Focus Groups overlay to switch or create groups"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
              <span>Switch Group</span>
            </button>

            {/* Single Icon when Collapsed (No minimized sidebar strip) */}
            {!isTodoListOpen && (
              <button
                onClick={() => setIsTodoListOpen(true)}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-surface-container-high hover:bg-surface-container border border-outline-variant text-primary hover:scale-105 active:scale-95 transition-all shadow-sm"
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
            )}
          </div>
        </header>

        {/* Main Immersive Canvas Area */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4 md:p-6">
          {/* Floating Orbit Member Bubbles Layer with Compact Scaling & Strict Avoidance */}
          <OrbitBubbles attachedFriends={groupFriends} compact={isTodoListOpen} />

          {/* Group Goal / Focus Task Indicator */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center z-10 pointer-events-none w-full max-w-xl px-4">
            <span
              className="font-body-lg text-xs font-medium tracking-wide truncate block opacity-90"
              style={{ color: 'var(--primary)' }}
            >
              Shared Presence: {currentGroup.description || 'Focusing Together'}
            </span>
          </div>

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
                {timerState === 'idle' && 'GROUP FOCUS'}
                {timerState === 'running' && (isBreakPhase ? 'REST' : 'FOCUS')}
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
          'transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
          isTodoListOpen
            ? 'w-full lg:w-[35%] lg:min-w-[360px] lg:max-w-[440px] xl:max-w-[500px] opacity-100 border-t lg:border-t-0 lg:border-l border-surface-variant/40 translate-x-0'
            : 'w-0 min-w-0 max-w-0 opacity-0 border-none pointer-events-none translate-x-8'
        )}
      >
        <div className="w-full lg:w-[360px] xl:w-[440px] h-full min-h-0 flex flex-col">
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
                className="p-1 text-outline hover:text-primary rounded-lg hover:bg-surface-container transition-colors shrink-0"
                title="Collapse Tasks Panel"
                aria-label="Collapse Tasks Panel"
              >
                <PanelRightClose className="w-3.5 h-3.5" />
              </button>
            }
          />
        </div>
      </section>
    </div>
  );
}
