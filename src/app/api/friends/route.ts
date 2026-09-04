import { NextRequest, NextResponse } from 'next/server';
import { getUserFriends } from '@/features/friends/queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'user-default';

    const friends = await getUserFriends(userId);
    return NextResponse.json({ success: true, data: friends });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve friends' },
      { status: 500 }
    );
  }
}
