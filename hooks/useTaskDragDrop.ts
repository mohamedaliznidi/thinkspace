/**
 * Task Drag and Drop Hook for ThinkSpace
 * 
 * This hook provides drag-and-drop functionality for task reordering
 * and status changes with visual feedback and smooth animations.
 */

'use client';

import { useState, useCallback, useRef } from 'react';

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  order: number;
}

interface DragState {
  draggedTask: Task | null;
  draggedOver: string | null;
  isDragging: boolean;
  dragStartPosition: { x: number; y: number } | null;
}

interface UseTaskDragDropProps {
  onTaskReorder?: (taskId: string, newOrder: number, targetTaskId?: string) => void;
  onTaskStatusChange?: (taskId: string, newStatus: Task['status']) => void;
  onTaskMove?: (taskId: string, targetProjectId: string, newOrder: number) => void;
  enabled?: boolean;
}

export function useTaskDragDrop({
  onTaskReorder,
  onTaskStatusChange,
  onTaskMove,
  enabled = true,
}: UseTaskDragDropProps) {
  const [dragState, setDragState] = useState<DragState>({
    draggedTask: null,
    draggedOver: null,
    isDragging: false,
    dragStartPosition: null,
  });

  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDragStart = useCallback((task: Task, event: React.DragEvent) => {
    if (!enabled) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const startPosition = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    setDragState({
      draggedTask: task,
      draggedOver: null,
      isDragging: true,
      dragStartPosition: startPosition,
    });

    // Set drag data
    event.dataTransfer.setData('application/json', JSON.stringify(task));
    event.dataTransfer.effectAllowed = 'move';

    // Add visual feedback
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.style.opacity = '0.5';
      event.currentTarget.style.transform = 'rotate(5deg)';
    }
  }, [enabled]);

  const handleDragEnd = useCallback((event: React.DragEvent) => {
    if (!enabled) return;

    // Clear timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }

    // Reset visual feedback
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.style.opacity = '';
      event.currentTarget.style.transform = '';
    }

    setDragState({
      draggedTask: null,
      draggedOver: null,
      isDragging: false,
      dragStartPosition: null,
    });
  }, [enabled]);

  const handleDragOver = useCallback((event: React.DragEvent, targetId?: string) => {
    if (!enabled) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    if (targetId && targetId !== dragState.draggedOver) {
      setDragState(prev => ({
        ...prev,
        draggedOver: targetId,
      }));
    }
  }, [enabled, dragState.draggedOver]);

  const handleDragEnter = useCallback((event: React.DragEvent, targetId?: string) => {
    if (!enabled) return;

    event.preventDefault();

    if (targetId) {
      setDragState(prev => ({
        ...prev,
        draggedOver: targetId,
      }));

      // Add visual feedback to drop target
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.style.backgroundColor = 'var(--mantine-color-blue-0)';
        event.currentTarget.style.borderColor = 'var(--mantine-color-blue-6)';
      }
    }
  }, [enabled]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    if (!enabled) return;

    // Only clear if we're actually leaving the element
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setDragState(prev => ({
        ...prev,
        draggedOver: null,
      }));

      // Remove visual feedback
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.style.backgroundColor = '';
        event.currentTarget.style.borderColor = '';
      }
    }
  }, [enabled]);

  const handleDrop = useCallback((
    event: React.DragEvent,
    targetTask?: Task,
    targetStatus?: Task['status'],
    targetProjectId?: string
  ) => {
    if (!enabled) return;

    event.preventDefault();

    // Remove visual feedback
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.style.backgroundColor = '';
      event.currentTarget.style.borderColor = '';
    }

    try {
      const draggedTaskData = JSON.parse(event.dataTransfer.getData('application/json')) as Task;
      
      if (!draggedTaskData) return;

      // Handle status change (kanban columns)
      if (targetStatus && targetStatus !== draggedTaskData.status && onTaskStatusChange) {
        onTaskStatusChange(draggedTaskData.id, targetStatus);
      }
      // Handle reordering within same context
      else if (targetTask && targetTask.id !== draggedTaskData.id && onTaskReorder) {
        onTaskReorder(draggedTaskData.id, targetTask.order, targetTask.id);
      }
      // Handle moving to different project
      else if (targetProjectId && targetProjectId !== draggedTaskData.id && onTaskMove) {
        onTaskMove(draggedTaskData.id, targetProjectId, 0);
      }

    } catch (error) {
      console.error('Error handling drop:', error);
    }

    setDragState({
      draggedTask: null,
      draggedOver: null,
      isDragging: false,
      dragStartPosition: null,
    });
  }, [enabled, onTaskReorder, onTaskStatusChange, onTaskMove]);

  const getDragProps = useCallback((task: Task) => ({
    draggable: enabled,
    onDragStart: (e: React.DragEvent) => handleDragStart(task, e),
    onDragEnd: handleDragEnd,
    style: {
      cursor: enabled ? 'grab' : 'default',
      transition: 'all 0.2s ease',
      ...(dragState.draggedTask?.id === task.id && {
        opacity: 0.5,
        transform: 'rotate(5deg)',
      }),
    },
  }), [enabled, dragState.draggedTask, handleDragStart, handleDragEnd]);

  const getDropProps = useCallback((
    targetTask?: Task,
    targetStatus?: Task['status'],
    targetProjectId?: string
  ) => ({
    onDragOver: (e: React.DragEvent) => handleDragOver(e, targetTask?.id || targetStatus || targetProjectId),
    onDragEnter: (e: React.DragEvent) => handleDragEnter(e, targetTask?.id || targetStatus || targetProjectId),
    onDragLeave: handleDragLeave,
    onDrop: (e: React.DragEvent) => handleDrop(e, targetTask, targetStatus, targetProjectId),
    style: {
      transition: 'all 0.2s ease',
      ...(dragState.draggedOver === (targetTask?.id || targetStatus || targetProjectId) && {
        backgroundColor: 'var(--mantine-color-blue-0)',
        borderColor: 'var(--mantine-color-blue-6)',
      }),
    },
  }), [
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    dragState.draggedOver,
  ]);

  return {
    dragState,
    getDragProps,
    getDropProps,
    isDragging: dragState.isDragging,
    draggedTask: dragState.draggedTask,
  };
}
