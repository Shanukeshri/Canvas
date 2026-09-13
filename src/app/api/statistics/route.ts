import { NextRequest, NextResponse } from 'next/server';
import {
  getUserWeeklyStats,
  getUserProjectStats,
  getUserMonthlyStats,
  getUserSummaryMetrics,
} from '@/features/statistics/queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'user-default';
    const now = new Date();
    const year = Number(searchParams.get('year')) || now.getFullYear();
    const month = searchParams.has('month') ? Number(searchParams.get('month')) : now.getMonth();
    const timeZone = searchParams.get('tz') || searchParams.get('timezone') || undefined;
    const timeRange = (searchParams.get('timeRange') || 'week') as 'today' | 'week' | 'month' | 'all';

    const [weeklyStats, projectStats, monthlyStats, metrics] = await Promise.all([
      getUserWeeklyStats(userId, timeZone),
      getUserProjectStats(userId, timeRange, timeZone),
      getUserMonthlyStats(userId, year, month, timeZone),
      getUserSummaryMetrics(userId, timeRange, timeZone),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        weeklyStats,
        projectStats,
        monthlyStats,
        metrics,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

