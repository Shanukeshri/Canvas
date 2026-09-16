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
import { prisma } from '../lib/db/prisma';
import { redis } from '../lib/redis';

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
  const onlineUsers = new Map<string, { socketIds: Set<string>; activeGroupId?: string; lastSeen: number }>();
  
  // Track active timers in memory for this server instance
  // (In a multi-node setup this would be purely in Redis, but we use memory+Redis here)
  const activeTimers = new Map<string, any>();

  // Background Worker: Flush active sessions from memory/Redis to Postgres every 5 minutes
  setInterval(async () => {
    try {
      if (redis) {
        let cursor = '0';
        do {
          const res = await redis.scan(cursor, 'MATCH', 'timer_state:*', 'COUNT', 100);
          cursor = res[0];
          const keys = res[1];
          if (keys.length > 0) {
            const values = await redis.mget(...keys);
            const batch = keys.map((key, idx) => {
              const userId = key.split(':')[1];
              const state = JSON.parse(values[idx] || '{}');
              return { userId, state };
            }).filter(item => item.state && item.state.mode);
            const existingStates = await prisma.timerState.findMany({
              where: { userId: { in: batch.map(b => b.userId) } },
              select: { userId: true, updatedAt: true }
            });
            const existingMap = new Map(existingStates.map(s => [s.userId, s.updatedAt]));
            
            const validBatch = batch.filter(({userId, state}) => {
              const stateTimestamp = state.timestampMs ? new Date(state.timestampMs) : new Date(0);
              const existingDate = existingMap.get(userId);
              return !existingDate || existingDate < stateTimestamp;
            });

            if (validBatch.length > 0) {
              await prisma.$transaction(
                validBatch.map(({userId, state}) => 
                  prisma.timerState.upsert({
                    where: { userId },
                    update: {
                      mode: state.mode,
                      status: state.status,
                      phase: state.phase,
                      durationMs: BigInt(state.durationMs || 0),
                      startedAtMs: state.startedAtMs ? BigInt(state.startedAtMs) : null,
                      pausedAtMs: state.pausedAtMs ? BigInt(state.pausedAtMs) : null,
                      elapsedDurationMs: BigInt(state.elapsedDurationMs || 0),
                    },
                    create: {
                      userId,
                      mode: state.mode,
                      status: state.status,
                      phase: state.phase,
                      durationMs: BigInt(state.durationMs || 0),
                      startedAtMs: state.startedAtMs ? BigInt(state.startedAtMs) : null,
                      pausedAtMs: state.pausedAtMs ? BigInt(state.pausedAtMs) : null,
                      elapsedDurationMs: BigInt(state.elapsedDurationMs || 0),
                    }
                  })
                )
              );
            }
          }
        } while (cursor !== '0');
      } else {
        if (activeTimers.size === 0) return;
        console.log(`[Cron] Flushing ${activeTimers.size} active sessions to Postgres...`);
        const entries = Array.from(activeTimers.entries());
        const BATCH_SIZE = 50;
        
        for (let i = 0; i < entries.length; i += BATCH_SIZE) {
          const batch = entries.slice(i, i + BATCH_SIZE);
          
          const existingStates = await prisma.timerState.findMany({
            where: { userId: { in: batch.map(b => b[0]) } },
            select: { userId: true, updatedAt: true }
          });
          const existingMap = new Map(existingStates.map(s => [s.userId, s.updatedAt]));
          
          const validBatch = batch.filter(([userId, state]) => {
            const stateTimestamp = state.timestampMs ? new Date(state.timestampMs) : new Date(0);
            const existingDate = existingMap.get(userId);
            return !existingDate || existingDate < stateTimestamp;
          });

          if (validBatch.length > 0) {
            await prisma.$transaction(
              validBatch.map(([userId, state]) => 
                prisma.timerState.upsert({
                  where: { userId },
                  update: {
                    mode: state.mode,
                    status: state.status,
                    phase: state.phase,
                    durationMs: BigInt(state.durationMs || 0),
                    startedAtMs: state.startedAtMs ? BigInt(state.startedAtMs) : null,
                    pausedAtMs: state.pausedAtMs ? BigInt(state.pausedAtMs) : null,
                    elapsedDurationMs: BigInt(state.elapsedDurationMs || 0),
                  },
                  create: {
                    userId,
                    mode: state.mode,
                    status: state.status,
                    phase: state.phase,
                    durationMs: BigInt(state.durationMs || 0),
                    startedAtMs: state.startedAtMs ? BigInt(state.startedAtMs) : null,
                    pausedAtMs: state.pausedAtMs ? BigInt(state.pausedAtMs) : null,
                    elapsedDurationMs: BigInt(state.elapsedDurationMs || 0),
                  }
                })
              )
            );
          }
        }
      }

      // Clear inactive users from memory
      for (const userId of activeTimers.keys()) {
        if (!onlineUsers.has(userId)) {
          activeTimers.delete(userId);
        }
      }
    } catch (err) {
      console.error('[Cron] Flush error:', err);
    }
  }, 5 * 60 * 1000);

  io.on('connection', (socket) => {
    console.log(`⚡ [Socket.IO Server] Client connected: ${socket.id}`);

    // User authentication / identification
    const registerUserSocket = (uid: string, groupId?: string) => {
      socket.data.userId = uid;
      socket.join(`user:${uid}`);
      const existing = onlineUsers.get(uid);
      const isNewOrChanged = !existing || !existing.socketIds.has(socket.id) || (groupId !== undefined && existing.activeGroupId !== groupId);
      
      if (!existing) {
        onlineUsers.set(uid, { socketIds: new Set([socket.id]), lastSeen: Date.now(), activeGroupId: groupId });
      } else {
        existing.socketIds.add(socket.id);
        existing.lastSeen = Date.now();
        if (groupId) existing.activeGroupId = groupId;
      }

      if (isNewOrChanged) {
        io.emit('presence:update', { onlineUserIds: Array.from(onlineUsers.keys()) });
      }
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
      if (socket.data.userId && payload) {
        activeTimers.set(socket.data.userId, payload);
        // Opportunistic high-frequency write to Redis
        if (redis) {
          // Use a long expiration (24 hours) so paused/idle states aren't lost
          redis.set(`timer_state:${socket.data.userId}`, JSON.stringify(payload), 'EX', 86400).catch(() => {});
        }
      }
      socket.broadcast.emit('timer:state_synced', payload);
    });

    socket.on('timer:event', (payload) => {
      // Only emit event_synced, don't duplicate state_synced
      socket.broadcast.emit('timer:event_synced', payload);
    });

    socket.on('timer:request_state', (payload) => {
      if (payload.targetUserId) {
        io.to(`user:${payload.targetUserId}`).emit('timer:state_requested', payload);
      }
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
      if (payload.receiverId) {
        io.to(`user:${payload.receiverId}`).emit('cowork:declined', {
          ...payload,
          timestampMs: Date.now(),
        });
      }
      if (payload.senderId) {
        io.to(`user:${payload.senderId}`).emit('cowork:declined', {
          ...payload,
          timestampMs: Date.now(),
        });
      }
    });

    socket.on('cowork:disconnect', (payload) => {
      if (payload.userId) {
        io.to(`user:${payload.userId}`).emit('cowork:disconnected', {
          ...payload,
          timestampMs: Date.now(),
        });
      }
      if (payload.targetUserId) {
        io.to(`user:${payload.targetUserId}`).emit('cowork:disconnected', {
          ...payload,
          timestampMs: Date.now(),
        });
      }
    });

    // --- Group Events ---
    socket.on('group:join', ({ groupId, user }) => {
      socket.join(`group:${groupId}`);
      const userInfo = onlineUsers.get(user.id) || {
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        color: user.color,
        socketIds: new Set([socket.id]),
        lastSeen: Date.now(),
        activeGroupId: groupId,
      };
      (userInfo as any).activeGroupId = groupId;
      onlineUsers.set(user.id, userInfo);

      // Collect existing active members in this group room
      const activePeers: any[] = [];
      for (const [uId, u] of onlineUsers.entries()) {
        if (u.activeGroupId === groupId && uId !== user.id) {
          activePeers.push({
            id: (u as any).userId || uId,
            name: (u as any).name,
            avatar: (u as any).avatar,
            color: (u as any).color,
            status: 'focusing',
            timerTime: '25:00',
            isConnected: true,
          });
          // Ask existing members to send their true live state to the newly joined member
          io.to(`user:${uId}`).emit('timer:state_requested', {
            requesterId: user.id,
            targetUserId: uId,
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
      socket.to(`group:${groupId}`).emit('group:task_changed', {
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
          friend: payload.receiverFriendData || ({ id: payload.receiverId } as any),
          timestampMs: Date.now(),
        });
      }
      if (payload.receiverId) {
        io.to(`user:${payload.receiverId}`).emit('friend:request_accepted', {
          friendshipId: payload.requestId || `fship-${Date.now()}`,
          friend: payload.senderFriendData || ({ id: payload.senderId } as any),
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
        const uid = socket.data.userId;
        const user = onlineUsers.get(uid);
        if (user) {
          user.socketIds.delete(socket.id);
          if (user.socketIds.size === 0) {
            // Gracefully pause or handle disconnect for active timer
            const timerState = activeTimers.get(uid);
            if (timerState) {
              if (timerState.status === 'running') {
                timerState.status = 'paused';
                timerState.pausedAtMs = Date.now();
                timerState.elapsedDurationMs = (timerState.elapsedDurationMs || 0) + (Date.now() - (timerState.startedAtMs || Date.now()));
                activeTimers.set(uid, timerState);
              }
              
              if (redis) {
                // Update final state in Redis (no TTL since they are offline, or long TTL)
                redis.set(`timer_state:${uid}`, JSON.stringify(timerState), 'EX', 86400).catch(() => {});
              }
            }

            if (user.activeGroupId) {
              io.to(`group:${user.activeGroupId}`).emit('group:member_left', {
                groupId: user.activeGroupId,
                userId: uid,
                timestampMs: Date.now(),
              });
            }
            onlineUsers.delete(uid);
            io.emit('presence:update', { onlineUserIds: Array.from(onlineUsers.keys()) });
          }
        }
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
