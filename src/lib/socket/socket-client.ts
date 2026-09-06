import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@/types/socket';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(userId?: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (typeof window === 'undefined') {
    return null as any;
  }

  // Derive target URL: default to env or localhost:3002
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  const targetUrl =
    socketUrl && !socketUrl.includes(':3000')
      ? socketUrl
      : `${window.location.protocol}//${window.location.hostname}:3002`;

  if (!socket) {
    socket = io(targetUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      query: userId ? { userId } : undefined,
    });
  } else if (userId && (!socket.io.opts.query || (socket.io.opts.query as any).userId !== userId)) {
    socket.io.opts.query = { userId };
    if (socket.connected) {
      socket.emit('presence:heartbeat', { userId });
    } else {
      socket.connect();
    }
  }

  if (socket && !socket.connected) {
    socket.connect();
  }

  return socket;
}
