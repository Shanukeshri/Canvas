'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Bell, Check, X, Clock, Users, Award } from 'lucide-react';
import clsx from 'clsx';

export function NotificationsOverlay() {
  const { overlay, closeOverlay, notifications, markNotificationRead } = useApp();

  if (overlay !== 'notifications') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-zen-card border border-zen-border rounded-3xl p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zen-border pb-3">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-zen-accent" />
            <h2 className="text-lg font-semibold text-zen-text">Notifications</h2>
          </div>
          <button
            onClick={closeOverlay}
            className="p-1 rounded-xl text-zen-text-muted hover:text-zen-text hover:bg-zen-surface transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex flex-col gap-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationRead(notif.id)}
              className={clsx(
                'p-4 rounded-2xl border transition-all cursor-pointer flex gap-3.5',
                notif.read
                  ? 'border-zen-border bg-zen-surface/40 opacity-70'
                  : 'border-zen-accent/40 bg-zen-accent-subtle/40 shadow-sm'
              )}
            >
              <div className="p-2 rounded-xl bg-zen-surface border border-zen-border text-zen-accent flex-shrink-0 h-fit">
                {notif.type === 'group_invite' ? (
                  <Users className="w-4 h-4" />
                ) : notif.type === 'timer_complete' ? (
                  <Award className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zen-text">{notif.title}</span>
                  <span className="text-[11px] text-zen-text-muted">{notif.time}</span>
                </div>
                <p className="text-xs text-zen-text-muted leading-relaxed">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
