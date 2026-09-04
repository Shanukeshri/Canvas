import { createServer } from 'http';
import { Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types/socket';

const PORT = parseInt(process.env.SOCKET_PORT || process.env.PORT || '3001', 10);

export function createSocketServer() {
  const httpServer = createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Zen Productivity Realtime Socket.IO Server');
  });

  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Track online users
  const onlineUsers = new Map<string, { socketId: string; activeGroupId?: string; lastSeen: number }>();

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // User authentication / identification
    const userId = socket.handshake.query.userId as string | undefined;
    if (userId) {
      socket.data.userId = userId;
      onlineUsers.set(userId, { socketId: socket.id, lastSeen: Date.now() });
      socket.join(`user:${userId}`);
      io.emit('presence:update', { onlineUserIds: Array.from(onlineUsers.keys()) });
    }

    // --- Timer Events ---
    socket.on('timer:start', (payload) => {
      socket.broadcast.emit('timer:started', payload);
    });

    socket.on('timer:pause', (payload) => {
      socket.broadcast.emit('timer:paused', payload);
    });

    socket.on('timer:resume', (payload) => {
      socket.broadcast.emit('timer:resumed', payload);
    });

    socket.on('timer:stop', (payload) => {
      socket.broadcast.emit('timer:stopped', payload);
    });

    socket.on('timer:complete', (payload) => {
      socket.broadcast.emit('timer:completed', payload);
    });

    socket.on('timer:heartbeat', (payload) => {
      if (payload.userId) {
        const user = onlineUsers.get(payload.userId);
        if (user) user.lastSeen = Date.now();
      }
    });

    // --- Group Events ---
    socket.on('group:join', ({ groupId, user }) => {
      socket.join(`group:${groupId}`);
      const userInfo = onlineUsers.get(user.id);
      if (userInfo) userInfo.activeGroupId = groupId;

      io.to(`group:${groupId}`).emit('group:member_joined', {
        groupId,
        member: user,
        timestampMs: Date.now(),
      });
      console.log(`[Group] User ${user.name} (${user.id}) joined room group:${groupId}`);
    });

    socket.on('group:leave', ({ groupId, userId }) => {
      socket.leave(`group:${groupId}`);
      io.to(`group:${groupId}`).emit('group:member_left', {
        groupId,
        userId,
        timestampMs: Date.now(),
      });
    });

    socket.on('group:task_update', ({ groupId, task, action }) => {
      io.to(`group:${groupId}`).emit('group:task_changed', {
        groupId,
        task,
        action,
        timestampMs: Date.now(),
      });
    });

    // --- Presence Events ---
    socket.on('presence:status', ({ userId, status, currentTask }) => {
      socket.broadcast.emit('friend:status_changed', {
        friendId: userId,
        status,
        currentTask,
      });
    });

    socket.on('presence:heartbeat', ({ userId, activeGroupId }) => {
      const user = onlineUsers.get(userId);
      if (user) {
        user.lastSeen = Date.now();
        user.activeGroupId = activeGroupId;
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.data.userId) {
        onlineUsers.delete(socket.data.userId);
        io.emit('presence:update', { onlineUserIds: Array.from(onlineUsers.keys()) });
      }
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return { httpServer, io };
}

// Direct execution when run via `node src/server/socket-server.ts` or `tsx`
if (require.main === module) {
  const { httpServer } = createSocketServer();
  httpServer.listen(PORT, () => {
    console.log(`⚡ Zen Realtime Socket.IO Server running on port ${PORT}`);
  });
}
