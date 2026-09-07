import { prisma } from './prisma';

export async function seedDatabase() {
  const existingUser = await prisma.user.findFirst({
    where: { handle: '@alex_s' },
  });

  if (existingUser) {
    return existingUser;
  }

  // 1. Create main user
  const mainUser = await prisma.user.create({
    data: {
      id: 'user-default',
      name: 'Alex Serene',
      email: 'alex.serene@canvasfocus.app',
      handle: '@alex_s',
      avatar: '🦊',
      themeColor: '#6366f1',
    },
  });

  // 2. Create friend users
  const sarah = await prisma.user.create({
    data: {
      id: 'friend-1',
      name: 'Sarah Chen',
      email: 'sarah@canvasfocus.app',
      handle: '@sarahc',
      avatar: '👩🏻‍💻',
      themeColor: '#7209B7',
    },
  });

  const david = await prisma.user.create({
    data: {
      id: 'friend-2',
      name: 'David Kim',
      email: 'david@canvasfocus.app',
      handle: '@davidk',
      avatar: '👨🏻‍🎨',
      themeColor: '#F77F00',
    },
  });

  const elena = await prisma.user.create({
    data: {
      id: 'friend-3',
      name: 'Elena Rostova',
      email: 'elena@canvasfocus.app',
      handle: '@elena_r',
      avatar: '👩🏼‍🔬',
      themeColor: '#2A9D8F',
    },
  });

  const marcus = await prisma.user.create({
    data: {
      id: 'friend-4',
      name: 'Marcus Vance',
      email: 'marcus@canvasfocus.app',
      handle: '@marcus_v',
      avatar: '👨🏽‍💻',
      themeColor: '#0077B6',
    },
  });

  // 3. Create friendships
  await prisma.friendship.createMany({
    data: [
      { userId: mainUser.id, friendId: sarah.id },
      { userId: mainUser.id, friendId: david.id },
      { userId: mainUser.id, friendId: elena.id },
      { userId: mainUser.id, friendId: marcus.id },
    ],
  });

  // 4. Create sample tasks
  await prisma.task.createMany({
    data: [
      {
        id: 'task-1',
        title: 'Implement Server Actions & Optimistic UI',
        project: 'Next.js Study',
        priority: 'high',
        dueDate: 'Today',
        completed: false,
        description: 'Build real-time form submission with server action response and optimistic local UI updates.',
        userId: mainUser.id,
        order: 1,
      },
      {
        id: 'task-2',
        title: 'Build Route Handler middleware authentication',
        project: 'Next.js Study',
        priority: 'high',
        dueDate: 'Today',
        completed: false,
        description: 'Add bearer token checking and role verification in Edge middleware.',
        userId: mainUser.id,
        order: 2,
      },
      {
        id: 'task-3',
        title: 'Review TypeScript strict variance annotations',
        project: 'TypeScript',
        priority: 'medium',
        dueDate: 'Today',
        completed: false,
        description: 'Audit generic type covariance and contravariance in generic state handlers.',
        userId: mainUser.id,
        order: 3,
      },
      {
        id: 'task-4',
        title: 'Design GSAP ScrollTrigger timeline choreography',
        project: 'UI Design',
        priority: 'high',
        dueDate: 'Tomorrow',
        completed: false,
        description: 'Refine hero section pinning and typography opacity transitions.',
        userId: mainUser.id,
        order: 4,
      },
      {
        id: 'task-5',
        title: 'Configure Web Audio API ambient pink noise synthesizer',
        project: 'Audio Engine',
        priority: 'low',
        dueDate: 'Tomorrow',
        completed: false,
        description: 'Create custom audio buffer node for soothing brown/pink ambient background sound.',
        userId: mainUser.id,
        order: 5,
      },
      {
        id: 'task-6',
        title: 'Read Next.js Caching & Revalidation Guide',
        project: 'Next.js Study',
        priority: 'medium',
        dueDate: 'Yesterday',
        completed: true,
        completedAt: new Date(Date.now() - 2 * 3600 * 1000),
        description: 'Studied full-route cache, Data cache, and request memoization.',
        userId: mainUser.id,
        order: 6,
      },
      {
        id: 'task-7',
        title: 'Build responsive minimal sidebar navigation',
        project: 'UI Design',
        priority: 'high',
        dueDate: 'Yesterday',
        completed: true,
        completedAt: new Date(Date.now() - 5 * 3600 * 1000),
        description: 'Created icon-only collapsed sidebar with sleek tooltips.',
        userId: mainUser.id,
        order: 7,
      },
    ],
  });

  // 5. Create Group
  const group = await prisma.group.create({
    data: {
      id: 'group-1',
      name: 'Next.js Architecture Study',
      code: '#NX8$2!k',
      description: 'Deep dive into App Router, React Server Components, and Edge functions.',
      category: 'Engineering',
      ownerId: mainUser.id,
    },
  });

  // Group Memberships
  await prisma.groupMembership.createMany({
    data: [
      { groupId: group.id, userId: mainUser.id, role: 'owner' },
      { groupId: group.id, userId: sarah.id, role: 'member' },
      { groupId: group.id, userId: david.id, role: 'member' },
      { groupId: group.id, userId: elena.id, role: 'member' },
    ],
  });

  // Group Tasks
  await prisma.task.createMany({
    data: [
      {
        id: 'gtask-1',
        title: 'Learn Server Actions & Mutations',
        project: 'Architecture',
        priority: 'high',
        dueDate: 'Today',
        completed: false,
        userId: mainUser.id,
        groupId: group.id,
        assignedToId: mainUser.id,
        description: 'Implement optimistic updates with server mutation response handling.',
        order: 1,
      },
      {
        id: 'gtask-2',
        title: 'Implement Route Handler authentication',
        project: 'Route Handlers',
        priority: 'medium',
        dueDate: 'Today',
        completed: false,
        userId: sarah.id,
        groupId: group.id,
        assignedToId: sarah.id,
        description: 'Verify JWT and user permissions in Next.js edge route handlers.',
        order: 2,
      },
      {
        id: 'gtask-3',
        title: 'Audit TanStack Query Cache Invalidation Keys',
        project: 'Actions & Caching',
        priority: 'medium',
        dueDate: 'Tomorrow',
        completed: false,
        userId: david.id,
        groupId: group.id,
        assignedToId: david.id,
        description: 'Ensure exact query key structures for fine-grained cache invalidation.',
        order: 3,
      },
    ],
  });

  // 6. Timer Preset
  await prisma.timerPreset.create({
    data: {
      userId: mainUser.id,
      name: 'Classic Pomodoro',
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      targetSessions: 4,
      autoStartBreaks: false,
      soundOnComplete: true,
    },
  });

  // 7. Focus sessions for statistics
  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;
  await prisma.focusSession.createMany({
    data: [
      {
        userId: mainUser.id,
        type: 'pomodoro',
        startedAtMs: BigInt(now - 3 * 3600 * 1000),
        endedAtMs: BigInt(now - 3 * 3600 * 1000 + 25 * 60 * 1000),
        elapsedDurationMs: BigInt(25 * 60 * 1000),
        status: 'completed',
        createdAt: new Date(now - 3 * 3600 * 1000),
      },
      {
        userId: mainUser.id,
        type: 'pomodoro',
        startedAtMs: BigInt(now - 2 * 3600 * 1000),
        endedAtMs: BigInt(now - 2 * 3600 * 1000 + 25 * 60 * 1000),
        elapsedDurationMs: BigInt(25 * 60 * 1000),
        status: 'completed',
        createdAt: new Date(now - 2 * 3600 * 1000),
      },
      {
        userId: mainUser.id,
        type: 'stopwatch',
        startedAtMs: BigInt(now - 1 * 3600 * 1000),
        endedAtMs: BigInt(now - 1 * 3600 * 1000 + 42 * 60 * 1000),
        elapsedDurationMs: BigInt(42 * 60 * 1000),
        status: 'completed',
        createdAt: new Date(now - 1 * 3600 * 1000),
      },
      // Previous days
      {
        userId: mainUser.id,
        type: 'pomodoro',
        startedAtMs: BigInt(now - dayMs - 2 * 3600 * 1000),
        endedAtMs: BigInt(now - dayMs - 2 * 3600 * 1000 + 50 * 60 * 1000),
        elapsedDurationMs: BigInt(50 * 60 * 1000),
        status: 'completed',
        createdAt: new Date(now - dayMs),
      },
      {
        userId: mainUser.id,
        type: 'pomodoro',
        startedAtMs: BigInt(now - 2 * dayMs - 2 * 3600 * 1000),
        endedAtMs: BigInt(now - 2 * dayMs - 2 * 3600 * 1000 + 75 * 60 * 1000),
        elapsedDurationMs: BigInt(75 * 60 * 1000),
        status: 'completed',
        createdAt: new Date(now - 2 * dayMs),
      },
    ],
  });

  // 8. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: mainUser.id,
        title: 'Focus Goal Achieved!',
        message: 'You completed 4 Pomodoro focus intervals today. Superb deep work flow!',
        type: 'timer_complete',
        read: false,
      },
      {
        userId: mainUser.id,
        title: 'Group Study Invitation',
        message: 'Sarah Chen invited you to join the TypeScript Advanced Architecture room.',
        type: 'group_invite',
        read: false,
      },
    ],
  });

  return mainUser;
}
