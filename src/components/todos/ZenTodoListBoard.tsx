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
  Layers,
  Search,
  AlignLeft,
} from 'lucide-react';
import clsx from 'clsx';
import { Task } from '@/types';

export interface ColumnDef {
  id: string;
  title: string;
  type: 'today' | 'upcoming' | 'project' | 'custom' | 'completed';
  icon: React.ReactNode;
  isCustom?: boolean;
}

export interface ZenTodoListBoardProps {
  title?: string;
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onReorderTasks: (tasks: Task[]) => void;
  customLists: string[];
  onAddCustomList: (name: string) => void;
  onDeleteCustomList: (name: string) => void;
  isGroupMode?: boolean;
  compactMode?: boolean;
  headerRightContent?: React.ReactNode;
  defaultProject?: string;
  hideHeader?: boolean;
}

export function ZenTodoListBoard({
  title = 'Task Overview',
  tasks,
  onAddTask,
  onToggleComplete,
  onDeleteTask,
  onReorderTasks,
  customLists,
  onAddCustomList,
  onDeleteCustomList,
  isGroupMode = false,
  compactMode = false,
  headerRightContent,
  defaultProject,
  hideHeader = false,
}: ZenTodoListBoardProps) {
  const { setOverlay, setSelectedTaskDetail, setSelectedTask, setActiveTab, groups, setActiveGroupId } = useApp();

  // UI state
  const [showAddModal, setShowAddModal] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDescription, setQuickDescription] = useState('');
  const [quickProject, setQuickProject] = useState(defaultProject || customLists[0] || 'General');
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
  const scrollRafRef = useRef<number | null>(null);

  // Active column index tracking for compact / single list mode
  const [activeColIndex, setActiveColIndex] = useState(0);

  const handleBoardScroll = () => {
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      if (!boardRef.current) return;
      const container = boardRef.current;
      const scrollLeft = container.scrollLeft;
      const card = container.querySelector('.todo-column-card') as HTMLElement | null;
      const cardWidth = card ? card.offsetWidth + (compactMode ? 14 : 24) : (container.clientWidth || 1);
      const newIdx = Math.round(scrollLeft / cardWidth);
      setActiveColIndex(Math.max(0, Math.min(newIdx, Math.max(0, columns.length - 1))));
    });
  };

  const scrollToIndex = (idx: number) => {
    if (!boardRef.current) return;
    const container = boardRef.current;
    const card = container.querySelector('.todo-column-card') as HTMLElement | null;
    const cardWidth = card ? card.offsetWidth + (compactMode ? 14 : 24) : (container.clientWidth || 1);
    container.scrollTo({
      left: idx * cardWidth,
      behavior: 'smooth',
    });
  };

  // Clean, non-jittering wheel listener:
  // - Inside column cards: Allows native vertical scrolling of .todo-list-scrollable without triggering horizontal jumping.
  // - Outside cards (canvas background in wide mode): Translates vertical wheel to horizontal board scroll smoothly.
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

      if (!compactMode && Math.abs(e.deltaY) > Math.abs(e.deltaX) * 1.5) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    const handleQuickAdd = () => {
      setActiveInlineCol('today');
    };
    window.addEventListener('zen:quick-add-task', handleQuickAdd);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('zen:quick-add-task', handleQuickAdd);
    };
  }, [compactMode]);

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
    onAddCustomList(trimmed);
    setNewListName('');
    setIsAddingList(false);
    scrollToFarRight();
  };

  const handleDeleteList = (listName: string) => {
    onDeleteCustomList(listName);
  };

  // Handle Quick Add Modal Submit
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onAddTask({
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
    const taskTitle = inlineTaskTitles[col.id]?.trim();
    if (!taskTitle) return;

    let project = defaultProject || 'General';
    let dueDate = 'Today';
    let completed = false;

    if (col.type === 'today') {
      dueDate = 'Today';
      project = customLists[0] || defaultProject || 'General';
    } else if (col.type === 'upcoming') {
      dueDate = 'Tomorrow';
      project = customLists[0] || defaultProject || 'General';
    } else if (col.type === 'completed') {
      completed = true;
      dueDate = 'Today';
    } else if (col.type === 'project' || col.type === 'custom') {
      project = col.title;
      dueDate = 'Today';
    }

    onAddTask({
      title: taskTitle,
      project,
      priority: 'medium',
      dueDate,
      completed,
    });

    setInlineTaskTitles((prev) => ({ ...prev, [col.id]: '' }));
    setActiveInlineCol(null);
  };

  // Build the list of columns
  const columns: ColumnDef[] = isGroupMode
    ? [
        ...customLists.map((name) => ({
          id: `col-${name}`,
          title: name,
          type: 'custom' as const,
          icon: <Folder className="w-3.5 h-3.5 text-primary" />,
          isCustom: true,
        })),
        {
          id: 'col-completed',
          title: 'Done',
          type: 'completed',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-outline" />,
        },
      ]
    : [
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
          t.project?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.assignedTo?.toLowerCase().includes(q)
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
    return filtered.filter((t) => !t.completed && t.project?.toLowerCase() === col.title.toLowerCase());
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
      onReorderTasks([updatedTask, ...remaining]);
    } else {
      const insertIdx = dragOverPosition === 'after' ? targetIdx + 1 : targetIdx;
      const newTasks = [...remaining];
      newTasks.splice(insertIdx, 0, updatedTask);
      onReorderTasks(newTasks);
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
    onReorderTasks([updatedTask, ...remaining]);
    handleDragEnd();
  };

  const totalActiveTasks = tasks.filter((t) => !t.completed).length;

  // Column width classes depending on mode
  // In compact mode: exactly one list fills the entire panel width with snap-center
  const colWidthClass = compactMode
    ? 'w-full min-w-full max-w-full snap-center'
    : 'w-[360px] min-w-[360px] max-w-[360px] lg:w-[380px] lg:min-w-[380px] lg:max-w-[380px] snap-start';

  return (
    <div className="flex-1 h-full min-h-0 flex flex-col overflow-hidden select-none animate-in fade-in duration-300">
      {/* Top Header Bar */}
      {!hideHeader && (
        <header
          className={clsx(
            'shrink-0 border-b border-surface-variant/30 flex flex-col gap-2.5 bg-surface-container-lowest/70 backdrop-blur-md',
            compactMode ? 'px-3.5 py-3' : 'px-8 pt-7 pb-5'
          )}
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2 min-w-0 shrink">
              <h1
                className={clsx(
                  'font-headline-md text-primary font-semibold tracking-tight truncate',
                  compactMode ? 'text-base' : 'text-2xl md:text-3xl'
                )}
              >
                {title}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] md:text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 shrink-0">
                {totalActiveTasks} active
              </span>
            </div>

            {/* Action Controls & Search - Always pinned to the right */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {/* Search bar */}
              <div className="relative flex items-center">
                <Search className="w-3 h-3 absolute left-2 text-outline/60 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter..."
                  className={clsx(
                    'h-7 pl-6 pr-2 py-1 rounded-xl bg-surface-container-low/70 border border-surface-variant/40 text-xs text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-primary/50 transition-all',
                    compactMode ? 'w-20 sm:w-24 text-[11px]' : 'w-40 md:w-52 h-9 text-sm pl-8'
                  )}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1.5 text-outline/60 hover:text-on-surface text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* New List Button - Always pinned on the right */}
              <button
                onClick={() => {
                  setIsAddingList(true);
                  scrollToFarRight();
                }}
                className={clsx(
                  'flex items-center gap-1 rounded-xl bg-primary text-on-primary font-semibold hover:opacity-90 transition-all shadow-sm shrink-0',
                  compactMode ? 'px-2.5 py-1 text-[11px] h-7' : 'px-3.5 py-2 text-sm h-9'
                )}
                title="Create a new todo list/column"
              >
                <Layers className="w-3 h-3" />
                <span>+ List</span>
              </button>

              {/* Right-most Action Controls (e.g. Collapse Button) */}
              {headerRightContent}
            </div>
          </div>

          {/* Compact Mode List Carousel Indicators (Scroll Breaking Navigation) */}
          {compactMode && (
            <div className="flex items-center justify-between pt-1 border-t border-surface-variant/20 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
                {columns.map((col, idx) => {
                  const isActive = activeColIndex === idx;
                  return (
                    <button
                      key={col.id}
                      onClick={() => scrollToIndex(idx)}
                      className={clsx(
                        'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 flex items-center gap-1',
                        isActive
                          ? 'bg-primary text-on-primary font-semibold shadow-sm scale-105'
                          : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                      )}
                    >
                      <span className="truncate max-w-[110px]">{col.title}</span>
                      <span
                        className={clsx(
                          'text-[9px] px-1.5 py-0.2 rounded-full',
                          isActive ? 'bg-white/20 text-white' : 'bg-surface/80 text-outline'
                        )}
                      >
                        {getTasksForColumn(col).length}
                      </span>
                    </button>
                  );
                })}
              </div>

              <span className="text-[10px] text-outline shrink-0 ml-2 font-mono">
                {Math.min(activeColIndex + 1, columns.length)}/{columns.length}
              </span>
            </div>
          )}
        </header>
      )}

      {/* Main Horizontally Scrollable Board Canvas with Clean Scroll Breaking */}
      <div
        ref={boardRef}
        onScroll={handleBoardScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={clsx(
          'flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden flex flex-row items-start cursor-default',
          compactMode
            ? 'p-3 gap-3.5 snap-x snap-mandatory'
            : 'px-8 py-6 gap-6'
        )}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--outline-variant) transparent',
          scrollSnapType: compactMode ? 'x mandatory' : undefined,
          overscrollBehaviorX: 'contain',
        }}
      >
        {columns.map((col, colIdx) => {
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
              style={{
                scrollSnapAlign: compactMode ? 'center' : undefined,
                scrollSnapStop: compactMode ? 'always' : undefined,
              }}
              className={clsx(
                'todo-column-card shrink-0 bg-surface-container-low/80 backdrop-blur-md rounded-2xl border flex flex-col shadow-sm transition-all',
                colWidthClass,
                compactMode ? 'max-h-[calc(100vh-145px)] h-[calc(100vh-145px)]' : 'max-h-[calc(100vh-175px)]',
                isColumnDragOver
                  ? 'border-primary/60 bg-surface-container-low/90 ring-1 ring-primary/40'
                  : 'border-surface-variant/40 hover:border-surface-variant/70'
              )}
            >
              {/* Column Header */}
              <div
                className={clsx(
                  'shrink-0 border-b border-surface-variant/30 flex items-center justify-between',
                  compactMode ? 'p-3 pb-2.5' : 'p-4 pb-3'
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded-lg bg-surface-container/60">{col.icon}</div>
                  <h2 className="font-label-md text-primary font-semibold text-xs md:text-sm tracking-normal truncate">
                    {col.title}
                  </h2>
                  <span className="text-[11px] font-medium text-on-surface-variant bg-surface-container/70 px-2 py-0.5 rounded-full shrink-0">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setActiveInlineCol(isInlineActive ? null : col.id);
                    }}
                    title="Add task to this list"
                    className="p-1 text-outline/70 hover:text-primary rounded-lg hover:bg-surface-container/60 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  {col.isCustom && (
                    <button
                      onClick={() => handleDeleteList(col.title)}
                      title="Delete this list"
                      className="p-1 text-outline/70 hover:text-error rounded-lg hover:bg-surface-container/60 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Quick Add Row in Column Header when toggled */}
              {isInlineActive && (
                <div className="shrink-0 p-3 bg-surface-container/40 border-b border-surface-variant/30 flex flex-col gap-2 animate-in fade-in duration-150">
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
                    className="w-full px-3 py-1.5 rounded-xl bg-surface/80 border border-surface-variant/50 text-xs text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-primary/60"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setActiveInlineCol(null)}
                      className="px-2.5 py-1 text-[11px] text-outline/70 hover:text-on-surface"
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

              {/* Vertically Scrollable Task Items Container with Drag & Drop */}
              <div
                className="todo-list-scrollable flex-1 overflow-y-auto p-3 space-y-2"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--outline-variant) transparent',
                  overscrollBehaviorY: 'contain',
                }}
              >
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center flex flex-col items-center justify-center text-outline/70 text-xs italic">
                    <span>No tasks in this list</span>
                    <button
                      onClick={() => setActiveInlineCol(col.id)}
                      className="mt-1.5 text-[11px] text-primary/80 hover:text-primary not-italic underline underline-offset-2"
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
                            'group relative bg-surface-container-lowest/85 hover:bg-surface-container-lowest p-3 rounded-xl border border-surface-variant/30 hover:border-surface-variant/70 transition-all flex flex-col gap-1.5 shadow-sm cursor-grab active:cursor-grabbing',
                            task.completed && 'opacity-60',
                            isDragging && 'opacity-30 scale-[0.98] border-dashed border-primary'
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {/* Drag Handle */}
                            <div
                              className="mt-0.5 text-outline/40 group-hover:text-outline/80 transition-colors shrink-0 cursor-grab"
                              title="Drag to reorder"
                            >
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>

                            {/* Checkbox */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleComplete(task.id);
                              }}
                              className={clsx(
                                'mt-0.5 shrink-0 w-4 h-4 rounded-md border flex items-center justify-center transition-all',
                                task.completed
                                  ? 'border-primary bg-primary text-on-primary'
                                  : 'border-surface-variant/70 hover:border-primary bg-transparent text-transparent hover:text-primary/30'
                              )}
                            >
                              <Check className="w-2.5 h-2.5" />
                            </button>

                            {/* Main Name & Body */}
                            <div
                              onClick={() => {
                                setSelectedTaskDetail(task);
                                setOverlay('task-detail');
                              }}
                              className="flex-1 min-w-0 cursor-pointer"
                            >
                              <h3
                                className={clsx(
                                  'font-body-md text-xs md:text-sm font-medium text-on-surface leading-snug break-words group-hover:text-primary transition-colors',
                                  task.completed && 'line-through text-outline/60'
                                )}
                              >
                                {task.title}
                              </h3>

                              {task.description && (
                                <p className="text-[11px] text-on-surface-variant/80 line-clamp-2 mt-0.5 leading-relaxed whitespace-pre-wrap">
                                  {task.description}
                                </p>
                              )}

                              {task.assignedTo && (
                                <div className="mt-1 flex items-center gap-1">
                                  <span className="text-[10px] font-medium text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                    👤 {task.assignedTo}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Quick Action Icons */}
                            <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!task.completed && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTask(task);
                                    if (isGroupMode) {
                                      setActiveTab('groups');
                                    } else {
                                      const matchingGroup = groups.find(
                                        (g) =>
                                          g.tasks.some((t) => t.id === task.id) ||
                                          (task.project && g.name.toLowerCase() === task.project.toLowerCase())
                                      );
                                      if (matchingGroup) {
                                        setActiveGroupId(matchingGroup.id);
                                        setActiveTab('groups');
                                      } else {
                                        setActiveTab('timer');
                                      }
                                    }
                                  }}
                                  title={isGroupMode ? "Focus in Group Timer" : "Focus in Timer"}
                                  className="p-1 text-primary/80 hover:text-primary hover:scale-110 rounded-lg hover:bg-surface-container/60 transition-all"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTask(task.id);
                                }}
                                title="Delete task"
                                className="p-1 text-outline/60 hover:text-error rounded-lg hover:bg-surface-container/60 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
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
              <div className="shrink-0 p-2.5 pt-2 border-t border-surface-variant/30">
                <button
                  onClick={() => setActiveInlineCol(col.id)}
                  className="w-full py-1.5 px-3 rounded-xl bg-surface-container/40 hover:bg-surface-container/70 text-on-surface-variant hover:text-primary text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-transparent hover:border-surface-variant/30"
                >
                  <Plus className="w-3 h-3" /> Add Task
                </button>
              </div>
            </section>
          );
        })}

        {/* Ghost "+ Add New List" Column Card at the far right */}
        <div
          style={{
            scrollSnapAlign: compactMode ? 'center' : undefined,
          }}
          className={clsx('shrink-0', colWidthClass)}
        >
          {isAddingList ? (
            <div className="bg-surface-container-low/80 p-4 rounded-2xl border border-primary/30 shadow-sm flex flex-col gap-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                  Create New List
                </h3>
                <button
                  onClick={() => setIsAddingList(false)}
                  className="text-outline/70 hover:text-on-surface text-xs"
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
                  placeholder="e.g. Backlog, Testing..."
                  className="w-full px-3 py-2 rounded-xl bg-surface/80 border border-surface-variant/50 text-xs text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-primary/60"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingList(false)}
                    className="px-3 py-1.5 rounded-xl text-xs text-outline/70 hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-medium shadow-sm hover:opacity-90"
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
              className="w-full h-32 rounded-2xl border-2 border-dashed border-surface-variant/40 hover:border-primary/40 bg-surface-container-low/30 hover:bg-surface-container-low/60 flex flex-col items-center justify-center gap-2 text-outline/70 hover:text-primary transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-surface-container/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-3.5 h-3.5 text-primary" />
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            className="w-[500px] max-w-[92vw] bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-6 shadow-xl flex flex-col gap-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-surface-variant/30 pb-3">
              <h2 className="font-headline-md text-on-surface text-base font-semibold">
                Add New Task
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant/70 hover:text-primary text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAdd} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                  Task Name
                </label>
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="What needs focus?"
                  autoFocus
                  className="px-3.5 py-2 rounded-xl bg-surface/80 border border-surface-variant/50 text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-primary/60"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-primary" /> Body / Description
                </label>
                <textarea
                  value={quickDescription}
                  onChange={(e) => setQuickDescription(e.target.value)}
                  rows={2}
                  placeholder="Add details, notes, or context..."
                  className="px-3.5 py-2 rounded-xl bg-surface/80 border border-surface-variant/50 text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-primary/60 resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant font-medium flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-outline" /> List / Category
                  </label>
                  <select
                    value={quickProject}
                    onChange={(e) => setQuickProject(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-surface/80 border border-surface-variant/50 text-xs text-on-surface cursor-pointer focus:outline-none focus:border-primary/60"
                  >
                    {customLists.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-outline" /> Due Date
                  </label>
                  <select
                    value={quickDueDate}
                    onChange={(e) => setQuickDueDate(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-surface/80 border border-surface-variant/50 text-xs text-on-surface cursor-pointer focus:outline-none focus:border-primary/60"
                  >
                    <option value="Today">Today</option>
                    <option value="Tomorrow">Tomorrow</option>
                    <option value="Next Week">Next Week</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-surface-variant/30">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-surface-variant/40 text-on-surface-variant hover:text-on-surface text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-medium shadow-sm hover:opacity-90"
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
