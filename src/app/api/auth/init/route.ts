import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/db/seed';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      user: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Initialization failed' },
      { status: 500 }
    );
  }
}
