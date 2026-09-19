'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Friend } from '@/types';
import { useApp } from '@/context/AppContext';
import { hexToRgb, mixColor } from '@/lib/theme-utils';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { getSocket } from '@/lib/socket/socket-client';
import { tabSync } from '@/lib/broadcast';

interface OrbitBubblesProps {
  attachedFriends: Friend[];
  compact?: boolean;
}

// Distinct theme color tokens for each friend matching the main timer's aesthetic
const FRIEND_THEMES: Record<string, { primary: string; glow: string }> = {
  'friend-1': { primary: '#c084fc', glow: '#a855f7' }, // Sarah Chen: Soft Violet
  'friend-2': { primary: '#fb923c', glow: '#f97316' }, // David Kim: Warm Amber
  'friend-3': { primary: '#34d399', glow: '#10b981' }, // Elena Rostova: Emerald
  'friend-4': { primary: '#f43f5e', glow: '#e11d48' }, // Marcus Vance: Rose
  'friend-5': { primary: '#38bdf8', glow: '#0ea5e9' }, // Cyan
};

interface BubblePhysics {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  isDragging: boolean;
}

export function OrbitBubbles({ attachedFriends, compact = false }: OrbitBubblesProps) {
  const { toggleAttachFriend, setAttachedFriendIds, currentUser } = useApp();
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Re-render interval for high-precision live friend seconds
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => (t + 1) % 10000), 500);
    return () => clearInterval(interval);
  }, []);

  const handleConfirmRemove = (friendId: string) => {
    // 1. Remove locally
    setAttachedFriendIds((prev) => prev.filter((id) => id !== friendId));
    setConfirmingRemoveId(null);

    // 2. Terminate connection from both sides via socket
    try {
      const socket = getSocket();
      socket.emit('cowork:disconnect', {
        userId: currentUser?.id || 'user-default',
        targetUserId: friendId,
      });
    } catch {}

    // 3. Terminate via broadcast for multi-tab
    tabSync.publish({
      type: 'COWORK_DISCONNECT_SYNC',
      payload: { targetFriendId: friendId },
      userId: currentUser?.id || '',
    });
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleDomRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const physicsRef = useRef<Record<string, BubblePhysics>>({});
  const activeDragIdRef = useRef<string | null>(null);
  const dragOffsetRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Initialize and synchronize physics state when attached friends change
  useEffect(() => {
    const total = attachedFriends.length;
    attachedFriends.forEach((friend, idx) => {
      if (!physicsRef.current[friend.id]) {
        // Distribute initial phase evenly along the infinity lemniscate
        const phase = (idx / Math.max(1, total)) * Math.PI * 2;
        const initialX = Math.sin(phase) * (compact ? 190 : 340);
        const initialY = (Math.sin(2 * phase) / 2) * (compact ? 110 : 170);
        physicsRef.current[friend.id] = {
          id: friend.id,
          x: initialX,
          y: initialY,
          vx: 0,
          vy: 0,
          phase,
          isDragging: false,
        };
      }
    });

    // Clean up removed friends
    Object.keys(physicsRef.current).forEach((id) => {
      if (!attachedFriends.some((f) => f.id === id)) {
        delete physicsRef.current[id];
      }
    });
  }, [attachedFriends, compact]);

  // Main 60/120fps physics and avoidance simulation loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const simulate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05); // cap dt to prevent huge jumps
      lastTime = now;

      // 1. LIVE DYNAMIC CONTAINER MEASUREMENTS
      const containerEl = containerRef.current;
      const containerRect = containerEl ? containerEl.getBoundingClientRect() : null;
      const w = containerRect && containerRect.width > 50 ? containerRect.width : (typeof window !== 'undefined' ? (compact ? window.innerWidth * 0.6 : window.innerWidth) : 900);
      const h = containerRect && containerRect.height > 50 ? containerRect.height : (typeof window !== 'undefined' ? window.innerHeight * 0.85 : 700);
      const halfW = w / 2;
      const halfH = h / 2;

      // 2. LIVE DYNAMIC MAIN TIMER MEASUREMENT
      const mainTimerEl = typeof document !== 'undefined' ? document.getElementById('main-timer-ring') : null;
      const mainTimerRect = mainTimerEl ? mainTimerEl.getBoundingClientRect() : null;
      const mainTimerRadius = mainTimerRect && mainTimerRect.width > 20 ? mainTimerRect.width / 2 : (compact ? 130 : 180);

      // 3. LIVE DYNAMIC INDIVIDUAL BUBBLE RADII
      const friendsList = Object.values(physicsRef.current);
      const liveBubbleRadii: Record<string, number> = {};
      friendsList.forEach((body) => {
        const dom = bubbleDomRefs.current[body.id];
        if (dom) {
          const rect = dom.getBoundingClientRect();
          liveBubbleRadii[body.id] = rect.width > 20 ? rect.width / 2 : (compact ? 75 : 105);
        } else {
          liveBubbleRadii[body.id] = compact ? 75 : 105;
        }
      });

      friendsList.forEach((body) => {
        if (body.isDragging) {
          return;
        }

        const r_i = liveBubbleRadii[body.id] || (compact ? 75 : 105);
        const margin = 16;
        const minX = -halfW + r_i + margin;
        const maxX = halfW - r_i - margin;
        const minY = -halfH + r_i + margin;
        const maxY = halfH - r_i - margin;

        // Dynamic clearance boundaries based on live main timer size + live bubble size
        const minCenterDist = mainTimerRadius + r_i + 16;
        const centerAvoidDist = minCenterDist + 35;

        // Dynamic scale for the guidance orbit path adapted to live container bounds
        // On horizontally wide viewports, ampX gives plenty of side clearance
        const ampX = Math.max(minCenterDist + 15, Math.min(maxX - 10, minCenterDist + 55));
        // Clamp ampY to safe vertical bounds so the guidance curve NEVER steers towards ceiling/floor pinch points
        const maxSafeY = Math.max(20, maxY - 15);
        const ampY = Math.min(maxSafeY, Math.max(25, maxY * 0.55));

        // 1. Guidance Force along smooth side-elongated figure-8
        body.phase += 0.07 * dt;
        const targetX = Math.sin(body.phase) * ampX;
        const targetY = (Math.sin(2 * body.phase) / 2) * ampY;

        const kDrive = 0.45;
        const fxDrive = (targetX - body.x) * kDrive;
        const fyDrive = (targetY - body.y) * kDrive;

        let totalFx = fxDrive;
        let totalFy = fyDrive;

        // 2. Center Timer Clearance Guidance:
        // If distance < centerAvoidDist, gently push away at a calm, serene pace.
        const distFromCenter = Math.hypot(body.x, body.y);
        if (distFromCenter < centerAvoidDist && distFromCenter > 0.001) {
          const overlap = centerAvoidDist - distFromCenter;
          let nx = body.x / distFromCenter;
          let ny = body.y / distFromCenter;

          // If vertical room is tight (|y| approaching maxY), gently bias horizontal clearance without violent sideways snap
          if (Math.abs(body.y) > maxY * 0.75) {
            const sideSign = body.x >= 0 ? 1 : -1;
            nx = (nx + sideSign * 0.4) / 1.4;
            ny *= 0.5;
          }

          // Gentle, progressive repulsion (reduced from 600 down to 140 for slow, graceful movement)
          const pushForce = Math.min(140, (overlap / (centerAvoidDist - minCenterDist + 30)) * 120);
          totalFx += nx * pushForce;
          totalFy += ny * pushForce;

          // Gentle tangential guidance around timer
          totalFx += -ny * 15;
          totalFy += nx * 15;
        }

        // 3. Mutual Live Friends Avoidance (Using live measured radii of both bubbles)
        friendsList.forEach((other) => {
          if (other.id === body.id) return;
          const r_other = liveBubbleRadii[other.id] || (compact ? 75 : 105);
          const liveAvoidDist = r_i + r_other + 16;

          const dx = body.x - other.x;
          const dy = body.y - other.y;
          const d = Math.hypot(dx, dy);
          if (d < liveAvoidDist && d > 0) {
            const overlap = liveAvoidDist - d;
            const nx = dx / d;
            const ny = dy / d;
            const push = (overlap / liveAvoidDist) * 350;
            totalFx += nx * push;
            totalFy += ny * push;
          }
        });

        // 4. Viewport Live Edge Boundaries Avoidance (Soft spring walls)
        if (body.x < minX) {
          totalFx += (minX - body.x) * 4.0;
          if (body.vx < 0) body.vx *= 0.7;
        } else if (body.x > maxX) {
          totalFx += (maxX - body.x) * 4.0;
          if (body.vx > 0) body.vx *= 0.7;
        }

        if (body.y < minY) {
          totalFy += (minY - body.y) * 4.0;
          if (body.vy < 0) body.vy *= 0.7;
        } else if (body.y > maxY) {
          totalFy += (maxY - body.y) * 4.0;
          if (body.vy > 0) body.vy *= 0.7;
        }

        // Integrate acceleration, apply smooth velocity damping for calm motion
        const damping = 0.90;
        body.vx = (body.vx + totalFx * dt) * damping;
        body.vy = (body.vy + totalFy * dt) * damping;

        // Cap maximum velocity for slow, peaceful drift
        const currentSpeed = Math.hypot(body.vx, body.vy);
        const maxSpeed = 50; // pixels per second cap for calm, slower drift
        if (currentSpeed > maxSpeed) {
          body.vx = (body.vx / currentSpeed) * maxSpeed;
          body.vy = (body.vy / currentSpeed) * maxSpeed;
        }

        // Update position
        body.x += body.vx * dt;
        body.y += body.vy * dt;

        // 5. SMOOTH CONSTRAINT RELAXATION (Gentle outward relaxation instead of instantaneous snap)
        const currentDist = Math.hypot(body.x, body.y);
        if (currentDist < minCenterDist && currentDist > 0.001) {
          const penetration = minCenterDist - currentDist;
          // Smooth relaxation step: gently push outwards along radial vector by a fraction of penetration per frame
          const easeStep = Math.min(penetration * 0.08, 1.8);
          const nx = body.x / currentDist;
          const ny = body.y / currentDist;

          body.x += nx * easeStep;
          body.y += ny * easeStep;

          // Dampen any radial velocity pointing inwards towards the timer
          const dotRadial = body.vx * nx + body.vy * ny;
          if (dotRadial < 0) {
            body.vx -= dotRadial * nx;
            body.vy -= dotRadial * ny;
          }
          body.vx += nx * 6 * dt;
          body.vy += ny * 6 * dt;
        }

        // Clamp strictly inside viewport bounds
        body.x = Math.max(minX, Math.min(maxX, body.x));
        body.y = Math.max(minY, Math.min(maxY, body.y));
      });

      // Update DOM elements transforms directly for 60/120fps smooth motion
      friendsList.forEach((body) => {
        const dom = bubbleDomRefs.current[body.id];
        if (dom) {
          dom.style.transform = `translate3d(${body.x}px, ${body.y}px, 0) translate(-50%, -50%)`;
        }
      });

      animId = requestAnimationFrame(simulate);
    };

    animId = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Global Pointer Event Listeners for smooth dragging & dropping
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      const activeId = activeDragIdRef.current;
      if (!activeId) return;

      const body = physicsRef.current[activeId];
      if (!body) return;

      const { startX, startY, initX, initY } = dragOffsetRef.current;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      body.x = initX + deltaX;
      body.y = initY + deltaY;
      body.vx = 0;
      body.vy = 0;

      // Update DOM transform immediately
      const dom = bubbleDomRefs.current[activeId];
      if (dom) {
        dom.style.transform = `translate3d(${body.x}px, ${body.y}px, 0) translate(-50%, -50%)`;
      }
    };

    const handleGlobalPointerUp = () => {
      const activeId = activeDragIdRef.current;
      if (activeId) {
        const body = physicsRef.current[activeId];
        if (body) {
          body.isDragging = false;
          // Re-estimate phase from dropped angle so it continues guidance orbit naturally
          const angle = Math.atan2(body.y, body.x);
          body.phase = angle;
          // Zero velocity upon release so it doesn't fling
          body.vx = 0;
          body.vy = 0;
        }
        activeDragIdRef.current = null;
        setActiveDragId(null);
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: true });
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, []);

  if (!attachedFriends || attachedFriends.length === 0) return null;

  const handlePointerDown = (friendId: string, e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();

    const body = physicsRef.current[friendId];
    if (!body) return;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    body.isDragging = true;
    activeDragIdRef.current = friendId;
    dragOffsetRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: body.x,
      initY: body.y,
    };
    setActiveDragId(friendId);
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-35"
    >
      {attachedFriends.map((friend) => {
        const isDragging = activeDragId === friend.id;

        // High-precision remaining seconds: use exact targetCompletionMs if running timer, or startedAtMs if running stopwatch
        const isFriendFocusing = friend.status === 'focusing' || friend.isFocusing === true;
        const isFriendBreak = friend.status === 'break';
        const isFriendOffline = friend.status === 'offline';
        const isInactive = !isFriendFocusing && !isFriendBreak;
        const isFriendStopwatch = friend.timerType === 'stopwatch' || friend.mode === 'stopwatch';

        let totalSeconds = 0;
        if (isFriendStopwatch) {
          // Stopwatch counts UP from startedAtMs or elapsedDurationMs, never negative
          if (isFriendFocusing && friend.startedAtMs) {
            const elapsedMs = Math.max(0, Date.now() - friend.startedAtMs);
            totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
          } else if (friend.elapsedDurationMs !== undefined) {
            totalSeconds = Math.max(0, Math.floor(friend.elapsedDurationMs / 1000));
          } else if (friend.currentTimeMs !== undefined) {
            totalSeconds = Math.max(0, Math.floor(friend.currentTimeMs / 1000));
          } else {
            totalSeconds = Math.max(0, (friend.timerMinutes ?? 0) * 60 + (friend.timerSeconds ?? 0));
          }
        } else {
          // Timer counts DOWN from targetCompletionMs or remainingMs, never negative
          if (isFriendFocusing && friend.targetCompletionMs) {
            const remMs = Math.max(0, friend.targetCompletionMs - Date.now());
            totalSeconds = Math.max(0, Math.ceil(remMs / 1000));
          } else if (friend.remainingMs !== undefined && !isFriendFocusing) {
            totalSeconds = Math.max(0, Math.ceil(friend.remainingMs / 1000));
          } else {
            totalSeconds = Math.max(0, (friend.timerMinutes ?? 25) * 60 + (friend.timerSeconds ?? 0));
          }
        }

        const displayMinutes = Math.floor(totalSeconds / 60);
        const displaySeconds = totalSeconds % 60;

        const totalDurationSec = friend.durationMs ? Math.round(friend.durationMs / 1000) : 25 * 60;
        const progressFraction = isFriendStopwatch
          ? Math.max(0.05, Math.min(1, (totalSeconds % 60) / 60))
          : Math.max(0.05, Math.min(1, totalSeconds / Math.max(1, totalDurationSec)));
        const strokeDashoffset = Math.max(0, 301.59 - 301.59 * progressFraction);

        // Use live broadcasted friend theme color with fallback
        const friendColor = isFriendOffline
          ? 'var(--outline)'
          : isFriendBreak
          ? '#34d399'
          : (friend.color || FRIEND_THEMES[friend.id]?.primary || '#c084fc');
        // Theme-tinted white for countdown digits matching main timer's --timer-digits aesthetic
        const friendDigitsColor = (isInactive || isFriendOffline)
          ? 'var(--outline)'
          : mixColor({ r: 248, g: 248, b: 252 }, hexToRgb(friendColor), 0.48);

        return (
          <div
            key={friend.id}
            ref={(el) => {
              bubbleDomRefs.current[friend.id] = el;
            }}
            onPointerDown={(e) => handlePointerDown(friend.id, e)}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate3d(0, 0, 0) translate(-50%, -50%)',
              willChange: 'transform',
              touchAction: 'none',
              userSelect: 'none',
              opacity: isFriendOffline ? 0.35 : 1,
              filter: isFriendOffline ? 'grayscale(0.7)' : 'none',
              transition: 'opacity 0.5s ease, filter 0.5s ease',
            }}
            className={clsx(
              'pointer-events-auto group select-none',
              isDragging ? 'cursor-grabbing z-50 scale-[1.02]' : 'cursor-grab hover:z-40'
            )}
            title="Drag with hand or mouse to reposition • Floats slowly avoiding center and boundaries"
          >
            {/* Friend Timer: Scaled appropriately for compact and regular views */}
            <div
              className={clsx(
                'relative flex flex-col items-center justify-center select-none shrink-0 transition-transform',
                compact
                  ? 'w-[150px] h-[150px] md:w-[160px] md:h-[160px]'
                  : 'w-[210px] h-[210px] lg:w-[230px] lg:h-[230px]'
              )}
            >
              {/* Subtle Tinted Inner Disc matching Main Timer */}
              <div
                className="absolute inset-3 rounded-full border border-surface-variant/20 pointer-events-none transition-colors opacity-[0.025]"
                style={{ backgroundColor: friendColor }}
              />

              {/* Confirm Removal Popover or 'X' Button */}
              {confirmingRemoveId === friend.id ? (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-2 rounded-full bg-surface-container-lowest/95 backdrop-blur-md border border-rose-500/40 p-2.5 flex flex-col items-center justify-center z-40 animate-in fade-in zoom-in-95 duration-150 text-center select-none"
                >
                  <p className="text-[11px] font-bold text-on-surface mb-0.5">Confirm?</p>
                  <p className="text-[9px] text-outline mb-2">Disconnect both</p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmingRemoveId(null)}
                      className="px-2 py-0.5 rounded-lg text-[10px] text-outline hover:text-on-surface border border-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmRemove(friend.id)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-xs cursor-pointer"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmingRemoveId(friend.id);
                  }}
                  className={clsx(
                    'absolute rounded-full bg-surface-container border border-surface-variant hover:bg-error hover:text-white hover:border-error transition-all flex items-center justify-center text-on-surface-variant opacity-0 group-hover:opacity-100 z-30 cursor-pointer',
                    compact ? 'top-1 right-1 w-5 h-5 text-[10px]' : 'top-2 right-2 w-6 h-6'
                  )}
                  title={`Remove ${friend.name} from canvas`}
                  aria-label={`Remove ${friend.name}`}
                >
                  <X className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                </button>
              )}

              {/* SVG Progress Circle Ring */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-300 group-hover:scale-[1.008]"
                preserveAspectRatio="xMidYMid meet"
                viewBox="0 0 100 100"
              >
                {/* Outer track */}
                <circle
                  cx="50"
                  cy="50"
                  fill="none"
                  r="48"
                  stroke={isInactive ? 'var(--outline)' : friendColor}
                  strokeOpacity={isInactive ? 0.15 : 0.22}
                  strokeWidth="0.75"
                />
                {/* Dynamic progress arc */}
                <circle
                  className={clsx(
                    "-rotate-90 origin-center transition-all duration-700 ease-out",
                    isInactive && "opacity-35"
                  )}
                  cx="50"
                  cy="50"
                  fill="none"
                  r="48"
                  stroke={isInactive ? 'var(--outline)' : friendColor}
                  strokeDasharray="301.59"
                  strokeDashoffset={strokeDashoffset}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>

              {/* Center Content */}
              <div className="flex flex-col items-center justify-center z-10 space-y-0.5 pointer-events-none">
                {/* Name Header in Friend Theme Accent */}
                <span
                  className={clsx(
                    "font-label-md uppercase transition-colors font-medium truncate max-w-[110px] text-center",
                    compact ? "text-[10px] md:text-[11px] tracking-[0.16em]" : "text-xs md:text-sm tracking-[0.25em]",
                    isInactive ? "text-outline" : "group-hover:opacity-90"
                  )}
                  style={{ color: isInactive ? 'var(--outline)' : friendColor }}
                >
                  {friend.name}
                </span>

                {/* Countdown Numbers */}
                <span
                  className={clsx(
                    "font-timer-display leading-none tabular-nums tracking-tighter transition-all group-hover:opacity-95 font-light",
                    compact ? "text-[28px] md:text-[32px]" : "text-[42px] lg:text-[48px]",
                    isInactive && "opacity-50"
                  )}
                  style={{ color: friendDigitsColor }}
                >
                  {displayMinutes}:{displaySeconds.toString().padStart(2, '0')}
                </span>

                {/* Session Indicator Dots / Offline Label */}
                {isFriendOffline ? (
                  <span
                    className={clsx(
                      "font-label-md uppercase font-semibold tracking-[0.15em] text-outline",
                      compact ? "text-[8px] pt-0.5" : "text-[10px] pt-1"
                    )}
                  >
                    OFFLINE
                  </span>
                ) : (
                <div className={clsx("flex items-center", compact ? "gap-1 pt-0.5" : "gap-1.5 pt-1.5")}>
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={clsx(
                        'rounded-full transition-all',
                        compact ? 'w-1 h-1' : 'w-1.5 h-1.5',
                        i < 2 ? 'scale-125' : 'opacity-30'
                      )}
                      style={{
                        backgroundColor: i < 2 ? friendColor : 'var(--outline-variant)',
                      }}
                    />
                  ))}
                </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
