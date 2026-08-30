'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Search,
  Timer,
  CheckSquare,
  Users,
  BarChart3,
  Settings,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  User,
  LogIn,
  LogOut,
  X,
} from 'lucide-react';

export function CommandPalette() {
  const {
    overlay,
    closeOverlay,
    setOverlay,
    setActiveTab,
    timerState,
    startTimer,
    pauseTimer,
    resetTimer,
    tasks,
    groups,
    setSelectedTask,
    isAuthenticated,
    logout,
    openAuthModal,
  } = useApp();

  const [query, setQuery] = useState('');



  if (overlay !== 'command-k') return null;

  const actions = [
    {
      id: 'act-start-timer',
      title: timerState === 'running' ? 'Pause Timer' : 'Start Timer',
      category: 'Timer Controls',
      icon: timerState === 'running' ? Pause : Play,
      run: () => {
        timerState === 'running' ? pauseTimer() : startTimer();
        closeOverlay();
      },
    },
    {
      id: 'act-reset-timer',
      title: 'Reset Timer',
      category: 'Timer Controls',
      icon: RotateCcw,
      run: () => {
        resetTimer();
        closeOverlay();
      },
    },
    {
      id: 'nav-timer',
      title: 'Go to Timer Canvas',
      category: 'Navigation',
      icon: Timer,
      run: () => {
        setActiveTab('timer');
        closeOverlay();
      },
    },
    {
      id: 'nav-todos',
      title: 'Go to Zen Todos',
      category: 'Navigation',
      icon: CheckSquare,
      run: () => {
        setActiveTab('todos');
        closeOverlay();
      },
    },
    {
      id: 'nav-groups',
      title: 'Go to Focus Groups',
      category: 'Navigation',
      icon: Users,
      run: () => {
        setActiveTab('groups');
        closeOverlay();
      },
    },
    {
      id: 'overlay-stats',
      title: 'Open Insights',
      category: 'Overlays',
      icon: BarChart3,
      run: () => {
        setOverlay('stats');
      },
    },
    {
      id: 'overlay-sound',
      title: 'Open Ambient Sound Mixer',
      category: 'Overlays',
      icon: Volume2,
      run: () => {
        setOverlay('sound');
      },
    },
    {
      id: 'overlay-settings',
      title: 'Open Theme & Settings',
      category: 'Overlays',
      icon: Settings,
      run: () => {
        setOverlay('settings');
      },
    },
    {
      id: 'overlay-profile',
      title: 'Open Profile & Themes',
      category: 'Account & Aesthetics',
      icon: User,
      run: () => {
        setOverlay('profile');
      },
    },
    ...(isAuthenticated
      ? [
          {
            id: 'act-logout',
            title: 'Log Out of Account',
            category: 'Account & Aesthetics',
            icon: LogOut,
            run: () => {
              logout();
              closeOverlay();
            },
          },
        ]
      : [
          {
            id: 'act-login',
            title: 'Sign In / Register',
            category: 'Account & Aesthetics',
            icon: LogIn,
            run: () => {
              openAuthModal('login');
            },
          },
        ]),
  ];

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase())
  );

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredActions = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dim/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-[0px_4px_20px_rgba(45,10,10,0.08)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant bg-surface-bright">
          <Search className="w-5 h-5 text-primary flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, task, or group..."
            autoFocus
            className="w-full bg-transparent text-on-surface font-body-md text-body-md placeholder:text-on-surface-variant focus:outline-none"
          />
          <button
            onClick={closeOverlay}
            className="p-1 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-3 flex flex-col gap-4">
          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <span className="text-label-md font-label-md font-medium text-on-surface-variant uppercase tracking-wider px-3 py-1 block">
                Actions & Navigation
              </span>
              <div className="flex flex-col gap-1 mt-1">
                {filteredActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={action.run}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-body-md text-sm font-medium text-on-surface hover:bg-primary-container hover:text-primary transition-all group"
                    >
                      <Icon className="w-4 h-4 text-on-surface-variant group-hover:text-primary flex-shrink-0" />
                      <span>{action.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tasks Search Results */}
          {filteredTasks.length > 0 && (
            <div>
              <span className="text-label-md font-label-md font-medium text-on-surface-variant uppercase tracking-wider px-3 py-1 block">
                Tasks
              </span>
              <div className="flex flex-col gap-1 mt-1">
                {filteredTasks.slice(0, 5).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      setSelectedTask(task);
                      setActiveTab('timer');
                      closeOverlay();
                    }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-body-md text-sm text-on-surface hover:bg-surface-container transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-medium truncate">{task.title}</span>
                    </div>
                    <span className="text-label-md text-on-surface-variant px-2 py-0.5 rounded-md bg-surface border border-outline-variant">
                      {task.project}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Groups Search Results */}
          {filteredGroups.length > 0 && (
            <div>
              <span className="text-label-md font-label-md font-medium text-on-surface-variant uppercase tracking-wider px-3 py-1 block">
                Focus Groups
              </span>
              <div className="flex flex-col gap-1 mt-1">
                {filteredGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => {
                      setActiveTab('groups');
                      closeOverlay();
                    }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-body-md text-sm text-on-surface hover:bg-surface-container transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-medium">{group.name}</span>
                    </div>
                    <span className="text-label-md text-on-surface-variant">{group.activeCount} active</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-5 py-3 border-t border-outline-variant bg-surface flex items-center justify-between text-label-md text-on-surface-variant">
          <span>Use ⌘K anytime to open search</span>
          <span className="font-mono bg-surface-container px-2 py-0.5 rounded-md border border-outline-variant text-on-surface">
            ESC to close
          </span>
        </div>
      </div>
    </div>
  );
}
