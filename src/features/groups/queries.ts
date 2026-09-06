import { prisma } from '@/lib/db/prisma';
import { Group, GroupMember, Task } from '@/types';

export async function getUserGroups(userId: string): Promise<Group[]> {
  const memberships = await prisma.groupMembership.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          memberships: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  handle: true,
                  avatar: true,
                  themeColor: true,
                },
              },
            },
          },
          tasks: {
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
          },
        },
      },
    },
  });

  return memberships.map((m) => {
    const g = m.group;
    const members: GroupMember[] = g.memberships.map((mem) => ({
      id: mem.user.id,
      name: mem.user.name,
      handle: mem.user.handle,
      avatar: mem.user.avatar,
      color: mem.user.themeColor || '#6366f1',
      status: mem.user.id === userId ? 'focusing' : 'offline',
      timerTime: '25:00',
      currentTask: mem.user.id === userId ? 'Deep focus work' : 'Offline',
      isUser: mem.user.id === userId,
      isConnected: mem.user.id === userId,
    }));

    const tasks: Task[] = g.tasks.map((t) => ({
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

    // Extract unique project/categories as customLists
    const customLists = Array.from(new Set(tasks.map((t) => t.project).filter(Boolean)));

    return {
      id: g.id,
      name: g.name,
      code: g.code,
      description: g.description,
      category: g.category,
      members,
      tasks,
      customLists: customLists.length > 0 ? customLists : ['General', 'Sprint Tasks'],
      activeCount: members.length,
    };
  });
}
