'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Plus,
  Check,
  Folder,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Flame,
  X,
  MoreVertical,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import clsx from 'clsx';
import { Task } from '@/types';

interface ColumnDef {
  id: string;
  title: string;
  type: 'today' | 'upcoming' | 'project' | 'custom' | 'completed';
  icon: React.ReactNode;
  isCustom?: boolean;
}

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

  // Custom user lists
  const [customLists, setCustomLists] = useState<string[]>([
    'Next.js Study',
    'TypeScript',
    'UI Design',
    'Audio Engine',
  ]);

  // UI state
  const [showAddModal, setShowAddModal] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickProject, setQuickProject] = useState('Website Redesign');
  const [quickDueDate, setQuickDueDate] = useState('Today');
  const [quickPriority, setQuickPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Inline column task creation state { [columnId]: string }
  const [inlineTaskTitles, setInlineTaskTitles] = useState<Record<string, string>>({});
  const [activeInlineCol, setActiveInlineCol] = useState<string | null>(null);

  // New list inline creation
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Search/filter
  const [searchQuery, setSearchQuery] = useState('');

  // Horizontal Board Scroll Ref
  const boardRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Set up wheel scroll listener:
  // - If mouse is over a todo list card: vertical wheel scrolls that specific todo list vertically.
  // - If mouse is NOT on any todo list (e.g. board background, padding, headers): vertical/horizontal wheel scrolls the board horizontally.
  useEffect(() => {
    const container = boardRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      const hoveredCard = target?.closest('.todo-column-card');

      if (hoveredCard) {
        // Mouse is over a todo list card
        // If user is scrolling vertically:
        // We let the vertical scroll act on the card's inner scrollable list.
        const scrollableList = hoveredCard.querySelector('.todo-list-scrollable') as HTMLElement | null;
        if (scrollableList && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          // If the cursor wasn't directly over the scrollable area (e.g. over card header/padding),
          // propagate the vertical scroll to the card's scrollable container
          if (!target?.closest('.todo-list-scrollable')) {
            scrollableList.scrollTop += e.deltaY;
            e.preventDefault();
          }
          // If already inside .todo-list-scrollable, native vertical scroll handles it smoothly
        }
        return;
      }

      // Mouse is NOT on any todo list card (it is on the board background, canvas, between columns, header, etc.)
      // Any vertical scroll (deltaY) scrolls the board horizontally!
      if (Math.abs(e.deltaY) > 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      } else if (Math.abs(e.deltaX) > 0) {
        // Horizontal scroll natively scrolls or we add deltaX
        container.scrollLeft += e.deltaX;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Drag to scroll on background
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger drag if clicked directly on board background or column gaps (not on buttons, cards, inputs)
    const target = e.target as HTMLElement;
    if (target.closest('.todo-column-card') || target.closest('button') || target.closest('input')) {
      return;
    }
    if (!boardRef.current) return;

    isDraggingRef.current = true;
    startXRef.current = e.pageX - boardRef.current.offsetLeft;
    scrollLeftRef.current = boardRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !boardRef.current) return;
    e.preventDefault();
    const x = e.pageX - boardRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5; // Drag speed multiplier
    boardRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  // Scroll to the far right when a new list is created
  const scrollToFarRight = () => {
    setTimeout(() => {
      if (boardRef.current) {
        boardRef.current.scrollTo({
          left: boardRef.current.scrollWidth,
          behavior: 'smooth',
        });
      }
    }, 100);
  };

  // Handle adding a new custom list/column
  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newListName.trim();
    if (!trimmed) return;
    if (!customLists.includes(trimmed)) {
      setCustomLists((prev) => [...prev, trimmed]);
    }
    setNewListName('');
    setIsAddingList(false);
    scrollToFarRight();
  };

  const handleDeleteList = (listName: string) => {
    setCustomLists((prev) => prev.filter((name) => name !== listName));
  };

  // Handle Quick Add Modal Submit
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    addTask({
      title: quickTitle.trim(),
      project: quickProject,
      priority: quickPriority,
      dueDate: quickDueDate,
      completed: false,
    });
    setQuickTitle('');
    setShowAddModal(false);
  };

  // Handle Inline Add Task in a specific Column
  const handleInlineAddTask = (col: ColumnDef) => {
    const title = inlineTaskTitles[col.id]?.trim();
    if (!title) return;

    let project = 'General';
    let dueDate = 'Today';
    let completed = false;

    if (col.type === 'today') {
      dueDate = 'Today';
      project = 'Website Redesign';
    } else if (col.type === 'upcoming') {
      dueDate = 'Tomorrow';
      project = 'Website Redesign';
    } else if (col.type === 'completed') {
      completed = true;
      dueDate = 'Today';
    } else if (col.type === 'project' || col.type === 'custom') {
      project = col.title;
      dueDate = 'Today';
    }

    addTask({
      title,
      project,
      priority: 'medium',
      dueDate,
      completed,
    });

    setInlineTaskTitles((prev) => ({ ...prev, [col.id]: '' }));
    setActiveInlineCol(null);
  };

  // Build the list of columns
  const columns: ColumnDef[] = [
    {
      id: 'col-today',
      title: 'Today',
      type: 'today',
      icon: <Calendar className="w-3.5 h-3.5 text-primary" />,
    },
    {
      id: 'col-upcoming',
      title: 'Upcoming',
      type: 'upcoming',
      icon: <Clock className="w-3.5 h-3.5 text-secondary" />,
    },
    ...customLists.map((name) => ({
      id: `col-${name}`,
      title: name,
      type: 'custom' as const,
      icon: <Folder className="w-3.5 h-3.5 text-outline-variant" />,
      isCustom: true,
    })),
    {
      id: 'col-completed',
      title: 'Completed',
      type: 'completed',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-outline" />,
    },
  ];

  // Helper to filter tasks for each column
  const getTasksForColumn = (col: ColumnDef): Task[] => {
    let filtered = tasks;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.project.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    if (col.type === 'today') {
      return filtered.filter((t) => !t.completed && (t.dueDate === 'Today' || !t.dueDate));
    }
    if (col.type === 'upcoming') {
      return filtered.filter((t) => !t.completed && t.dueDate !== 'Today' && t.dueDate);
    }
    if (col.type === 'completed') {
      return filtered.filter((t) => t.completed);
    }
    // Custom or project column
    return filtered.filter((t) => !t.completed && t.project.toLowerCase() === col.title.toLowerCase());
  };

  const totalActiveTasks = tasks.filter((t) => !t.completed).length;

  return (
    <div className="flex-1 h-screen flex flex-col overflow-hidden bg-zen-bg select-none animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <header className="shrink-0 px-8 pt-8 pb-5 border-b border-surface-variant/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline-md text-headline-md text-primary/90 font-semibold tracking-tight text-2xl md:text-3xl">
              Task Overview
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary/90 border border-primary/20">
              {totalActiveTasks} active tasks
            </span>
          </div>
        </div>

        {/* Action Controls & Search */}
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-outline/60 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks..."
              className="h-10 pl-9 pr-4 py-2 rounded-xl bg-surface-container-low/70 border border-surface-variant/40 text-sm text-on-surface/90 placeholder:text-outline/60 focus:outline-none focus:border-primary/50 w-44 md:w-56 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-outline/60 hover:text-on-surface text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* New List Button */}
          <button
            onClick={() => {
              setIsAddingList(true);
              scrollToFarRight();
            }}
            className="h-10 flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-low/70 hover:bg-surface-container border border-surface-variant/40 text-on-surface-variant/80 hover:text-primary font-label-md text-sm font-medium transition-all shadow-sm"
            title="Create a new todo column"
          >
            <Layers className="w-4 h-4" />
            <span>+ New List</span>
          </button>

          {/* Add Task Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="h-10 flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-on-primary font-label-md text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </header>

      {/* Main Horizontally Scrollable Board Canvas */}
      <div
        ref={boardRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden px-8 py-6 flex flex-row items-start gap-6 cursor-default"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--outline-variant) transparent',
        }}
      >
        {columns.map((col) => {
          const colTasks = getTasksForColumn(col);
          const isInlineActive = activeInlineCol === col.id;

          return (
            <section
              key={col.id}
              className="todo-column-card w-[370px] min-w-[370px] max-w-[370px] lg:w-[390px] lg:min-w-[390px] lg:max-w-[390px] shrink-0 bg-surface-container-low/60 backdrop-blur-md rounded-2xl border border-surface-variant/40 flex flex-col max-h-[calc(100vh-175px)] shadow-sm hover:border-surface-variant/70 transition-all"
            >
              {/* Column Header */}
              <div className="shrink-0 p-4.5 pb-3.5 border-b border-surface-variant/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-xl bg-surface-container/60">{col.icon}</div>
                  <h2 className="font-label-md text-primary/90 font-semibold text-sm md:text-[15px] tracking-normal truncate">
                    {col.title}
                  </h2>
                  <span className="text-xs font-medium text-on-surface-variant/80 bg-surface-container/70 px-2.5 py-0.5 rounded-full shrink-0">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setActiveInlineCol(isInlineActive ? null : col.id);
                    }}
                    title="Add task to this list"
                    className="p-1.5 text-outline/70 hover:text-primary rounded-lg hover:bg-surface-container/60 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {col.isCustom && (
                    <button
                      onClick={() => handleDeleteList(col.title)}
                      title="Delete this list"
                      className="p-1.5 text-outline/70 hover:text-error rounded-lg hover:bg-surface-container/60 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Quick Add Row in Column Header when toggled */}
              {isInlineActive && (
                <div className="shrink-0 p-3.5 bg-surface-container/40 border-b border-surface-variant/30 flex flex-col gap-2.5 animate-in fade-in duration-150">
                  <input
                    type="text"
                    autoFocus
                    value={inlineTaskTitles[col.id] || ''}
                    onChange={(e) =>
                      setInlineTaskTitles((prev) => ({ ...prev, [col.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleInlineAddTask(col);
                      if (e.key === 'Escape') setActiveInlineCol(null);
                    }}
                    placeholder="Task name... (Press Enter)"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface/80 border border-surface-variant/50 text-sm text-on-surface/90 placeholder:text-outline/60 focus:outline-none focus:border-primary/60"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setActiveInlineCol(null)}
                      className="px-3 py-1.5 text-xs text-outline/70 hover:text-on-surface"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleInlineAddTask(col)}
                      className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-medium hover:opacity-90"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Vertically Scrollable Task Items Container */}
              <div
                className="todo-list-scrollable flex-1 overflow-y-auto p-3.5 space-y-3"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--outline-variant) transparent',
                }}
              >
                {colTasks.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center justify-center text-outline/70 text-sm italic">
                    <span>No tasks in this list</span>
                    <button
                      onClick={() => setActiveInlineCol(col.id)}
                      className="mt-2.5 text-xs text-primary/80 hover:text-primary not-italic underline underline-offset-2"
                    >
                      + Add a task
                    </button>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className={clsx(
                        'group relative bg-surface-container-lowest/70 hover:bg-surface-container-lowest/90 p-4 rounded-xl border border-surface-variant/30 hover:border-surface-variant/60 transition-all flex flex-col gap-2.5 shadow-sm',
                        task.completed && 'opacity-60'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTaskComplete(task.id)}
                          className={clsx(
                            'mt-0.5 shrink-0 w-5 h-5 rounded-lg border flex items-center justify-center transition-all',
                            task.completed
                              ? 'border-primary/80 bg-primary/90 text-on-primary'
                              : 'border-surface-variant/60 hover:border-primary/60 bg-transparent text-transparent hover:text-primary/30'
                          )}
                        >
                          <Check className="w-3 h-3" />
                        </button>

                        {/* Title and details */}
                        <div
                          onClick={() => {
                            setSelectedTaskDetail(task);
                            setOverlay('task-detail');
                          }}
                          className="flex-1 min-w-0 cursor-pointer"
                        >
                          <h3
                            className={clsx(
                              'font-body-md text-sm md:text-[15px] font-medium text-on-surface/90 leading-snug break-words group-hover:text-primary/90 transition-colors',
                              task.completed && 'line-through text-outline/60'
                            )}
                          >
                            {task.title}
                          </h3>

                          {task.description && (
                            <p className="text-xs text-outline/75 line-clamp-2 mt-1.5 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Quick Action Icons */}
                        <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!task.completed && (
                            <button
                              onClick={() => {
                                setSelectedTask(task);
                                setActiveTab('timer');
                              }}
                              title="Focus in Timer"
                              className="p-1.5 text-primary/80 hover:text-primary hover:scale-110 rounded-lg hover:bg-surface-container/60 transition-all"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteTask(task.id)}
                            title="Delete task"
                            className="p-1.5 text-outline/60 hover:text-error rounded-lg hover:bg-surface-container/60 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Footer metadata badges */}
                      <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-surface-variant/25 text-xs">
                        {/* Priority Badge */}
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded-md font-medium flex items-center gap-1.5 text-[11px]',
                            task.priority === 'high' && 'bg-error/10 text-error/80',
                            task.priority === 'medium' && 'bg-amber-500/10 text-amber-400/80',
                            task.priority === 'low' && 'bg-surface-container/50 text-outline/70'
                          )}
                        >
                          <span
                            className={clsx(
                              'w-1.5 h-1.5 rounded-full',
                              task.priority === 'high' && 'bg-error/80',
                              task.priority === 'medium' && 'bg-amber-400/80',
                              task.priority === 'low' && 'bg-outline/60'
                            )}
                          />
                          {task.priority}
                        </span>

                        {/* Project Badge */}
                        {col.type !== 'custom' && task.project && (
                          <span className="px-2 py-0.5 rounded-md bg-surface-container/50 text-outline/80 text-[11px] truncate max-w-[130px]">
                            {task.project}
                          </span>
                        )}

                        {/* Due date Badge */}
                        {task.dueDate && (
                          <span className="ml-auto text-[11px] text-outline/75 font-medium">
                            {task.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Column Footer: Quick add task trigger */}
              <div className="shrink-0 p-3.5 pt-2.5 border-t border-surface-variant/30">
                <button
                  onClick={() => setActiveInlineCol(col.id)}
                  className="w-full py-2 px-3.5 rounded-xl bg-surface-container/40 hover:bg-surface-container/70 text-on-surface-variant/80 hover:text-primary text-xs md:text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-transparent hover:border-surface-variant/30"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Task
                </button>
              </div>
            </section>
          );
        })}

        {/* Ghost "+ Add New List" Column Card at the far right */}
        <div className="w-[370px] min-w-[370px] max-w-[370px] lg:w-[390px] lg:min-w-[390px] lg:max-w-[390px] shrink-0">
          {isAddingList ? (
            <div className="bg-surface-container-low/80 p-5 rounded-2xl border border-primary/30 shadow-sm flex flex-col gap-3.5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-primary/90 uppercase tracking-wider">
                  Create New List
                </h3>
                <button
                  onClick={() => setIsAddingList(false)}
                  className="text-outline/70 hover:text-on-surface text-xs"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreateList} className="flex flex-col gap-3.5">
                <input
                  type="text"
                  autoFocus
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g. Backlog, Marketing, Ideas..."
                  className="w-full px-4 py-2.5 rounded-xl bg-surface/80 border border-surface-variant/50 text-sm text-on-surface/90 placeholder:text-outline/60 focus:outline-none focus:border-primary/60"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingList(false)}
                    className="px-3.5 py-2 rounded-xl text-xs text-outline/70 hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-medium shadow-sm hover:opacity-90"
                  >
                    Create List
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsAddingList(true);
                scrollToFarRight();
              }}
              className="w-full h-36 rounded-2xl border-2 border-dashed border-surface-variant/40 hover:border-primary/40 bg-surface-container-low/30 hover:bg-surface-container-low/60 flex flex-col items-center justify-center gap-2.5 text-outline/70 hover:text-primary transition-all group"
            >
              <div className="w-9 h-9 rounded-full bg-surface-container/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-4 h-4 text-primary/90" />
              </div>
              <span className="text-sm font-medium tracking-wide">+ Add Another List</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Quick Add Task Modal */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            className="w-full max-w-lg bg-surface-container-lowest border border-surface-variant/40 rounded-2xl p-7 shadow-xl flex flex-col gap-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-surface-variant/30 pb-4">
              <h2 className="text-headline-md font-headline-md text-on-surface/95 text-lg font-semibold">
                Add New Task
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant/70 hover:text-primary text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAdd} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-label-md text-on-surface-variant/80 text-xs font-medium">Task Title</label>
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="What needs focus?"
                  autoFocus
                  className="px-4 py-2.5 rounded-xl bg-surface/80 border border-surface-variant/50 text-sm text-on-surface/90 placeholder:text-outline/60 focus:outline-none focus:border-primary/60"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-label-md text-on-surface-variant/80 text-xs font-medium">List / Project</label>
                  <select
                    value={quickProject}
                    onChange={(e) => setQuickProject(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-surface/80 border border-surface-variant/50 text-sm text-on-surface/90 cursor-pointer"
                  >
                    <option value="Website Redesign">Website Redesign</option>
                    {customLists.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-label-md text-on-surface-variant/80 text-xs font-medium">Due</label>
                  <select
                    value={quickDueDate}
                    onChange={(e) => setQuickDueDate(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-surface/80 border border-surface-variant/50 text-sm text-on-surface/90 cursor-pointer"
                  >
                    <option value="Today">Today</option>
                    <option value="Tomorrow">Tomorrow</option>
                    <option value="Next Week">Next Week</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-label-md text-on-surface-variant/80 text-xs font-medium">Priority</label>
                  <select
                    value={quickPriority}
                    onChange={(e) => setQuickPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="px-3 py-2.5 rounded-xl bg-surface/80 border border-surface-variant/50 text-sm text-on-surface/90 cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-variant/30">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-surface-variant/40 text-on-surface-variant/80 hover:text-on-surface text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium shadow-sm hover:opacity-90"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
