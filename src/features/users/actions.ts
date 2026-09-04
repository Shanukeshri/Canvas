'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { ProfileSchema } from '@/lib/validation/schemas';

export async function updateProfileAction(userId: string, data: unknown) {
  const parsed = ProfileSchema.parse(data);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.name,
      handle: parsed.handle,
      avatar: parsed.avatar,
      themeColor: parsed.themeColor,
    },
  });

  revalidatePath('/app');
  return { success: true, user: updated };
}

export async function updateUserThemeAction(userId: string, themeColor: string) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { themeColor },
  });

  return { success: true, themeColor: updated.themeColor };
}
