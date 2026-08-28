'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { CheckSquare, Calendar, Folder, Flag, User, X, Check, Trash2 } from 'lucide-react';
import clsx from 'clsx';

export function TaskDetailOverlay() {
  const {
    overlay,
    closeOverlay,
    selectedTaskDetail,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    setSelectedTask,
    setActiveTab,
  } = useApp();

  const [title, setTitle] = useState('');
  const [project, setProject] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('Today');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (selectedTaskDetail) {
      setTitle(selectedTaskDetail.title);
      setProject(selectedTaskDetail.project);
      setPriority(selectedTaskDetail.priority);
      setDueDate(selectedTaskDetail.dueDate);
      setDescription(selectedTaskDetail.description || '');
    }
  }, [selectedTaskDetail]);

  if (overlay !== 'task-detail' || !selectedTaskDetail) return null;

  const handleSave = () => {
    updateTask({
      ...selectedTaskDetail,
      title,
      project,
      priority,
      dueDate,
      description,
    });
    closeOverlay();
  };

  const handleDelete = () => {
    deleteTask(selectedTaskDetail.id);
    closeOverlay();
  };

  const handleFocusOnTimer = () => {
    setSelectedTask(selectedTaskDetail);
    setActiveTab('timer');
    closeOverlay();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-zen-card border border-zen-border rounded-3xl p-6 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zen-border pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleTaskComplete(selectedTaskDetail.id)}
              className={clsx(
                'w-6 h-6 rounded-lg border flex items-center justify-center transition-all',
                selectedTaskDetail.completed
                  ? 'bg-zen-accent border-zen-accent text-white'
                  : 'border-zen-border text-transparent hover:border-zen-accent'
              )}
            >
              <Check className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold uppercase tracking-wider text-zen-text-muted">
              Task Details
            </span>
          </div>
          <button
            onClick={closeOverlay}
            className="p-1 rounded-xl text-zen-text-muted hover:text-zen-text hover:bg-zen-surface transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-bold text-zen-text bg-transparent border-b border-zen-border pb-2 focus:outline-none focus:border-zen-accent"
          placeholder="Task title..."
        />

        {/* Properties Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-zen-text-muted flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5" /> Project
            </span>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zen-surface border border-zen-border text-xs text-zen-text font-medium"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-zen-text-muted flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5" /> Priority
            </span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-zen-surface border border-zen-border text-xs text-zen-text font-medium cursor-pointer"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-zen-text-muted flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Due Date
            </span>
            <input
              type="text"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zen-surface border border-zen-border text-xs text-zen-text font-medium"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-zen-text-muted flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Assigned
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-zen-surface border border-zen-border text-xs text-zen-text font-medium">
              {selectedTaskDetail.assignedTo || 'Alex Johnson'}
            </span>
          </div>
        </div>

        {/* Description Input */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-zen-text-muted">Notes / Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-2xl bg-zen-surface border border-zen-border text-xs text-zen-text focus:outline-none focus:border-zen-accent placeholder-zen-text-muted resize-none"
            placeholder="Add extra context or steps..."
          />
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zen-border">
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-xl text-red-500 hover:bg-red-500/10 text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Delete Task
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFocusOnTimer}
              className="px-4 py-2 rounded-xl bg-zen-surface hover:bg-zen-surface-hover text-zen-accent border border-zen-accent/30 text-xs font-medium transition-all"
            >
              Focus on Timer Canvas
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-zen-accent text-white text-xs font-medium shadow-md shadow-zen-accent-glow hover:bg-zen-accent-hover transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
