import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { userId, payload } = data;

    if (!userId || !payload) {
      return NextResponse.json({ success: false, error: 'Missing userId or payload' }, { status: 400 });
    }

    if (payload.id) {
      await prisma.focusSession.upsert({
        where: { id: payload.id },
        update: {
          taskId: payload.taskId || null,
          groupId: payload.groupId || null,
          endedAtMs: BigInt(payload.endedAtMs),
          elapsedDurationMs: BigInt(payload.elapsedDurationMs),
          status: payload.status,
        },
        create: {
          id: payload.id,
          userId,
          type: payload.type,
          taskId: payload.taskId || null,
          groupId: payload.groupId || null,
          startedAtMs: BigInt(payload.startedAtMs),
          endedAtMs: BigInt(payload.endedAtMs),
          elapsedDurationMs: BigInt(payload.elapsedDurationMs),
          status: payload.status,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Session checkpoint error:', err);
    return NextResponse.json({ success: false, error: 'Failed to save checkpoint' }, { status: 500 });
  }
}
