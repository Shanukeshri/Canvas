'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { CreateGroupSchema } from '@/lib/validation/schemas';
import {
  assertGroupMembership,
  assertGroupOwner,
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

export async function inviteFriendToGroupAction(userId: string, groupId: string, friendIdOrHandle: string) {
  // 1. Enforce inviter membership
  await assertGroupMembership(groupId, userId);

  // 2. Resolve target user by id, handle (with or without @), or email
  const clean = friendIdOrHandle.trim();
  const cleanWithoutAt = clean.replace(/^@/, '');
  const cleanWithAt = clean.startsWith('@') ? clean : `@${clean}`;

  let targetUser = await prisma.user.findFirst({
    where: {
      OR: [
        { id: clean },
        { handle: clean },
        { handle: cleanWithoutAt },
        { handle: cleanWithAt },
        { email: clean },
      ],
    },
    select: { id: true, name: true, handle: true },
  });

  const inviteeId = targetUser?.id || clean;

  // 3. Create or update invitation
  const invitation = await prisma.groupInvitation.upsert({
    where: {
      groupId_inviteeId: {
        groupId,
        inviteeId,
      },
    },
    update: {
      inviterId: userId,
      status: 'pending',
    },
    create: {
      groupId,
      inviterId: userId,
      inviteeId,
      status: 'pending',
    },
    include: {
      group: { select: { id: true, name: true } },
      inviter: { select: { id: true, name: true, avatar: true, themeColor: true } },
    },
  });

  // Create persistent notification for invitee
  const notification = await prisma.notification.create({
    data: {
      userId: inviteeId,
      title: 'Group Room Invitation',
      message: `${invitation.inviter.name} invited you to join "${invitation.group.name}".`,
      type: 'group_invite',
      actionPayload: JSON.stringify({
        groupId,
        groupName: invitation.group.name,
        invitationId: invitation.id,
        inviterId: userId,
        inviterName: invitation.inviter.name,
      }),
    },
  });

  revalidatePath('/app');
  return { success: true, invitation, notification };
}

export async function acceptGroupInvitationAction(
  userId: string,
  invitationId?: string,
  fallbackGroupId?: string
) {
  let invitation = null;
  if (invitationId && !invitationId.startsWith('inv-') && !invitationId.startsWith('ginvite-')) {
    invitation = await prisma.groupInvitation.findUnique({
      where: { id: invitationId },
    });
  }

  const targetGroupId = invitation?.groupId || fallbackGroupId || invitationId;

  if (!targetGroupId) {
    throw new Error('Valid group ID or invitation ID is required.');
  }

  // Ensure target group exists
  const group = await prisma.group.findUnique({
    where: { id: targetGroupId },
    select: { id: true, name: true },
  });

  if (!group) {
    throw new Error('Focus group was not found.');
  }

  await prisma.$transaction([
    prisma.groupMembership.upsert({
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
    }),
    ...(invitation
      ? [
          prisma.groupInvitation.update({
            where: { id: invitation.id },
            data: { status: 'accepted' },
          }),
        ]
      : [
          prisma.groupInvitation.updateMany({
            where: {
              groupId: group.id,
              inviteeId: userId,
            },
            data: { status: 'accepted' },
          }),
        ]),
    prisma.activityEvent.create({
      data: {
        groupId: group.id,
        actorId: userId,
        type: 'MEMBER_JOINED',
        payload: JSON.stringify({ role: 'member' }),
      },
    }),
  ]);

  // Once accepted, delete all matching group invite notifications for this user from the database
  await prisma.notification.deleteMany({
    where: {
      userId,
      OR: [
        { type: 'group_invite', actionPayload: { contains: group.id } },
        ...(invitation ? [{ id: invitation.id }, { actionPayload: { contains: invitation.id } }] : []),
        ...(invitationId ? [{ id: invitationId }, { actionPayload: { contains: invitationId } }] : []),
      ],
    },
  });

  revalidatePath('/app');
  return { success: true, groupId: group.id, groupName: group.name };
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
