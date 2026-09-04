import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/db/seed';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      await seedDatabase();
    }
    const defaultUser = await prisma.user.findFirst({
      where: { handle: '@alex_s' },
    });

    return NextResponse.json({
      success: true,
      user: defaultUser
        ? {
            id: defaultUser.id,
            name: defaultUser.name,
            email: defaultUser.email,
            handle: defaultUser.handle,
            avatar: defaultUser.avatar,
            provider: 'email',
            createdAt: defaultUser.createdAt.toLocaleDateString(),
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Initialization failed' },
      { status: 500 }
    );
  }
}
