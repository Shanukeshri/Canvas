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

    const [weeklyStats, projectStats, monthlyStats, metrics] = await Promise.all([
      getUserWeeklyStats(userId),
      getUserProjectStats(userId),
      getUserMonthlyStats(userId, year, month),
      getUserSummaryMetrics(userId),
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

