import { prisma } from '@/lib/db/prisma';
import { Friend } from '@/types';

export async function getUserFriends(userId: string): Promise<Friend[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ userId }, { friendId: userId }],
    },
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
      friend: {
        select: {
          id: true,
          name: true,
          handle: true,
          avatar: true,
          themeColor: true,
        },
      },
    },
  });

  return friendships.map((f) => {
    const isOwner = f.userId === userId;
    const profile = isOwner ? f.friend : f.user;

    return {
      id: profile.id,
      name: profile.name,
      handle: profile.handle,
      avatar: profile.avatar,
      color: profile.themeColor || '#6366f1',
      status: 'focusing',
      currentTask: 'Deep focus work',
      timerMinutes: 25,
      timerSeconds: 0,
      mode: 'pomodoro',
      isFocusing: true,
    };
  });
}

export async function searchUsers(query: string, currentUserId: string) {
  if (!query || query.trim().length === 0) return [];

  const cleanQuery = query.trim().toLowerCase();

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: currentUserId } },
        {
          OR: [
            { name: { contains: cleanQuery } },
            { handle: { contains: cleanQuery } },
            { email: { contains: cleanQuery } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      handle: true,
      avatar: true,
      themeColor: true,
    },
    take: 10,
  });

  return users;
}
