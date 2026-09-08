import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

function getSanitizedDbHost(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return 'DATABASE_URL_NOT_CONFIGURED';
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}`;
  } catch {
    return 'INVALID_DATABASE_URL_FORMAT';
  }
}

export async function GET() {
  const dbHost = getSanitizedDbHost();
  let dbStatus = 'connected';
  let latencyMs = 0;
  let errorMessage: string | undefined;

  const startTime = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    latencyMs = Math.round(performance.now() - startTime);
    console.log(`[HealthCheck] DB connected successfully to ${dbHost} (${latencyMs}ms)`);
  } catch (error: any) {
    latencyMs = Math.round(performance.now() - startTime);
    dbStatus = 'disconnected';
    errorMessage = error?.message || String(error);
    console.error(`[HealthCheck] DB connection FAILED to ${dbHost} after ${latencyMs}ms:`, errorMessage);
  }

  const isHealthy = dbStatus === 'connected';

  return NextResponse.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      services: {
        database: {
          status: dbStatus,
          latencyMs: isHealthy ? latencyMs : undefined,
          host: dbHost,
          error: errorMessage,
        },
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
