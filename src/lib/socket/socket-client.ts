import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@/types/socket';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(userId?: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (typeof window === 'undefined') {
    return null as any;
  }

  // Derive target URL: default to NEXT_PUBLIC_SOCKET_URL or window.location.origin
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  const targetUrl =
    socketUrl ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000');

  if (!socket) {
    console.log(`🔌 [Socket.IO Client] Initializing connection to: ${targetUrl}`);
    socket = io(targetUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      query: userId ? { userId } : undefined,
    });

    socket.on('connect', () => {
      console.log(`✅ [Socket.IO Client] Connected successfully! Socket ID: ${socket?.id} | Target: ${targetUrl}`);
    });

    socket.on('disconnect', (reason) => {
      console.warn(`⚠️ [Socket.IO Client] Disconnected from server. Reason: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      console.warn(`⚠️ [Socket.IO Client] Connection error:`, error.message);
    });

    socket.io.on('reconnect', (attempt) => {
      console.log(`🔄 [Socket.IO Client] Reconnected after ${attempt} attempts! Socket ID: ${socket?.id}`);
    });
  } else if (userId && (!socket.io.opts.query || (socket.io.opts.query as any).userId !== userId)) {
    console.log(`🔌 [Socket.IO Client] User identity changed, recreating socket.`);
    socket.disconnect();
    socket = null;
    return getSocket(userId);
  }

  if (socket && !socket.connected) {
    socket.connect();
  }

  return socket;
}
