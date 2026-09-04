import { NextRequest, NextResponse } from 'next/server';
import { getUserFriends } from '@/features/friends/queries';
import {
  sendFriendRequestAction,
  acceptFriendRequestAction,
  declineFriendRequestAction,
  removeFriendAction,
} from '@/features/friends/actions';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const friends = await getUserFriends(userId);
    return NextResponse.json({ success: true, data: friends });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve friends' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { senderId, receiverId } = body;

    if (!senderId || !receiverId) {
      return NextResponse.json(
        { success: false, error: 'senderId and receiverId are required.' },
        { status: 400 }
      );
    }

    const result = await sendFriendRequestAction(senderId, { receiverId });
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send friend request' },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, requestId, action } = body;

    if (!userId || !requestId) {
      return NextResponse.json(
        { success: false, error: 'userId and requestId are required.' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      const result = await acceptFriendRequestAction(userId, requestId);
      return NextResponse.json({ success: true, data: result });
    } else if (action === 'decline') {
      const result = await declineFriendRequestAction(userId, requestId);
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Action failed' },
      { status: 400 }
    );
  }
}
