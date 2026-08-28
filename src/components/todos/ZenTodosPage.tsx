'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Check, Folder, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export function ZenTodosPage() {
  const {
    tasks,
    addTask,
    toggleTaskComplete,
    deleteTask,
    setOverlay,
    setSelectedTaskDetail,
    setSelectedTask,
    setActiveTab,
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickProject, setQuickProject] = useState('Website Redesign');
  const [quickDueDate, setQuickDueDate] = useState('Today');

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    addTask({
      title: quickTitle.trim(),
      project: quickProject,
      priority: 'medium',
      dueDate: quickDueDate,
      completed: false,
    });
    setQuickTitle('');
    setShowAddModal(false);
  };

  const todayTasks = tasks.filter((t) => !t.completed && (t.dueDate === 'Today' || !t.dueDate));
  const upcomingTasks = tasks.filter((t) => !t.completed && t.dueDate !== 'Today' && t.dueDate);
  const completedTasks = tasks.filter((t) => t.completed);

  // Derive unique projects with task count
  const projectsMap: Record<string, number> = {};
  tasks.forEach((t) => {
    projectsMap[t.project] = (projectsMap[t.project] || 0) + 1;
  });
  const projectsList = Object.entries(projectsMap);

  return (
    <main className="flex-1 md:ml-[80px] pt-12 md:pt-20 pb-xxl px-gutter w-full max-w-[1400px] mx-auto min-h-screen flex flex-col animate-in fade-in duration-300">
      <div className="w-full">
        {/* Header */}
        <header className="flex justify-between items-end mb-xl">
          <div>
            <h1 className="font-headline-md text-headline-md text-primary font-medium tracking-tight">
              Task Overview
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-1">
              Minimalist 4-column overview for deep clarity and calm focus.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity shadow-[0_4px_20px_rgba(45,10,10,0.08)]"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </header>

        {/* 4 Columns Grid matching zen_multi_column_todos_crimson */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg items-start">
          {/* Section 1: Today */}
          <section className="bg-surface-container-low p-md rounded-xl border border-surface-variant">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-label-md text-label-md text-primary font-medium uppercase tracking-widest text-[11px]">
                Today
              </h2>
              <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-1 rounded-full font-medium">
                {todayTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-xs">
              {todayTasks.length === 0 ? (
                <span className="text-label-md text-on-surface-variant py-sm italic text-xs">No tasks for today</span>
              ) : (
                todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-start gap-sm py-sm cursor-pointer border-b border-surface-variant last:border-0 pb-sm transition-colors"
                  >
                    <button
                      onClick={() => toggleTaskComplete(task.id)}
                      className="mt-1 shrink-0 w-4 h-4 rounded-full border border-outline-variant flex items-center justify-center group-hover:border-primary transition-all"
                    >
                      {task.completed && <Check className="w-2.5 h-2.5 text-primary" />}
                    </button>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span
                        onClick={() => {
                          setSelectedTaskDetail(task);
                          setOverlay('task-detail');
                        }}
                        className="font-body-md text-on-surface-variant group-hover:text-primary text-[13px] leading-snug truncate"
                      >
                        {task.title}
                      </span>
                      <span className="text-[10px] text-outline truncate">{task.project}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setActiveTab('timer');
                      }}
                      title="Focus on timer"
                      className="opacity-0 group-hover:opacity-100 p-1 text-primary hover:scale-110 transition-all flex-shrink-0"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Section 2: Upcoming */}
          <section className="bg-surface-container-low p-md rounded-xl border border-surface-variant">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-label-md text-label-md text-primary font-medium uppercase tracking-widest text-[11px]">
                Upcoming
              </h2>
              <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-1 rounded-full font-medium">
                {upcomingTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-xs">
              {upcomingTasks.length === 0 ? (
                <span className="text-label-md text-on-surface-variant py-sm italic text-xs">No upcoming tasks</span>
              ) : (
                upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-start gap-sm py-sm cursor-pointer border-b border-surface-variant last:border-0 pb-sm transition-colors"
                  >
                    <button
                      onClick={() => toggleTaskComplete(task.id)}
                      className="mt-1 shrink-0 w-4 h-4 rounded-full border border-outline-variant flex items-center justify-center group-hover:border-primary transition-all"
                    >
                      {task.completed && <Check className="w-2.5 h-2.5 text-primary" />}
                    </button>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span
                        onClick={() => {
                          setSelectedTaskDetail(task);
                          setOverlay('task-detail');
                        }}
                        className="font-body-md text-on-surface-variant group-hover:text-primary text-[13px] leading-snug truncate"
                      >
                        {task.title}
                      </span>
                      <span className="text-[10px] text-outline">{task.dueDate}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Section 3: Projects */}
          <section className="bg-surface-container-low p-md rounded-xl border border-surface-variant">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-label-md text-label-md text-primary font-medium uppercase tracking-widest text-[11px]">
                Projects
              </h2>
              <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-1 rounded-full font-medium">
                {projectsList.length}
              </span>
            </div>
            <div className="flex flex-col gap-xs">
              {projectsList.map(([projName, count]) => (
                <div
                  key={projName}
                  className="group flex items-start gap-sm py-sm cursor-pointer border-b border-surface-variant last:border-0 pb-sm transition-colors"
                >
                  <Folder className="mt-1 w-4 h-4 text-outline-variant group-hover:text-primary transition-colors flex-shrink-0" />
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="font-body-md text-on-surface-variant group-hover:text-primary text-[13px] leading-snug truncate font-medium">
                      {projName}
                    </span>
                    <span className="text-[10px] text-outline">{count} tasks</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Completed */}
          <section className="bg-surface-container-low p-md rounded-xl border border-surface-variant">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-label-md text-label-md text-outline-variant font-medium uppercase tracking-widest text-[11px]">
                Completed
              </h2>
              <span className="text-[10px] text-outline-variant bg-surface-container px-2 py-1 rounded-full font-medium">
                {completedTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-xs opacity-60">
              {completedTasks.length === 0 ? (
                <span className="text-label-md text-on-surface-variant py-sm italic text-xs">No completed tasks yet</span>
              ) : (
                completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-sm py-sm border-b border-surface-variant last:border-0 pb-sm"
                  >
                    <button
                      onClick={() => toggleTaskComplete(task.id)}
                      className="mt-1 shrink-0 w-4 h-4 rounded-full border-2 border-primary bg-primary flex items-center justify-center"
                    >
                      <Check className="w-2.5 h-2.5 text-on-primary" />
                    </button>
                    <span className="font-body-md text-outline-variant line-through text-[13px] leading-snug flex-1 truncate">
                      {task.title}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 text-outline hover:text-error transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Quick Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h2 className="text-headline-md font-headline-md text-on-surface">Add New Task</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-primary text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAdd} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-label-md text-on-surface-variant">Task Title</label>
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="What needs focus?"
                  autoFocus
                  className="px-3.5 py-2 rounded-xl bg-surface border border-outline-variant text-body-md text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-label-md text-on-surface-variant">Project</label>
                  <input
                    type="text"
                    value={quickProject}
                    onChange={(e) => setQuickProject(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-surface border border-outline-variant text-body-md text-sm text-on-surface"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-label-md text-on-surface-variant">Due</label>
                  <select
                    value={quickDueDate}
                    onChange={(e) => setQuickDueDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-surface border border-outline-variant text-body-md text-sm text-on-surface cursor-pointer"
                  >
                    <option value="Today">Today</option>
                    <option value="Tomorrow">Tomorrow</option>
                    <option value="Next Week">Next Week</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface-variant hover:text-on-surface text-label-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-label-md font-medium shadow-md hover:opacity-90"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Add Task CTA */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-12 right-12 w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity z-40"
        title="Add Task"
      >
        <Plus className="w-6 h-6" />
      </button>
    </main>
  );
}
