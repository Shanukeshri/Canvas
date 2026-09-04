import { NextRequest, NextResponse } from 'next/server';
import { getTasks } from '@/features/tasks/queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'user-default';
    const groupId = searchParams.get('groupId') || undefined;

    const tasks = await getTasks(userId, groupId);
    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve tasks' },
      { status: 500 }
    );
  }
}
