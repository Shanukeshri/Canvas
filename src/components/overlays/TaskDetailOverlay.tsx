'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  Check,
  Trash2,
  Calendar,
  Folder,
  ArrowRight,
  AlignLeft,
  Clock,
  Sparkles,
} from 'lucide-react';
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
  const [description, setDescription] = useState('');
  const [project, setProject] = useState('');
  const [dueDate, setDueDate] = useState('Today');

  useEffect(() => {
    if (selectedTaskDetail) {
      setTitle(selectedTaskDetail.title || '');
      setDescription(selectedTaskDetail.description || '');
      setProject(selectedTaskDetail.project || 'General');
      setDueDate(selectedTaskDetail.dueDate || 'Today');
    }
  }, [selectedTaskDetail]);

  if (overlay !== 'task-detail' || !selectedTaskDetail) return null;

  const handleSave = () => {
    updateTask({
      ...selectedTaskDetail,
      title: title.trim() || selectedTaskDetail.title,
      description: description.trim(),
      project: project.trim() || selectedTaskDetail.project,
      dueDate,
    });
    closeOverlay();
  };

  const handleDelete = () => {
    deleteTask(selectedTaskDetail.id);
    closeOverlay();
  };

  const handleFocusOnTimer = () => {
    const updated = {
      ...selectedTaskDetail,
      title: title.trim() || selectedTaskDetail.title,
      description: description.trim(),
      project: project.trim() || selectedTaskDetail.project,
      dueDate,
    };
    updateTask(updated);
    setSelectedTask(updated);
    setActiveTab('timer');
    closeOverlay();
  };

  return (
    <div
      onClick={closeOverlay}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="w-[540px] max-w-[92vw] bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-6 md:p-7 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-surface-variant/30 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                toggleTaskComplete(selectedTaskDetail.id);
              }}
              title={selectedTaskDetail.completed ? 'Mark incomplete' : 'Mark complete'}
              className={clsx(
                'w-6 h-6 rounded-lg border flex items-center justify-center transition-all',
                selectedTaskDetail.completed
                  ? 'bg-primary border-primary text-on-primary'
                  : 'border-surface-variant/70 hover:border-primary text-transparent hover:text-primary/30'
              )}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant/80 font-medium">
              <span className="p-1 rounded-md bg-surface-container/60">
                <Folder className="w-3.5 h-3.5 text-primary" />
              </span>
              <span>{project || 'Task Details'}</span>
            </div>
          </div>

          <button
            onClick={closeOverlay}
            className="p-1.5 rounded-xl text-outline/70 hover:text-on-surface hover:bg-surface-container/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task Main Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-primary/80 uppercase tracking-wider">
            Task Name
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task name..."
            autoFocus
            className="w-full text-lg md:text-xl font-semibold text-on-surface bg-transparent border-b border-surface-variant/40 focus:border-primary/70 pb-2 focus:outline-none transition-colors placeholder:text-outline/40"
          />
        </div>

        {/* Body Field (Under Todo Name) */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-on-surface-variant/80 uppercase tracking-wider flex items-center gap-1.5">
            <AlignLeft className="w-3.5 h-3.5 text-primary/80" /> Body / Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Add details, notes, sub-tasks, or context for this todo..."
            className="w-full p-4 rounded-2xl bg-surface-container-low/70 border border-surface-variant/40 text-sm text-on-surface/90 focus:outline-none focus:border-primary/60 focus:bg-surface-container-low placeholder:text-outline/50 resize-none leading-relaxed transition-all"
          />
        </div>

        {/* Metadata Controls: List & Due Date (No Priority) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-on-surface-variant/80 font-medium flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-outline" /> List / Project
            </span>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="e.g. General, Design..."
              className="px-3.5 py-2 rounded-xl bg-surface-container-low/70 border border-surface-variant/40 text-xs text-on-surface/90 font-medium focus:outline-none focus:border-primary/60"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-on-surface-variant/80 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-outline" /> Due Date
            </span>
            <select
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-surface-container-low/70 border border-surface-variant/40 text-xs text-on-surface/90 font-medium focus:outline-none focus:border-primary/60 cursor-pointer"
            >
              <option value="Today">Today</option>
              <option value="Tomorrow">Tomorrow</option>
              <option value="This Week">This Week</option>
              <option value="Next Week">Next Week</option>
              <option value="Someday">Someday</option>
            </select>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-surface-variant/30 mt-1">
          <button
            onClick={handleDelete}
            className="px-3.5 py-2 rounded-xl text-error hover:bg-error/10 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleFocusOnTimer}
              className="px-4 py-2 rounded-xl bg-surface-container/60 hover:bg-surface-container text-primary font-medium text-xs flex items-center gap-1.5 transition-colors border border-primary/20"
            >
              <span>Focus on Timer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-medium shadow-sm hover:opacity-90 transition-opacity"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

