import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../types/socket';

const PORT = parseInt(process.env.PORT || process.env.SOCKET_PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

export function setupSocketIO(httpServer: ReturnType<typeof createServer>) {
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
    console.log(`⚡ [Socket.IO Server] Client connected: ${socket.id}`);

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
      console.log(`⚡ [Socket.IO Server] User registered: ${uid} (socket ${socket.id}, room: user:${uid})`);
    };

    const initialUserId = socket.handshake.query.userId as string | undefined;
    if (initialUserId && initialUserId !== 'undefined' && initialUserId !== 'guest') {
      registerUserSocket(initialUserId);
    }

    // --- Time Sync / Clock Skew Ping-Pong ---
    socket.on('timer:ping', (payload) => {
      socket.emit('timer:pong', {
        clientTime: payload?.clientTime || 0,
        serverTime: Date.now(),
      });
    });

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
      const userInfo = onlineUsers.get(user.id) || {
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        color: user.color,
        socketId: socket.id,
        lastSeen: Date.now(),
      };
      userInfo.activeGroupId = groupId;
      onlineUsers.set(user.id, userInfo);

      // Collect existing active members in this group room
      const activePeers: any[] = [];
      for (const [uId, u] of onlineUsers.entries()) {
        if (u.activeGroupId === groupId && uId !== user.id) {
          activePeers.push({
            id: u.userId || uId,
            name: u.name,
            avatar: u.avatar,
            color: u.color,
            status: 'focusing',
            timerTime: '25:00',
            isConnected: true,
          });
        }
      }

      // 1. Send existing room members back to joining user
      socket.emit('group:room_state', {
        groupId,
        activeMembers: activePeers,
        timestampMs: Date.now(),
      });

      // 2. Broadcast to other members in the room that this member joined
      socket.to(`group:${groupId}`).emit('group:member_joined', {
        groupId,
        member: { ...user, isConnected: true },
        timestampMs: Date.now(),
      });
      console.log(`[Group] User ${user.name} (${user.id}) joined room group:${groupId} (peers in room: ${activePeers.length})`);
    });

    socket.on('group:leave', ({ groupId, userId }) => {
      socket.leave(`group:${groupId}`);
      const userInfo = onlineUsers.get(userId);
      if (userInfo && userInfo.activeGroupId === groupId) {
        userInfo.activeGroupId = undefined;
      }
      io.to(`group:${groupId}`).emit('group:member_left', {
        groupId,
        userId,
        timestampMs: Date.now(),
      });
    });

    socket.on('group:invite', (payload) => {
      console.log(`[Group] Invite from ${payload.inviterName} (${payload.inviterId}) to ${payload.inviteeId} for "${payload.groupName}"`);
      if (payload.inviteeId) {
        io.to(`user:${payload.inviteeId}`).emit('group:invite_received', {
          id: `notif-grp-${Date.now()}`,
          groupId: payload.groupId,
          groupName: payload.groupName,
          inviter: {
            id: payload.inviterId,
            name: payload.inviterName,
            avatar: payload.inviterAvatar,
            color: payload.inviterColor,
          },
          invitationId: payload.invitationId,
          timestampMs: Date.now(),
        });
      }
    });

    socket.on('group:task_update', ({ groupId, task, action }) => {
      io.to(`group:${groupId}`).emit('group:task_changed', {
        groupId,
        task,
        action,
        timestampMs: Date.now(),
      });
    });

    // --- Friend Events (Real-time Socket Notifications) ---
    socket.on('friend:request', (payload) => {
      console.log(`[Friend] Request from ${payload.sender?.name || 'User'} to ${payload.receiverId}`);
      if (payload.receiverId) {
        io.to(`user:${payload.receiverId}`).emit('friend:request_received', {
          requestId: payload.requestId || `freq-${Date.now()}`,
          sender: payload.sender,
          timestampMs: Date.now(),
        });
      }
    });

    socket.on('friend:accept', (payload) => {
      console.log(`[Friend] Accepted by ${payload.receiverId} for ${payload.senderId}`);
      if (payload.senderId) {
        io.to(`user:${payload.senderId}`).emit('friend:request_accepted', {
          friendshipId: payload.requestId || `fship-${Date.now()}`,
          friend: payload.receiverFriendData || { id: payload.receiverId },
          timestampMs: Date.now(),
        });
      }
      if (payload.receiverId) {
        io.to(`user:${payload.receiverId}`).emit('friend:request_accepted', {
          friendshipId: payload.requestId || `fship-${Date.now()}`,
          friend: payload.senderFriendData || { id: payload.senderId },
          timestampMs: Date.now(),
        });
      }
    });

    // --- Theme & Color Broadcast Events ---
    socket.on('user:color_update', ({ userId, themeColor }) => {
      console.log(`[Socket.IO Server] User ${userId} color changed to ${themeColor}`);
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
    socket.on('disconnect', (reason) => {
      if (socket.data.userId) {
        onlineUsers.delete(socket.data.userId);
        io.emit('presence:update', { onlineUserIds: Array.from(onlineUsers.keys()) });
      }
      console.log(`⚡ [Socket.IO Server] Client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  return io;
}

// Start Unified Server
export async function startServer() {
  await app.prepare();

  const httpServer = createServer((req, res) => {
    // Health check endpoint
    if (req.url === '/health' || req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', serverTime: Date.now(), time: new Date().toISOString() }));
      return;
    }

    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  setupSocketIO(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`🚀 [Unified Server] Next.js + Socket.IO running on port ${PORT} (dev: ${dev})`);
  });

  return httpServer;
}

// Direct execution
if (require.main === module) {
  startServer().catch((err) => {
    console.error('Fatal error starting unified server:', err);
    process.exit(1);
  });
}
