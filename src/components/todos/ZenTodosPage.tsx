'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ZenTodoListBoard } from './ZenTodoListBoard';

export function ZenTodosPage() {
  const {
    tasks,
    addTask,
    toggleTaskComplete,
    deleteTask,
    reorderTasks,
  } = useApp();

  // Custom user lists
  const [customLists, setCustomLists] = useState<string[]>([
    'Next.js Study',
    'TypeScript',
    'UI Design',
    'Audio Engine',
  ]);

  const handleAddCustomList = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!customLists.includes(trimmed)) {
      setCustomLists((prev) => [...prev, trimmed]);
    }
  };

  const handleDeleteCustomList = (name: string) => {
    setCustomLists((prev) => prev.filter((l) => l !== name));
  };

  return (
    <div className="flex-1 h-screen flex flex-col overflow-hidden bg-zen-bg select-none">
      <ZenTodoListBoard
        title="Task Overview"
        tasks={tasks}
        onAddTask={addTask}
        onToggleComplete={toggleTaskComplete}
        onDeleteTask={deleteTask}
        onReorderTasks={reorderTasks}
        customLists={customLists}
        onAddCustomList={handleAddCustomList}
        onDeleteCustomList={handleDeleteCustomList}
        defaultProject="Website Redesign"
      />
    </div>
  );
}
