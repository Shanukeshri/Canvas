import { NextRequest, NextResponse } from 'next/server';
import { getUserNotifications } from '@/features/notifications/queries';
import { createNotificationAction } from '@/features/notifications/actions';
import { formatErrorMessage } from '@/lib/utils/error-formatter';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'user-default';

    const notifications = await getUserNotifications(userId);
    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: formatErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createNotificationAction(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: formatErrorMessage(error) },
      { status: 500 }
    );
  }
}
