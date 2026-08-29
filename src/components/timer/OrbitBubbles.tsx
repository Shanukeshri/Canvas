'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Friend } from '@/types';
import { useApp } from '@/context/AppContext';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface OrbitBubblesProps {
  attachedFriends: Friend[];
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

export function OrbitBubbles({ attachedFriends }: OrbitBubblesProps) {
  const { toggleAttachFriend } = useApp();

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
        const initialX = Math.sin(phase) * 380;
        const initialY = (Math.sin(2 * phase) / 2) * 190;
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
  }, [attachedFriends]);

  // Main 60/120fps physics and avoidance simulation loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const simulate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05); // cap dt to prevent huge jumps
      lastTime = now;

      const w = typeof window !== 'undefined' ? window.innerWidth : 1440;
      const h = typeof window !== 'undefined' ? window.innerHeight : 800;

      // Dynamically measure the actual rendered radius of the main central timer
      const mainTimerEl = typeof document !== 'undefined' ? document.getElementById('main-timer-ring') : null;
      const mainTimerRadius = mainTimerEl ? mainTimerEl.getBoundingClientRect().width / 2 : (w > 1024 ? 295 : 230);
      const friendRadius = 135; // Bubble radius (~270px diameter)

      // Guaranteed dynamic clearance based on the EXACT size of the main timer:
      // At any main timer size, the two circles physically cannot overlap.
      const minCenterDist = mainTimerRadius + friendRadius + 30; // Hard clearance boundary
      const centerAvoidDist = minCenterDist + 75;                // Repulsion guidance zone

      // Viewport bounds relative to center (0, 0)
      const halfW = w / 2;
      const halfH = h / 2;
      const marginX = 140;
      const marginY = 140;
      const minX = -halfW + marginX;
      const maxX = halfW - marginX;
      const minY = -halfH + marginY;
      const maxY = halfH - marginY;

      // Dynamic scale for the infinity path adapted to screen and main timer size
      const ampX = Math.min(halfW - 160, Math.max(minCenterDist + 40, 520));
      const ampY = Math.min(halfH - 160, Math.max((minCenterDist + 40) * 0.52, 270));

      // Mutual bubble avoidance distance (two ~270px bubbles need >300px clearance)
      const bubbleAvoidDist = 340;
      const minBubbleDist = 280;

      const friendsList = Object.values(physicsRef.current);

      friendsList.forEach((body) => {
        if (body.isDragging) {
          // If being dragged, direct position control
          return;
        }

        // 1. Infinity Lemniscate Guidance Force (Very slow, serene pace ~60s loop)
        body.phase += 0.07 * dt;
        const targetX = Math.sin(body.phase) * ampX;
        const targetY = (Math.sin(2 * body.phase) / 2) * ampY;

        // Gentle spring driving force towards infinity path
        const kDrive = 0.45;
        const fxDrive = (targetX - body.x) * kDrive;
        const fyDrive = (targetY - body.y) * kDrive;

        let totalFx = fxDrive;
        let totalFy = fyDrive;

        // 2. Strong Central Main Timer Avoidance (Repulsion from 0, 0)
        const distFromCenter = Math.hypot(body.x, body.y);
        if (distFromCenter < centerAvoidDist) {
          const overlap = centerAvoidDist - distFromCenter;
          const nx = distFromCenter > 0 ? body.x / distFromCenter : 1;
          const ny = distFromCenter > 0 ? body.y / distFromCenter : 0;
          // Smooth progressive repulsion pushing strongly away from center
          const pushForce = (overlap / (centerAvoidDist - minCenterDist + 30)) * 650;
          totalFx += nx * pushForce;
          totalFy += ny * pushForce;
        }

        // 3. Mutual Friends Avoidance (Push away from each other)
        friendsList.forEach((other) => {
          if (other.id === body.id) return;
          const dx = body.x - other.x;
          const dy = body.y - other.y;
          const d = Math.hypot(dx, dy);
          if (d < bubbleAvoidDist && d > 0) {
            const overlap = bubbleAvoidDist - d;
            const nx = dx / d;
            const ny = dy / d;
            const push = (overlap / bubbleAvoidDist) * 450;
            totalFx += nx * push;
            totalFy += ny * push;
          }
        });

        // 4. Viewport Edge Boundaries Avoidance (Soft spring walls)
        if (body.x < minX) {
          totalFx += (minX - body.x) * 3.5;
        } else if (body.x > maxX) {
          totalFx += (maxX - body.x) * 3.5;
        }

        if (body.y < minY) {
          totalFy += (minY - body.y) * 3.5;
        } else if (body.y > maxY) {
          totalFy += (maxY - body.y) * 3.5;
        }

        // Integrate acceleration, apply smooth velocity damping for calm motion
        const damping = 0.92;
        body.vx = (body.vx + totalFx * dt) * damping;
        body.vy = (body.vy + totalFy * dt) * damping;

        // Cap maximum velocity for slow, peaceful drift
        const currentSpeed = Math.hypot(body.vx, body.vy);
        const maxSpeed = 70; // pixels per second cap
        if (currentSpeed > maxSpeed) {
          body.vx = (body.vx / currentSpeed) * maxSpeed;
          body.vy = (body.vy / currentSpeed) * maxSpeed;
        }

        // Update position
        body.x += body.vx * dt;
        body.y += body.vy * dt;

        // Hard minimum distance constraint from center
        const newDistFromCenter = Math.hypot(body.x, body.y);
        if (newDistFromCenter < minCenterDist && newDistFromCenter > 0) {
          const nx = body.x / newDistFromCenter;
          const ny = body.y / newDistFromCenter;
          body.x = nx * minCenterDist;
          body.y = ny * minCenterDist;
          // Deflect tangential velocity around center
          body.vx += -ny * 15;
          body.vy += nx * 15;
        }

        // Hard clamp inside viewport
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
          // Re-estimate phase from dropped angle so it continues infinity loop naturally
          const angle = Math.atan2(body.y, body.x);
          body.phase = angle;
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
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-20">
      {attachedFriends.map((friend) => {
        const isDragging = activeDragId === friend.id;
        const totalSeconds = (friend.timerMinutes || 25) * 60 + (friend.timerSeconds || 0);
        const progressFraction = Math.max(0.15, (totalSeconds % (25 * 60)) / (25 * 60));
        const strokeDashoffset = 301.59 - 301.59 * progressFraction;

        // Distinct harmonious theme palette matching main timer
        const themeTokens = FRIEND_THEMES[friend.id] || {
          primary: friend.color || '#c084fc',
          glow: friend.color || '#a855f7',
        };

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
            }}
            className={clsx(
              'pointer-events-auto group select-none',
              isDragging ? 'cursor-grabbing z-50 scale-[1.02]' : 'cursor-grab hover:z-40'
            )}
            title="Drag with hand or mouse to reposition • Floats slowly avoiding center and boundaries"
          >
            {/* Friend Timer: EXACT Same Look as Main Timer with its own theme color */}
            <div className="relative w-[240px] h-[240px] lg:w-[270px] lg:h-[270px] flex flex-col items-center justify-center select-none shrink-0">
              {/* Close 'X' Button on Top Right inside circle on hover */}
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAttachFriend(friend.id);
                }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-surface-container border border-surface-variant hover:bg-error hover:text-white hover:border-error transition-all flex items-center justify-center text-on-surface-variant opacity-0 group-hover:opacity-100 z-30 cursor-pointer"
                title={`Remove ${friend.name} from canvas`}
                aria-label={`Remove ${friend.name}`}
              >
                <X className="w-3 h-3" />
              </button>

              {/* SVG Progress Circle Ring — Identical Geometry & Stroke Styling to Main Timer */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-300 group-hover:scale-[1.008]"
                preserveAspectRatio="xMidYMid meet"
                viewBox="0 0 100 100"
              >
                {/* Outer track */}
                <circle
                  className="text-outline-variant opacity-30"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="0.6"
                />
                {/* Dynamic progress arc in friend's unique color */}
                <circle
                  className="-rotate-90 origin-center transition-all duration-700 ease-out"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="48"
                  stroke={themeTokens.primary}
                  strokeDasharray="301.59"
                  strokeDashoffset={strokeDashoffset}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>

              {/* Center Content — Matches Main Timer Typography & Proportions */}
              <div className="flex flex-col items-center justify-center z-10 space-y-1 pointer-events-none">
                {/* Name Header in Place of 'FOCUS' */}
                <span className="font-label-md text-xs md:text-sm text-outline tracking-[0.25em] uppercase transition-colors group-hover:text-primary">
                  {friend.name}
                </span>

                {/* Countdown Numbers in Friend's Theme Color */}
                <span
                  className="font-timer-display text-[46px] lg:text-[52px] leading-none tabular-nums tracking-tighter transition-all group-hover:opacity-95 font-light"
                  style={{ color: themeTokens.primary }}
                >
                  {friend.timerMinutes}:{friend.timerSeconds ? friend.timerSeconds.toString().padStart(2, '0') : '00'}
                </span>

                {/* Session Indicator Dots matching Main Timer */}
                <div className="flex items-center gap-1.5 pt-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={clsx(
                        'w-1.5 h-1.5 rounded-full transition-all',
                        i < 2 ? 'scale-125' : 'bg-outline-variant'
                      )}
                      style={{
                        backgroundColor: i < 2 ? themeTokens.primary : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Hover Tooltip for Task Details */}
              <div className="absolute top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-surface-container-low border border-surface-variant px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shadow-sm pointer-events-none z-30">
                <span className="text-on-surface-variant">Task: </span>
                <span style={{ color: themeTokens.primary }}>{friend.currentTask || 'Focusing quietly'}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
