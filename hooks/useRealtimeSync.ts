/**
 * Real-time Sync Hook for ThinkSpace
 * 
 * React hook for managing real-time synchronization, optimistic updates,
 * and conflict resolution in React components.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { notifications } from '@mantine/notifications';
import { 
  realtimeSync, 
  RealtimeEvent, 
  OptimisticUpdate, 
  RealtimeEventType,
  ConflictResolutionStrategy 
} from '@/lib/realtime';

// Hook return type
interface UseRealtimeSyncReturn {
  // Connection status
  isConnected: boolean;
  reconnectAttempts: number;
  
  // Optimistic updates
  sendOptimisticUpdate: (
    type: RealtimeEventType,
    itemType: 'project' | 'area' | 'resource' | 'note',
    itemId: string,
    originalData: any,
    optimisticData: any
  ) => Promise<string>;
  pendingUpdates: OptimisticUpdate[];
  
  // Conflicts
  conflicts: RealtimeEvent[];
  resolveConflict: (
    conflictId: string,
    strategy: ConflictResolutionStrategy,
    manualResolution?: any
  ) => Promise<void>;
  
  // Event subscription
  subscribe: (eventType: RealtimeEventType, handler: (event: RealtimeEvent) => void) => () => void;
  
  // Manual sync
  forceSync: () => void;
}

// Hook options
interface UseRealtimeSyncOptions {
  autoConnect?: boolean;
  showNotifications?: boolean;
  onRealtimeEvent?: (event: RealtimeEvent) => void;
  onOptimisticUpdate?: (update: OptimisticUpdate) => void;
  onOptimisticConfirmed?: (update: OptimisticUpdate) => void;
  onOptimisticFailed?: (update: OptimisticUpdate) => void;
  onSyncConflict?: (event: RealtimeEvent) => void;
}

export function useRealtimeSync(options: UseRealtimeSyncOptions = {}): UseRealtimeSyncReturn {
  const { data: session } = useSession();
  const {
    autoConnect = true,
    showNotifications = true,
    onRealtimeEvent,
    onOptimisticUpdate,
    onOptimisticConfirmed,
    onOptimisticFailed,
    onSyncConflict,
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [pendingUpdates, setPendingUpdates] = useState<OptimisticUpdate[]>([]);
  const [conflicts, setConflicts] = useState<RealtimeEvent[]>([]);

  // Refs for event handlers to avoid stale closures
  const handlersRef = useRef({
    onRealtimeEvent,
    onOptimisticUpdate,
    onOptimisticConfirmed,
    onOptimisticFailed,
    onSyncConflict,
  });

  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = {
      onRealtimeEvent,
      onOptimisticUpdate,
      onOptimisticConfirmed,
      onOptimisticFailed,
      onSyncConflict,
    };
  }, [onRealtimeEvent, onOptimisticUpdate, onOptimisticConfirmed, onOptimisticFailed, onSyncConflict]);

  // Connect to real-time sync when session is available
  useEffect(() => {
    if (autoConnect && session?.user?.id) {
      realtimeSync.connect(session.user.id);
    }

    return () => {
      if (autoConnect) {
        realtimeSync.disconnect();
      }
    };
  }, [session?.user?.id, autoConnect]);

  // Setup event listeners
  useEffect(() => {
    const handleConnected = () => {
      setIsConnected(true);
      setReconnectAttempts(0);
      
      if (showNotifications) {
        notifications.show({
          title: 'Connected',
          message: 'Real-time sync is now active',
          color: 'green',
          autoClose: 3000,
        });
      }
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      
      if (showNotifications) {
        notifications.show({
          title: 'Disconnected',
          message: 'Real-time sync connection lost. Attempting to reconnect...',
          color: 'orange',
          autoClose: 5000,
        });
      }
    };

    const handleRealtimeEvent = (event: RealtimeEvent) => {
      handlersRef.current.onRealtimeEvent?.(event);
      
      if (showNotifications && event.type !== 'user_activity') {
        notifications.show({
          title: 'Real-time Update',
          message: `${event.data.itemType || 'Item'} was ${event.type.replace('_', ' ')}`,
          color: 'blue',
          autoClose: 3000,
        });
      }
    };

    const handleOptimisticUpdate = (update: OptimisticUpdate) => {
      setPendingUpdates(prev => [...prev.filter(u => u.id !== update.id), update]);
      handlersRef.current.onOptimisticUpdate?.(update);
    };

    const handleOptimisticConfirmed = (update: OptimisticUpdate) => {
      setPendingUpdates(prev => prev.filter(u => u.id !== update.id));
      handlersRef.current.onOptimisticConfirmed?.(update);
      
      if (showNotifications) {
        notifications.show({
          title: 'Update Confirmed',
          message: 'Your changes have been synchronized',
          color: 'green',
          autoClose: 2000,
        });
      }
    };

    const handleOptimisticFailed = (update: OptimisticUpdate) => {
      setPendingUpdates(prev => prev.filter(u => u.id !== update.id));
      handlersRef.current.onOptimisticFailed?.(update);
      
      if (showNotifications) {
        notifications.show({
          title: 'Update Failed',
          message: 'Failed to synchronize your changes. They have been reverted.',
          color: 'red',
          autoClose: 5000,
        });
      }
    };

    const handleRevertOptimistic = (update: OptimisticUpdate) => {
      setPendingUpdates(prev => prev.filter(u => u.id !== update.id));
      
      if (showNotifications) {
        notifications.show({
          title: 'Changes Reverted',
          message: 'Your optimistic changes have been reverted due to conflicts',
          color: 'orange',
          autoClose: 4000,
        });
      }
    };

    const handleSyncConflict = (event: RealtimeEvent) => {
      setConflicts(prev => [...prev, event]);
      handlersRef.current.onSyncConflict?.(event);
      
      if (showNotifications) {
        notifications.show({
          title: 'Sync Conflict',
          message: 'A conflict was detected. Please resolve it manually.',
          color: 'red',
          autoClose: false,
        });
      }
    };

    // Add event listeners
    realtimeSync.on('connected', handleConnected);
    realtimeSync.on('disconnected', handleDisconnected);
    realtimeSync.on('realtime_event', handleRealtimeEvent);
    realtimeSync.on('optimistic_update', handleOptimisticUpdate);
    realtimeSync.on('optimistic_confirmed', handleOptimisticConfirmed);
    realtimeSync.on('optimistic_failed', handleOptimisticFailed);
    realtimeSync.on('revert_optimistic', handleRevertOptimistic);
    realtimeSync.on('sync_conflict', handleSyncConflict);

    // Update state from current status
    const status = realtimeSync.getConnectionStatus();
    setIsConnected(status.connected);
    setReconnectAttempts(status.reconnectAttempts);
    setPendingUpdates(realtimeSync.getPendingUpdates());
    setConflicts(realtimeSync.getConflicts());

    // Cleanup
    return () => {
      realtimeSync.off('connected', handleConnected);
      realtimeSync.off('disconnected', handleDisconnected);
      realtimeSync.off('realtime_event', handleRealtimeEvent);
      realtimeSync.off('optimistic_update', handleOptimisticUpdate);
      realtimeSync.off('optimistic_confirmed', handleOptimisticConfirmed);
      realtimeSync.off('optimistic_failed', handleOptimisticFailed);
      realtimeSync.off('revert_optimistic', handleRevertOptimistic);
      realtimeSync.off('sync_conflict', handleSyncConflict);
    };
  }, [showNotifications]);

  // Send optimistic update
  const sendOptimisticUpdate = useCallback(async (
    type: RealtimeEventType,
    itemType: 'project' | 'area' | 'resource' | 'note',
    itemId: string,
    originalData: any,
    optimisticData: any
  ): Promise<string> => {
    return realtimeSync.sendOptimisticUpdate(type, itemType, itemId, originalData, optimisticData);
  }, []);

  // Resolve conflict
  const resolveConflict = useCallback(async (
    conflictId: string,
    strategy: ConflictResolutionStrategy,
    manualResolution?: any
  ): Promise<void> => {
    await realtimeSync.resolveConflict(conflictId, strategy, manualResolution);
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
  }, []);

  // Subscribe to specific events
  const subscribe = useCallback((
    eventType: RealtimeEventType,
    handler: (event: RealtimeEvent) => void
  ): (() => void) => {
    const wrappedHandler = (event: RealtimeEvent) => {
      if (event.type === eventType) {
        handler(event);
      }
    };

    realtimeSync.on('realtime_event', wrappedHandler);

    return () => {
      realtimeSync.off('realtime_event', wrappedHandler);
    };
  }, []);

  // Force sync (refresh data)
  const forceSync = useCallback(() => {
    // In a real implementation, this would trigger a full data refresh
    // For now, we'll just emit a custom event
    if (showNotifications) {
      notifications.show({
        title: 'Syncing',
        message: 'Refreshing data from server...',
        color: 'blue',
        autoClose: 2000,
      });
    }
  }, [showNotifications]);

  return {
    isConnected,
    reconnectAttempts,
    sendOptimisticUpdate,
    pendingUpdates,
    conflicts,
    resolveConflict,
    subscribe,
    forceSync,
  };
}

// Specialized hooks for different use cases

// Hook for optimistic updates on a specific item
export function useOptimisticItem<T>(
  itemType: 'project' | 'area' | 'resource' | 'note',
  itemId: string,
  initialData: T
) {
  const [data, setData] = useState<T>(initialData);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const { sendOptimisticUpdate } = useRealtimeSync();

  // Update data optimistically
  const updateOptimistically = useCallback(async (updates: Partial<T>) => {
    const originalData = data;
    const optimisticData = { ...data, ...updates };
    
    setData(optimisticData);
    setIsOptimistic(true);

    try {
      await sendOptimisticUpdate(
        'item_updated',
        itemType,
        itemId,
        originalData,
        optimisticData
      );
    } catch (error) {
      // Revert on error
      setData(originalData);
      setIsOptimistic(false);
      throw error;
    }
  }, [data, itemType, itemId, sendOptimisticUpdate]);

  // Handle confirmed updates
  useEffect(() => {
    const handler = (update: OptimisticUpdate) => {
      if (update.itemType === itemType && update.itemId === itemId) {
        setIsOptimistic(false);
      }
    };
    realtimeSync.on('optimistic_confirmed', handler);

    return () => {
      realtimeSync.off('optimistic_confirmed', handler);
    };
  }, [itemType, itemId]);

  // Handle failed updates
  useEffect(() => {
    const handler = (update: OptimisticUpdate) => {
      if (update.itemType === itemType && update.itemId === itemId) {
        setData(update.originalData);
        setIsOptimistic(false);
      }
    };
    realtimeSync.on('optimistic_failed', handler);

    return () => {
      realtimeSync.off('optimistic_failed', handler);
    };
  }, [itemType, itemId]);

  return {
    data,
    isOptimistic,
    updateOptimistically,
  };
}
