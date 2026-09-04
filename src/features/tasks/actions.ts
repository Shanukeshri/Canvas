'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { CreateTaskSchema, UpdateTaskSchema } from '@/lib/validation/schemas';
import { assertTaskDeletionAllowed, assertGroupMembership } from '@/lib/auth/authorization';

export async function createTaskAction(userId: string, data: unknown) {
  const parsed = CreateTaskSchema.parse(data);

  if (parsed.groupId) {
    await assertGroupMembership(parsed.groupId, userId);
  }

  // Determine highest order index
  const lastTask = await prisma.task.findFirst({
    where: parsed.groupId ? { groupId: parsed.groupId } : { userId, groupId: null },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  const nextOrder = (lastTask?.order ?? 0) + 1;

  const task = await prisma.task.create({
    data: {
      title: parsed.title,
      project: parsed.project || 'General Focus',
      priority: parsed.priority || 'medium',
      dueDate: parsed.dueDate || 'Today',
      description: parsed.description || '',
      completed: parsed.completed || false,
      userId,
      groupId: parsed.groupId || null,
      order: nextOrder,
    },
  });

  revalidatePath('/app');
  return { success: true, task };
}

export async function updateTaskAction(userId: string, data: unknown) {
  const parsed = UpdateTaskSchema.parse(data);

  const existing = await prisma.task.findUnique({
    where: { id: parsed.id },
  });

  if (!existing) {
    throw new Error('Task not found');
  }

  if (existing.groupId) {
    await assertGroupMembership(existing.groupId, userId);
  }

  const updated = await prisma.task.update({
    where: { id: parsed.id },
    data: {
      title: parsed.title !== undefined ? parsed.title : existing.title,
      project: parsed.project !== undefined ? parsed.project : existing.project,
      priority: parsed.priority !== undefined ? parsed.priority : existing.priority,
      dueDate: parsed.dueDate !== undefined ? parsed.dueDate : existing.dueDate,
      description: parsed.description !== undefined ? parsed.description : existing.description,
      completed: parsed.completed !== undefined ? parsed.completed : existing.completed,
      completedAt:
        parsed.completed === true
          ? new Date()
          : parsed.completed === false
          ? null
          : existing.completedAt,
    },
  });

  revalidatePath('/app');
  return { success: true, task: updated };
}

export async function toggleTaskCompleteAction(userId: string, taskId: string) {
  const existing = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!existing) {
    throw new Error('Task not found');
  }

  if (existing.groupId) {
    await assertGroupMembership(existing.groupId, userId);
  }

  const newCompleted = !existing.completed;
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      completed: newCompleted,
      completedAt: newCompleted ? new Date() : null,
    },
  });

  revalidatePath('/app');
  return { success: true, task: updated };
}

export async function deleteTaskAction(userId: string, taskId: string) {
  // Enforce authoritative rule: only task owner can delete
  await assertTaskDeletionAllowed(taskId, userId);

  await prisma.task.delete({
    where: { id: taskId },
  });

  revalidatePath('/app');
  return { success: true };
}

export async function reorderTasksAction(userId: string, orderedTaskIds: string[], groupId?: string) {
  if (groupId) {
    await assertGroupMembership(groupId, userId);
  }

  await prisma.$transaction(
    orderedTaskIds.map((id, index) =>
      prisma.task.update({
        where: { id },
        data: { order: index + 1 },
      })
    )
  );

  revalidatePath('/app');
  return { success: true };
}
