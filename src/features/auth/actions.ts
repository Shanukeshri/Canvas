'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { AuthLoginSchema, AuthRegisterSchema } from '@/lib/validation/schemas';
import { User } from '@/types';

export async function registerUserAction(data: unknown): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const parsed = AuthRegisterSchema.parse(data);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: parsed.email.toLowerCase() }, { handle: parsed.handle || '' }],
      },
    });

    if (existing) {
      return { success: false, error: 'User with this email or handle already exists.' };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(parsed.password, salt);
    const handle = parsed.handle || `@${parsed.name.toLowerCase().replace(/\s+/g, '')}`;

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email.toLowerCase(),
        passwordHash,
        handle,
        avatar: parsed.avatar || '🦊',
        themeColor: '#6366f1',
      },
    });

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        handle: user.handle,
        avatar: user.avatar,
        provider: 'email',
        createdAt: user.createdAt.toLocaleDateString(),
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Registration failed.' };
  }
}

export async function loginUserAction(data: unknown): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const parsed = AuthLoginSchema.parse(data);

    const user = await prisma.user.findUnique({
      where: { email: parsed.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      // If user was created without password (e.g. demo), allow fallback check
      if (user && !user.passwordHash) {
        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            handle: user.handle,
            avatar: user.avatar,
            provider: 'email',
            createdAt: user.createdAt.toLocaleDateString(),
          },
        };
      }
      return { success: false, error: 'Invalid email or password.' };
    }

    const isMatch = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: 'Invalid email or password.' };
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        handle: user.handle,
        avatar: user.avatar,
        provider: 'email',
        createdAt: user.createdAt.toLocaleDateString(),
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Login failed.' };
  }
}
