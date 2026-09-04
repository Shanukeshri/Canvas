import { prisma } from '@/lib/db/prisma';
import { Task } from '@/types';

export async function getTasks(userId: string, groupId?: string): Promise<Task[]> {
  const dbTasks = await prisma.task.findMany({
    where: groupId ? { groupId } : { userId, groupId: null },
    orderBy: { order: 'asc' },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          handle: true,
          avatar: true,
        },
      },
    },
  });

  return dbTasks.map((t) => ({
    id: t.id,
    title: t.title,
    project: t.project,
    priority: t.priority as 'low' | 'medium' | 'high',
    dueDate: t.dueDate,
    completed: t.completed,
    completedAt: t.completedAt ? t.completedAt.toISOString() : undefined,
    description: t.description,
    assignedTo: t.assignedTo ? t.assignedTo.name : undefined,
  }));
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  const t = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          handle: true,
          avatar: true,
        },
      },
    },
  });

  if (!t) return null;

  return {
    id: t.id,
    title: t.title,
    project: t.project,
    priority: t.priority as 'low' | 'medium' | 'high',
    dueDate: t.dueDate,
    completed: t.completed,
    completedAt: t.completedAt ? t.completedAt.toISOString() : undefined,
    description: t.description,
    assignedTo: t.assignedTo ? t.assignedTo.name : undefined,
  };
}
