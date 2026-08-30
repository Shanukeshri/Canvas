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
import { FocusGroupsOverlay } from '@/components/overlays/FocusGroupsOverlay';
import { AuthModal } from '@/components/auth/AuthModal';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';

export function MainAppCanvas({ onOpenProductPage }: { onOpenProductPage?: () => void }) {
  const { activeTab } = useApp();
  useGlobalShortcuts();

  return (
    <div className="relative flex min-h-screen w-full bg-zen-bg text-zen-text overflow-hidden selection:bg-zen-accent selection:text-white">
      {/* Fixed Non-expanding Sidebar Navigation with Tooltips */}
      <Sidebar onOpenProductPage={onOpenProductPage} />

      {/* Main Focus Canvas Area */}
      <main className="flex-1 ml-[72px] min-h-screen relative flex flex-col overflow-hidden">
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
      <FocusGroupsOverlay />
      <AuthModal />
    </div>
  );
}
