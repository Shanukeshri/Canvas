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
    select: { id: true, name: true, handle: true, avatar: true, themeColor: true },
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
      actionPayload: JSON.stringify({ requestId: request.id, senderId, sender }),
    },
  });

  return { success: true, request, sender };
}

export async function acceptFriendRequestAction(userId: string, requestId: string) {
  // Find request by id, or by senderId + receiverId
  let request = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { id: requestId, receiverId: userId },
        { senderId: requestId, receiverId: userId },
      ],
    },
    include: {
      sender: { select: { id: true, name: true, handle: true, avatar: true, themeColor: true } },
      receiver: { select: { id: true, name: true, handle: true, avatar: true, themeColor: true } },
    },
  });

  // Fallback: reverse lookup in case userId sent and the other accepted
  if (!request) {
    request = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { id: requestId, senderId: userId },
          { receiverId: requestId, senderId: userId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, handle: true, avatar: true, themeColor: true } },
        receiver: { select: { id: true, name: true, handle: true, avatar: true, themeColor: true } },
      },
    });
  }

  // If still not found, check if already friends
  if (!request) {
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId: requestId },
          { userId: requestId, friendId: userId },
        ],
      },
    });
    if (existingFriendship) {
      return { success: true, alreadyFriends: true };
    }
    throw new Error('Friend request not found or unauthorized.');
  }

  // Ensure friendship records exist
  const existingFriendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId: request.senderId, friendId: request.receiverId },
        { userId: request.receiverId, friendId: request.senderId },
      ],
    },
  });

  if (!existingFriendship) {
    await prisma.friendship.create({
      data: {
        userId: request.senderId,
        friendId: request.receiverId,
      },
    });
  }

  await prisma.friendRequest.updateMany({
    where: {
      OR: [
        { id: request.id },
        { senderId: request.senderId, receiverId: request.receiverId },
      ],
    },
    data: { status: 'accepted' },
  });

  try {
    await prisma.notification.create({
      data: {
        userId: request.senderId,
        title: 'Friend Request Accepted',
        message: `${request.receiver.name} accepted your friend request.`,
        type: 'friend_accepted',
        actionPayload: JSON.stringify({ friendId: request.receiverId, friendName: request.receiver.name }),
      },
    });
  } catch {}

  // Delete pending friend request notification from DB once accepted
  await prisma.notification.deleteMany({
    where: {
      userId,
      OR: [
        { type: 'friend_request', actionPayload: { contains: request.id } },
        { type: 'friend_request', actionPayload: { contains: request.senderId } },
      ],
    },
  });

  revalidatePath('/app');
  return {
    success: true,
    friend: {
      id: request.sender.id === userId ? request.receiver.id : request.sender.id,
      name: request.sender.id === userId ? request.receiver.name : request.sender.name,
      handle: request.sender.id === userId ? request.receiver.handle : request.sender.handle,
      avatar: request.sender.id === userId ? request.receiver.avatar : request.sender.avatar,
      color: (request.sender.id === userId ? request.receiver.themeColor : request.sender.themeColor) || '#6366f1',
    },
    requesterId: request.senderId,
    receiverId: request.receiverId,
  };
}

export async function declineFriendRequestAction(userId: string, requestId: string) {
  await prisma.friendRequest.updateMany({
    where: {
      OR: [
        { id: requestId, receiverId: userId },
        { senderId: requestId, receiverId: userId },
      ],
    },
    data: { status: 'declined' },
  });

  // Delete pending friend request notification from DB once declined
  await prisma.notification.deleteMany({
    where: {
      userId,
      OR: [
        { type: 'friend_request', actionPayload: { contains: requestId } },
      ],
    },
  });

  revalidatePath('/app');
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
