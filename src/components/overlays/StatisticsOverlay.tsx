'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  X,
  BarChart2,
  Calendar,
  Flame,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  Sparkles,
  Layers,
} from 'lucide-react';
import clsx from 'clsx';

export function StatisticsOverlay() {
  const { overlay, closeOverlay, totalFocusMinutesToday } = useApp();
  const { theme } = useTheme();

  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

  if (overlay !== 'stats') return null;

  const hoursToday = Math.floor(totalFocusMinutesToday / 60);
  const minutesToday = totalFocusMinutesToday % 60;

  const weekData = [
    { day: 'Mon', hours: '2h 15m', height: 45, sessions: 5, active: false },
    { day: 'Tue', hours: '4h 30m', height: 75, sessions: 9, active: false },
    { day: 'Wed', hours: '3h 42m', height: 60, sessions: 7, active: true },
    { day: 'Thu', hours: '5h 10m', height: 90, sessions: 11, active: false },
    { day: 'Fri', hours: '3h 20m', height: 55, sessions: 6, active: false },
    { day: 'Sat', hours: '1h 45m', height: 30, sessions: 3, active: false },
    { day: 'Sun', hours: '2h 00m', height: 35, sessions: 4, active: false },
  ];

  const projectDistribution = [
    { name: 'Next.js Architecture', time: '6h 40m', percent: 45, color: '#FF5722' },
    { name: 'Server Actions & APIs', time: '4h 10m', percent: 28, color: '#3B82F6' },
    { name: 'Design Systems & CSS', time: '2h 30m', percent: 17, color: '#10B981' },
    { name: 'Code Review & Docs', time: '1h 00m', percent: 10, color: '#8B5CF6' },
  ];

  // 28-day activity heatmap mock
  const heatmapWeeks = Array.from({ length: 4 }).map((_, wIdx) =>
    Array.from({ length: 7 }).map((_, dIdx) => {
      const level = ((wIdx * 7 + dIdx * 3) % 5);
      return { day: dIdx, level };
    })
  );

  return (
    <div
      onClick={closeOverlay}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-5xl bg-surface-container-lowest/95 backdrop-blur-2xl border border-surface-variant/40 rounded-3xl shadow-2xl p-6 md:p-8 max-h-[88vh] overflow-y-auto animate-in zoom-in-95 duration-200 relative flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Range Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-variant/30 pb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border border-surface-variant/40 shadow-sm"
              style={{ backgroundColor: theme.hex + '15', color: theme.hex }}
            >
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-on-surface">Productivity Insights</h1>
              <p className="text-xs text-outline">Comprehensive breakdown of your focus time & habits</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Time Range Selector */}
            <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-2xl border border-surface-variant/40">
              {(
                [
                  { id: 'today', label: 'Today' },
                  { id: 'week', label: 'Week' },
                  { id: 'month', label: 'Month' },
                  { id: 'all', label: 'All Time' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTimeRange(tab.id)}
                  className={clsx(
                    'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                    timeRange === tab.id
                      ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
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

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Hero Metric & Weekly Chart (Col Span 2) */}
          <div className="lg:col-span-2 border border-surface-variant/40 rounded-3xl bg-surface-container-low/60 p-6 flex flex-col justify-between shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block mb-1">
                  Total Focus Time ({timeRange === 'today' ? 'Today' : 'This Week'})
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-on-surface font-mono">
                    {timeRange === 'today' ? `${hoursToday}h ${minutesToday}m` : '22h 42m'}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +18% vs last week
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-outline">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: theme.hex }} />
                  Current Focus
                </div>
                <div className="flex items-center gap-1.5 text-xs text-outline">
                  <span className="w-2.5 h-2.5 rounded-sm bg-surface-container-high" />
                  Past Sessions
                </div>
              </div>
            </div>

            {/* Interactive Bar Chart */}
            <div className="flex items-end justify-between h-52 gap-3 pt-6 px-2 border-b border-surface-variant/30 pb-3">
              {weekData.map((d, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1 h-full justify-end group relative">
                  {/* Floating tooltip */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none bg-surface-container-highest px-2.5 py-1 rounded-lg text-[11px] font-semibold text-on-surface shadow-xl whitespace-nowrap z-20 border border-surface-variant">
                    {d.hours} • {d.sessions} sessions
                  </div>

                  <div className="w-full max-w-[42px] bg-surface-container/50 rounded-t-xl overflow-hidden flex items-end h-40">
                    <div
                      className={clsx(
                        'w-full rounded-t-xl transition-all duration-300 group-hover:scale-105 shadow-sm min-h-[12px]',
                        d.active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                      )}
                      style={{
                        height: `${d.height}%`,
                        backgroundColor: d.active ? theme.hex : theme.hex + '50',
                      }}
                    />
                  </div>
                  <span
                    className={clsx(
                      'text-xs font-semibold transition-colors',
                      d.active ? 'text-primary font-bold' : 'text-outline group-hover:text-on-surface'
                    )}
                    style={d.active ? { color: theme.hex } : {}}
                  >
                    {d.day}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 text-xs text-outline">
              <span>Daily Target: 4h 00m</span>
              <span className="font-semibold text-on-surface">Goal Met: 4 of 7 days</span>
            </div>
          </div>

          {/* Quick Metrics & Streak Card (Col 1) */}
          <div className="flex flex-col gap-4">
            {/* Streak & Consistency */}
            <div className="border border-surface-variant/40 rounded-3xl bg-surface-container-low/60 p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-on-surface">Focus Streak</span>
                </div>
                <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                  🔥 14 Days
                </span>
              </div>
              <p className="text-xs text-outline leading-relaxed">
                You have maintained active daily focus sessions without missing a day for two weeks.
              </p>
            </div>

            {/* 2x2 Metric Badges */}
            <div className="grid grid-cols-2 gap-3 flex-1">
              <div className="border border-surface-variant/40 rounded-2xl bg-surface-container-low/60 p-4 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] font-semibold text-outline uppercase tracking-wider">
                  Sessions Done
                </span>
                <div className="my-2">
                  <span className="text-2xl font-bold text-on-surface font-mono">48</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-medium">96% completion</span>
              </div>

              <div className="border border-surface-variant/40 rounded-2xl bg-surface-container-low/60 p-4 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] font-semibold text-outline uppercase tracking-wider">
                  Tasks Finished
                </span>
                <div className="my-2">
                  <span className="text-2xl font-bold text-on-surface font-mono">31</span>
                </div>
                <span className="text-[10px] text-primary font-medium" style={{ color: theme.hex }}>
                  +9 this week
                </span>
              </div>

              <div className="border border-surface-variant/40 rounded-2xl bg-surface-container-low/60 p-4 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] font-semibold text-outline uppercase tracking-wider">
                  Avg Session
                </span>
                <div className="my-2">
                  <span className="text-2xl font-bold text-on-surface font-mono">28m</span>
                </div>
                <span className="text-[10px] text-outline">Ideal flow length</span>
              </div>

              <div className="border border-surface-variant/40 rounded-2xl bg-surface-container-low/60 p-4 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] font-semibold text-outline uppercase tracking-wider">
                  Peak Hour
                </span>
                <div className="my-2">
                  <span className="text-2xl font-bold text-on-surface font-mono">10 AM</span>
                </div>
                <span className="text-[10px] text-outline">Morning deep flow</span>
              </div>
            </div>
          </div>

          {/* Project Distribution Breakdown (Col Span 2) */}
          <div className="lg:col-span-2 border border-surface-variant/40 rounded-3xl bg-surface-container-low/60 p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" style={{ color: theme.hex }} />
                <h3 className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                  Project Focus Distribution
                </h3>
              </div>
              <span className="text-xs text-outline font-mono">4 active projects</span>
            </div>

            {/* Distribution Stacked Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-surface-container mb-5 shadow-inner">
              {projectDistribution.map((p, idx) => (
                <div
                  key={idx}
                  className="h-full transition-all hover:opacity-90"
                  style={{ width: `${p.percent}%`, backgroundColor: p.color }}
                  title={`${p.name}: ${p.percent}% (${p.time})`}
                />
              ))}
            </div>

            {/* List items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projectDistribution.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-surface-container-lowest/60 border border-surface-variant/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-xs font-medium text-on-surface truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                    <span className="text-on-surface font-semibold">{p.time}</span>
                    <span className="text-outline text-[10px]">({p.percent}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 28-day Activity Heatmap (Col 1) */}
          <div className="border border-surface-variant/40 rounded-3xl bg-surface-container-low/60 p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: theme.hex }} />
                <span className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                  Consistency Map
                </span>
              </div>
              <span className="text-[10px] text-outline font-mono">Last 28 Days</span>
            </div>

            <div className="grid grid-cols-7 gap-2 my-auto py-2">
              {heatmapWeeks.flatMap((week, wIdx) =>
                week.map((item, dIdx) => (
                  <div
                    key={`${wIdx}-${dIdx}`}
                    className="w-full aspect-square rounded-lg transition-transform hover:scale-125 cursor-pointer shadow-sm"
                    style={{
                      backgroundColor:
                        item.level === 0
                          ? 'var(--surface-container)'
                          : item.level === 1
                          ? theme.hex + '35'
                          : item.level === 2
                          ? theme.hex + '70'
                          : item.level === 3
                          ? theme.hex + 'AA'
                          : theme.hex,
                    }}
                    title={`Day ${wIdx * 7 + dIdx + 1}: ${item.level * 1.5}h focused`}
                  />
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-3 text-[10px] text-outline">
              <span>Less</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((lvl) => (
                  <span
                    key={lvl}
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{
                      backgroundColor:
                        lvl === 0
                          ? 'var(--surface-container)'
                          : lvl === 1
                          ? theme.hex + '35'
                          : lvl === 2
                          ? theme.hex + '70'
                          : lvl === 3
                          ? theme.hex + 'AA'
                          : theme.hex,
                    }}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
