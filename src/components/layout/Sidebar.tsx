'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Timer,
  CheckCircle2,
  LayoutGrid,
  BarChart2,
  Volume2,
  Settings,
  Plus,
  Bell,
  Command,
  Sun,
  Moon,
} from 'lucide-react';
import clsx from 'clsx';

export function Sidebar() {
  const { activeTab, setActiveTab, overlay, setOverlay, notifications } = useApp();
  const { isDarkMode, toggleDarkMode, theme } = useTheme();

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <nav
      aria-label="Sidebar Navigation"
      className="fixed left-0 top-0 h-full flex flex-col justify-between py-6 px-2 z-40 bg-surface border-r border-outline-variant w-[80px] items-center select-none"
    >
      {/* Top Profile / Brand Avatar */}
      <div className="flex flex-col items-center w-full">
        <button
          onClick={() => setOverlay(overlay === 'profile' ? null : 'profile')}
          className="w-10 h-10 rounded-full border border-outline-variant overflow-hidden mb-6 shadow-[0_4px_20px_rgba(45,10,10,0.08)] flex items-center justify-center text-lg bg-surface-container hover:scale-105 transition-transform"
          title="Profile & Preferences"
          style={{ borderColor: theme.hex + '60' }}
        >
          🦊
        </button>

        {/* Primary Tabs */}
        <div className="flex flex-col gap-3 w-full items-center">
          {/* Timer Tab */}
          <button
            onClick={() => {
              setActiveTab('timer');
              setOverlay(null);
            }}
            aria-current={activeTab === 'timer' && overlay === null ? 'page' : undefined}
            aria-label="Timer"
            className={clsx(
              'relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300',
              activeTab === 'timer' && overlay === null
                ? 'bg-surface-container-high text-primary scale-95 shadow-sm'
                : 'text-outline hover:text-primary hover:bg-surface-container-low'
            )}
            title="Focus Timer"
          >
            <Timer className="w-5 h-5" />
            {activeTab === 'timer' && overlay === null && (
              <div
                className="absolute -right-[8px] top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-l-full"
                style={{ backgroundColor: theme.hex }}
              />
            )}
          </button>

          {/* Todo Tab */}
          <button
            onClick={() => {
              setActiveTab('todos');
              setOverlay(null);
            }}
            aria-current={activeTab === 'todos' && overlay === null ? 'page' : undefined}
            aria-label="Todo"
            className={clsx(
              'relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300',
              activeTab === 'todos' && overlay === null
                ? 'bg-surface-container-high text-primary scale-95 shadow-sm'
                : 'text-outline hover:text-primary hover:bg-surface-container-low'
            )}
            title="Tasks & Todos"
          >
            <CheckCircle2 className="w-5 h-5" />
            {activeTab === 'todos' && overlay === null && (
              <div
                className="absolute -right-[8px] top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-l-full"
                style={{ backgroundColor: theme.hex }}
              />
            )}
          </button>

          {/* Groups Tab */}
          <button
            onClick={() => {
              setActiveTab('groups');
              setOverlay(null);
            }}
            aria-current={activeTab === 'groups' && overlay === null ? 'page' : undefined}
            aria-label="Groups"
            className={clsx(
              'relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300',
              activeTab === 'groups' && overlay === null
                ? 'bg-surface-container-high text-primary scale-95 shadow-sm'
                : 'text-outline hover:text-primary hover:bg-surface-container-low'
            )}
            title="Focus Groups"
          >
            <LayoutGrid className="w-5 h-5" />
            {activeTab === 'groups' && overlay === null && (
              <div
                className="absolute -right-[8px] top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-l-full"
                style={{ backgroundColor: theme.hex }}
              />
            )}
          </button>
        </div>

        {/* Action Button: Quick Add or Command Palette */}
        <button
          onClick={() => setOverlay('command-k')}
          aria-label="Command Palette"
          className="mt-4 w-10 h-10 flex items-center justify-center rounded-full bg-primary text-on-primary hover:opacity-90 transition-opacity duration-300 shadow-[0_4px_20px_rgba(45,10,10,0.08)]"
          title="Command Palette (⌘K)"
        >
          <Command className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Footer Tabs */}
      <div className="flex flex-col gap-2 w-full items-center">
        {/* Notifications */}
        <button
          onClick={() => setOverlay(overlay === 'notifications' ? null : 'notifications')}
          aria-label="Notifications"
          className={clsx(
            'relative w-12 h-12 flex items-center justify-center rounded-xl transition-colors duration-300',
            overlay === 'notifications'
              ? 'bg-surface-container-high text-primary scale-95'
              : 'text-outline hover:text-primary hover:bg-surface-container-low'
          )}
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifCount > 0 && (
            <span
              className="absolute top-3 right-3 w-2 h-2 rounded-full"
              style={{ backgroundColor: theme.hex }}
            />
          )}
        </button>

        {/* Stats */}
        <button
          onClick={() => setOverlay(overlay === 'stats' ? null : 'stats')}
          aria-label="Stats"
          className={clsx(
            'w-12 h-12 flex items-center justify-center rounded-xl transition-colors duration-300',
            overlay === 'stats'
              ? 'bg-surface-container-high text-primary scale-95'
              : 'text-outline hover:text-primary hover:bg-surface-container-low'
          )}
          title="Statistics & Insights"
        >
          <BarChart2 className="w-5 h-5" />
        </button>

        {/* Sound */}
        <button
          onClick={() => setOverlay(overlay === 'sound' ? null : 'sound')}
          aria-label="Sound"
          className={clsx(
            'w-12 h-12 flex items-center justify-center rounded-xl transition-colors duration-300',
            overlay === 'sound'
              ? 'bg-surface-container-high text-primary scale-95'
              : 'text-outline hover:text-primary hover:bg-surface-container-low'
          )}
          title="Soundscapes"
        >
          <Volume2 className="w-5 h-5" />
        </button>

        {/* Settings */}
        <button
          onClick={() => setOverlay(overlay === 'settings' ? null : 'settings')}
          aria-label="Settings"
          className={clsx(
            'w-12 h-12 flex items-center justify-center rounded-xl transition-colors duration-300',
            overlay === 'settings'
              ? 'bg-surface-container-high text-primary scale-95'
              : 'text-outline hover:text-primary hover:bg-surface-container-low'
          )}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Theme Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          aria-label="Toggle Theme Mode"
          className="w-10 h-10 mt-1 flex items-center justify-center rounded-full text-outline hover:text-primary hover:bg-surface-container-low transition-colors"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>
      </div>
    </nav>
  );
}
