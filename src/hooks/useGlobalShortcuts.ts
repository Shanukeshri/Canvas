'use client';

import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';

export function useGlobalShortcuts() {
  const {
    activeTab,
    setActiveTab,
    overlay,
    setOverlay,
    closeOverlay,
    timerState,
    startTimer,
    pauseTimer,
    resetTimer,
    startBreak,
    toggleMasterMute,
  } = useApp();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl as HTMLElement)?.isContentEditable;

      // Cmd+K or Ctrl+K for command palette
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOverlay(overlay === 'command-k' ? null : 'command-k');
        return;
      }

      // Escape to close active overlay or modal
      if (e.key === 'Escape') {
        if (overlay !== null) {
          e.preventDefault();
          closeOverlay();
          return;
        }
      }

      // If user is currently typing inside an input or textarea, skip single-key shortcuts
      if (isInput) return;

      // Space: Start / Pause / Resume Focus Timer
      if (e.code === 'Space') {
        e.preventDefault();
        if (timerState === 'running') {
          pauseTimer();
        } else if (timerState === 'completed') {
          startBreak();
        } else {
          startTimer();
        }
        return;
      }

      // 'd' or 'D': Reset Timer to default
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        resetTimer();
        return;
      }

      // '1': Switch to Focus Timer
      if (e.key === '1') {
        e.preventDefault();
        setActiveTab('timer');
        closeOverlay();
        return;
      }

      // '2': Switch to Canvas Todos
      if (e.key === '2') {
        e.preventDefault();
        setActiveTab('todos');
        closeOverlay();
        return;
      }

      // '3': Switch to Focus Groups
      if (e.key === '3') {
        e.preventDefault();
        setActiveTab('groups');
        closeOverlay();
        return;
      }

      // 'm' or 'M': Toggle Master Audio Mute
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMasterMute();
        return;
      }

      // 'n' or 'N': Quick Add Task
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        if (activeTab !== 'todos') {
          setActiveTab('todos');
          closeOverlay();
        }
        window.dispatchEvent(new CustomEvent('canvas:quick-add-task'));
        window.dispatchEvent(new CustomEvent('zen:quick-add-task'));
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTab,
    setActiveTab,
    overlay,
    setOverlay,
    closeOverlay,
    timerState,
    startTimer,
    pauseTimer,
    resetTimer,
    startBreak,
    toggleMasterMute,
  ]);
}
