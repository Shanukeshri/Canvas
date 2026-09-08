import { prisma } from '@/lib/db/prisma';
import { StatDayData, ProjectStat } from '@/types';

export async function getUserWeeklyStats(userId: string): Promise<StatDayData[]> {
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Construct exactly the last 7 calendar days ending today in local chronological order
  const days: {
    dateStr: string;
    day: string;
    focusMinutes: number;
    stopwatchMinutes: number;
    sessions: number;
    tasksCompleted: number;
  }[] = [];

  const startOfRange = new Date();
  startOfRange.setDate(now.getDate() - 6);
  startOfRange.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const day = dayNames[d.getDay()];
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

  // Fetch actual FocusSessions within range
  const sessions = await prisma.focusSession.findMany({
    where: {
      userId,
      createdAt: { gte: startOfRange },
    },
  });

  // Fetch actual completed tasks in range
  const completedTasks = await prisma.task.findMany({
    where: {
      userId,
      completed: true,
      completedAt: { gte: startOfRange },
    },
  });

  for (const s of sessions) {
    const dateStr = s.createdAt.toISOString().slice(0, 10);
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
      const dateStr = t.completedAt.toISOString().slice(0, 10);
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

export async function getUserProjectStats(userId: string): Promise<ProjectStat[]> {
  const [tasks, sessions] = await Promise.all([
    prisma.task.findMany({
      where: { userId },
      select: { id: true, project: true },
    }),
    prisma.focusSession.findMany({
      where: { userId },
      select: { taskId: true, elapsedDurationMs: true },
    }),
  ]);

  if (sessions.length === 0) {
    return [];
  }

  const taskProjectMap = new Map<string, string>();
  for (const t of tasks) {
    if (t.project) {
      taskProjectMap.set(t.id, t.project);
    }
  }

  const projectMap = new Map<string, number>();
  for (const s of sessions) {
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
  month: number // 0-indexed (0 = Jan)
): Promise<DayActivityData[]> {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);
  const daysInMonth = endDate.getDate();

  const sessions = await prisma.focusSession.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const dayMap = new Map<number, { minutes: number; sessions: number }>();
  for (let d = 1; d <= daysInMonth; d++) {
    dayMap.set(d, { minutes: 0, sessions: 0 });
  }

  for (const s of sessions) {
    const day = s.createdAt.getDate();
    const entry = dayMap.get(day);
    if (entry) {
      const mins = Math.round(Number(s.elapsedDurationMs) / (60 * 1000));
      entry.minutes += mins;
      entry.sessions += 1;
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

export async function getUserSummaryMetrics(userId: string): Promise<SummaryMetrics> {
  const [sessions, completedTasks] = await Promise.all([
    prisma.focusSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.task.count({
      where: { userId, completed: true },
    }),
  ]);

  const totalSessions = sessions.length;
  const totalDurationMs = sessions.reduce((acc, s) => acc + Number(s.elapsedDurationMs), 0);
  const totalMinutes = Math.round(totalDurationMs / (60 * 1000));
  const avgFocusMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

  // Peak flow hour calculation (only when real sessions exist)
  let peakFlowHour = '--';
  if (totalSessions > 0) {
    const hourCounts = new Map<number, number>();
    for (const s of sessions) {
      const hr = s.createdAt.getHours();
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

  // Streak calculation (actual consecutive calendar days of focus)
  const activeDates = new Set(
    sessions.map((s) => s.createdAt.toISOString().slice(0, 10))
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
      const yesterdayKey = checkDate.toISOString().slice(0, 10);
      if (activeDates.has(yesterdayKey)) {
        streak = 1;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    if (streak > 0) {
      while (true) {
        const prevKey = checkDate.toISOString().slice(0, 10);
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
    const key = rangeCheck.toISOString().slice(0, 10);
    if (activeDates.has(key)) {
      daysActivePastMonth++;
    }
    rangeCheck.setDate(rangeCheck.getDate() - 1);
  }
  const consistencyRatePercent = Math.min(100, Math.round((daysActivePastMonth / daysInPastMonth) * 100));

  return {
    totalSessions,
    totalCompletedTasks: completedTasks,
    avgFocusMinutes,
    peakFlowHour,
    streakDays: streak,
    consistencyRatePercent,
  };
}
