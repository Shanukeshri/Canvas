'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { CanvasTodoListBoard } from './ZenTodoListBoard';

export function CanvasTodosPage() {
  const {
    tasks,
    addTask,
    toggleTaskComplete,
    deleteTask,
    reorderTasks,
    currentUser,
  } = useApp();

  const [customLists, setCustomLists] = useState<string[]>(() => {
    if (typeof window !== 'undefined' && currentUser?.id) {
      try {
        const saved =
          localStorage.getItem(`canvas_custom_lists_${currentUser.id}`) ||
          localStorage.getItem(`zen_custom_lists_${currentUser.id}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return ['Deep Work', 'Personal'];
  });

  // Sync custom lists from task projects if user created new ones
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    const taskProjects = tasks.map((t) => t.project).filter((p): p is string => Boolean(p && p.trim()));
    const uniqueProjects = Array.from(new Set(taskProjects));

    setCustomLists((prev) => {
      const merged = Array.from(new Set([...prev, ...uniqueProjects]));
      if (merged.length !== prev.length && currentUser?.id && typeof window !== 'undefined') {
        localStorage.setItem(`canvas_custom_lists_${currentUser.id}`, JSON.stringify(merged));
      }
      return merged;
    });
  }, [tasks, currentUser?.id]);

  const handleAddCustomList = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!customLists.includes(trimmed)) {
      setCustomLists((prev) => {
        const next = [...prev, trimmed];
        if (currentUser?.id && typeof window !== 'undefined') {
          localStorage.setItem(`canvas_custom_lists_${currentUser.id}`, JSON.stringify(next));
        }
        return next;
      });
    }
  };

  const handleDeleteCustomList = (name: string) => {
    setCustomLists((prev) => {
      const next = prev.filter((l) => l !== name);
      if (currentUser?.id && typeof window !== 'undefined') {
        localStorage.setItem(`canvas_custom_lists_${currentUser.id}`, JSON.stringify(next));
      }
      return next;
    });
  };

  return (
    <div className="flex-1 h-screen flex flex-col overflow-hidden bg-canvas-bg select-none">
      <CanvasTodoListBoard
        title="Task Overview"
        tasks={tasks}
        onAddTask={addTask}
        onToggleComplete={toggleTaskComplete}
        onDeleteTask={deleteTask}
        onReorderTasks={reorderTasks}
        customLists={customLists}
        onAddCustomList={handleAddCustomList}
        onDeleteCustomList={handleDeleteCustomList}
        defaultProject={customLists[0] || 'Deep Work'}
      />
    </div>
  );
}

export { CanvasTodosPage as ZenTodosPage };
