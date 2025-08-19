/**
 * Sync Provider Component for ThinkSpace
 * 
 * Provides real-time synchronization context and manages global sync state
 * across the entire application.
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { notifications } from '@mantine/notifications';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { RealtimeEvent, OptimisticUpdate } from '@/lib/realtime';

// Sync context interface
interface SyncContextValue {
  isConnected: boolean;
  pendingUpdates: OptimisticUpdate[];
  conflicts: RealtimeEvent[];
  lastSyncTime: Date | null;
  syncStats: {
    totalUpdates: number;
    successfulUpdates: number;
    failedUpdates: number;
    conflictsResolved: number;
  };
  forceSync: () => void;
}

// Create context
const SyncContext = createContext<SyncContextValue | null>(null);

// Provider props
interface SyncProviderProps {
  children: ReactNode;
  enableNotifications?: boolean;
  enableOfflineMode?: boolean;
}

export function SyncProvider({ 
  children, 
  enableNotifications = true,
  enableOfflineMode = true 
}: SyncProviderProps) {
  const { data: session } = useSession();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStats, setSyncStats] = useState({
    totalUpdates: 0,
    successfulUpdates: 0,
    failedUpdates: 0,
    conflictsResolved: 0,
  });

  // Real-time sync hook with global event handlers
  const {
    isConnected,
    pendingUpdates,
    conflicts,
    forceSync,
  } = useRealtimeSync({
    autoConnect: true,
    showNotifications: enableNotifications,
    
    // Global event handlers
    onRealtimeEvent: (event: RealtimeEvent) => {
      setLastSyncTime(new Date());
      
      // Handle different event types globally
      switch (event.type) {
        case 'item_created':
        case 'item_updated':
        case 'item_deleted':
          // Trigger data refresh for affected views
          triggerDataRefresh(event.data.itemType, event.data.itemId);
          break;
          
        case 'link_created':
        case 'link_updated':
        case 'link_deleted':
          // Refresh relationship data
          triggerRelationshipRefresh();
          break;
          
        case 'tag_updated':
          // Refresh tag-related data
          triggerTagRefresh();
          break;
          
        case 'user_activity':
          // Handle user activity events
          handleUserActivity(event);
          break;
      }
    },
    
    onOptimisticUpdate: (update: OptimisticUpdate) => {
      setSyncStats(prev => ({
        ...prev,
        totalUpdates: prev.totalUpdates + 1,
      }));
    },
    
    onOptimisticConfirmed: (update: OptimisticUpdate) => {
      setSyncStats(prev => ({
        ...prev,
        successfulUpdates: prev.successfulUpdates + 1,
      }));
      setLastSyncTime(new Date());
    },
    
    onOptimisticFailed: (update: OptimisticUpdate) => {
      setSyncStats(prev => ({
        ...prev,
        failedUpdates: prev.failedUpdates + 1,
      }));
      
      if (enableNotifications) {
        notifications.show({
          title: 'Sync Failed',
          message: `Failed to sync ${update.itemType} changes`,
          color: 'red',
          autoClose: 5000,
        });
      }
    },
    
    onSyncConflict: (event: RealtimeEvent) => {
      if (enableNotifications) {
        notifications.show({
          id: `conflict-${event.id}`,
          title: 'Sync Conflict Detected',
          message: 'Please resolve the conflict to continue syncing',
          color: 'orange',
          autoClose: false,
          withCloseButton: true,
        });
      }
    },
  });

  // Trigger data refresh for specific item types
  const triggerDataRefresh = (itemType?: string, itemId?: string) => {
    // Emit custom events that components can listen to
    const event = new CustomEvent('thinkspace:data-refresh', {
      detail: { itemType, itemId, timestamp: new Date() }
    });
    window.dispatchEvent(event);
  };

  // Trigger relationship refresh
  const triggerRelationshipRefresh = () => {
    const event = new CustomEvent('thinkspace:relationships-refresh', {
      detail: { timestamp: new Date() }
    });
    window.dispatchEvent(event);
  };

  // Trigger tag refresh
  const triggerTagRefresh = () => {
    const event = new CustomEvent('thinkspace:tags-refresh', {
      detail: { timestamp: new Date() }
    });
    window.dispatchEvent(event);
  };

  // Handle user activity events
  const handleUserActivity = (event: RealtimeEvent) => {
    // Could be used for presence indicators, activity feeds, etc.
    const activityEvent = new CustomEvent('thinkspace:user-activity', {
      detail: { event, timestamp: new Date() }
    });
    window.dispatchEvent(activityEvent);
  };

  // Handle offline/online events
  useEffect(() => {
    if (!enableOfflineMode) return;

    const handleOnline = () => {
      if (enableNotifications) {
        notifications.show({
          title: 'Back Online',
          message: 'Reconnecting to sync server...',
          color: 'green',
          autoClose: 3000,
        });
      }
      forceSync();
    };

    const handleOffline = () => {
      if (enableNotifications) {
        notifications.show({
          title: 'Offline Mode',
          message: 'Changes will be synced when connection is restored',
          color: 'orange',
          autoClose: 5000,
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enableOfflineMode, enableNotifications, forceSync]);

  // Periodic sync status updates
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      // Update last sync time if we're connected and have no pending updates
      if (pendingUpdates.length === 0) {
        setLastSyncTime(new Date());
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, pendingUpdates.length]);

  // Handle conflict resolution completion
  useEffect(() => {
    const previousConflictCount = syncStats.conflictsResolved;
    const currentConflictCount = conflicts.length;
    
    // If conflicts decreased, it means some were resolved
    if (currentConflictCount < previousConflictCount) {
      setSyncStats(prev => ({
        ...prev,
        conflictsResolved: prev.conflictsResolved + (previousConflictCount - currentConflictCount),
      }));
    }
  }, [conflicts.length, syncStats.conflictsResolved]);

  // Context value
  const contextValue: SyncContextValue = {
    isConnected,
    pendingUpdates,
    conflicts,
    lastSyncTime,
    syncStats,
    forceSync,
  };

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
}

// Hook to use sync context
export function useSyncContext(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
}

// Hook for listening to data refresh events
export function useDataRefresh(
  itemType?: string,
  onRefresh?: (detail: any) => void
) {
  useEffect(() => {
    const handleRefresh = (event: CustomEvent) => {
      const { itemType: eventItemType, itemId, timestamp } = event.detail;
      
      // If no specific item type filter, or if it matches
      if (!itemType || eventItemType === itemType) {
        onRefresh?.(event.detail);
      }
    };

    window.addEventListener('thinkspace:data-refresh', handleRefresh as EventListener);
    
    return () => {
      window.removeEventListener('thinkspace:data-refresh', handleRefresh as EventListener);
    };
  }, [itemType, onRefresh]);
}

// Hook for listening to relationship refresh events
export function useRelationshipRefresh(onRefresh?: () => void) {
  useEffect(() => {
    const handleRefresh = () => {
      onRefresh?.();
    };

    window.addEventListener('thinkspace:relationships-refresh', handleRefresh);
    
    return () => {
      window.removeEventListener('thinkspace:relationships-refresh', handleRefresh);
    };
  }, [onRefresh]);
}

// Hook for listening to tag refresh events
export function useTagRefresh(onRefresh?: () => void) {
  useEffect(() => {
    const handleRefresh = () => {
      onRefresh?.();
    };

    window.addEventListener('thinkspace:tags-refresh', handleRefresh);
    
    return () => {
      window.removeEventListener('thinkspace:tags-refresh', handleRefresh);
    };
  }, [onRefresh]);
}

// Hook for listening to user activity events
export function useUserActivity(onActivity?: (event: RealtimeEvent) => void) {
  useEffect(() => {
    const handleActivity = (event: CustomEvent) => {
      onActivity?.(event.detail.event);
    };

    window.addEventListener('thinkspace:user-activity', handleActivity as EventListener);
    
    return () => {
      window.removeEventListener('thinkspace:user-activity', handleActivity as EventListener);
    };
  }, [onActivity]);
}
