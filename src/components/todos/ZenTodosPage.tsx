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
      <header className="shrink-0 px-8 pt-8 pb-4 border-b border-surface-variant/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline-md text-headline-md text-primary font-semibold tracking-tight text-xl md:text-2xl">
              Task Overview
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {totalActiveTasks} active tasks
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant text-xs md:text-sm mt-0.5">
            Horizontally scrollable boards — scroll over lists vertically or over the board horizontally.
          </p>
        </div>

        {/* Action Controls & Search */}
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-outline pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-surface-container-low border border-surface-variant text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary w-40 md:w-52 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-outline hover:text-on-surface text-xs"
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-variant text-on-surface-variant hover:text-primary font-label-md text-xs font-medium transition-all shadow-sm"
            title="Create a new todo column"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>+ New List</span>
          </button>

          {/* Add Task Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md text-xs font-medium hover:opacity-90 transition-opacity shadow-[0_4px_20px_rgba(52,16,15,0.25)]"
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
              className="todo-column-card w-[330px] min-w-[330px] max-w-[330px] shrink-0 bg-surface-container-low/90 backdrop-blur-sm rounded-2xl border border-surface-variant flex flex-col max-h-[calc(100vh-170px)] shadow-lg hover:border-outline-variant/60 transition-all"
            >
              {/* Column Header */}
              <div className="shrink-0 p-4 pb-3 border-b border-surface-variant flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded-lg bg-surface-container">{col.icon}</div>
                  <h2 className="font-label-md text-primary font-semibold text-xs uppercase tracking-wider truncate">
                    {col.title}
                  </h2>
                  <span className="text-[11px] font-medium text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full shrink-0">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setActiveInlineCol(isInlineActive ? null : col.id);
                    }}
                    title="Add task to this list"
                    className="p-1 text-outline hover:text-primary rounded-lg hover:bg-surface-container transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  {col.isCustom && (
                    <button
                      onClick={() => handleDeleteList(col.title)}
                      title="Delete this list"
                      className="p-1 text-outline hover:text-error rounded-lg hover:bg-surface-container transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Quick Add Row in Column Header when toggled */}
              {isInlineActive && (
                <div className="shrink-0 p-3 bg-surface-container/60 border-b border-surface-variant flex flex-col gap-2 animate-in fade-in duration-150">
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
                    className="w-full px-3 py-1.5 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setActiveInlineCol(null)}
                      className="px-2 py-1 text-[11px] text-outline hover:text-on-surface"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleInlineAddTask(col)}
                      className="px-3 py-1 rounded-lg bg-primary text-on-primary text-[11px] font-medium hover:opacity-90"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Vertically Scrollable Task Items Container */}
              <div
                className="todo-list-scrollable flex-1 overflow-y-auto p-3 space-y-2.5"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--outline-variant) transparent',
                }}
              >
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center flex flex-col items-center justify-center text-outline text-xs italic">
                    <span>No tasks in this list</span>
                    <button
                      onClick={() => setActiveInlineCol(col.id)}
                      className="mt-2 text-[11px] text-primary/80 hover:text-primary not-italic underline underline-offset-2"
                    >
                      + Add a task
                    </button>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className={clsx(
                        'group relative bg-surface p-3 rounded-xl border border-surface-variant hover:border-outline-variant transition-all hover:shadow-md flex flex-col gap-2',
                        task.completed && 'opacity-65'
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTaskComplete(task.id)}
                          className={clsx(
                            'mt-0.5 shrink-0 w-4 h-4 rounded-md border flex items-center justify-center transition-all',
                            task.completed
                              ? 'border-primary bg-primary text-on-primary'
                              : 'border-outline-variant hover:border-primary bg-transparent text-transparent hover:text-primary/40'
                          )}
                        >
                          <Check className="w-2.5 h-2.5" />
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
                              'font-body-md text-xs font-medium text-on-surface leading-snug break-words group-hover:text-primary transition-colors',
                              task.completed && 'line-through text-outline'
                            )}
                          >
                            {task.title}
                          </h3>

                          {task.description && (
                            <p className="text-[11px] text-outline line-clamp-2 mt-1 leading-normal">
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
                              className="p-1 text-primary hover:scale-110 rounded hover:bg-surface-container transition-all"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteTask(task.id)}
                            title="Delete task"
                            className="p-1 text-outline hover:text-error rounded hover:bg-surface-container transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Footer metadata badges */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-surface-variant/50 text-[10px]">
                        {/* Priority Badge */}
                        <span
                          className={clsx(
                            'px-1.5 py-0.5 rounded font-medium flex items-center gap-1',
                            task.priority === 'high' && 'bg-error/15 text-error',
                            task.priority === 'medium' && 'bg-amber-500/15 text-amber-400',
                            task.priority === 'low' && 'bg-surface-container text-outline'
                          )}
                        >
                          <span
                            className={clsx(
                              'w-1.5 h-1.5 rounded-full',
                              task.priority === 'high' && 'bg-error',
                              task.priority === 'medium' && 'bg-amber-400',
                              task.priority === 'low' && 'bg-outline'
                            )}
                          />
                          {task.priority}
                        </span>

                        {/* Project Badge */}
                        {col.type !== 'custom' && task.project && (
                          <span className="px-1.5 py-0.5 rounded bg-surface-container text-outline truncate max-w-[110px]">
                            {task.project}
                          </span>
                        )}

                        {/* Due date Badge */}
                        {task.dueDate && (
                          <span className="ml-auto text-[10px] text-outline font-medium">
                            {task.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Column Footer: Quick add task trigger */}
              <div className="shrink-0 p-3 pt-2 border-t border-surface-variant/60">
                <button
                  onClick={() => setActiveInlineCol(col.id)}
                  className="w-full py-1.5 px-3 rounded-xl bg-surface-container/50 hover:bg-surface-container text-on-surface-variant hover:text-primary text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-transparent hover:border-surface-variant"
                >
                  <Plus className="w-3 h-3" /> Add Task
                </button>
              </div>
            </section>
          );
        })}

        {/* Ghost "+ Add New List" Column Card at the far right */}
        <div className="w-[330px] min-w-[330px] max-w-[330px] shrink-0">
          {isAddingList ? (
            <div className="bg-surface-container-low p-4 rounded-2xl border border-primary/40 shadow-xl flex flex-col gap-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Create New List
                </h3>
                <button
                  onClick={() => setIsAddingList(false)}
                  className="text-outline hover:text-on-surface text-xs"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreateList} className="flex flex-col gap-3">
                <input
                  type="text"
                  autoFocus
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g. Backlog, Marketing, Ideas..."
                  className="w-full px-3.5 py-2 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingList(false)}
                    className="px-3 py-1.5 rounded-xl text-xs text-outline hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-medium shadow-md hover:opacity-90"
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
              className="w-full h-32 rounded-2xl border-2 border-dashed border-surface-variant hover:border-primary/60 bg-surface-container-low/40 hover:bg-surface-container-low/80 flex flex-col items-center justify-center gap-2 text-outline hover:text-primary transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium tracking-wide">+ Add Another List</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Quick Add Task Modal */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h2 className="text-headline-md font-headline-md text-on-surface text-base font-semibold">
                Add New Task
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-primary text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAdd} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-label-md text-on-surface-variant text-xs">Task Title</label>
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="What needs focus?"
                  autoFocus
                  className="px-3.5 py-2 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-label-md text-on-surface-variant text-xs">List / Project</label>
                  <select
                    value={quickProject}
                    onChange={(e) => setQuickProject(e.target.value)}
                    className="px-2.5 py-2 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface cursor-pointer"
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

                <div className="flex flex-col gap-1">
                  <label className="text-label-md text-on-surface-variant text-xs">Due</label>
                  <select
                    value={quickDueDate}
                    onChange={(e) => setQuickDueDate(e.target.value)}
                    className="px-2.5 py-2 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface cursor-pointer"
                  >
                    <option value="Today">Today</option>
                    <option value="Tomorrow">Tomorrow</option>
                    <option value="Next Week">Next Week</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-label-md text-on-surface-variant text-xs">Priority</label>
                  <select
                    value={quickPriority}
                    onChange={(e) => setQuickPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="px-2.5 py-2 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface-variant hover:text-on-surface text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-medium shadow-md hover:opacity-90"
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
