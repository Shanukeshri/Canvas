import { create } from 'zustand';
import { ActiveTab, OverlayType, Task } from '@/types';

interface UIState {
  // Navigation & Overlays
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  overlay: OverlayType;
  setOverlay: (overlay: OverlayType) => void;
  closeOverlay: () => void;
  selectedTaskDetail: Task | null;
  setSelectedTaskDetail: (task: Task | null) => void;

  // Dragging & Interaction
  isDraggingBubble: boolean;
  setIsDraggingBubble: (isDragging: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Theme & Profile UI
  activeThemeId: string;
  setActiveThemeId: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'timer',
  setActiveTab: (tab) => set({ activeTab: tab }),
  overlay: null,
  setOverlay: (overlay) => set({ overlay }),
  closeOverlay: () => set({ overlay: null }),
  selectedTaskDetail: null,
  setSelectedTaskDetail: (task) => set({ selectedTaskDetail: task, overlay: task ? 'task-detail' : null }),
  isDraggingBubble: false,
  setIsDraggingBubble: (isDragging) => set({ isDraggingBubble: isDragging }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open, overlay: open ? 'command-k' : null }),
  activeThemeId: 'indigo-dusk',
  setActiveThemeId: (id) => set({ activeThemeId: id }),
}));
