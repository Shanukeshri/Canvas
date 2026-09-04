import { prisma } from '@/lib/db/prisma';
import { NotificationItem } from '@/types';

export async function getUserNotifications(userId: string): Promise<NotificationItem[]> {
  const dbNotifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  return dbNotifications.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    time: formatTimeAgo(n.createdAt),
    type: n.type as any,
    read: n.read,
    actionPayload: n.actionPayload ? JSON.parse(n.actionPayload) : undefined,
  }));
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
