'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { FriendRequestSchema } from '@/lib/validation/schemas';

export async function sendFriendRequestAction(senderId: string, data: unknown) {
  const parsed = FriendRequestSchema.parse(data);

  if (senderId === parsed.receiverId) {
    throw new Error('Cannot send friend request to yourself.');
  }

  // Check existing friendship
  const existingFriendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId: senderId, friendId: parsed.receiverId },
        { userId: parsed.receiverId, friendId: senderId },
      ],
    },
  });

  if (existingFriendship) {
    throw new Error('Already friends with this user.');
  }

  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { name: true },
  });

  const request = await prisma.friendRequest.upsert({
    where: {
      senderId_receiverId: {
        senderId,
        receiverId: parsed.receiverId,
      },
    },
    update: {
      status: 'pending',
    },
    create: {
      senderId,
      receiverId: parsed.receiverId,
      status: 'pending',
    },
  });

  // Create persistent notification for receiver
  await prisma.notification.create({
    data: {
      userId: parsed.receiverId,
      title: 'New Friend Request',
      message: `${sender?.name || 'A user'} sent you a friend request.`,
      type: 'friend_request',
      actionPayload: JSON.stringify({ requestId: request.id, senderId }),
    },
  });

  return { success: true, request };
}

export async function acceptFriendRequestAction(userId: string, requestId: string) {
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
    include: {
      sender: { select: { name: true } },
      receiver: { select: { name: true } },
    },
  });

  if (!request || request.receiverId !== userId) {
    throw new Error('Friend request not found or unauthorized.');
  }

  await prisma.$transaction([
    prisma.friendship.create({
      data: {
        userId: request.senderId,
        friendId: request.receiverId,
      },
    }),
    prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'accepted' },
    }),
    prisma.notification.create({
      data: {
        userId: request.senderId,
        title: 'Friend Request Accepted',
        message: `${request.receiver.name} accepted your friend request.`,
        type: 'friend_request',
      },
    }),
  ]);

  revalidatePath('/app');
  return { success: true };
}

export async function declineFriendRequestAction(userId: string, requestId: string) {
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.receiverId !== userId) {
    throw new Error('Unauthorized.');
  }

  await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: 'declined' },
  });

  return { success: true };
}

export async function removeFriendAction(userId: string, friendId: string) {
  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    },
  });

  revalidatePath('/app');
  return { success: true };
}
