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

export async function searchUsers(query: string, currentUserId?: string) {
  if (!query) return [];

  const raw = query.trim();
  if (raw.length === 0) return [];

  const cleanQuery = raw.startsWith('@') ? raw.slice(1).trim() : raw;
  const cleanLower = cleanQuery.toLowerCase();

  // If user typed only "@", return the most recent 10 users
  const whereClause =
    cleanLower.length === 0
      ? {}
      : {
          OR: [
            { name: { contains: cleanLower, mode: 'insensitive' as const } },
            { handle: { contains: cleanLower, mode: 'insensitive' as const } },
            { handle: { contains: `@${cleanLower}`, mode: 'insensitive' as const } },
            { email: { contains: cleanLower, mode: 'insensitive' as const } },
          ],
        };

  const candidates = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      handle: true,
      avatar: true,
      themeColor: true,
    },
    take: 25,
  });

  // Fetch friendship & pending request status for the current user
  const friendIdSet = new Set<string>();
  const pendingOutgoingSet = new Set<string>();
  const pendingIncomingMap = new Map<string, string>();

  if (currentUserId && currentUserId !== 'guest' && currentUserId !== 'user-default') {
    const [friendships, requests] = await Promise.all([
      prisma.friendship.findMany({
        where: {
          OR: [{ userId: currentUserId }, { friendId: currentUserId }],
        },
        select: { userId: true, friendId: true },
      }),
      prisma.friendRequest.findMany({
        where: {
          OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
          status: 'pending',
        },
        select: { id: true, senderId: true, receiverId: true },
      }),
    ]);

    for (const f of friendships) {
      friendIdSet.add(f.userId === currentUserId ? f.friendId : f.userId);
    }

    for (const r of requests) {
      if (r.senderId === currentUserId) {
        pendingOutgoingSet.add(r.receiverId);
      } else {
        pendingIncomingMap.set(r.senderId, r.id);
      }
    }
  }

  const formatCandidate = (u: any) => {
    const isFriend = friendIdSet.has(u.id);
    const isPendingOutgoing = pendingOutgoingSet.has(u.id);
    const incomingRequestId = pendingIncomingMap.get(u.id);

    return {
      ...u,
      isFriend,
      hasPendingRequest: isPendingOutgoing || !!incomingRequestId,
      requestDirection: isPendingOutgoing ? 'outgoing' : incomingRequestId ? 'incoming' : null,
      requestId: incomingRequestId || null,
    };
  };

  if (cleanLower.length === 0) {
    return candidates.slice(0, 10).map(formatCandidate);
  }

  // Score candidates to guarantee highest-relevance top 10 matches
  const scored = candidates.map((u) => {
    const nameLower = (u.name || '').toLowerCase();
    const handleWithoutAt = (u.handle || '').toLowerCase().replace(/^@/, '');
    const handleWithAt = (u.handle || '').toLowerCase();
    let score = 0;

    // Exact match
    if (handleWithoutAt === cleanLower || handleWithAt === cleanLower || nameLower === cleanLower) {
      score += 100;
    }
    // Prefix match
    else if (handleWithoutAt.startsWith(cleanLower) || handleWithAt.startsWith(cleanLower)) {
      score += 80;
    } else if (nameLower.startsWith(cleanLower)) {
      score += 70;
    }
    // Substring match
    else if (handleWithoutAt.includes(cleanLower) || handleWithAt.includes(cleanLower)) {
      score += 50;
    } else if (nameLower.includes(cleanLower)) {
      score += 40;
    } else {
      score += 10;
    }

    return { user: u, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 10).map((s) => formatCandidate(s.user));
}

