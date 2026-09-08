'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { FocusSessionSchema, TimerPresetSchema } from '@/lib/validation/schemas';
import { TimerEngineState } from './timer-engine';

export async function recordFocusSessionAction(userId: string, data: unknown) {
  const parsed = FocusSessionSchema.parse(data);

  // Ensure user exists in database to avoid foreign key constraint violations
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (parsed.id) {
    const session = await prisma.focusSession.upsert({
      where: { id: parsed.id },
      update: {
        taskId: parsed.taskId || null,
        groupId: parsed.groupId || null,
        endedAtMs: BigInt(parsed.endedAtMs),
        elapsedDurationMs: BigInt(parsed.elapsedDurationMs),
        status: parsed.status,
      },
      create: {
        id: parsed.id,
        userId,
        type: parsed.type,
        taskId: parsed.taskId || null,
        groupId: parsed.groupId || null,
        startedAtMs: BigInt(parsed.startedAtMs),
        endedAtMs: BigInt(parsed.endedAtMs),
        elapsedDurationMs: BigInt(parsed.elapsedDurationMs),
        status: parsed.status,
      },
    });

    return { success: true, sessionId: session.id };
  }

  const session = await prisma.focusSession.create({
    data: {
      userId,
      type: parsed.type,
      taskId: parsed.taskId || null,
      groupId: parsed.groupId || null,
      startedAtMs: BigInt(parsed.startedAtMs),
      endedAtMs: BigInt(parsed.endedAtMs),
      elapsedDurationMs: BigInt(parsed.elapsedDurationMs),
      status: parsed.status,
    },
  });

  return { success: true, sessionId: session.id };
}

export async function saveTimerStateCheckpointAction(userId: string, state: TimerEngineState) {
  await prisma.timerState.upsert({
    where: { userId },
    update: {
      mode: state.mode,
      status: state.status,
      phase: state.phase,
      durationMs: BigInt(state.durationMs),
      startedAtMs: 'startedAtMs' in state ? BigInt(state.startedAtMs) : null,
      pausedAtMs: 'pausedAtMs' in state ? BigInt(state.pausedAtMs) : null,
      elapsedDurationMs: BigInt(state.elapsedDurationMs),
    },
    create: {
      userId,
      mode: state.mode,
      status: state.status,
      phase: state.phase,
      durationMs: BigInt(state.durationMs),
      startedAtMs: 'startedAtMs' in state ? BigInt(state.startedAtMs) : null,
      pausedAtMs: 'pausedAtMs' in state ? BigInt(state.pausedAtMs) : null,
      elapsedDurationMs: BigInt(state.elapsedDurationMs),
    },
  });

  return { success: true };
}

export async function saveTimerPresetAction(userId: string, data: unknown) {
  const parsed = TimerPresetSchema.parse(data);

  const preset = await prisma.timerPreset.create({
    data: {
      userId,
      name: parsed.name,
      focusMinutes: parsed.focusMinutes,
      shortBreakMinutes: parsed.shortBreakMinutes,
      longBreakMinutes: parsed.longBreakMinutes,
      targetSessions: parsed.targetSessions,
      autoStartBreaks: parsed.autoStartBreaks,
      soundOnComplete: parsed.soundOnComplete,
    },
  });

  return { success: true, preset };
}
