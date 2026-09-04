'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { CreateGroupSchema } from '@/lib/validation/schemas';
import {
  assertGroupMembership,
  assertGroupOwner,
  assertFriendship,
} from '@/lib/auth/authorization';

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '#';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createGroupAction(userId: string, data: unknown) {
  const parsed = CreateGroupSchema.parse(data);
  const code = parsed.code || generateRandomCode();

  const group = await prisma.$transaction(async (tx) => {
    const createdGroup = await tx.group.create({
      data: {
        name: parsed.name,
        code,
        description: parsed.description || '',
        category: parsed.category || 'Focus Room',
        ownerId: userId,
      },
    });

    await tx.groupMembership.create({
      data: {
        groupId: createdGroup.id,
        userId,
        role: 'owner',
      },
    });

    await tx.activityEvent.create({
      data: {
        groupId: createdGroup.id,
        actorId: userId,
        type: 'MEMBER_JOINED',
        payload: JSON.stringify({ role: 'owner' }),
      },
    });

    return createdGroup;
  });

  revalidatePath('/app');
  return { success: true, group };
}

export async function inviteFriendToGroupAction(userId: string, groupId: string, friendId: string) {
  // 1. Enforce friend requirement
  await assertFriendship(userId, friendId);

  // 2. Enforce inviter membership
  await assertGroupMembership(groupId, userId);

  // 3. Create or update invitation
  const invitation = await prisma.groupInvitation.upsert({
    where: {
      groupId_inviteeId: {
        groupId,
        inviteeId: friendId,
      },
    },
    update: {
      inviterId: userId,
      status: 'pending',
    },
    create: {
      groupId,
      inviterId: userId,
      inviteeId: friendId,
      status: 'pending',
    },
    include: {
      group: { select: { name: true } },
      inviter: { select: { name: true } },
    },
  });

  // Create persistent notification for invitee
  await prisma.notification.create({
    data: {
      userId: friendId,
      title: 'Group Room Invitation',
      message: `${invitation.inviter.name} invited you to join "${invitation.group.name}".`,
      type: 'group_invite',
      actionPayload: JSON.stringify({ groupId, invitationId: invitation.id }),
    },
  });

  return { success: true, invitation };
}

export async function acceptGroupInvitationAction(userId: string, invitationId: string) {
  const invitation = await prisma.groupInvitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation || invitation.inviteeId !== userId) {
    throw new Error('Invitation not found or unauthorized.');
  }

  await prisma.$transaction([
    prisma.groupMembership.upsert({
      where: {
        groupId_userId: {
          groupId: invitation.groupId,
          userId,
        },
      },
      update: {},
      create: {
        groupId: invitation.groupId,
        userId,
        role: 'member',
      },
    }),
    prisma.groupInvitation.update({
      where: { id: invitationId },
      data: { status: 'accepted' },
    }),
    prisma.activityEvent.create({
      data: {
        groupId: invitation.groupId,
        actorId: userId,
        type: 'MEMBER_JOINED',
        payload: JSON.stringify({ role: 'member' }),
      },
    }),
  ]);

  revalidatePath('/app');
  return { success: true };
}

export async function joinGroupByCodeAction(userId: string, code: string) {
  const group = await prisma.group.findUnique({
    where: { code },
  });

  if (!group) {
    throw new Error('Group with this code was not found.');
  }

  await prisma.groupMembership.upsert({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId,
      },
    },
    update: {},
    create: {
      groupId: group.id,
      userId,
      role: 'member',
    },
  });

  revalidatePath('/app');
  return { success: true, groupId: group.id };
}

export async function leaveGroupAction(userId: string, groupId: string) {
  await prisma.groupMembership.delete({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });

  revalidatePath('/app');
  return { success: true };
}

export async function deleteGroupAction(userId: string, groupId: string) {
  await assertGroupOwner(groupId, userId);

  await prisma.group.delete({
    where: { id: groupId },
  });

  revalidatePath('/app');
  return { success: true };
}
