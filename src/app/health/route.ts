import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  let dbStatus = 'connected';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error('Database health check failed:', error);
    dbStatus = 'disconnected';
  }

  const isHealthy = dbStatus === 'connected';

  return NextResponse.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbStatus,
      },
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
