import { prisma } from '@/lib/db/prisma';
import { StatDayData, ProjectStat } from '@/types';

export function getLocalDateString(date: Date, timeZone?: string): string {
  try {
    if (timeZone) {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    }
  } catch {}
  return date.toISOString().slice(0, 10);
}

export function getLocalHour(date: Date, timeZone?: string): number {
  try {
    if (timeZone) {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        hour12: false,
      }).formatToParts(date);
      const hourPart = parts.find((p) => p.type === 'hour');
      if (hourPart) {
        const val = parseInt(hourPart.value, 10);
        return val === 24 ? 0 : val;
      }
    }
  } catch {}
  return date.getHours();
}

export async function getUserWeeklyStats(userId: string, timeZone?: string): Promise<StatDayData[]> {
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Construct exactly the last 7 calendar days ending today in user local chronological order
  const days: {
    dateStr: string;
    day: string;
    focusMinutes: number;
    stopwatchMinutes: number;
    sessions: number;
    tasksCompleted: number;
  }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = getLocalDateString(d, timeZone);
    let day = dayNames[d.getDay()];
    try {
      if (timeZone) {
        day = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(d);
      }
    } catch {}

    days.push({
      dateStr,
      day,
      focusMinutes: 0,
      stopwatchMinutes: 0,
      sessions: 0,
      tasksCompleted: 0,
    });
  }

  const daysByDate = new Map(days.map((d) => [d.dateStr, d]));

  // Fetch actual FocusSessions within range (last 9 days buffer to safely capture timezone deltas)
  const startOfRange = new Date();
  startOfRange.setDate(now.getDate() - 8);

  const [sessions, completedTasks] = await Promise.all([
    prisma.focusSession.findMany({
      where: {
        userId,
        createdAt: { gte: startOfRange },
      },
    }),
    prisma.task.findMany({
      where: {
        userId,
        completed: true,
        completedAt: { gte: startOfRange },
      },
    }),
  ]);

  for (const s of sessions) {
    const dateStr = getLocalDateString(s.createdAt, timeZone);
    const entry = daysByDate.get(dateStr);
    if (entry) {
      const minutes = Math.round(Number(s.elapsedDurationMs) / (60 * 1000));
      if (s.type === 'stopwatch') {
        entry.stopwatchMinutes += minutes;
      } else {
        entry.focusMinutes += minutes;
        entry.sessions += 1;
      }
    }
  }

  for (const t of completedTasks) {
    if (t.completedAt) {
      const dateStr = getLocalDateString(t.completedAt, timeZone);
      const entry = daysByDate.get(dateStr);
      if (entry) {
        entry.tasksCompleted += 1;
      }
    }
  }

  return days.map(({ day, focusMinutes, stopwatchMinutes, sessions, tasksCompleted, dateStr }) => ({
    day,
    focusMinutes,
    stopwatchMinutes,
    sessions,
    tasksCompleted,
    date: dateStr,
  }));
}

export async function getUserProjectStats(
  userId: string,
  timeRange: 'today' | 'week' | 'month' | 'all' = 'week',
  timeZone?: string
): Promise<ProjectStat[]> {
  const now = new Date();
  let startDate: Date | undefined;

  if (timeRange === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  } else if (timeRange === 'week') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  } else if (timeRange === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }

  const [tasks, sessions] = await Promise.all([
    prisma.task.findMany({
      where: { userId },
      select: { id: true, project: true },
    }),
    prisma.focusSession.findMany({
      where: {
        userId,
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      },
      select: { taskId: true, elapsedDurationMs: true, createdAt: true },
    }),
  ]);

  if (sessions.length === 0) {
    return [];
  }

  const todayKey = getLocalDateString(now, timeZone);

  const taskProjectMap = new Map<string, string>();
  for (const t of tasks) {
    if (t.project) {
      taskProjectMap.set(t.id, t.project);
    }
  }

  const projectMap = new Map<string, number>();
  for (const s of sessions) {
    if (timeRange === 'today') {
      const sDateStr = getLocalDateString(s.createdAt, timeZone);
      if (sDateStr !== todayKey) continue;
    }

    let projName = 'General Focus';
    if (s.taskId && taskProjectMap.has(s.taskId)) {
      projName = taskProjectMap.get(s.taskId)!;
    }
    const mins = Math.round(Number(s.elapsedDurationMs) / (60 * 1000));
    projectMap.set(projName, (projectMap.get(projName) || 0) + mins);
  }

  const colors = [
    '#6366f1',
    '#7209B7',
    '#F77F00',
    '#2A9D8F',
    '#0077B6',
    '#E63946',
    '#10B981',
    '#EC4899',
  ];
  let colorIndex = 0;

  return Array.from(projectMap.entries())
    .filter(([_, minutes]) => minutes > 0)
    .map(([name, minutes]) => ({
      name,
      minutes,
      color: colors[colorIndex++ % colors.length],
    }));
}

export interface DayActivityData {
  dayNum: number;
  hours: number;
  sessions: number;
  level: number; // 0 to 4
}

