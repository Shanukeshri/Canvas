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
  Bell,
  Sun,
  Moon,
  Clock,
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  onOpenProductPage?: () => void;
}

export function Sidebar({ onOpenProductPage }: SidebarProps) {
  const { activeTab, setActiveTab, overlay, setOverlay, notifications } = useApp();
  const { isDarkMode, toggleDarkMode, theme } = useTheme();

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <nav
      aria-label="Sidebar Navigation"
      className="fixed left-0 top-0 h-full flex flex-col justify-between py-5 px-2 z-40 bg-surface border-r border-outline-variant w-[72px] items-center select-none overflow-visible"
    >
      {/* UPPER GROUP */}
      <div className="flex flex-col items-center w-full gap-5">
        {/* 1. Very Top: Stopwatch Icon -> Opens Product Landing Page */}
        <div className="relative group flex items-center justify-center">
          <button
            onClick={() => {
              if (onOpenProductPage) onOpenProductPage();
            }}
            aria-label="Product Story & Overview"
            className="w-11 h-11 rounded-xl flex items-center justify-center bg-surface-container-low border border-outline-variant text-primary hover:bg-surface-container-high hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            <Clock className="w-5 h-5" style={{ color: theme.hex }} />
          </button>
          {/* Tooltip */}
          <div className="absolute left-full ml-3 px-2.5 py-1 text-[11px] font-medium tracking-wide text-primary bg-surface-container-lowest border border-outline-variant rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 transform -translate-x-1 group-hover:translate-x-0">
            Product Story & Overview
          </div>
        </div>

        {/* Separator */}
        <div className="w-8 h-[1px] bg-outline-variant/60" />

        {/* Main Nav Tabs: Timer, Tasks, Groups (Last button removed as requested) */}
        <div className="flex flex-col gap-2.5 w-full items-center">
          {/* Focus Timer */}
          <div className="relative group flex items-center justify-center w-full">
            <button
              onClick={() => {
                setActiveTab('timer');
                setOverlay(null);
              }}
              aria-current={activeTab === 'timer' && overlay === null ? 'page' : undefined}
              aria-label="Focus Timer"
              className={clsx(
                'relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200',
                activeTab === 'timer' && overlay === null
                  ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                  : 'text-outline hover:text-primary hover:bg-surface-container-low'
              )}
            >
              <Timer className="w-5 h-5" />
              {activeTab === 'timer' && overlay === null && (
                <div
                  className="absolute -right-[8px] top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-l-full"
                  style={{ backgroundColor: theme.hex }}
                />
              )}
            </button>
            <div className="absolute left-full ml-3 px-2.5 py-1 text-[11px] font-medium tracking-wide text-primary bg-surface-container-lowest border border-outline-variant rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 transform -translate-x-1 group-hover:translate-x-0">
              Focus Timer
            </div>
          </div>

          {/* Tasks & Todos */}
          <div className="relative group flex items-center justify-center w-full">
            <button
              onClick={() => {
                setActiveTab('todos');
                setOverlay(null);
              }}
              aria-current={activeTab === 'todos' && overlay === null ? 'page' : undefined}
              aria-label="Tasks & Todos"
              className={clsx(
                'relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200',
                activeTab === 'todos' && overlay === null
                  ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                  : 'text-outline hover:text-primary hover:bg-surface-container-low'
              )}
            >
              <CheckCircle2 className="w-5 h-5" />
              {activeTab === 'todos' && overlay === null && (
                <div
                  className="absolute -right-[8px] top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-l-full"
                  style={{ backgroundColor: theme.hex }}
                />
              )}
            </button>
            <div className="absolute left-full ml-3 px-2.5 py-1 text-[11px] font-medium tracking-wide text-primary bg-surface-container-lowest border border-outline-variant rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 transform -translate-x-1 group-hover:translate-x-0">
              Tasks & Todos
            </div>
          </div>

          {/* Focus Groups */}
          <div className="relative group flex items-center justify-center w-full">
            <button
              onClick={() => {
                setActiveTab('groups');
                setOverlay(overlay === 'groups' ? null : 'groups');
              }}
              aria-current={activeTab === 'groups' ? 'page' : undefined}
              aria-label="Focus Groups"
              className={clsx(
                'relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200',
                activeTab === 'groups' || overlay === 'groups'
                  ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                  : 'text-outline hover:text-primary hover:bg-surface-container-low'
              )}
            >
              <LayoutGrid className="w-5 h-5" />
              {activeTab === 'groups' && (
                <div
                  className="absolute -right-[8px] top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-l-full"
                  style={{ backgroundColor: theme.hex }}
                />
              )}
            </button>
            <div className="absolute left-full ml-3 px-2.5 py-1 text-[11px] font-medium tracking-wide text-primary bg-surface-container-lowest border border-outline-variant rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 transform -translate-x-1 group-hover:translate-x-0">
              Focus Groups
            </div>
          </div>
        </div>
      </div>

      {/* LOWER GROUP (Including Profile at the bottom) */}
      <div className="flex flex-col gap-2 w-full items-center">
        {/* Notifications */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={() => setOverlay(overlay === 'notifications' ? null : 'notifications')}
            aria-label="Notifications"
            className={clsx(
              'relative w-11 h-11 flex items-center justify-center rounded-xl transition-colors duration-200',
              overlay === 'notifications'
                ? 'bg-surface-container-high text-primary'
                : 'text-outline hover:text-primary hover:bg-surface-container-low'
            )}
          >
            <Bell className="w-5 h-5" />
            {unreadNotifCount > 0 && (
              <span
                className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
                style={{ backgroundColor: theme.hex }}
              />
            )}
          </button>
          <div className="absolute left-full ml-3 px-2.5 py-1 text-[11px] font-medium tracking-wide text-primary bg-surface-container-lowest border border-outline-variant rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 transform -translate-x-1 group-hover:translate-x-0">
            Notifications
          </div>
        </div>

        {/* Stats */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={() => setOverlay(overlay === 'stats' ? null : 'stats')}
            aria-label="Statistics"
            className={clsx(
              'w-11 h-11 flex items-center justify-center rounded-xl transition-colors duration-200',
              overlay === 'stats'
                ? 'bg-surface-container-high text-primary'
                : 'text-outline hover:text-primary hover:bg-surface-container-low'
            )}
          >
            <BarChart2 className="w-5 h-5" />
          </button>
          <div className="absolute left-full ml-3 px-2.5 py-1 text-[11px] font-medium tracking-wide text-primary bg-surface-container-lowest border border-outline-variant rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 transform -translate-x-1 group-hover:translate-x-0">
            Productivity Insights
          </div>
        </div>

        {/* Ambient Soundscape */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={() => setOverlay(overlay === 'sound' ? null : 'sound')}
            aria-label="Ambient Sounds"
            className={clsx(
              'w-11 h-11 flex items-center justify-center rounded-xl transition-colors duration-200',
              overlay === 'sound'
                ? 'bg-surface-container-high text-primary'
                : 'text-outline hover:text-primary hover:bg-surface-container-low'
            )}
          >
            <Volume2 className="w-5 h-5" />
          </button>
          <div className="absolute left-full ml-3 px-2.5 py-1 text-[11px] font-medium tracking-wide text-primary bg-surface-container-lowest border border-outline-variant rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 transform -translate-x-1 group-hover:translate-x-0">
            Ambient Soundscapes
          </div>
        </div>

        {/* Settings */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={() => setOverlay(overlay === 'settings' ? null : 'settings')}
            aria-label="Settings"
            className={clsx(
              'w-11 h-11 flex items-center justify-center rounded-xl transition-colors duration-200',
              overlay === 'settings'
                ? 'bg-surface-container-high text-primary'
                : 'text-outline hover:text-primary hover:bg-surface-container-low'
            )}
          >
            <Settings className="w-5 h-5" />
          </button>
          <div className="absolute left-full ml-3 px-2.5 py-1 text-[11px] font-medium tracking-wide text-primary bg-surface-container-lowest border border-outline-variant rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 transform -translate-x-1 group-hover:translate-x-0">
            Settings & Defaults
          </div>
        </div>

        {/* Theme Light/Dark Mode Toggle */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={toggleDarkMode}
            aria-label="Toggle Theme Mode"
            className="w-10 h-10 flex items-center justify-center rounded-full text-outline hover:text-primary hover:bg-surface-container-low transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
          <div className="absolute left-full ml-3 px-2.5 py-1 text-[11px] font-medium tracking-wide text-primary bg-surface-container-lowest border border-outline-variant rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 transform -translate-x-1 group-hover:translate-x-0">
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </div>
        </div>

        {/* Separator */}
        <div className="w-8 h-[1px] bg-outline-variant/60 my-1" />

        {/* 8. Profile Avatar (Moved to the bottom of the sidebar) */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={() => setOverlay(overlay === 'profile' ? null : 'profile')}
            aria-label="Profile & Themes"
            className="w-10 h-10 rounded-full border border-outline-variant overflow-hidden shadow-sm flex items-center justify-center text-lg bg-surface-container hover:scale-105 active:scale-95 transition-transform"
            style={{ borderColor: theme.hex + '70' }}
          >
            🦊
          </button>
          <div className="absolute left-full ml-3 px-2.5 py-1 text-[11px] font-medium tracking-wide text-primary bg-surface-container-lowest border border-outline-variant rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 transform -translate-x-1 group-hover:translate-x-0">
            Profile & 24 Themes
          </div>
        </div>
      </div>
    </nav>
  );
}
