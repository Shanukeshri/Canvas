'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  X,
  Sparkles,
  Flame,
  Calendar as CalendarIcon,
  TrendingUp,
  Clock,
  CheckCircle2,
  Layers,
  Zap,
  Target,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';

export function StatisticsOverlay() {
  const { overlay, closeOverlay, totalFocusMinutesToday } = useApp();
  const { theme } = useTheme();

  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<{ dayNum: number; hours: number; sessions: number } | null>(null);

  // Month navigation for Calendar
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 7, 1)); // August 2026

  if (overlay !== 'stats') return null;

  const hoursToday = Math.floor(totalFocusMinutesToday / 60);
  const minutesToday = totalFocusMinutesToday % 60;

  // Week focus trend data for Line Graph (Straight lines connecting data points)
  const trendData = [
    { day: 'Mon', hours: '2h 15m', val: 2.25, sessions: 5 },
    { day: 'Tue', hours: '4h 30m', val: 4.5, sessions: 9 },
    { day: 'Wed', hours: '3h 42m', val: 3.7, sessions: 7, active: true },
    { day: 'Thu', hours: '5h 10m', val: 5.16, sessions: 11 },
    { day: 'Fri', hours: '3h 20m', val: 3.33, sessions: 6 },
    { day: 'Sat', hours: '1h 45m', val: 1.75, sessions: 3 },
    { day: 'Sun', hours: '2h 00m', val: 2.0, sessions: 4 },
  ];

  // Project distribution
  const projectDistribution = [
    { name: 'Architecture & Core', time: '6h 40m', percent: 45, color: theme.hex },
    { name: 'APIs & Backend', time: '4h 10m', percent: 28, color: '#3B82F6' },
    { name: 'UI & Design System', time: '2h 30m', percent: 17, color: '#10B981' },
    { name: 'Review & Docs', time: '1h 00m', percent: 10, color: '#8B5CF6' },
  ];

  // Calendar calculations: 7 columns starting from Monday
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonthName = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();
  // In JS Date, getDay() returns 0 for Sunday, 1 for Mon... 6 for Sat.
  // Converting to Monday = 0: (day + 6) % 7
  const firstDayIndex = (new Date(currentYear, currentDate.getMonth(), 1).getDay() + 6) % 7;

  // Generate calendar days with mock consistency focus hours
  const calendarCells = [];
  // Leading empty padding cells from previous month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push({ isPadding: true, dayNum: 0, level: 0, hours: 0, sessions: 0 });
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    // Deterministic pseudo-random activity based on day
    const seed = (d * 7 + currentDate.getMonth() * 13) % 19;
    const level = seed % 5;
    const hours = level === 0 ? 0 : Number((level * 1.2 + (d % 3) * 0.4).toFixed(1));
    const sessions = level === 0 ? 0 : Math.max(1, Math.round(hours * 2));
    calendarCells.push({ isPadding: false, dayNum: d, level, hours, sessions });
  }

  const weekDayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Straight line graph SVG calculations
  const svgWidth = 500;
  const svgHeight = 150;
  const padX = 28;
  const padYTop = 18;
  const padYBottom = 26;
  const maxVal = 6.0;

  const points = trendData.map((d, i) => {
    const x = padX + (i * (svgWidth - padX * 2)) / (trendData.length - 1);
    const y = svgHeight - padYBottom - (d.val / maxVal) * (svgHeight - padYTop - padYBottom);
    return { x, y, ...d };
  });

  // Generate straight lines connecting data points (NOT smooth curves)
  const generateStraightPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  };

  const linePath = generateStraightPath(points);
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - padYBottom} L ${points[0].x} ${svgHeight - padYBottom} Z`
    : '';

  return (
    <div
      onClick={closeOverlay}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-5xl xl:max-w-6xl bg-surface-container-lowest/95 backdrop-blur-2xl border border-surface-variant/40 rounded-3xl shadow-2xl p-6 sm:p-8 select-none animate-in zoom-in-95 duration-150 relative flex flex-col gap-5 max-h-[94vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--surface-variant) transparent',
        }}
      >
        {/* Header: Title + Streak + Time Range selector + Close */}
        <div className="flex items-center justify-between border-b border-surface-variant/30 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs"
              style={{
                backgroundColor: theme.hex + '18',
                borderColor: theme.hex + '35',
                color: theme.hex,
              }}
            >
              <Sparkles className="w-5 h-5" />
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-lg sm:text-xl font-bold text-on-surface tracking-tight">Insights</h1>

              {/* Streak Badge */}
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-xs transition-transform hover:scale-105"
                style={{
                  backgroundColor: theme.hex + '15',
                  borderColor: theme.hex + '30',
                  color: theme.hex,
                }}
              >
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span className="font-mono">14d Streak</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-xl border border-surface-variant/40">
              {(
                [
                  { id: 'today', label: 'Today' },
                  { id: 'week', label: 'Week' },
                  { id: 'month', label: 'Month' },
                  { id: 'all', label: 'All' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTimeRange(tab.id)}
                  className={clsx(
                    'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                    timeRange === tab.id
                      ? 'bg-surface-container-high font-semibold shadow-xs'
                      : 'text-outline hover:text-on-surface'
                  )}
                  style={timeRange === tab.id ? { color: theme.hex } : {}}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={closeOverlay}
              aria-label="Close"
              className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Visualizations Row: Calendar Map & Straight-Line Focus Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* 1. Consistency Calendar (7 Columns starting from Monday, Month & Year heading) */}
          <div className="lg:col-span-7 border border-surface-variant/35 rounded-2xl bg-surface-container-low/50 p-5 flex flex-col justify-between shadow-xs relative">
            {/* Calendar Header with Month & Year and Nav Controls */}
            <div className="flex items-center justify-between mb-3 border-b border-surface-variant/20 pb-3">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-4 h-4" style={{ color: theme.hex }} />
                <h2 className="text-sm font-bold text-on-surface tracking-wide">
                  {currentMonthName} {currentYear}
                </h2>
                <span className="text-[11px] text-outline font-mono ml-1 px-2 py-0.5 rounded-md bg-surface-container">
                  Consistency Calendar
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 7 Columns Day Names Header: Mon - Sun */}
            <div className="grid grid-cols-7 gap-2 mb-2 px-1">
              {weekDayHeaders.map((d, i) => (
                <span
                  key={i}
                  className={clsx(
                    'text-[11px] font-semibold text-center uppercase tracking-wider',
                    i >= 5 ? 'text-outline/70' : 'text-outline'
                  )}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-2 px-1 my-auto">
              {calendarCells.map((cell, idx) => {
                if (cell.isPadding) {
                  return (
                    <div
                      key={`pad-${idx}`}
                      className="aspect-square rounded-xl bg-transparent border border-dashed border-surface-variant/15 opacity-20 pointer-events-none"
                    />
                  );
                }

                const isHovered = hoveredDay?.dayNum === cell.dayNum;
                const isToday = cell.dayNum === 30 && currentMonthName === 'August' && currentYear === 2026;

                return (
                  <div
                    key={`day-${cell.dayNum}`}
                    onMouseEnter={() =>
                      setHoveredDay({
                        dayNum: cell.dayNum,
                        hours: cell.hours,
                        sessions: cell.sessions,
                      })
                    }
                    onMouseLeave={() => setHoveredDay(null)}
                    className={clsx(
                      'aspect-square rounded-xl transition-all duration-200 cursor-pointer shadow-2xs relative flex flex-col items-center justify-between p-1.5 select-none border',
                      isToday ? 'ring-2 ring-offset-1 ring-primary' : 'border-surface-variant/20'
                    )}
                    style={{
                      backgroundColor:
                        cell.level === 0
                          ? 'var(--surface-container)'
                          : cell.level === 1
                          ? theme.hex + '35'
                          : cell.level === 2
                          ? theme.hex + '65'
                          : cell.level === 3
                          ? theme.hex + '95'
                          : theme.hex,
                      color: cell.level >= 2 ? '#ffffff' : 'var(--on-surface)',
                      transform: isHovered ? 'scale(1.12)' : 'scale(1)',
                      boxShadow: isHovered ? `0 0 14px ${theme.hex}60` : 'none',
                      zIndex: isHovered ? 20 : 1,
                    }}
                  >
                    {/* Day number */}
                    <span className="text-[11px] font-mono font-bold self-start leading-none">
                      {cell.dayNum}
                    </span>

                    {/* Focus dots / hours indicator */}
                    {cell.level > 0 && (
                      <span className="text-[9px] font-mono font-semibold self-end opacity-90 leading-none">
                        {cell.hours}h
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Calendar Bottom Legend & Hover Details */}
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-surface-variant/20 text-[11px] text-outline">
              <span className="font-mono">
                {hoveredDay
                  ? `${currentMonthName} ${hoveredDay.dayNum}: ${hoveredDay.hours}h focused (${hoveredDay.sessions} sessions)`
                  : '88% monthly consistency rate'}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">Less</span>
                {[0, 1, 2, 3, 4].map((lvl) => (
                  <span
                    key={lvl}
                    className="w-2.5 h-2.5 rounded-xs"
                    style={{
                      backgroundColor:
                        lvl === 0
                          ? 'var(--surface-container)'
                          : lvl === 1
                          ? theme.hex + '35'
                          : lvl === 2
                          ? theme.hex + '65'
                          : lvl === 3
                          ? theme.hex + '95'
                          : theme.hex,
                    }}
                  />
                ))}
                <span className="text-[10px]">More</span>
              </div>
            </div>
          </div>

          {/* 2. Focus Trend Straight-Line Graph */}
          <div className="lg:col-span-5 border border-surface-variant/35 rounded-2xl bg-surface-container-low/50 p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: theme.hex }} />
                <span className="text-xs font-semibold text-on-surface tracking-wide">
                  Weekly Focus Trend
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-on-surface">
                  {timeRange === 'today' ? `${hoursToday}h ${minutesToday}m` : '22h 42m'}
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
                  +18%
                </span>
              </div>
            </div>

            {/* Straight-Line Graph SVG */}
            <div className="relative w-full h-[180px] my-auto">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  {/* Subtle straight polygon gradient */}
                  <linearGradient id="straightLineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.hex} stopOpacity="0.35" />
                    <stop offset="80%" stopColor={theme.hex} stopOpacity="0.06" />
                    <stop offset="100%" stopColor={theme.hex} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Subtle horizontal dashed guide lines */}
                {[0.25, 0.55, 0.85].map((fraction, i) => {
                  const y = svgHeight - padYBottom - fraction * (svgHeight - padYTop - padYBottom);
                  return (
                    <line
                      key={i}
                      x1={padX}
                      y1={y}
                      x2={svgWidth - padX}
                      y2={y}
                      stroke="var(--surface-variant)"
                      strokeOpacity="0.35"
                      strokeDasharray="3 3"
                    />
                  );
                })}

                {/* Straight Polygon Area Fill */}
                <path d={areaPath} fill="url(#straightLineGrad)" />

                {/* Straight Line Path (No Bezier curves) */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={theme.hex}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points on vertexes */}
                {points.map((p, i) => {
                  const isHovered = hoveredPoint === i;
                  return (
                    <g key={i}>
                      {/* Invisible hover target */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="14"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(i)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />

                      {/* Visible Node */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? 5.5 : p.active ? 4.5 : 3.5}
                        fill={isHovered || p.active ? theme.hex : 'var(--surface-container-high)'}
                        stroke={isHovered || p.active ? 'var(--surface)' : theme.hex}
                        strokeWidth="2"
                        className="transition-all duration-150 pointer-events-none"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Floating Tooltip for Line Graph */}
              {hoveredPoint !== null && (
                <div
                  className="absolute pointer-events-none bg-surface-container-highest px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-on-surface shadow-xl border border-surface-variant -translate-x-1/2 -translate-y-full transition-all"
                  style={{
                    left: `${(points[hoveredPoint].x / svgWidth) * 100}%`,
                    top: `${(points[hoveredPoint].y / svgHeight) * 100 - 10}%`,
                  }}
                >
                  <span style={{ color: theme.hex }}>{trendData[hoveredPoint].day}</span>: {trendData[hoveredPoint].hours} ({trendData[hoveredPoint].sessions} sessions)
                </div>
              )}
            </div>

            {/* X Axis Labels */}
            <div className="flex items-center justify-between px-3 pt-2 border-t border-surface-variant/20 text-[11px] text-outline">
              {trendData.map((d, i) => (
                <span
                  key={i}
                  className={clsx(
                    'font-medium transition-colors',
                    d.active ? 'font-bold' : 'hover:text-on-surface'
                  )}
                  style={d.active ? { color: theme.hex } : {}}
                >
                  {d.day}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row: 4 Metric Badges & Project Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* 4 Compact Stat Badges (Col 5) */}
          <div className="md:col-span-5 grid grid-cols-2 gap-3">
            <div className="border border-surface-variant/35 rounded-2xl bg-surface-container-low/50 p-4 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-outline uppercase tracking-wider">
                  Sessions
                </span>
                <Clock className="w-4 h-4 text-outline/70" />
              </div>
              <div className="my-1">
                <span className="text-2xl font-bold text-on-surface font-mono">48</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-medium font-mono">96% done</span>
            </div>

            <div className="border border-surface-variant/35 rounded-2xl bg-surface-container-low/50 p-4 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-outline uppercase tracking-wider">
                  Tasks
                </span>
                <CheckCircle2 className="w-4 h-4 text-outline/70" />
              </div>
              <div className="my-1">
                <span className="text-2xl font-bold text-on-surface font-mono">31</span>
              </div>
              <span className="text-[11px] font-medium font-mono" style={{ color: theme.hex }}>
                +9 week
              </span>
            </div>

            <div className="border border-surface-variant/35 rounded-2xl bg-surface-container-low/50 p-4 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-outline uppercase tracking-wider">
                  Avg Focus
                </span>
                <Zap className="w-4 h-4 text-outline/70" />
              </div>
              <div className="my-1">
                <span className="text-2xl font-bold text-on-surface font-mono">28m</span>
              </div>
              <span className="text-[11px] text-outline font-mono">optimal</span>
            </div>

            <div className="border border-surface-variant/35 rounded-2xl bg-surface-container-low/50 p-4 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-outline uppercase tracking-wider">
                  Peak Flow
                </span>
                <Target className="w-4 h-4 text-outline/70" />
              </div>
              <div className="my-1">
                <span className="text-2xl font-bold text-on-surface font-mono">10 AM</span>
              </div>
              <span className="text-[11px] text-outline font-mono">morning</span>
            </div>
          </div>

          {/* Project Distribution (Col Span 7) */}
          <div className="md:col-span-7 border border-surface-variant/35 rounded-2xl bg-surface-container-low/50 p-5 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" style={{ color: theme.hex }} />
                <span className="text-xs font-semibold text-on-surface tracking-wide">
                  Project Focus Distribution
                </span>
              </div>
              <span className="text-[11px] text-outline font-mono">4 projects</span>
            </div>

            {/* Segmented Distribution Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-surface-container mb-4 shadow-inner">
              {projectDistribution.map((p, idx) => (
                <div
                  key={idx}
                  className="h-full transition-opacity hover:opacity-85"
                  style={{ width: `${p.percent}%`, backgroundColor: p.color }}
                  title={`${p.name}: ${p.percent}% (${p.time})`}
                />
              ))}
            </div>

            {/* Project List Chips */}
            <div className="grid grid-cols-2 gap-2.5">
              {projectDistribution.map((p, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 rounded-xl bg-surface-container-lowest/80 border border-surface-variant/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-xs font-medium text-on-surface truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
                    <span className="text-on-surface font-semibold">{p.time}</span>
                    <span className="text-outline">({p.percent}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
