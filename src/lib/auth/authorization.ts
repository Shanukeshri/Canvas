import { prisma } from '@/lib/db/prisma';

export class AuthorizationError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Ensures the requesting user is a member of the given group.
 */
export async function assertGroupMembership(groupId: string, userId: string) {
  const membership = await prisma.groupMembership.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new AuthorizationError('You must be a member of this group to access its resources.');
  }

  return membership;
}

/**
 * Ensures the requesting user is the owner of the given group.
 */
export async function assertGroupOwner(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { ownerId: true },
  });

  if (!group || group.ownerId !== userId) {
    throw new AuthorizationError('Only the group owner can perform this operation.');
  }

  return group;
}

/**
 * Ensures the requesting user owns the task before allowing destructive operations like delete.
 */
export async function assertTaskDeletionAllowed(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, userId: true, groupId: true },
  });

  if (!task) {
    throw new Error('Task not found.');
  }

  if (task.userId !== userId) {
    throw new AuthorizationError('You can only delete your own tasks.');
  }

  return task;
}

/**
 * Ensures users are friends before allowing group invitations.
 */
export async function assertFriendship(userAId: string, userBId: string) {
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId: userAId, friendId: userBId },
        { userId: userBId, friendId: userAId },
      ],
    },
  });

  if (!friendship) {
    throw new AuthorizationError('Only friends can be invited to groups.');
  }

  return friendship;
}
