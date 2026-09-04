'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';

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
      id: notificationId,
      userId,
    },
  });

  revalidatePath('/app');
  return { success: true };
}
