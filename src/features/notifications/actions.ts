'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';

export async function createNotificationAction(data: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  actionPayload?: any;
}) {
  const notif = await prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || 'system',
      actionPayload: data.actionPayload ? JSON.stringify(data.actionPayload) : null,
    },
  });

  revalidatePath('/app');
  return { success: true, notification: notif };
}

export async function markNotificationReadAction(userId: string, notificationId: string) {
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: { read: true },
  });

  revalidatePath('/app');
  return { success: true };
}

export async function removeNotificationAction(userId: string, notificationId: string) {
  await prisma.notification.deleteMany({
    where: {
      userId,
      OR: [
        { id: notificationId },
        { actionPayload: { contains: notificationId } },
      ],
    },
  });

  revalidatePath('/app');
  return { success: true };
}
