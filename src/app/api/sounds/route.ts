import { NextResponse } from 'next/server';
import { SOUND_CATALOG } from '@/features/sounds/sounds';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: SOUND_CATALOG,
  });
}

