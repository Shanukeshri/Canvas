'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { ImmersiveTimer } from '@/components/timer/ImmersiveTimer';
import { ZenTodosPage } from '@/components/todos/ZenTodosPage';
import { ZenGroupsPage } from '@/components/groups/ZenGroupsPage';

// Overlays
import { TimerSettingsOverlay } from '@/components/overlays/TimerSettingsOverlay';
import { SoundMixerOverlay } from '@/components/overlays/SoundMixerOverlay';
import { StatisticsOverlay } from '@/components/overlays/StatisticsOverlay';
import { SettingsOverlay } from '@/components/overlays/SettingsOverlay';
import { ProfileOverlay } from '@/components/overlays/ProfileOverlay';
import { FriendsOverlay } from '@/components/overlays/FriendsOverlay';
import { NotificationsOverlay } from '@/components/overlays/NotificationsOverlay';
import { TaskDetailOverlay } from '@/components/overlays/TaskDetailOverlay';

export function MainAppCanvas({ onBackToLanding }: { onBackToLanding?: () => void }) {
  const { activeTab } = useApp();

  return (
    <div className="relative flex min-h-screen w-full bg-zen-bg text-zen-text overflow-hidden selection:bg-zen-accent selection:text-white">
      {/* Collapsed Sidebar Navigation */}
      <Sidebar />

      {/* Main Focus Canvas Area */}
      <main className="flex-1 ml-16 min-h-screen relative flex flex-col">
        {onBackToLanding && (
          <div className="absolute top-4 right-6 z-30">
            <button
              onClick={onBackToLanding}
              className="px-3.5 py-1.5 rounded-full border border-zen-border bg-zen-surface/60 backdrop-blur-md text-xs font-semibold text-zen-text-muted hover:text-zen-text hover:border-zen-accent transition-all"
            >
              ← Back to Product Story
            </button>
          </div>
        )}

        {/* Primary Page Render */}
        {activeTab === 'timer' && <ImmersiveTimer />}
        {activeTab === 'todos' && <ZenTodosPage />}
        {activeTab === 'groups' && <ZenGroupsPage />}
      </main>

      {/* Global Overlays & Modals */}
      <CommandPalette />
      <TimerSettingsOverlay />
      <SoundMixerOverlay />
      <StatisticsOverlay />
      <SettingsOverlay />
      <ProfileOverlay />
      <FriendsOverlay />
      <NotificationsOverlay />
      <TaskDetailOverlay />
    </div>
  );
}
