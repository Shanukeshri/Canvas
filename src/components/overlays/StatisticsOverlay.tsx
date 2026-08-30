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

  // Trend data mapped by time range for Line Graph
  const trendDataMap = {
    today: [
      { day: '08:00', hours: '45m', val: 0.75, sessions: 1 },
      { day: '10:00', hours: '1h 30m', val: 1.5, sessions: 2 },
      { day: '12:00', hours: '50m', val: 0.83, sessions: 1 },
      { day: '14:00', hours: '2h 10m', val: 2.16, sessions: 3, active: true },
      { day: '16:00', hours: '1h 15m', val: 1.25, sessions: 2 },
      { day: '18:00', hours: '40m', val: 0.66, sessions: 1 },
      { day: '20:00', hours: '0m', val: 0.0, sessions: 0 },
    ],
    week: [
      { day: 'Mon', hours: '2h 15m', val: 2.25, sessions: 5 },
      { day: 'Tue', hours: '4h 30m', val: 4.5, sessions: 9 },
      { day: 'Wed', hours: '3h 42m', val: 3.7, sessions: 7, active: true },
      { day: 'Thu', hours: '5h 10m', val: 5.16, sessions: 11 },
      { day: 'Fri', hours: '3h 20m', val: 3.33, sessions: 6 },
      { day: 'Sat', hours: '1h 45m', val: 1.75, sessions: 3 },
      { day: 'Sun', hours: '2h 00m', val: 2.0, sessions: 4 },
    ],
    month: [
      { day: 'W1', hours: '18h 30m', val: 3.7, sessions: 24 },
      { day: 'W2', hours: '24h 10m', val: 4.8, sessions: 32 },
      { day: 'W3', hours: '21h 45m', val: 4.3, sessions: 29 },
      { day: 'W4', hours: '28h 15m', val: 5.6, sessions: 38, active: true },
    ],
    all: [
      { day: 'May', hours: '64h', val: 3.2, sessions: 85 },
      { day: 'Jun', hours: '82h', val: 4.1, sessions: 110 },
      { day: 'Jul', hours: '96h', val: 4.8, sessions: 128 },
      { day: 'Aug', hours: '104h', val: 5.2, sessions: 142, active: true },
    ],
  };

  const trendData = trendDataMap[timeRange] || trendDataMap.week;

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
  const firstDayIndex = (new Date(currentYear, currentDate.getMonth(), 1).getDay() + 6) % 7;

  // Generate calendar days with mock consistency focus hours
  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push({ isPadding: true, dayNum: 0, level: 0, hours: 0, sessions: 0 });
  }
  for (let d = 1; d <= daysInMonth; d++) {
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

  // Straight line graph SVG calculations: Compact height
  const svgWidth = 480;
  const svgHeight = 85;
  const padX = 20;
  const padYTop = 8;
  const padYBottom = 14;
  const maxVal = Math.max(...trendData.map((d) => d.val), 6.0);

  const points = trendData.map((d, i) => {
    const x = padX + (i * (svgWidth - padX * 2)) / Math.max(1, trendData.length - 1);
    const y = svgHeight - padYBottom - (d.val / maxVal) * (svgHeight - padYTop - padYBottom);
    return { x, y, ...d };
  });

  // Straight lines connecting data points
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-4xl xl:max-w-5xl bg-surface-container-lowest/95 backdrop-blur-2xl border border-surface-variant/40 rounded-3xl shadow-2xl p-4 sm:p-5 select-none animate-in zoom-in-95 duration-150 relative flex flex-col gap-2.5 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Compact height */}
        <div className="flex items-center justify-between border-b border-surface-variant/30 pb-2.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border shadow-xs"
              style={{
                backgroundColor: theme.hex + '18',
                borderColor: theme.hex + '35',
                color: theme.hex,
              }}
            >
              <Sparkles className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-on-surface tracking-tight">Insights</h1>

              {/* Streak Badge */}
              <div
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border shadow-xs"
                style={{
                  backgroundColor: theme.hex + '15',
                  borderColor: theme.hex + '30',
                  color: theme.hex,
                }}
              >
                <Flame className="w-3 h-3 fill-current" />
                <span className="font-mono">14d Streak</span>
              </div>
            </div>
          </div>

          <button
            onClick={closeOverlay}
            aria-label="Close"
            className="p-1.5 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Visualizations Row: Calendar Map & Straight-Line Focus Trend (Vertically Compact) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 shrink-0">
          {/* 1. Consistency Calendar (7 Columns starting from Monday) */}
          <div className="lg:col-span-7 border border-surface-variant/35 rounded-2xl bg-surface-container-low/50 p-2.5 sm:p-3 flex flex-col justify-between shadow-xs relative">
            {/* Calendar Header with Month & Year and Nav Controls */}
            <div className="flex items-center justify-between mb-1.5 border-b border-surface-variant/20 pb-1.5">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" style={{ color: theme.hex }} />
                <h2 className="text-xs font-bold text-on-surface tracking-wide">
                  {currentMonthName} {currentYear}
                </h2>
                <span className="text-[9px] text-outline font-mono ml-1 px-1.5 py-0.5 rounded-md bg-surface-container">
                  Consistency Calendar
                </span>
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-0.5 rounded-md text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-0.5 rounded-md text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 7 Columns Day Names Header: Mon - Sun */}
            <div className="grid grid-cols-7 gap-1 mb-1 px-0.5">
              {weekDayHeaders.map((d, i) => (
                <span
                  key={i}
                  className={clsx(
                    'text-[9px] font-semibold text-center uppercase tracking-wider',
                    i >= 5 ? 'text-outline/70' : 'text-outline'
                  )}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Calendar Days Grid: Scaled down height */}
            <div className="grid grid-cols-7 gap-1 px-0.5 my-auto">
              {calendarCells.map((cell, idx) => {
                if (cell.isPadding) {
                  return (
                    <div
                      key={`pad-${idx}`}
                      className="h-6 sm:h-6.5 rounded-md bg-transparent border border-dashed border-surface-variant/15 opacity-15 pointer-events-none"
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
                      'h-6 sm:h-6.5 rounded-md transition-all duration-150 cursor-pointer shadow-2xs relative flex flex-col items-center justify-between p-0.5 select-none border',
                      isToday ? 'ring-1.5 ring-primary' : 'border-surface-variant/20'
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
                      transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                      boxShadow: isHovered ? `0 0 10px ${theme.hex}60` : 'none',
                      zIndex: isHovered ? 20 : 1,
                    }}
                  >
                    {/* Day number */}
                    <span className="text-[9px] font-mono font-bold self-start leading-none pl-0.5">
                      {cell.dayNum}
                    </span>

                    {/* Focus hours indicator */}
                    {cell.level > 0 && (
                      <span className="text-[7.5px] font-mono font-semibold self-end pr-0.5 opacity-90 leading-none">
                        {cell.hours}h
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Calendar Bottom Legend & Hover Details */}
            <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-surface-variant/20 text-[9.5px] text-outline">
              <span className="font-mono truncate">
                {hoveredDay
                  ? `${currentMonthName} ${hoveredDay.dayNum}: ${hoveredDay.hours}h (${hoveredDay.sessions}s)`
                  : '88% monthly consistency'}
              </span>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <span className="text-[8.5px]">Less</span>
                {[0, 1, 2, 3, 4].map((lvl) => (
                  <span
                    key={lvl}
                    className="w-1.5 h-1.5 rounded-xs"
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
                <span className="text-[8.5px]">More</span>
              </div>
            </div>
          </div>

          {/* 2. Focus Trend Straight-Line Graph with Time Range Selector (Vertically Compact) */}
          <div className="lg:col-span-5 border border-surface-variant/35 rounded-2xl bg-surface-container-low/50 p-2.5 sm:p-3 flex flex-col justify-between shadow-xs">
            {/* Header: Title + Selector */}
            <div className="flex items-center justify-between mb-1 gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" style={{ color: theme.hex }} />
                <span className="text-xs font-semibold text-on-surface tracking-wide truncate">
                  Focus Trend
                </span>
              </div>

              {/* Time Range Selector embedded in Line Chart */}
              <div className="flex items-center gap-0.5 p-0.5 bg-surface-container rounded-lg border border-surface-variant/40 shrink-0">
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
                      'px-1.5 py-0.5 rounded-md text-[9px] font-medium transition-all',
                      timeRange === tab.id
                        ? 'bg-surface-container-highest font-semibold shadow-xs'
                        : 'text-outline hover:text-on-surface'
                    )}
                    style={timeRange === tab.id ? { color: theme.hex } : {}}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Summary */}
            <div className="flex items-center justify-between mb-0.5 px-0.5">
              <span className="text-[10px] text-outline">Total Focus:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold text-on-surface">
                  {timeRange === 'today' ? `${hoursToday}h ${minutesToday}m` : '22h 42m'}
                </span>
                <span className="text-[8.5px] font-semibold text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded-full font-mono">
                  +18%
                </span>
              </div>
            </div>

            {/* Compact Straight-Line Graph SVG */}
            <div className="relative w-full h-[85px] my-auto">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="straightLineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.hex} stopOpacity="0.32" />
                    <stop offset="80%" stopColor={theme.hex} stopOpacity="0.05" />
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

                {/* Straight Line Path */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={theme.hex}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points */}
                {points.map((p, i) => {
                  const isHovered = hoveredPoint === i;
                  return (
                    <g key={i}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="10"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(i)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />

                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? 4.5 : p.active ? 3.5 : 2.5}
                        fill={isHovered || p.active ? theme.hex : 'var(--surface-container-high)'}
                        stroke={isHovered || p.active ? 'var(--surface)' : theme.hex}
                        strokeWidth="1.5"
                        className="transition-all duration-150 pointer-events-none"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Floating Tooltip for Line Graph */}
              {hoveredPoint !== null && (
                <div
                  className="absolute pointer-events-none bg-surface-container-highest px-2 py-0.5 rounded-md text-[9px] font-semibold text-on-surface shadow-xl border border-surface-variant -translate-x-1/2 -translate-y-full transition-all z-30"
                  style={{
                    left: `${(points[hoveredPoint].x / svgWidth) * 100}%`,
                    top: `${(points[hoveredPoint].y / svgHeight) * 100 - 6}%`,
                  }}
                >
                  <span style={{ color: theme.hex }}>{trendData[hoveredPoint].day}</span>: {trendData[hoveredPoint].hours}
                </div>
              )}
            </div>

            {/* X Axis Labels */}
            <div className="flex items-center justify-between px-1 pt-1 border-t border-surface-variant/20 text-[9px] text-outline">
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

        {/* Bottom Row: 4 Metric Badges & Project Distribution (Compact Sizing) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 shrink-0">
          {/* 4 Compact Stat Badges (Col 5) */}
          <div className="md:col-span-5 grid grid-cols-2 gap-2">
            <div className="border border-surface-variant/35 rounded-xl bg-surface-container-low/50 p-2 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[8.5px] font-semibold text-outline uppercase tracking-wider">
                  Sessions
                </span>
                <Clock className="w-3 h-3 text-outline/70" />
              </div>
              <div className="my-0.5">
                <span className="text-lg font-bold text-on-surface font-mono">48</span>
              </div>
              <span className="text-[9px] text-emerald-400 font-medium font-mono">96% done</span>
            </div>

            <div className="border border-surface-variant/35 rounded-xl bg-surface-container-low/50 p-2 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[8.5px] font-semibold text-outline uppercase tracking-wider">
                  Tasks
                </span>
                <CheckCircle2 className="w-3 h-3 text-outline/70" />
              </div>
              <div className="my-0.5">
                <span className="text-lg font-bold text-on-surface font-mono">31</span>
              </div>
              <span className="text-[9px] font-medium font-mono" style={{ color: theme.hex }}>
                +9 week
              </span>
            </div>

            <div className="border border-surface-variant/35 rounded-xl bg-surface-container-low/50 p-2 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[8.5px] font-semibold text-outline uppercase tracking-wider">
                  Avg Focus
                </span>
                <Zap className="w-3 h-3 text-outline/70" />
              </div>
              <div className="my-0.5">
                <span className="text-lg font-bold text-on-surface font-mono">28m</span>
              </div>
              <span className="text-[9px] text-outline font-mono">optimal</span>
            </div>

            <div className="border border-surface-variant/35 rounded-xl bg-surface-container-low/50 p-2 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[8.5px] font-semibold text-outline uppercase tracking-wider">
                  Peak Flow
                </span>
                <Target className="w-3 h-3 text-outline/70" />
              </div>
              <div className="my-0.5">
                <span className="text-lg font-bold text-on-surface font-mono">10 AM</span>
              </div>
              <span className="text-[9px] text-outline font-mono">morning</span>
            </div>
          </div>

          {/* Project Distribution (Col Span 7) */}
          <div className="md:col-span-7 border border-surface-variant/35 rounded-xl bg-surface-container-low/50 p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" style={{ color: theme.hex }} />
                <span className="text-xs font-semibold text-on-surface tracking-wide">
                  Project Focus Distribution
                </span>
              </div>
              <span className="text-[9.5px] text-outline font-mono">4 projects</span>
            </div>

            {/* Segmented Distribution Bar */}
            <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-surface-container mb-2 shadow-inner">
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
            <div className="grid grid-cols-2 gap-1.5">
              {projectDistribution.map((p, idx) => (
                <div
                  key={idx}
                  className="px-2 py-1 rounded-lg bg-surface-container-lowest/80 border border-surface-variant/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-[10px] font-medium text-on-surface truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 font-mono text-[9.5px]">
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
