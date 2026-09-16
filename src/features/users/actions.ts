'use server';


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


  return { success: true, user: updated };
}

export async function updateUserThemeAction(userId: string, themeColor: string) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { themeColor },
  });

  return { success: true, themeColor: updated.themeColor };
}

export async function updateUserPreferencesAction(userId: string, preferences: Record<string, any>) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { preferences: true, themeColor: true },
    });

    let currentPrefs: Record<string, any> = {};
    try {
      if (user?.preferences) currentPrefs = JSON.parse(user.preferences);
    } catch {}

    const merged = { ...currentPrefs, ...preferences };

    const updateData: any = {
      preferences: JSON.stringify(merged),
    };
    if (preferences.themeColor) {
      updateData.themeColor = preferences.themeColor;
    }

    const updated = await tx.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Upsert default TimerPreset
    if (preferences.focusDurationMinutes !== undefined) {
      try {
        const existingPreset = await tx.timerPreset.findFirst({ where: { userId } });
        if (existingPreset) {
          await tx.timerPreset.update({
            where: { id: existingPreset.id },
            data: {
              focusMinutes: preferences.focusDurationMinutes,
              shortBreakMinutes: preferences.shortBreakMinutes ?? 5,
              longBreakMinutes: preferences.longBreakMinutes ?? 15,
              targetSessions: preferences.targetSessions ?? 4,
              autoStartBreaks: preferences.autoStartBreaks ?? false,
            },
          });
        } else {
          await tx.timerPreset.create({
            data: {
              userId,
              name: 'Default Preset',
              focusMinutes: preferences.focusDurationMinutes,
              shortBreakMinutes: preferences.shortBreakMinutes ?? 5,
              longBreakMinutes: preferences.longBreakMinutes ?? 15,
              targetSessions: preferences.targetSessions ?? 4,
              autoStartBreaks: preferences.autoStartBreaks ?? false,
            },
          });
        }
      } catch {}
    }

    return { success: true, preferences: merged };
  });
}
