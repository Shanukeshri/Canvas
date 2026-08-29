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
  GripVertical,
  X,
  Layers,
  Search,
  AlignLeft,
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
    reorderTasks,
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
  const [quickDescription, setQuickDescription] = useState('');
  const [quickProject, setQuickProject] = useState('Website Redesign');
  const [quickDueDate, setQuickDueDate] = useState('Today');

  // Inline column task creation state { [columnId]: string }
  const [inlineTaskTitles, setInlineTaskTitles] = useState<Record<string, string>>({});
  const [activeInlineCol, setActiveInlineCol] = useState<string | null>(null);

  // New list inline creation
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Search/filter
  const [searchQuery, setSearchQuery] = useState('');

  // Drag and drop reordering state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  // Horizontal Board Scroll Ref
  const boardRef = useRef<HTMLDivElement>(null);
  const isDraggingBoardRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Set up wheel scroll listener:
  // - If mouse is over a todo list card: vertical wheel scrolls that specific todo list vertically.
  // - If mouse is NOT on any todo list: vertical/horizontal wheel scrolls the board horizontally.
  useEffect(() => {
    const container = boardRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      const hoveredCard = target?.closest('.todo-column-card');

      if (hoveredCard) {
        const scrollableList = hoveredCard.querySelector('.todo-list-scrollable') as HTMLElement | null;
        if (scrollableList && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          if (!target?.closest('.todo-list-scrollable')) {
            scrollableList.scrollTop += e.deltaY;
            e.preventDefault();
          }
        }
        return;
      }

      if (Math.abs(e.deltaY) > 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      } else if (Math.abs(e.deltaX) > 0) {
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
    const target = e.target as HTMLElement;
    if (
      target.closest('.todo-column-card') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea')
    ) {
      return;
    }
    if (!boardRef.current) return;

    isDraggingBoardRef.current = true;
    startXRef.current = e.pageX - boardRef.current.offsetLeft;
    scrollLeftRef.current = boardRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingBoardRef.current || !boardRef.current) return;
    e.preventDefault();
    const x = e.pageX - boardRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    boardRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingBoardRef.current = false;
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
      description: quickDescription.trim(),
      project: quickProject,
      priority: 'medium',
      dueDate: quickDueDate,
      completed: false,
    });
    setQuickTitle('');
    setQuickDescription('');
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

  // ================= DRAG AND DROP HANDLERS =================
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setDragOverPosition(null);
    setDragOverColId(null);
  };

  const handleDragOverCard = (e: React.DragEvent, targetTask: Task) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedTaskId || draggedTaskId === targetTask.id) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const isTopHalf = relY < rect.height / 2;

    setDragOverTaskId(targetTask.id);
    setDragOverPosition(isTopHalf ? 'before' : 'after');
  };

  const handleDropOnCard = (e: React.DragEvent, targetTask: Task, targetCol: ColumnDef) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedTaskId || draggedTaskId === targetTask.id) {
      handleDragEnd();
      return;
    }

    const draggedTask = tasks.find((t) => t.id === draggedTaskId);
    if (!draggedTask) {
      handleDragEnd();
      return;
    }

    // Determine target column properties
    const updatedTask = { ...draggedTask };
    if (targetCol.type === 'today') {
      updatedTask.dueDate = 'Today';
      updatedTask.completed = false;
    } else if (targetCol.type === 'upcoming') {
      if (updatedTask.dueDate === 'Today' || !updatedTask.dueDate) {
        updatedTask.dueDate = 'Tomorrow';
      }
      updatedTask.completed = false;
    } else if (targetCol.type === 'completed') {
      updatedTask.completed = true;
    } else if (targetCol.type === 'custom' || targetCol.type === 'project') {
      updatedTask.project = targetCol.title;
      updatedTask.completed = false;
    }

    const remaining = tasks.filter((t) => t.id !== draggedTaskId);
    const targetIdx = remaining.findIndex((t) => t.id === targetTask.id);

    if (targetIdx === -1) {
      reorderTasks([updatedTask, ...remaining]);
    } else {
      const insertIdx = dragOverPosition === 'after' ? targetIdx + 1 : targetIdx;
      const newTasks = [...remaining];
      newTasks.splice(insertIdx, 0, updatedTask);
      reorderTasks(newTasks);
    }

    handleDragEnd();
  };

  const handleDropOnColumn = (e: React.DragEvent, col: ColumnDef) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedTaskId) {
      handleDragEnd();
      return;
    }

    const draggedTask = tasks.find((t) => t.id === draggedTaskId);
    if (!draggedTask) {
      handleDragEnd();
      return;
    }

    const updatedTask = { ...draggedTask };
    if (col.type === 'today') {
      updatedTask.dueDate = 'Today';
      updatedTask.completed = false;
    } else if (col.type === 'upcoming') {
      if (updatedTask.dueDate === 'Today' || !updatedTask.dueDate) {
        updatedTask.dueDate = 'Tomorrow';
      }
      updatedTask.completed = false;
    } else if (col.type === 'completed') {
      updatedTask.completed = true;
    } else if (col.type === 'custom' || col.type === 'project') {
      updatedTask.project = col.title;
      updatedTask.completed = false;
    }

    const remaining = tasks.filter((t) => t.id !== draggedTaskId);
    reorderTasks([updatedTask, ...remaining]);
    handleDragEnd();
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
          const isColumnDragOver = dragOverColId === col.id;

          return (
            <section
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverColId(col.id);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                if (dragOverColId === col.id) setDragOverColId(null);
              }}
              onDrop={(e) => handleDropOnColumn(e, col)}
              className={clsx(
                'todo-column-card w-[370px] min-w-[370px] max-w-[370px] lg:w-[390px] lg:min-w-[390px] lg:max-w-[390px] shrink-0 bg-surface-container-low/60 backdrop-blur-md rounded-2xl border flex flex-col max-h-[calc(100vh-175px)] shadow-sm transition-all',
                isColumnDragOver
                  ? 'border-primary/60 bg-surface-container-low/90 ring-1 ring-primary/40'
                  : 'border-surface-variant/40 hover:border-surface-variant/70'
              )}
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

              {/* Vertically Scrollable Task Items Container with Drag & Drop */}
              <div
                className="todo-list-scrollable flex-1 overflow-y-auto p-3.5 space-y-2.5"
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
                  colTasks.map((task) => {
                    const isDragging = draggedTaskId === task.id;
                    const isOverThisTask = dragOverTaskId === task.id;

                    return (
                      <React.Fragment key={task.id}>
                        {/* Drop indicator line before */}
                        {isOverThisTask && dragOverPosition === 'before' && (
                          <div className="h-1 bg-primary rounded-full shadow-[0_0_8px_var(--primary)] -my-0.5 transition-all animate-pulse" />
                        )}

                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOverCard(e, task)}
                          onDrop={(e) => handleDropOnCard(e, task, col)}
                          className={clsx(
                            'group relative bg-surface-container-lowest/80 hover:bg-surface-container-lowest p-3.5 rounded-xl border border-surface-variant/30 hover:border-surface-variant/70 transition-all flex flex-col gap-2 shadow-sm cursor-grab active:cursor-grabbing',
                            task.completed && 'opacity-60',
                            isDragging && 'opacity-30 scale-[0.98] border-dashed border-primary'
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            {/* Drag Handle */}
                            <div
                              className="mt-0.5 text-outline/40 group-hover:text-outline/80 transition-colors shrink-0 cursor-grab"
                              title="Drag to reorder"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>

                            {/* Checkbox */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTaskComplete(task.id);
                              }}
                              className={clsx(
                                'mt-0.5 shrink-0 w-5 h-5 rounded-lg border flex items-center justify-center transition-all',
                                task.completed
                                  ? 'border-primary bg-primary text-on-primary'
                                  : 'border-surface-variant/70 hover:border-primary bg-transparent text-transparent hover:text-primary/30'
                              )}
                            >
                              <Check className="w-3 h-3" />
                            </button>

                            {/* Main Name & Body Only */}
                            <div
                              onClick={() => {
                                setSelectedTaskDetail(task);
                                setOverlay('task-detail');
                              }}
                              className="flex-1 min-w-0 cursor-pointer"
                            >
                              {/* Main Name */}
                              <h3
                                className={clsx(
                                  'font-body-md text-sm md:text-[14.5px] font-medium text-on-surface/90 leading-snug break-words group-hover:text-primary transition-colors',
                                  task.completed && 'line-through text-outline/60'
                                )}
                              >
                                {task.title}
                              </h3>

                              {/* Body (Directly under name) */}
                              {task.description && (
                                <p className="text-xs text-on-surface-variant/80 line-clamp-3 mt-1 leading-relaxed whitespace-pre-wrap">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            {/* Quick Action Icons */}
                            <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!task.completed && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTask(task.id);
                                }}
                                title="Delete task"
                                className="p-1.5 text-outline/60 hover:text-error rounded-lg hover:bg-surface-container/60 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Drop indicator line after */}
                        {isOverThisTask && dragOverPosition === 'after' && (
                          <div className="h-1 bg-primary rounded-full shadow-[0_0_8px_var(--primary)] -my-0.5 transition-all animate-pulse" />
                        )}
                      </React.Fragment>
                    );
                  })
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
            className="w-[520px] max-w-[92vw] bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-7 shadow-xl flex flex-col gap-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-surface-variant/30 pb-4">
              <h2 className="font-headline-md text-on-surface/95 text-lg font-semibold">
                Add New Task
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant/70 hover:text-primary text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAdd} className="flex flex-col gap-4">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-primary/80 uppercase tracking-wider">
                  Task Name
                </label>
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="What needs focus?"
                  autoFocus
                  className="px-4 py-2.5 rounded-xl bg-surface/80 border border-surface-variant/50 text-sm text-on-surface/90 placeholder:text-outline/60 focus:outline-none focus:border-primary/60"
                />
              </div>

              {/* Body / Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-on-surface-variant/80 uppercase tracking-wider flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-primary/80" /> Body / Description
                </label>
                <textarea
                  value={quickDescription}
                  onChange={(e) => setQuickDescription(e.target.value)}
                  rows={3}
                  placeholder="Add details, notes, or context for this todo..."
                  className="px-4 py-2.5 rounded-xl bg-surface/80 border border-surface-variant/50 text-sm text-on-surface/90 placeholder:text-outline/60 focus:outline-none focus:border-primary/60 resize-none leading-relaxed"
                />
              </div>

              {/* List and Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-on-surface-variant/80 font-medium flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-outline" /> List / Project
                  </label>
                  <select
                    value={quickProject}
                    onChange={(e) => setQuickProject(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-surface/80 border border-surface-variant/50 text-sm text-on-surface/90 cursor-pointer focus:outline-none focus:border-primary/60"
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
                  <label className="text-xs text-on-surface-variant/80 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-outline" /> Due Date
                  </label>
                  <select
                    value={quickDueDate}
                    onChange={(e) => setQuickDueDate(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-surface/80 border border-surface-variant/50 text-sm text-on-surface/90 cursor-pointer focus:outline-none focus:border-primary/60"
                  >
                    <option value="Today">Today</option>
                    <option value="Tomorrow">Tomorrow</option>
                    <option value="Next Week">Next Week</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-surface-variant/30">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-surface-variant/40 text-on-surface-variant/80 hover:text-on-surface text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-medium shadow-sm hover:opacity-90"
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

