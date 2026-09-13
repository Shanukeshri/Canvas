import { NextRequest, NextResponse } from 'next/server';
import { searchUsers } from '@/features/friends/queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const userId = searchParams.get('userId') || undefined;

    const results = await searchUsers(q, userId);
    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