export async function getUserMonthlyStats(
  userId: string,
  year: number,
  month: number, // 0-indexed (0 = Jan)
  timeZone?: string
): Promise<DayActivityData[]> {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Buffer range around month for timezone safe boundaries
  const rangeStart = new Date(Date.UTC(year, month - 1, 24));
  const rangeEnd = new Date(Date.UTC(year, month + 1, 7));

  const sessions = await prisma.focusSession.findMany({
    where: {
      userId,
      createdAt: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    },
  });

  const dayMap = new Map<number, { minutes: number; sessions: number }>();
  for (let d = 1; d <= daysInMonth; d++) {
    dayMap.set(d, { minutes: 0, sessions: 0 });
  }

  for (const s of sessions) {
    const localDateStr = getLocalDateString(s.createdAt, timeZone);
    const [sYear, sMonth, sDay] = localDateStr.split('-').map(Number);
    if (sYear === year && sMonth === month + 1) {
      const entry = dayMap.get(sDay);
      if (entry) {
        const mins = Math.round(Number(s.elapsedDurationMs) / (60 * 1000));
        entry.minutes += mins;
        entry.sessions += 1;
      }
    }
  }

  return Array.from(dayMap.entries()).map(([dayNum, data]) => {
    const hours = Number((data.minutes / 60).toFixed(1));
    let level = 0;
    if (hours > 4) level = 4;
    else if (hours > 2.5) level = 3;
    else if (hours > 1) level = 2;
    else if (hours > 0) level = 1;

    return {
      dayNum,
      hours,
      sessions: data.sessions,
      level,
    };
  });
}

export interface SummaryMetrics {
  totalSessions: number;
  totalCompletedTasks: number;
  avgFocusMinutes: number;
  peakFlowHour: string;
  streakDays: number;
  consistencyRatePercent: number;
}

export async function getUserSummaryMetrics(
  userId: string,
  timeRange: 'today' | 'week' | 'month' | 'all' = 'week',
  timeZone?: string
): Promise<SummaryMetrics> {
  const now = new Date();
  const todayKey = getLocalDateString(now, timeZone);

  const [allSessions, completedTasksCount] = await Promise.all([
    prisma.focusSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.task.count({
      where: { userId, completed: true },
    }),
  ]);

  // Filter sessions according to timeRange
  let filteredSessions = allSessions;
  if (timeRange === 'today') {
    filteredSessions = allSessions.filter((s) => getLocalDateString(s.createdAt, timeZone) === todayKey);
  } else if (timeRange === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    filteredSessions = allSessions.filter((s) => s.createdAt >= weekAgo);
  } else if (timeRange === 'month') {
    const monthAgo = new Date();
    monthAgo.setDate(now.getDate() - 30);
    filteredSessions = allSessions.filter((s) => s.createdAt >= monthAgo);
  }

  const totalSessions = filteredSessions.length;
  const totalDurationMs = filteredSessions.reduce((acc, s) => acc + Number(s.elapsedDurationMs), 0);
  const totalMinutes = Math.round(totalDurationMs / (60 * 1000));
  const avgFocusMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

  // Peak flow hour calculation
  let peakFlowHour = '--';
  if (filteredSessions.length > 0) {
    const hourCounts = new Map<number, number>();
    for (const s of filteredSessions) {
      const hr = getLocalHour(s.createdAt, timeZone);
      hourCounts.set(hr, (hourCounts.get(hr) || 0) + 1);
    }

    let peakHour = 0;
    let maxHourCount = 0;
    hourCounts.forEach((count, hr) => {
      if (count > maxHourCount) {
        maxHourCount = count;
        peakHour = hr;
      }
    });

    const peakPeriod = peakHour >= 12 ? 'PM' : 'AM';
    const peakDisplay = peakHour % 12 === 0 ? 12 : peakHour % 12;
    peakFlowHour = `${peakDisplay} ${peakPeriod}`;
  }

  // Streak calculation (consecutive local calendar days of focus)
  const activeDates = new Set(
    allSessions.map((s) => getLocalDateString(s.createdAt, timeZone))
  );

  let streak = 0;
  if (activeDates.size > 0) {
    const checkDate = new Date();
    const todayLocalKey = getLocalDateString(checkDate, timeZone);

    if (activeDates.has(todayLocalKey)) {
      streak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayKey = getLocalDateString(checkDate, timeZone);
      if (activeDates.has(yesterdayKey)) {
        streak = 1;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    if (streak > 0) {
      while (true) {
        const prevKey = getLocalDateString(checkDate, timeZone);
        if (activeDates.has(prevKey)) {
          streak += 1;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  const daysInPastMonth = 30;
  let daysActivePastMonth = 0;
  const rangeCheck = new Date();
  for (let i = 0; i < daysInPastMonth; i++) {
    const key = getLocalDateString(rangeCheck, timeZone);
    if (activeDates.has(key)) {
      daysActivePastMonth++;
    }
    rangeCheck.setDate(rangeCheck.getDate() - 1);
  }
  const consistencyRatePercent = Math.min(100, Math.round((daysActivePastMonth / daysInPastMonth) * 100));

  return {
    totalSessions,
    totalCompletedTasks: completedTasksCount,
    avgFocusMinutes,
    peakFlowHour,
    streakDays: streak,
    consistencyRatePercent,
  };
}
