'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Hourglass,
  ArrowRight,
  Volume2,
  Users,
  CheckCircle2,
  Clock,
  Flame,
  CloudRain,
  Radio,
  Sparkles,
  Check,
  ListTodo,
  Waves,
  ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';
import { AuthModal } from '@/components/auth/AuthModal';

const SEGMENTS = [
  { id: 'hero', name: 'Start' },
  { id: 'attention', name: 'Clarity' },
  { id: 'single-task', name: 'One Thing' },
  { id: 'soundscapes', name: 'Sound' },
  { id: 'presence', name: 'Groups' },
  { id: 'launch', name: 'Launch' },
];

const DISTRACTION_ITEMS = [
  {
    id: 'emails',
    icon: '📧',
    label: 'Unread emails (42)',
    className: 'top-2 left-2 sm:left-10',
    dx: -280,
    dy: -160,
    rot: -12,
  },
  {
    id: 'slack',
    icon: '🔔',
    label: '@channel urgent announcement',
    className: 'top-3 right-2 sm:right-10',
    dx: 290,
    dy: -170,
    rot: 10,
  },
  {
    id: 'calendar',
    icon: '📅',
    label: 'Meeting starts in 5m',
    className: 'bottom-4 left-4 sm:left-14',
    dx: -270,
    dy: 160,
    rot: -8,
  },
  {
    id: 'chat',
    icon: '💬',
    label: '12 unread direct messages',
    className: 'bottom-3 right-4 sm:right-12',
    dx: 300,
    dy: 150,
    rot: 14,
  },
  {
    id: 'tabs',
    icon: '⚡',
    label: '38 open browser tabs',
    className: '-top-7 left-1/2 -translate-x-1/2',
    dx: 0,
    dy: -200,
    rot: -3,
  },
  {
    id: 'pr',
    icon: '🚨',
    label: 'Review requested on PR #142',
    className: '-bottom-7 left-1/2 -translate-x-1/2',
    dx: 0,
    dy: 200,
    rot: 4,
  },
];

const INITIAL_TODOS = [
  { id: '1', title: 'Prioritize top high-impact objective', tag: 'Strategy', est: '15m' },
  { id: '2', title: 'Draft core architecture specification', tag: 'Architecture', est: '30m' },
  { id: '3', title: 'Conduct calm code review with team', tag: 'Review', est: '20m' },
  { id: '4', title: 'Deep focus block: Ship canvas core updates', tag: 'Deep Work', est: '45m' },
];

const SOUNDSCAPES = [
  { id: 'rain', name: 'Gentle Rain', icon: CloudRain, defaultVol: 65 },
  { id: 'fire', name: 'Cozy Fireplace', icon: Flame, defaultVol: 40 },
  { id: 'noise', name: 'Deep Brown Noise', icon: Radio, defaultVol: 25 },
  { id: 'waves', name: 'Ocean Swell', icon: Waves, defaultVol: 50 },
];

