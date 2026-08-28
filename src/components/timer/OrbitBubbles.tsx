'use client';

import React from 'react';
import { Friend } from '@/types';
import clsx from 'clsx';

interface OrbitBubblesProps {
  attachedFriends: Friend[];
}

export function OrbitBubbles({ attachedFriends }: OrbitBubblesProps) {
  if (!attachedFriends || attachedFriends.length === 0) return null;

  // Orbital radius distance from central timer ring
  const radius = 230;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {attachedFriends.map((friend, index) => {
        const total = attachedFriends.length;
        const angleDeg = (360 / total) * index - 90;
        const angleRad = (angleDeg * Math.PI) / 180;
        const x = Math.cos(angleRad) * radius;
        const y = Math.sin(angleRad) * radius;

        return (
          <div
            key={friend.id}
            className="absolute pointer-events-auto transition-all duration-700 ease-out transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
            }}
          >
            {/* Orbital card */}
            <div
              className="relative flex items-center gap-2 px-3 py-1.5 rounded-full border border-outline-variant bg-surface-container-lowest shadow-[0_4px_20px_rgba(45,10,10,0.06)] backdrop-blur-md transition-transform group-hover:scale-105"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white font-bold flex-shrink-0 shadow-sm"
                style={{ backgroundColor: friend.color }}
              >
                {friend.avatar}
              </div>

              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-md text-label-md font-medium text-on-surface leading-none">{friend.name}</span>
                  <span
                    className={clsx(
                      'w-1.5 h-1.5 rounded-full',
                      friend.status === 'focusing' ? 'bg-primary' : 'bg-secondary'
                    )}
                  />
                </div>
                <span className="text-[11px] font-mono text-on-surface-variant leading-tight">
                  {friend.timerMinutes}:{friend.timerSeconds ? friend.timerSeconds.toString().padStart(2, '0') : '00'}
                </span>
              </div>
            </div>

            {/* Hover Tooltip Task */}
            <div className="absolute top-full mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-container-lowest border border-outline-variant px-2.5 py-1 rounded-lg text-label-md text-on-surface font-medium whitespace-nowrap shadow-[0_4px_20px_rgba(45,10,10,0.08)]">
              {friend.currentTask || 'Focusing quietly'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
