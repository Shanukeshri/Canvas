import { NextRequest, NextResponse } from 'next/server';
import { getUserNotifications } from '@/features/notifications/queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'user-default';

    const notifications = await getUserNotifications(userId);
    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve notifications' },
      { status: 500 }
    );
  }
}
