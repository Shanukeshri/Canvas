import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const group = await prisma.group.findUnique({
      where: { id },
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
        tasks: true,
      },
    });

    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || '';

    const members = group.memberships.map((mem) => ({
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

    const tasks = (group.tasks || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      project: t.project,
      priority: (t.priority || 'medium') as 'low' | 'medium' | 'high',
      dueDate: t.dueDate,
      completed: t.completed,
      completedAt: t.completedAt ? t.completedAt.toISOString() : undefined,
      description: t.description,
      assignedTo: t.assignedTo ? t.assignedTo.name : undefined,
    }));

    const customLists = Array.from(new Set(tasks.map((t: any) => t.project).filter(Boolean)));

    const formattedGroup = {
      id: group.id,
      name: group.name,
      code: group.code,
      description: group.description,
      category: group.category,
      members,
      tasks,
      customLists: customLists.length > 0 ? customLists : ['General', 'Sprint Tasks'],
      activeCount: members.length,
    };

    return NextResponse.json({ success: true, data: formattedGroup });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch group' },
      { status: 500 }
    );
  }
}
