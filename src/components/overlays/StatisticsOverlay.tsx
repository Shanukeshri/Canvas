'use client';

import React, { useState, useEffect } from 'react';

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

function calculateClientStats(sessions: any[], year: number, month: number) {
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // 1. Last 7 Days
  const weeklyDays: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const day = dayNames[d.getDay()];
    weeklyDays.push({
      dateStr,
      day,
      focusMinutes: 0,
      stopwatchMinutes: 0,
      sessions: 0,
      tasksCompleted: 0,
    });
  }

  const weeklyMap = new Map(weeklyDays.map((d) => [d.dateStr, d]));

  for (const s of sessions) {
    const sDate = new Date(s.createdAt || s.endedAtMs || s.startedAtMs);
    const dateStr = sDate.toISOString().slice(0, 10);
    const entry = weeklyMap.get(dateStr);
    if (entry) {
      const minutes = Math.round(Number(s.elapsedDurationMs || 0) / (60 * 1000));
      if (s.type === 'stopwatch') {
        entry.stopwatchMinutes += minutes;
      } else {
        entry.focusMinutes += minutes;
        entry.sessions += 1;
      }
    }
  }

  // 2. Monthly Stats
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayMap = new Map<number, { minutes: number; sessions: number }>();
  for (let d = 1; d <= daysInMonth; d++) {
    dayMap.set(d, { minutes: 0, sessions: 0 });
  }

  for (const s of sessions) {
    const sDate = new Date(s.createdAt || s.endedAtMs || s.startedAtMs);
    if (sDate.getFullYear() === year && sDate.getMonth() === month) {
      const day = sDate.getDate();
      const entry = dayMap.get(day);
      if (entry) {
        const mins = Math.round(Number(s.elapsedDurationMs || 0) / (60 * 1000));
        entry.minutes += mins;
        entry.sessions += 1;
      }
    }
  }

  const monthlyStats = Array.from(dayMap.entries()).map(([dayNum, data]) => {
    const hours = Number((data.minutes / 60).toFixed(1));
    let level = 0;
    if (hours > 4) level = 4;
    else if (hours > 2.5) level = 3;
    else if (hours > 1) level = 2;
    else if (hours > 0) level = 1;

    return { dayNum, hours, sessions: data.sessions, level };
  });

  // 3. Project Stats
  const projectMap = new Map<string, number>();
  for (const s of sessions) {
    const projName = s.projectName || 'General Focus';
    const mins = Math.round(Number(s.elapsedDurationMs || 0) / (60 * 1000));
    if (mins > 0) {
      projectMap.set(projName, (projectMap.get(projName) || 0) + mins);
    }
  }
  const colors = ['#6366f1', '#7209B7', '#F77F00', '#2A9D8F', '#0077B6', '#E63946'];
  let cIdx = 0;
  const projectStats = Array.from(projectMap.entries()).map(([name, minutes]) => ({
    name,
    minutes,
    color: colors[cIdx++ % colors.length],
  }));

  // 4. Summary Metrics
  const totalSessions = sessions.length;
  const totalDurationMs = sessions.reduce((acc, s) => acc + Number(s.elapsedDurationMs || 0), 0);
  const totalMinutes = Math.round(totalDurationMs / (60 * 1000));
  const avgFocusMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

  let peakFlowHour = '--';
  if (totalSessions > 0) {
    const hourCounts = new Map<number, number>();
    for (const s of sessions) {
      const hr = new Date(s.createdAt || s.endedAtMs || s.startedAtMs).getHours();
      hourCounts.set(hr, (hourCounts.get(hr) || 0) + 1);
    }
    let maxCount = 0;
    let maxHr = 0;
    hourCounts.forEach((cnt, hr) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        maxHr = hr;
      }
    });
    const period = maxHr >= 12 ? 'PM' : 'AM';
    const disp = maxHr % 12 === 0 ? 12 : maxHr % 12;
    peakFlowHour = `${disp} ${period}`;
  }

  const activeDates = new Set(
    sessions.map((s) => new Date(s.createdAt || s.endedAtMs || s.startedAtMs).toISOString().slice(0, 10))
  );
  let streak = 0;
  if (activeDates.size > 0) {
    const checkDate = new Date();
    const todayKey = checkDate.toISOString().slice(0, 10);
    if (activeDates.has(todayKey)) {
      streak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
      if (activeDates.has(checkDate.toISOString().slice(0, 10))) {
        streak = 1;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }
    if (streak > 0) {
      while (true) {
        const k = checkDate.toISOString().slice(0, 10);
        if (activeDates.has(k)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  let daysActivePastMonth = 0;
  const rangeCheck = new Date();
  for (let i = 0; i < 30; i++) {
    if (activeDates.has(rangeCheck.toISOString().slice(0, 10))) {
      daysActivePastMonth++;
    }
    rangeCheck.setDate(rangeCheck.getDate() - 1);
  }
  const consistencyRatePercent = Math.min(100, Math.round((daysActivePastMonth / 30) * 100));

  return {
    weeklyStats: weeklyDays,
    monthlyStats,
    projectStats,
    metrics: {
      totalSessions,
      totalCompletedTasks: 0,
      avgFocusMinutes,
      peakFlowHour,
      streakDays: streak,
      consistencyRatePercent,
    },
  };
}

export function StatisticsOverlay() {
  const { overlay, closeOverlay, totalFocusMinutesToday, currentUser } = useApp();
  const { theme } = useTheme();

  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<{ dayNum: number; hours: number; sessions: number } | null>(null);

  // Month navigation for Calendar (defaults to current month)
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Real statistics fetched from API or local storage
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [projectStats, setProjectStats] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    totalCompletedTasks: 0,
    avgFocusMinutes: 0,
    peakFlowHour: '--',
    streakDays: 0,
    consistencyRatePercent: 0,
  });

  const loadStatistics = () => {
    const yr = currentDate.getFullYear();
    const mo = currentDate.getMonth();

    if (currentUser?.id) {
      fetch(`/api/statistics?userId=${encodeURIComponent(currentUser.id)}&year=${yr}&month=${mo}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data) {
            if (Array.isArray(res.data.weeklyStats)) setWeeklyStats(res.data.weeklyStats);
            if (Array.isArray(res.data.projectStats)) setProjectStats(res.data.projectStats);
            if (Array.isArray(res.data.monthlyStats)) setMonthlyStats(res.data.monthlyStats);
            if (res.data.metrics) setMetrics(res.data.metrics);
          }
        })
        .catch((err) => {
          console.warn('Failed to load server statistics:', err);
        });
    } else {
      try {
        const raw =
          localStorage.getItem('canvas_focus_sessions_v1') ||
          localStorage.getItem('canvas_guest_focus_sessions_v1');
        const localSessions: any[] = raw ? JSON.parse(raw) : [];
        const clientStats = calculateClientStats(localSessions, yr, mo);
        setWeeklyStats(clientStats.weeklyStats);
        setProjectStats(clientStats.projectStats);
        setMonthlyStats(clientStats.monthlyStats);
        setMetrics(clientStats.metrics);
      } catch (e) {
        console.warn('Failed to parse local statistics:', e);
      }
    }
  };

  // Fetch real statistics when overlay opens or month changes, or on background stats update
  useEffect(() => {
    if (overlay !== 'stats') return;
    loadStatistics();

    const handleStatsUpdated = () => {
      loadStatistics();
    };

    window.addEventListener('canvas_stats_updated', handleStatsUpdated);
    return () => window.removeEventListener('canvas_stats_updated', handleStatsUpdated);
  }, [overlay, currentDate, currentUser?.id]);

  if (overlay !== 'stats') return null;

  const hoursToday = Math.floor(totalFocusMinutesToday / 60);
  const minutesToday = totalFocusMinutesToday % 60;

  // Real weekly trend data
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDayName = dayNames[new Date().getDay()];

  const defaultEmptyWeek = (() => {
    const list = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const day = dayNames[d.getDay()];
      list.push({
        day,
        hours: '0h 0m',
        val: 0,
        sessions: 0,
        active: day === todayDayName,
      });
    }
    return list;
  })();

  const trendData =
    weeklyStats.length > 0
      ? weeklyStats.map((d) => {
          const totalMinutes = (d.focusMinutes || 0) + (d.stopwatchMinutes || 0);
          const hours = Math.floor(totalMinutes / 60);
          const mins = totalMinutes % 60;
          const val = Number((totalMinutes / 60).toFixed(2));
          return {
            day: d.day,
            hours: `${hours}h ${mins}m`,
            val,
            sessions: d.sessions || 0,
            active: d.day === todayDayName,
          };
        })
      : defaultEmptyWeek;

  // Real project distribution
  const totalProjectMinutes =
    projectStats.reduce((acc, p) => acc + (p.minutes || 0), 0);

  const projectDistribution =
    projectStats.length > 0 && totalProjectMinutes > 0
      ? projectStats.map((p) => {
          const hours = Math.floor(p.minutes / 60);
          const mins = p.minutes % 60;
          const percent = Math.round((p.minutes / totalProjectMinutes) * 100);
          return {
            name: p.name,
            time: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
            percent: Math.max(percent, 1),
            color: p.color || theme.hex,
          };
        })
      : [];

  // Calendar calculations: 7 columns starting from Monday
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonthName = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = (new Date(currentYear, currentDate.getMonth(), 1).getDay() + 6) % 7;

  // Generate calendar days with real activity hours
  const calendarCells = [];
  // Leading empty padding cells from previous month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push({ isPadding: true, dayNum: 0, level: 0, hours: 0, sessions: 0 });
  }

  // Days of the month
  const monthlyDataMap = new Map<number, { hours: number; sessions: number; level: number }>();
  if (monthlyStats.length > 0) {
    for (const item of monthlyStats) {
      monthlyDataMap.set(item.dayNum, item);
    }
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const realEntry = monthlyDataMap.get(d);
    if (realEntry) {
      calendarCells.push({
        isPadding: false,
        dayNum: d,
        level: realEntry.level,
        hours: realEntry.hours,
        sessions: realEntry.sessions,
      });
    } else {
      // Days with zero recorded sessions
      calendarCells.push({ isPadding: false, dayNum: d, level: 0, hours: 0, sessions: 0 });
    }
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
  const rawMax = Math.max(...trendData.map((d) => d.val), 0);
  const maxVal = Math.max(rawMax, 2.0);

  const points = trendData.map((d, i) => {
    const x = padX + (i * (svgWidth - padX * 2)) / Math.max(1, trendData.length - 1);
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
        className="w-full max-w-5xl xl:max-w-6xl bg-surface-container-lowest/95 backdrop-blur-2xl border border-surface-variant/40 rounded-3xl shadow-2xl p-6 sm:p-8 select-none animate-in zoom-in-95 duration-150 relative flex flex-col gap-5 max-h-[94vh] overflow-y-auto scale-[0.95] origin-center"
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
                <span className="font-mono">{metrics.streakDays}d Streak</span>
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
                const isToday =
                  cell.dayNum === new Date().getDate() &&
                  currentMonthName === monthNames[new Date().getMonth()] &&
                  currentYear === new Date().getFullYear();

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
                  : `${metrics.consistencyRatePercent}% monthly consistency rate`}
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
                  {timeRange === 'today'
                    ? `${hoursToday}h ${minutesToday}m`
                    : `${Math.floor(trendData.reduce((acc, d) => acc + (d.val || 0), 0))}h ${Math.round((trendData.reduce((acc, d) => acc + (d.val || 0), 0) % 1) * 60)}m`}
                </span>
                <span className="text-[10px] font-semibold text-outline px-2 py-0.5 rounded-full font-mono bg-surface-container">
                  last 7 days
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
                <span className="text-2xl font-bold text-on-surface font-mono">{metrics.totalSessions}</span>
              </div>
              <span className="text-[11px] text-outline font-medium font-mono">completed</span>
            </div>

            <div className="border border-surface-variant/35 rounded-2xl bg-surface-container-low/50 p-4 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-outline uppercase tracking-wider">
                  Tasks
                </span>
                <CheckCircle2 className="w-4 h-4 text-outline/70" />
              </div>
              <div className="my-1">
                <span className="text-2xl font-bold text-on-surface font-mono">{metrics.totalCompletedTasks}</span>
              </div>
              <span className="text-[11px] font-medium font-mono" style={{ color: theme.hex }}>
                Completed
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
                <span className="text-2xl font-bold text-on-surface font-mono">{metrics.avgFocusMinutes}m</span>
              </div>
              <span className="text-[11px] text-outline font-mono">per session</span>
            </div>

            <div className="border border-surface-variant/35 rounded-2xl bg-surface-container-low/50 p-4 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-outline uppercase tracking-wider">
                  Peak Flow
                </span>
                <Target className="w-4 h-4 text-outline/70" />
              </div>
              <div className="my-1">
                <span className="text-2xl font-bold text-on-surface font-mono">{metrics.peakFlowHour}</span>
              </div>
              <span className="text-[11px] text-outline font-mono">optimal</span>
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
              <span className="text-[11px] text-outline font-mono">{projectDistribution.length} projects</span>
            </div>

            {projectDistribution.length === 0 ? (
              <div className="py-8 px-4 rounded-xl bg-surface-container-lowest/40 border border-dashed border-surface-variant/30 flex flex-col items-center justify-center text-center my-auto">
                <Layers className="w-6 h-6 text-outline/40 mb-2" />
                <span className="text-xs font-medium text-outline">No project focus logged yet</span>
                <span className="text-[11px] text-outline/60 mt-0.5">Select a task when focusing to categorize your time by project.</span>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
