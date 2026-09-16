# Git Changes Audit (HEAD vs Working Tree)

This document provides a detailed breakdown of all changes made in the repository since the last commit, analyzing both **what** was changed and **why**.

## 1. Architecture & Infrastructure

### Unified Server (Next.js + Socket.IO)
- **What**: Deleted the standalone `src/server/socket-server.ts` (`-308` lines) and merged all Socket.IO logic directly into the main `src/server/server.ts` (`+254` lines). Removed the `socket` startup script from `package.json`. Made `NEXT_PUBLIC_SOCKET_URL` and `SOCKET_PORT` optional in `env.ts`.
- **Why**: Simplifies deployment and development by running the Next.js application and the WebSocket server within a single Node process, removing the overhead of managing and scaling a secondary server.

### Redis & Background Cron Job for Timer State
- **What**: Implemented a 5-minute background interval in `server.ts` that batches active timer sessions from Redis/memory and flushes them to the PostgreSQL database via `upsert`. Modified `saveTimerStateCheckpointAction` (`src/features/timer/actions.ts`) to write primarily to Redis with an expiration, falling back to DB if Redis is unavailable.
- **Why**: Significantly reduces database write load. Instead of the client constantly hammering the SQL database on every timer tick or state change, state is quickly cached in Redis (or server memory) and lazily persisted in bulk.

## 2. Multi-Tab Synchronization & Leader Election

- **What**: Added a `LeaderElection` class to `src/lib/broadcast.ts` utilizing the `BroadcastChannel`. Updated `useRealtime.ts` and `AppContext.tsx` to check `leaderElection.isLeader` before executing authoritative actions. 
- **Why**: When a user opens the application in multiple browser tabs, all tabs were previously firing identical socket events (`presence:heartbeat`, `timer:sync_state`) and executing identical DB writes (`recordFocusSessionAction`). Leader election ensures that only one "Leader Tab" communicates authoritative state to the server, preventing duplicate data and race conditions.

## 3. Realtime Data Fetching & State Management

- **What**: Removed the manual `setInterval` polling for friends and notifications in `src/hooks/useRealtime.ts` and replaced it with `@tanstack/react-query` hooks. Added explicit query cache invalidation inside Socket.IO event listeners (e.g., `handleFriendRequestAccepted`, `handleGroupInviteReceived`). Removed `revalidatePath('/app')` from all Server Actions (`friends/actions.ts`, `groups/actions.ts`, `tasks/actions.ts`, `users/actions.ts`). 
- **Why**: Modernizes the client-side data fetching architecture. `react-query` handles caching, deduping, and background refetching much better than raw `setInterval` polling. Removing `revalidatePath` acknowledges that the application now entirely relies on client-side state / Socket events for live UI updates, eliminating unnecessary server-side rendering loads.

## 4. Robust Socket Connectivity & Session Management

- **What**: 
  - `server.ts`: Tracks `onlineUsers` using a `Set` of `socketIds` per user rather than overwriting a single `socketId` string.
  - `server.ts`: On socket disconnect, checks if the user has 0 active sockets left. If so, it automatically pauses their running timer and emits a "left group" event. 
  - `socket-client.ts`: If the authenticated `userId` changes, it explicitly calls `socket.disconnect()` and creates a new socket instance rather than just mutating connection options.
  - `AppContext.tsx`: Explicitly disconnects the socket on user logout.
- **Why**: Fixes "ghost presence" bugs where a user appears online or focusing after they closed their laptop or logged out. Handling multiple sockets prevents one tab from disconnecting another tab's session.

## 5. Logic Bug Fixes & Transaction Safety

- **What**: 
  - `src/features/timer/timer-engine.ts`: Added a `lastTickAtMs` property. If `now - lastTickAtMs > 60000ms`, the engine treats the session as a "phantom run" and forcibly pauses it at the last known tick.
  - `src/features/groups/actions.ts` & `src/features/users/actions.ts`: Wrapped database mutations in `prisma.$transaction(async (tx) => { ... })`. 
  - `src/features/statistics/queries.ts`: Fixed the "today" timeRange filter to use a SQL-level `gte` date check instead of fetching all historical sessions and filtering in JavaScript.
  - `src/features/tasks/actions.ts`: Changed `toggleTaskCompleteAction` to take a specific `targetState` boolean instead of blindly negating the server's current state.
- **Why**: 
  - The timer fix prevents timers from improperly counting time while a laptop is asleep or a browser tab is aggressively throttled.
  - Database transactions ensure that if a complex action (like accepting a group invite or updating preferences and presets) fails halfway, no corrupted partial state is saved.
  - The statistics query fix prevents severe memory leaks and slow page loads for users with thousands of past sessions.
  - Explicit task targeting prevents race conditions if multiple clicks/tabs attempt to complete a task simultaneously.

## 6. UI/UX Improvements

- **What**:
  - `src/components/landing/ProductLandingPage.tsx`: Redesigned the Hero segment. Replaced static text headers with a massive, interactive focal timer component. Added fade-in/fade-out scroll animations for the navigation bar and side pagination.
  - `src/components/layout/Sidebar.tsx`: The dark mode toggle now calls `saveUserPreferences` to persist the chosen theme to the database.
  - Auth APIs (`src/app/api/auth/...`): The login, register, and status routes now eagerly return the user's `timerState` in their payload.
- **Why**: Creates a more premium and dynamic aesthetic for the landing page. Persisting the theme prevents a flash of incorrect colors on reload. Returning `timerState` during authentication ensures the frontend UI immediately reflects the correct timer (running/paused/elapsed) without waiting for a subsequent socket sync roundtrip.
