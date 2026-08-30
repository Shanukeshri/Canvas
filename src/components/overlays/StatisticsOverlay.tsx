'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  X,
  Sparkles,
  Flame,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  Layers,
  Zap,
  Target,
} from 'lucide-react';
import clsx from 'clsx';

export function StatisticsOverlay() {
  const { overlay, closeOverlay, totalFocusMinutesToday } = useApp();
  const { theme } = useTheme();

  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ day: number; week: number; hours: number } | null>(null);

  if (overlay !== 'stats') return null;

  const hoursToday = Math.floor(totalFocusMinutesToday / 60);
  const minutesToday = totalFocusMinutesToday % 60;

  // Week focus trend data for Line Graph
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
    { name: 'Architecture', time: '6h 40m', percent: 45, color: theme.hex },
    { name: 'APIs & Backend', time: '4h 10m', percent: 28, color: '#3B82F6' },
    { name: 'UI & Design System', time: '2h 30m', percent: 17, color: '#10B981' },
    { name: 'Review & Docs', time: '1h 00m', percent: 10, color: '#8B5CF6' },
  ];

  // 28-day consistency heatmap mock (4 weeks x 7 days)
  const heatmapWeeks = Array.from({ length: 4 }).map((_, wIdx) =>
    Array.from({ length: 7 }).map((_, dIdx) => {
      const level = (wIdx * 7 + dIdx * 3 + 2) % 5;
      const hours = level === 0 ? 0 : Number((level * 1.3).toFixed(1));
      return { day: dIdx, week: wIdx, level, hours };
    })
  );

  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Calculate smooth SVG curve points
  const svgWidth = 460;
  const svgHeight = 130;
  const padX = 24;
  const padYTop = 16;
  const padYBottom = 22;
  const maxVal = 6.0;

  const points = trendData.map((d, i) => {
    const x = padX + (i * (svgWidth - padX * 2)) / (trendData.length - 1);
    const y = svgHeight - padYBottom - (d.val / maxVal) * (svgHeight - padYTop - padYBottom);
    return { x, y, ...d };
  });

  // Generate smooth cubic bezier path
  const generateSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 2.5;
      const cp1y = curr.y;
      const cp2x = next.x - (next.x - curr.x) / 2.5;
      const cp2y = next.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const linePath = generateSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight - padYBottom} L ${points[0].x} ${svgHeight - padYBottom} Z`;

  return (
    <div
      onClick={closeOverlay}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-4xl bg-surface-container-lowest/95 backdrop-blur-2xl border border-surface-variant/40 rounded-3xl shadow-2xl p-5 sm:p-6 select-none animate-in zoom-in-95 duration-150 relative flex flex-col gap-4 max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Title + Streak immediately beside it + Time Range selector + Close */}
        <div className="flex items-center justify-between border-b border-surface-variant/30 pb-3.5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center border shadow-xs"
              style={{
                backgroundColor: theme.hex + '18',
                borderColor: theme.hex + '35',
                color: theme.hex,
              }}
            >
              <Sparkles className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-bold text-on-surface tracking-tight">Insights</h1>

              {/* Streak Badge right after the heading */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-xs transition-transform hover:scale-105"
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

          <div className="flex items-center gap-2">
            {/* Time Range Selector */}
            <div className="flex items-center gap-1 p-0.5 bg-surface-container-low rounded-xl border border-surface-variant/40">
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
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
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
              className="p-1.5 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Visualizations Row: Consistency Map (in place of bar graph) & Focus Trend Line Graph */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* 1. Consistency Map (Prominent placement) */}
          <div className="border border-surface-variant/35 rounded-2xl bg-surface-container-low/50 p-4 flex flex-col justify-between shadow-xs relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: theme.hex }} />
                <span className="text-xs font-semibold text-on-surface tracking-wide">
                  Consistency Map
                </span>
              </div>
              <span className="text-[11px] text-outline font-mono">28 Days</span>
            </div>

            {/* 7 Days of Week Header */}
            <div className="grid grid-cols-7 gap-1.5 mb-1 px-0.5">
              {dayNames.map((d, i) => (
                <span key={i} className="text-[10px] font-semibold text-outline text-center">
                  {d}
                </span>
              ))}
            </div>

            {/* 4 Weeks Grid */}
            <div className="grid grid-cols-7 gap-1.5 px-0.5 my-auto">
              {heatmapWeeks.flatMap((week, wIdx) =>
                week.map((item, dIdx) => {
                  const isHovered =
                    hoveredCell?.week === wIdx && hoveredCell?.day === dIdx;
                  return (
                    <div
                      key={`${wIdx}-${dIdx}`}
                      onMouseEnter={() =>
                        setHoveredCell({ day: dIdx, week: wIdx, hours: item.hours })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                      className="aspect-square rounded-md transition-all duration-200 cursor-pointer shadow-2xs relative"
                      style={{
                        backgroundColor:
                          item.level === 0
                            ? 'var(--surface-container)'
                            : item.level === 1
                            ? theme.hex + '30'
                            : item.level === 2
                            ? theme.hex + '60'
                            : item.level === 3
                            ? theme.hex + '95'
                            : theme.hex,
                        transform: isHovered ? 'scale(1.18)' : 'scale(1)',
                        boxShadow: isHovered ? `0 0 10px ${theme.hex}50` : 'none',
                        zIndex: isHovered ? 10 : 1,
                      }}
                    />
                  );
                })
              )}
            </div>

            {/* Bottom Legend */}
            <div className="flex items-center justify-between pt-2.5 border-t border-surface-variant/20 text-[10px] text-outline">
              <span className="font-mono">
                {hoveredCell ? `${hoveredCell.hours}h focused` : '86% active rate'}
              </span>
              <div className="flex items-center gap-1">
                <span>Less</span>
                {[0, 1, 2, 3, 4].map((lvl) => (
                  <span
                    key={lvl}
                    className="w-2 h-2 rounded-xs"
                    style={{
                      backgroundColor:
                        lvl === 0
                          ? 'var(--surface-container)'
                          : lvl === 1
                          ? theme.hex + '30'
                          : lvl === 2
                          ? theme.hex + '60'
                          : lvl === 3
                          ? theme.hex + '95'
                          : theme.hex,
                    }}
                  />
                ))}
                <span>More</span>
              </div>
            </div>
          </div>

          {/* 2. Focus Trend Line Graph */}
          <div className="border border-surface-variant/35 rounded-2xl bg-surface-container-low/50 p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: theme.hex }} />
                <span className="text-xs font-semibold text-on-surface tracking-wide">
                  Focus Hours
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-on-surface">
                  {timeRange === 'today' ? `${hoursToday}h ${minutesToday}m` : '22h 42m'}
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-mono">
                  +18%
                </span>
              </div>
            </div>

            {/* SVG Smooth Line Chart */}
            <div className="relative w-full h-[125px] my-auto">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  {/* Softer, pleasant theme gradient under line */}
                  <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.hex} stopOpacity="0.32" />
                    <stop offset="70%" stopColor={theme.hex} stopOpacity="0.06" />
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

                {/* Area Gradient Fill */}
                <path d={areaPath} fill="url(#lineAreaGrad)" />

                {/* Line Path */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={theme.hex}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points */}
                {points.map((p, i) => {
                  const isHovered = hoveredPoint === i;
                  return (
                    <g key={i}>
                      {/* Invisible hover target */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="12"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(i)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />

                      {/* Visible Node */}
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
                  className="absolute pointer-events-none bg-surface-container-highest px-2 py-1 rounded-md text-[10px] font-semibold text-on-surface shadow-lg border border-surface-variant -translate-x-1/2 -translate-y-full transition-all"
                  style={{
                    left: `${(points[hoveredPoint].x / svgWidth) * 100}%`,
                    top: `${(points[hoveredPoint].y / svgHeight) * 100 - 8}%`,
                  }}
                >
                  <span style={{ color: theme.hex }}>{trendData[hoveredPoint].day}</span>: {trendData[hoveredPoint].hours} ({trendData[hoveredPoint].sessions} sessions)
                </div>
              )}
            </div>

            {/* X Axis Labels */}
            <div className="flex items-center justify-between px-2 pt-1 border-t border-surface-variant/20 text-[10px] text-outline">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* 4 Compact Stat Badges (Col 1) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="border border-surface-variant/35 rounded-2xl bg-surface-container-low/50 p-3 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-outline uppercase tracking-wider">
                  Sessions
                </span>
                <Clock className="w-3.5 h-3.5 text-outline/70" />
              </div>
              <div className="my-0.5">
                <span className="text-xl font-bold text-on-surface font-mono">48</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium font-mono">96% done</span>
            </div>

            <div className="border border-surface-variant/35 rounded-2xl bg-surface-container-low/50 p-3 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-outline uppercase tracking-wider">
                  Tasks
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-outline/70" />
              </div>
              <div className="my-0.5">
                <span className="text-xl font-bold text-on-surface font-mono">31</span>
              </div>
              <span className="text-[10px] font-medium font-mono" style={{ color: theme.hex }}>
                +9 week
              </span>
            </div>

            <div className="border border-surface-variant/35 rounded-2xl bg-surface-container-low/50 p-3 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-outline uppercase tracking-wider">
                  Avg Focus
                </span>
                <Zap className="w-3.5 h-3.5 text-outline/70" />
              </div>
              <div className="my-0.5">
                <span className="text-xl font-bold text-on-surface font-mono">28m</span>
              </div>
              <span className="text-[10px] text-outline font-mono">optimal</span>
            </div>

            <div className="border border-surface-variant/35 rounded-2xl bg-surface-container-low/50 p-3 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-outline uppercase tracking-wider">
                  Peak Flow
                </span>
                <Target className="w-3.5 h-3.5 text-outline/70" />
              </div>
              <div className="my-0.5">
                <span className="text-xl font-bold text-on-surface font-mono">10 AM</span>
              </div>
              <span className="text-[10px] text-outline font-mono">morning</span>
            </div>
          </div>

          {/* Project Distribution (Col Span 2) */}
          <div className="md:col-span-2 border border-surface-variant/35 rounded-2xl bg-surface-container-low/50 p-4 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" style={{ color: theme.hex }} />
                <span className="text-xs font-semibold text-on-surface tracking-wide">
                  Project Focus Distribution
                </span>
              </div>
              <span className="text-[10px] text-outline font-mono">4 projects</span>
            </div>

            {/* Segmented Distribution Bar */}
            <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-surface-container mb-3 shadow-inner">
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
            <div className="grid grid-cols-2 gap-2">
              {projectDistribution.map((p, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1.5 rounded-xl bg-surface-container-lowest/80 border border-surface-variant/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-[11px] font-medium text-on-surface truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
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
