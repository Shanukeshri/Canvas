import { NextRequest, NextResponse } from 'next/server';
import { getUserGroups } from '@/features/groups/queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'user-default';

    const groups = await getUserGroups(userId);
    return NextResponse.json({ success: true, data: groups });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve groups' },
      { status: 500 }
    );
  }
}
