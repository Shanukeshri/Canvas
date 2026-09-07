import { createServer } from 'http';
import { Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types/socket';

const PORT = parseInt(process.env.SOCKET_PORT || process.env.PORT || '3002', 10);

export function createSocketServer() {
  const httpServer = createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Canvas Productivity Realtime Socket.IO Server');
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
    const registerUserSocket = (uid: string, groupId?: string) => {
      socket.data.userId = uid;
      socket.join(`user:${uid}`);
      const existing = onlineUsers.get(uid) || { socketId: socket.id, lastSeen: Date.now() };
      existing.socketId = socket.id;
      existing.lastSeen = Date.now();
      if (groupId) existing.activeGroupId = groupId;
      onlineUsers.set(uid, existing);
      io.emit('presence:update', { onlineUserIds: Array.from(onlineUsers.keys()) });
      console.log(`[Socket.IO] User registered: ${uid} (socket ${socket.id}, room user:${uid})`);
    };

    const initialUserId = socket.handshake.query.userId as string | undefined;
    if (initialUserId && initialUserId !== 'undefined' && initialUserId !== 'guest') {
      registerUserSocket(initialUserId);
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

    socket.on('timer:sync_state', (payload) => {
      socket.broadcast.emit('timer:state_synced', payload);
    });

    socket.on('timer:event', (payload) => {
      socket.broadcast.emit('timer:event_synced', payload);
      socket.broadcast.emit('timer:state_synced', payload);
    });

    socket.on('timer:request_state', (payload) => {
      if (payload.targetUserId) {
        io.to(`user:${payload.targetUserId}`).emit('timer:state_requested', payload);
      }
      socket.broadcast.emit('timer:state_requested', payload);
    });

    socket.on('timer:heartbeat', (payload) => {
      if (payload.userId) {
        const user = onlineUsers.get(payload.userId);
        if (user) user.lastSeen = Date.now();
      }
    });

    // --- Co-working Orbit Events ---
    socket.on('cowork:request', (payload) => {
      console.log(`[Cowork] Request from ${payload.senderId} (${payload.senderName}) to ${payload.receiverId}`);
      if (payload.receiverId) {
        io.to(`user:${payload.receiverId}`).emit('cowork:requested', {
          ...payload,
          timestampMs: Date.now(),
        });
      }
      socket.broadcast.emit('cowork:requested', {
        ...payload,
        timestampMs: Date.now(),
      });
    });

    socket.on('cowork:accept', (payload) => {
      console.log(`[Cowork] Accepted: ${payload.senderId} <-> ${payload.receiverId}`);
      io.emit('cowork:accepted', {
        ...payload,
        timestampMs: Date.now(),
      });
      if (payload.senderId) {
        io.to(`user:${payload.senderId}`).emit('timer:state_requested', {
          requesterId: payload.receiverId,
          targetUserId: payload.senderId,
        });
      }
      if (payload.receiverId) {
        io.to(`user:${payload.receiverId}`).emit('timer:state_requested', {
          requesterId: payload.senderId,
          targetUserId: payload.receiverId,
        });
      }
    });

    socket.on('cowork:decline', (payload) => {
      io.emit('cowork:declined', {
        ...payload,
        timestampMs: Date.now(),
      });
    });

    socket.on('cowork:disconnect', (payload) => {
      io.emit('cowork:disconnected', {
        ...payload,
        timestampMs: Date.now(),
      });
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

    // --- Theme & Color Broadcast Events ---
    socket.on('user:color_update', ({ userId, themeColor }) => {
      console.log(`[Socket.IO] User ${userId} color changed to ${themeColor}`);
      socket.broadcast.emit('user:color_changed', { userId, themeColor });
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
      if (userId && userId !== 'undefined' && userId !== 'guest') {
        registerUserSocket(userId, activeGroupId);
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
    console.log(`⚡ Canvas Realtime Socket.IO Server running on port ${PORT}`);
  });
}
