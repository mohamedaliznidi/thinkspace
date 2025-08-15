/**
 * Task Keyboard Shortcuts Hook for ThinkSpace
 * 
 * This hook provides keyboard shortcuts for task management
 * including quick task creation, status changes, and navigation.
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useHotkeys } from '@mantine/hooks';

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

interface UseTaskKeyboardShortcutsProps {
  onTaskCreate?: () => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  onTaskStatusChange?: (taskId: string, status: Task['status']) => void;
  onBulkComplete?: () => void;
  onBulkDelete?: () => void;
  onViewModeToggle?: () => void;
  onFocusSearch?: () => void;
  selectedTasks?: Task[];
  focusedTask?: Task | null;
  enabled?: boolean;
}

export function useTaskKeyboardShortcuts({
  onTaskCreate,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  onBulkComplete,
  onBulkDelete,
  onViewModeToggle,
  onFocusSearch,
  selectedTasks = [],
  focusedTask,
  enabled = true,
}: UseTaskKeyboardShortcutsProps) {
  
  // Quick task creation
  useHotkeys([
    ['mod+Enter', () => {
      if (enabled && onTaskCreate) {
        onTaskCreate();
      }
    }],
  ]);

  // Search focus
  useHotkeys([
    ['mod+K', (e) => {
      if (enabled && onFocusSearch) {
        e.preventDefault();
        onFocusSearch();
      }
    }],
    ['/', (e) => {
      if (enabled && onFocusSearch) {
        e.preventDefault();
        onFocusSearch();
      }
    }],
  ]);

  // View mode toggle
  useHotkeys([
    ['mod+Shift+V', () => {
      if (enabled && onViewModeToggle) {
        onViewModeToggle();
      }
    }],
  ]);

  // Task status changes for focused task
  useHotkeys([
    ['1', () => {
      if (enabled && focusedTask && onTaskStatusChange) {
        onTaskStatusChange(focusedTask.id, 'TODO');
      }
    }],
    ['2', () => {
      if (enabled && focusedTask && onTaskStatusChange) {
        onTaskStatusChange(focusedTask.id, 'IN_PROGRESS');
      }
    }],
    ['3', () => {
      if (enabled && focusedTask && onTaskStatusChange) {
        onTaskStatusChange(focusedTask.id, 'IN_REVIEW');
      }
    }],
    ['4', () => {
      if (enabled && focusedTask && onTaskStatusChange) {
        onTaskStatusChange(focusedTask.id, 'BLOCKED');
      }
    }],
    ['5', () => {
      if (enabled && focusedTask && onTaskStatusChange) {
        onTaskStatusChange(focusedTask.id, 'COMPLETED');
      }
    }],
  ]);

  // Edit focused task
  useHotkeys([
    ['e', () => {
      if (enabled && focusedTask && onTaskEdit) {
        onTaskEdit(focusedTask);
      }
    }],
  ]);

  // Delete focused task
  useHotkeys([
    ['Delete', () => {
      if (enabled && focusedTask && onTaskDelete) {
        onTaskDelete(focusedTask);
      }
    }],
    ['Backspace', () => {
      if (enabled && focusedTask && onTaskDelete) {
        onTaskDelete(focusedTask);
      }
    }],
  ]);

  // Bulk operations
  useHotkeys([
    ['mod+Shift+C', () => {
      if (enabled && selectedTasks.length > 0 && onBulkComplete) {
        onBulkComplete();
      }
    }],
    ['mod+Shift+Delete', () => {
      if (enabled && selectedTasks.length > 0 && onBulkDelete) {
        onBulkDelete();
      }
    }],
  ]);

  // Return helper functions and state
  return {
    shortcuts: {
      'Cmd/Ctrl + Enter': 'Create new task',
      'Cmd/Ctrl + K or /': 'Focus search',
      'Cmd/Ctrl + Shift + V': 'Toggle view mode',
      '1-5': 'Change task status (when task focused)',
      'E': 'Edit focused task',
      'Delete/Backspace': 'Delete focused task',
      'Cmd/Ctrl + Shift + C': 'Complete selected tasks',
      'Cmd/Ctrl + Shift + Delete': 'Delete selected tasks',
    },
  };
}