export function ProductLandingPage({ onEnterApp }: { onEnterApp: () => void }) {
  const { theme } = useTheme();
  const { openAuthModal, isAuthenticated, currentUser } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSegment, setActiveSegment] = useState<number>(0);
  const [scrollRatio, setScrollRatio] = useState<number>(0);

  // Todo interactive checks (manual overrides)
  const [manualCheckedTodos, setManualCheckedTodos] = useState<{ [id: string]: boolean }>({});

  // Soundscape interactive base sliders
  const [soundVolumes, setSoundVolumes] = useState<{ [key: string]: number }>({
    rain: 65,
    fire: 40,
    noise: 25,
    waves: 50,
  });

  const scrollToSegment = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const target = container.querySelector(`[data-segment="${index}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Continuous passive scroll listener to track scrollRatio smoothly
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      const height = container.clientHeight || window.innerHeight;
      if (height > 0) {
        setScrollRatio(container.scrollTop / height);
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  // IntersectionObserver for snap segment activation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sections = container.querySelectorAll('[data-segment]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-segment'));
            if (!isNaN(index)) {
              setActiveSegment(index);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.5,
      }
    );

    sections.forEach((sec) => observer.observe(sec));

    return () => observer.disconnect();
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        scrollToSegment(Math.min(SEGMENTS.length - 1, activeSegment + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToSegment(Math.max(0, activeSegment - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSegment]);

  // ============================================================
  // Scroll Driven Computations
  // ============================================================

  // 1. Distractions Motion (Segment 1):
  // As we scroll into segment 1 from hero, distractions come from outside inward.
  // At segment 1, they surround the timer.
  // As we scroll away from segment 1 to segment 2, they disperse outwards.
  const distractionProgress = (() => {
    if (activeSegment === 0 || scrollRatio < 1.0) {
      // Coming in from outside as we scroll into segment 1
      return Math.max(0, Math.min(1, (1.0 - scrollRatio) / 0.85));
    }
    if (activeSegment > 1 || scrollRatio > 1.0) {
      // Dispersing outwards away as we scroll past segment 1
      return Math.max(0, Math.min(1, (scrollRatio - 1.0) / 0.65));
    }
    return 0;
  })();

  // 2. Todo List Sequential Checking (Segment 2 -> Segment 3)
  // Starts checking the boxes as soon as there is a start of scrolling!
  const scrollCheckedCount = (() => {
    if (activeSegment > 2) return INITIAL_TODOS.length;
    if (activeSegment < 2 || scrollRatio <= 2.015) return 0;
    const delta = scrollRatio - 2.0;
    if (delta > 0.36) return 4;
    if (delta > 0.24) return 3;
    if (delta > 0.12) return 2;
    if (delta > 0.015) return 1;
    return 0;
  })();

  const toggleTodoManual = (id: string) => {
    setManualCheckedTodos((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isTodoCompleted = (id: string, index: number) => {
    return Boolean(manualCheckedTodos[id] || index < scrollCheckedCount);
  };

  const totalCompletedTodos = INITIAL_TODOS.filter((t, i) => isTodoCompleted(t.id, i)).length;

  // 3. Soundscapes Motion (Segment 3):
  // When scrolling into segment 3 from segment 2, pointers start at the very start (0%) and come to current place.
  // When resting on segment 3, pointers are at current place (baseVol).
  // When scrolling away from segment 3 towards segment 4, pointers scroll to 100% (the end).
  const getSoundDisplayVol = (baseVol: number) => {
    if (activeSegment > 3 || scrollRatio >= 3.65) {
      return 100;
    }
    if (scrollRatio > 3.0) {
      const leaveProgress = Math.max(0, Math.min(1, (scrollRatio - 3.0) / 0.65));
      return Math.round(baseVol + (100 - baseVol) * leaveProgress);
    }
    if (activeSegment < 3 || scrollRatio < 3.0) {
      // Starts at 0% when scrollRatio <= 2.15, glides up to baseVol by scrollRatio = 3.0
      const enterProgress = Math.max(0, Math.min(1, (scrollRatio - 2.15) / 0.85));
      return Math.round(baseVol * enterProgress);
    }
    return baseVol;
  };

  const soundScrollAwayProgress =
    activeSegment > 3
      ? 1
      : activeSegment === 3
        ? Math.max(0, Math.min(1, (scrollRatio - 3.0) / 0.65))
        : 0;

  // 4. Focus Together Timers Entrance (Segment 4):
  // The middle timer comes from above, and the side ones from the side as we scroll in smoothly and slowly.
  const timersProgress = (() => {
    if (activeSegment >= 4) return 1;
    if (activeSegment < 3) return 0;
    return Math.max(0, Math.min(1, (scrollRatio - 3.3) / 0.7));
  })();

  const groupTimers = [
    {
      id: 'sarah',
      name: 'Sarah',
      avatar: '👩🏻‍💻',
      color: '#10b981', // Emerald green
      time: '18:42',
      status: 'FOCUS',
      direction: 'left', // enters slowly from the left side
    },
    {
      id: 'david',
      name: 'David',
      avatar: '👨🏻‍🎨',
      color: theme.hex || '#6366f1', // Canvas theme color
      time: '25:00',
      status: 'DEEP WORK',
      direction: 'top', // enters slowly from above
    },
    {
      id: 'elena',
      name: 'Elena',
      avatar: '👩🏼‍🔬',
      color: '#f59e0b', // Warm Amber
      time: '34:15',
      status: 'FLOW',
      direction: 'right', // enters slowly from the right side
    },
  ];

  const getTimerTransform = (direction: string) => {
    const factor = 1 - timersProgress;
    if (direction === 'left') {
      return `translateX(-${factor * 220}px)`;
    }
    if (direction === 'right') {
      return `translateX(${factor * 220}px)`;
    }
    // direction === 'top'
    return `translateY(-${factor * 180}px)`;
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth bg-surface text-on-surface select-none selection:bg-primary selection:text-white relative"
      style={{ scrollbarWidth: 'none' }}
    >
      {/* Top Navigation Bar - hidden on first page, smoothly fades in when scrolling */}
      <nav
        className={clsx(
          'fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 py-4 backdrop-blur-xl bg-surface/80 border-b border-surface-variant/30 transition-all duration-500',
          activeSegment === 0 && scrollRatio < 0.08
            ? 'opacity-0 pointer-events-none -translate-y-4'
            : 'opacity-100 pointer-events-auto translate-y-0'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center border border-surface-variant/40 shadow-sm transition-transform hover:rotate-180 duration-500"
            style={{ backgroundColor: theme.hex + '15', color: theme.hex }}
          >
            <Hourglass className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg text-on-surface tracking-wide">
            Canvas
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onEnterApp}
            className="px-5 py-2 rounded-full text-white text-xs font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            style={{ backgroundColor: theme.hex }}
          >
            Enter Canvas Workspace <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Segment Side Pagination Dots - hidden on first page, smoothly fades in when scrolling */}
      <div
        className={clsx(
          'fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-3 transition-all duration-500',
          activeSegment === 0 && scrollRatio < 0.08
            ? 'opacity-0 pointer-events-none translate-x-4'
            : 'opacity-100 pointer-events-auto translate-x-0'
        )}
      >
        {SEGMENTS.map((seg, idx) => (
          <button
            key={seg.id}
            onClick={() => scrollToSegment(idx)}
            className="group flex items-center justify-end gap-2.5 cursor-pointer py-1"
            aria-label={`Jump to segment ${seg.name}`}
          >
            <span
              className={clsx(
                'text-[10px] font-semibold tracking-wider uppercase transition-all duration-200 px-2 py-0.5 rounded-md bg-surface-container/90 border border-surface-variant/40 shadow-sm whitespace-nowrap',
                activeSegment === idx
                  ? 'opacity-100 text-on-surface translate-x-0'
                  : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 text-outline'
              )}
            >
              {seg.name}
            </span>
            <div
              className={clsx(
                'w-2.5 h-2.5 rounded-full transition-all duration-300',
                activeSegment === idx
                  ? 'scale-125 ring-4 ring-primary/20'
                  : 'bg-outline-variant hover:bg-outline'
              )}
              style={{
                backgroundColor: activeSegment === idx ? theme.hex : undefined,
              }}
            />
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* SEGMENT 0: HERO — Huge focal timer only, nothing written and nothing else */}
      {/* ============================================================ */}
      <section
        data-segment="0"
        className="h-screen w-full snap-start snap-always shrink-0 flex items-center justify-center relative px-6 text-center overflow-hidden"
      >
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[160px] opacity-25 pointer-events-none transition-all duration-700"
          style={{ backgroundColor: theme.hex }}
        />

        <div className="flex flex-col items-center justify-center z-10">
          {/* Focal Huge Timer Anchor - nothing written, nothing else */}
          <div
            onClick={onEnterApp}
            className="w-[75vmin] h-[75vmin] max-w-[600px] max-h-[600px] min-w-[280px] min-h-[280px] rounded-full border-4 sm:border-[6px] md:border-8 flex items-center justify-center shadow-2xl backdrop-blur-3xl bg-surface-container-low/95 transition-all duration-500 hover:scale-105 active:scale-98 cursor-pointer select-none group"
            style={{
              borderColor: theme.hex,
              boxShadow: `0 0 80px ${theme.hex}30, 0 25px 50px -12px rgba(0,0,0,0.35)`,
            }}
            title="Click to enter workspace"
          >
            <span className="font-mono text-[22vmin] sm:text-[20vmin] md:text-[18vmin] lg:text-[140px] font-extrabold text-on-surface tracking-tighter transition-transform group-hover:scale-102">
              25:00
            </span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div 
          className={clsx(
            "absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 transition-all duration-700",
            scrollRatio > 0.05 ? "opacity-0 translate-y-8 pointer-events-none" : "opacity-100 animate-bounce"
          )}
        >
          <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] bg-surface-container-low/50 px-4 py-1.5 rounded-full backdrop-blur-sm border border-surface-variant/30" style={{ color: theme.hex }}>Scroll to Explore</span>
          <div className="flex flex-col -space-y-4">
            <ChevronDown className="w-8 h-8 sm:w-10 sm:h-10 opacity-50" style={{ color: theme.hex }} />
            <ChevronDown className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: theme.hex }} />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SEGMENT 1: CHAOS TO CLARITY */}
      {/* Distractions come from outside when scrolling in, and move away when scrolling out */}
      {/* ============================================================ */}
      <section
        data-segment="1"
        className="h-screen w-full snap-start snap-always shrink-0 flex flex-col items-center justify-center relative px-6 text-center overflow-hidden border-t border-surface-variant/30 pt-16"
      >
        <div className="max-w-4xl flex flex-col items-center z-10">
          <span
            className="text-[11px] font-bold uppercase tracking-widest mb-4 px-3.5 py-1 rounded-full border"
            style={{
              backgroundColor: theme.hex + '15',
              borderColor: theme.hex + '30',
              color: theme.hex,
            }}
          >
            Digital Noise vs Deep Focus
          </span>

          <h2 className="text-3xl sm:text-5xl font-bold font-display text-on-surface max-w-2xl mb-8 leading-tight">
            There is always something asking for your attention.
          </h2>

          {/* Clean Segment Visual Showcase with In/Out Distractions */}
          <div className="relative w-full max-w-2xl h-64 sm:h-72 flex items-center justify-center my-2">
            {DISTRACTION_ITEMS.map((item) => (
              <div
                key={item.id}
                className={clsx(
                  'absolute px-4 py-2.5 rounded-2xl bg-surface-container border border-surface-variant/70 text-xs font-medium text-outline shadow-lg backdrop-blur-md flex items-center gap-2 select-none',
                  item.className
                )}
                style={{
                  transform: `translate(${distractionProgress * item.dx}px, ${
                    distractionProgress * item.dy
                  }px) rotate(${distractionProgress * item.rot}deg) scale(${
                    1 - distractionProgress * 0.25
                  })`,
                  opacity: Math.max(0, 1 - distractionProgress * 1.15),
                  transition: 'transform 0.1s ease-out, opacity 0.15s ease-out',
                  pointerEvents: distractionProgress > 0.4 ? 'none' : 'auto',
                }}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}

            {/* Calm Center Focus Island */}
            <div
              className="w-44 h-44 sm:w-48 sm:h-48 rounded-full border-2 flex flex-col items-center justify-center bg-surface-container-low shadow-2xl z-10 transition-transform duration-300"
              style={{
                borderColor: theme.hex,
                transform: `scale(${1 + (1 - distractionProgress) * 0.08})`,
                boxShadow:
                  distractionProgress < 0.3
                    ? `0 0 ${(1 - distractionProgress) * 45}px ${theme.hex}35`
                    : undefined,
              }}
            >
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-on-surface">
                25:00
              </span>
              <span
                className="text-[11px] font-bold mt-1 uppercase tracking-widest"
                style={{ color: theme.hex }}
              >
                CALM CANVAS
              </span>
              {distractionProgress < 0.3 && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider mt-1 transition-opacity duration-300"
                  style={{ color: theme.hex }}
                >
                  Clear &amp; Centered
                </span>
              )}
            </div>
          </div>

          <p className="text-2xl sm:text-3xl font-bold mt-6" style={{ color: theme.hex }}>
            You don't have to give it.
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SEGMENT 2: "ONE THING AT A TIME" — Todo List Section */}
      {/* Starts checking boxes as soon as there is a start of scrolling */}
      {/* ============================================================ */}
      <section
        data-segment="2"
        className="h-screen w-full snap-start snap-always shrink-0 flex flex-col items-center justify-center px-6 text-center bg-surface-container-low/40 border-t border-surface-variant/30 relative overflow-hidden pt-16"
      >
        <div className="flex flex-col items-center gap-5 max-w-4xl z-10 w-full">
          <div className="flex flex-col">
            <span className="text-5xl sm:text-7xl md:text-8xl font-black font-display text-on-surface tracking-tight">
              One thing.
            </span>
            <span
              className="text-5xl sm:text-7xl md:text-8xl font-black font-display tracking-tight"
              style={{ color: theme.hex }}
            >
              At a time.
            </span>
          </div>

          <p className="text-base sm:text-lg text-outline max-w-xl mx-auto leading-relaxed">
            Your tasks. Your time. Your attention. Kept clean, intentional, and uncluttered.
          </p>

          {/* Interactive Todo List Card */}
          <div className="w-full max-w-lg mt-2 p-5 sm:p-6 rounded-3xl bg-surface-container-low/95 border border-surface-variant/60 shadow-2xl text-left flex flex-col gap-3.5 backdrop-blur-md">
            {/* Header & Status Indicator */}
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant/40">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center border"
                  style={{ backgroundColor: theme.hex + '15', borderColor: theme.hex + '35' }}
                >
                  <ListTodo className="w-4 h-4" style={{ color: theme.hex }} />
                </div>
                <span className="text-xs font-bold text-on-surface tracking-wide">
                  Today's Single-Task Flow
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full transition-all"
                  style={{
                    backgroundColor:
                      totalCompletedTodos === INITIAL_TODOS.length
                        ? theme.hex
                        : theme.hex + '20',
                    color: totalCompletedTodos === INITIAL_TODOS.length ? '#ffffff' : theme.hex,
                  }}
                >
                  {totalCompletedTodos} of {INITIAL_TODOS.length} completed
                </span>
              </div>
            </div>

            {/* Todo Progress Bar */}
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${(totalCompletedTodos / INITIAL_TODOS.length) * 100}%`,
                  backgroundColor: theme.hex,
                }}
              />
            </div>

            {/* Todo Items */}
            <div className="flex flex-col gap-2 pt-1">
              {INITIAL_TODOS.map((todo, idx) => {
                const checked = isTodoCompleted(todo.id, idx);
                return (
                  <div
                    key={todo.id}
                    onClick={() => toggleTodoManual(todo.id)}
                    className={clsx(
                      'group p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer select-none',
                      checked
                        ? 'bg-surface-container/60 border-surface-variant/40 opacity-75'
                        : 'bg-surface-container border-surface-variant/70 hover:border-surface-variant shadow-sm hover:scale-[1.01]'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={clsx(
                          'w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shrink-0',
                          checked
                            ? 'scale-110 shadow-sm'
                            : 'border border-outline-variant group-hover:border-primary'
                        )}
                        style={{
                          backgroundColor: checked ? theme.hex : 'transparent',
                          borderColor: checked ? theme.hex : undefined,
                        }}
                      >
                        {checked && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </div>

                      <span
                        className={clsx(
                          'text-xs sm:text-sm font-semibold truncate transition-all duration-300',
                          checked ? 'line-through text-outline' : 'text-on-surface'
                        )}
                      >
                        {todo.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                        style={{
                          backgroundColor: theme.hex + '10',
                          borderColor: theme.hex + '25',
                          color: theme.hex,
                        }}
                      >
                        {todo.tag}
                      </span>
                      <span className="text-[11px] font-mono text-outline flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {todo.est}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Completed Celebration Message when all done */}
            {totalCompletedTodos === INITIAL_TODOS.length && (
              <div
                className="mt-1 py-1.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all duration-500 animate-in fade-in"
                style={{
                  backgroundColor: theme.hex + '15',
                  borderColor: theme.hex + '35',
                  color: theme.hex,
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>All tasks completed • Mind at ease</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SEGMENT 3: ATMOSPHERIC SOUNDSCAPES */}
      {/* Pointers start at 0% and slide to current place; scroll to 100% when leaving */}
      {/* ============================================================ */}
      <section
        data-segment="3"
        className="h-screen w-full snap-start snap-always shrink-0 flex flex-col items-center justify-center px-6 text-center border-t border-surface-variant/30 relative overflow-hidden pt-16"
      >
        <div className="max-w-xl w-full flex flex-col items-center z-10">
          <span
            className="text-[11px] font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full border"
            style={{
              backgroundColor: theme.hex + '15',
              borderColor: theme.hex + '30',
              color: theme.hex,
            }}
          >
            Atmospheric Soundscapes
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold font-display text-on-surface mb-6">
            Find your frequency.
          </h2>

          {soundScrollAwayProgress >= 0.95 && (
            <div
              className="mb-4 px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border animate-in fade-in duration-300"
              style={{
                backgroundColor: theme.hex + '15',
                borderColor: theme.hex + '35',
                color: theme.hex,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full immersion reached • 100% Resonance</span>
            </div>
          )}

          <div className="w-full flex flex-col gap-3">
            {SOUNDSCAPES.map((s) => {
              const Icon = s.icon;
              const baseVol = soundVolumes[s.id] ?? s.defaultVol;
              // Pointers start at 0% when scrolling in, reach baseVol on this segment, and slide to 100% when leaving
              const displayVol = getSoundDisplayVol(baseVol);

              return (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-surface-container-low/80 border border-surface-variant/50 text-left flex flex-col gap-2.5 shadow-lg transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" style={{ color: theme.hex }} />
                      <span>{s.name}</span>
                    </div>
                    <span
                      className="font-mono text-xs font-bold transition-all duration-150"
                      style={{ color: theme.hex }}
                    >
                      {displayVol}%
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={displayVol}
                      onChange={(e) =>
                        setSoundVolumes((prev) => ({
                          ...prev,
                          [s.id]: Number(e.target.value),
                        }))
                      }
                      className="w-full h-1.5 bg-surface-container rounded-lg appearance-none cursor-pointer transition-all duration-150"
                      style={{ accentColor: theme.hex }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SEGMENT 4: SHARED FOCUS GROUPS */}
      {/* 3 timers of different colors with names inside at top. */}
      {/* Middle comes from above, side ones from the side as you scroll. */}
      {/* ============================================================ */}
      <section
        data-segment="4"
        className="h-screen w-full snap-start snap-always shrink-0 flex flex-col items-center justify-center px-6 text-center bg-surface-container-low/40 border-t border-surface-variant/30 relative overflow-hidden pt-16"
      >
        <div className="max-w-4xl flex flex-col items-center z-10 w-full">
          <span
            className="text-[11px] font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full border"
            style={{
              backgroundColor: theme.hex + '15',
              borderColor: theme.hex + '30',
              color: theme.hex,
            }}
          >
            Shared Focus Groups
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold font-display text-on-surface mb-3">
            Focus together. Work separately.
          </h2>
          <p className="text-sm sm:text-base text-outline max-w-xl mb-8 leading-relaxed">
            Independent timers sharing space. No pressure, no comparison, just quiet group
            accountability.
          </p>

          {/* Three Timers with Distinct Colors & Dynamic Slow Inward Motion */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 max-w-4xl w-full my-2">
            {groupTimers.map((t, idx) => (
              <div
                key={t.id}
                className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 flex flex-col items-center justify-center p-4 shadow-2xl backdrop-blur-2xl bg-surface-container-low/90 select-none hover:scale-105 transition-transform duration-300"
                style={{
                  borderColor: t.color,
                  boxShadow: `0 14px 35px -8px ${t.color}35`,
                  transform: getTimerTransform(t.direction),
                  opacity: 0.15 + 0.85 * timersProgress,
                  transition: 'transform 1.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  transitionDelay: `${idx * 200}ms`,
                }}
              >
                {/* Name inside at the top of the timer */}
                <div
                  className="flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-xs font-bold tracking-wide mb-1 shadow-sm"
                  style={{
                    backgroundColor: t.color + '15',
                    borderColor: t.color + '35',
                    color: t.color,
                  }}
                >
                  <span className="text-sm">{t.avatar}</span>
                  <span>{t.name}</span>
                </div>

                {/* Central Countdown Timer */}
                <span className="font-mono text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight my-1">
                  {t.time}
                </span>

                {/* Focus Status Indicator inside at the bottom of the timer */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div
                    className="w-2 h-2 rounded-full animate-ping"
                    style={{ backgroundColor: t.color }}
                  />
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: t.color }}
                  >
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SEGMENT 5: LAUNCH CANVAS (FINAL CTA) */}
      {/* ============================================================ */}
      <section
        data-segment="5"
        className="h-screen w-full snap-start snap-always shrink-0 flex flex-col items-center justify-center px-6 text-center border-t border-surface-variant/30 relative overflow-hidden pt-16"
      >
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[160px] opacity-20 pointer-events-none"
          style={{ backgroundColor: theme.hex }}
        />

        <div className="max-w-xl flex flex-col items-center z-10">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center border-2 border-surface-variant/40 shadow-xl mb-6 transition-transform hover:rotate-180 duration-500"
            style={{ backgroundColor: theme.hex + '20', color: theme.hex }}
          >
            <Hourglass className="w-8 h-8" />
          </div>

          <h2 className="text-4xl sm:text-6xl font-extrabold font-display text-on-surface mb-5 tracking-tight">
            Ready to enter your canvas?
          </h2>
          <p className="text-sm sm:text-base text-outline max-w-md mb-10 leading-relaxed">
            Everything you need. Nothing in your way. Step into deep focus now.
          </p>

          <button
            onClick={onEnterApp}
            className="px-8 py-4 rounded-full text-white text-base font-extrabold shadow-2xl hover:opacity-90 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
            style={{ backgroundColor: theme.hex }}
          >
            Launch Canvas Workspace <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Global Auth Modal */}
      <AuthModal />
    </div>
  );
}
