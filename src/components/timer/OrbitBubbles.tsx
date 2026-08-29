'use client';

import React, { useState, useRef } from 'react';
import { Friend } from '@/types';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface OrbitBubblesProps {
  attachedFriends: Friend[];
}

// Subdued, gentle ambient palettes for friend timers (less bright, calm & low-distraction)
const FRIEND_THEMES: Record<string, { primary: string; glow: string; text: string }> = {
  'friend-1': { primary: '#9d84c8', glow: '#7c3aed', text: '#bfaed8' }, // Muted lavender
  'friend-2': { primary: '#c97a3e', glow: '#c25e19', text: '#dfa77e' }, // Muted warm amber
  'friend-3': { primary: '#3ba27e', glow: '#10b981', text: '#7fc9af' }, // Muted soft emerald
  'friend-4': { primary: '#c75168', glow: '#be123c', text: '#dba0ae' }, // Muted rose
  'friend-5': { primary: '#458fa8', glow: '#0284c7', text: '#88bed1' }, // Muted cyan
};

const DEFAULT_OFFSETS = [
  { x: -380, y: -190 },
  { x: 380, y: 190 },
  { x: 370, y: -190 },
  { x: -370, y: 190 },
];

const FLOAT_CLASSES = ['zen-float-0', 'zen-float-1', 'zen-float-2', 'zen-float-3'];

export function OrbitBubbles({ attachedFriends }: OrbitBubblesProps) {
  const { toggleAttachFriend } = useApp();
  const { theme } = useTheme();

  // Dragging state for custom freeform placement
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingFriendId, setDraggingFriendId] = useState<string | null>(null);

  const dragRef = useRef<{
    friendId: string;
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    hasMoved: boolean;
  } | null>(null);

  if (!attachedFriends || attachedFriends.length === 0) return null;

  const handlePointerDown = (friendId: string, idx: number, e: React.PointerEvent<HTMLDivElement>) => {
    // Only left click / primary pointer
    if (e.button !== 0) return;

    const currentPos = positions[friendId] || DEFAULT_OFFSETS[idx % DEFAULT_OFFSETS.length];
    dragRef.current = {
      friendId,
      startX: e.clientX,
      startY: e.clientY,
      initX: currentPos.x,
      initY: currentPos.y,
      hasMoved: false,
    };
    setDraggingFriendId(friendId);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const { friendId, startX, startY, initX, initY } = dragRef.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      dragRef.current.hasMoved = true;
    }

    setPositions((prev) => ({
      ...prev,
      [friendId]: {
        x: initX + deltaX,
        y: initY + deltaY,
      },
    }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
      dragRef.current = null;
    }
    setDraggingFriendId(null);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-10">
      {attachedFriends.map((friend, idx) => {
        const isDragging = draggingFriendId === friend.id;
        const customPos = positions[friend.id];
        const defaultOffset = DEFAULT_OFFSETS[idx % DEFAULT_OFFSETS.length];
        const floatClass = !customPos && !isDragging ? FLOAT_CLASSES[idx % FLOAT_CLASSES.length] : '';

        const totalSeconds = (friend.timerMinutes || 25) * 60 + (friend.timerSeconds || 0);
        const progressFraction = Math.max(0.15, (totalSeconds % (25 * 60)) / (25 * 60));
        const strokeDashoffset = 301.59 - 301.59 * progressFraction;

        // Distinct harmonious subdued MD3 theme palette for each friend
        const themeTokens = FRIEND_THEMES[friend.id] || {
          primary: '#9d84c8',
          glow: '#7c3aed',
          text: '#bfaed8',
        };

        const currentPos = customPos || defaultOffset;

        return (
          <div
            key={friend.id}
            onPointerDown={(e) => handlePointerDown(friend.id, idx, e)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: customPos || isDragging
                ? `translate3d(${currentPos.x}px, ${currentPos.y}px, 0) translate(-50%, -50%)`
                : undefined,
              willChange: 'transform',
              touchAction: 'none',
            }}
            className={clsx(
              'pointer-events-auto group select-none transition-shadow',
              floatClass,
              isDragging ? 'cursor-grabbing z-40 scale-[1.03]' : 'cursor-grab hover:z-30'
            )}
            title="Drag to reposition friend timer"
          >
            {/* Friend Timer: Less bright, ambient, subtle glow */}
            <div
              className={clsx(
                'relative w-[230px] h-[230px] flex flex-col items-center justify-center select-none transition-all duration-300',
                isDragging ? 'opacity-90' : 'opacity-40 hover:opacity-80'
              )}
            >
              {/* Soft Ambient Glow (Subdued) */}
              <div
                className="absolute w-[180px] h-[180px] rounded-full blur-[60px] opacity-10 pointer-events-none transition-opacity duration-500 group-hover:opacity-20"
                style={{ backgroundColor: themeTokens.glow }}
              />

              {/* Close 'X' Button on Top Right inside circle on hover */}
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAttachFriend(friend.id);
                }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-surface-container-high/80 border border-outline-variant/50 hover:bg-error hover:text-white hover:border-error transition-all flex items-center justify-center text-on-surface-variant opacity-0 group-hover:opacity-100 z-30 shadow-sm cursor-pointer"
                title={`Remove ${friend.name} from canvas`}
                aria-label={`Remove ${friend.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* SVG Progress Circle Ring — Subdued Track and Arc */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-300 group-hover:scale-[1.01]"
                preserveAspectRatio="xMidYMid meet"
                viewBox="0 0 100 100"
              >
                {/* Outer track */}
                <circle
                  className="text-outline-variant opacity-20"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="0.75"
                />
                {/* Dynamic progress arc in friend's muted color */}
                <circle
                  className="transition-all duration-700 ease-out -rotate-90 origin-center opacity-50 group-hover:opacity-75"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="48"
                  stroke={themeTokens.primary}
                  strokeDasharray="301.59"
                  strokeDashoffset={strokeDashoffset}
                  strokeWidth="1.25"
                  strokeLinecap="round"
                />
              </svg>

              {/* Inside Content — Subdued Typography */}
              <div className="flex flex-col items-center justify-center z-10 space-y-sm pointer-events-none">
                {/* Friend Name Header */}
                <span className="font-label-md text-[11px] tracking-[0.25em] uppercase text-outline opacity-70 transition-colors group-hover:opacity-100">
                  {friend.name}
                </span>

                {/* Main Countdown Display — Subdued Brightness */}
                <span
                  className="font-timer-display text-[36px] leading-none tabular-nums tracking-tighter transition-all opacity-70 group-hover:opacity-95"
                  style={{ color: themeTokens.primary }}
                >
                  {friend.timerMinutes}:{friend.timerSeconds ? friend.timerSeconds.toString().padStart(2, '0') : '00'}
                </span>

                {/* Session Indicator Dots */}
                <div className="flex items-center gap-1.5 pt-1.5 opacity-50 group-hover:opacity-80">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={clsx(
                        'w-1.5 h-1.5 rounded-full transition-all',
                        i < 2 ? 'scale-105' : 'bg-outline-variant opacity-40'
                      )}
                      style={{
                        backgroundColor: i < 2 ? themeTokens.primary : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Hover Tooltip for Task Details */}
              <div className="absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-surface-container-lowest border border-outline-variant/60 px-3 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap shadow-[0_4px_20px_rgba(45,10,10,0.1)] pointer-events-none z-30">
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
