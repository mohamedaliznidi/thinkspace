/**
 * Real-time Synchronization System for ThinkSpace
 * 
 * Provides WebSocket-based real-time updates, optimistic updates,
 * and conflict resolution across all PARA categories.
 */

import { EventEmitter } from 'events';

// Real-time event types
export type RealtimeEventType = 
  | 'item_created'
  | 'item_updated' 
  | 'item_deleted'
  | 'link_created'
  | 'link_updated'
  | 'link_deleted'
  | 'tag_updated'
  | 'user_activity'
  | 'sync_conflict';

// Real-time event interface
export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  userId: string;
  timestamp: string;
  data: {
    itemType?: 'project' | 'area' | 'resource' | 'note';
    itemId?: string;
    item?: any;
    changes?: any;
    conflictData?: any;
    metadata?: any;
  };
}

// Optimistic update interface
export interface OptimisticUpdate {
  id: string;
  type: RealtimeEventType;
  itemType: 'project' | 'area' | 'resource' | 'note';
  itemId: string;
  originalData: any;
  optimisticData: any;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
}

// Conflict resolution strategy
export type ConflictResolutionStrategy = 
  | 'client_wins'
  | 'server_wins'
  | 'merge'
  | 'manual';

// Real-time sync manager
export class RealtimeSyncManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private userId: string | null = null;
  private optimisticUpdates = new Map<string, OptimisticUpdate>();
  private conflictQueue: RealtimeEvent[] = [];

  constructor() {
    super();
    this.setupEventHandlers();
  }

  // Initialize connection
  async connect(userId: string): Promise<void> {
    this.userId = userId;
    
    if (typeof window === 'undefined') {
      // Server-side, skip WebSocket connection
      return;
    }

    try {
      // In a real implementation, you'd use a WebSocket server
      // For now, we'll simulate with a mock connection
      this.simulateConnection();
    } catch (error) {
      console.error('Failed to connect to real-time server:', error);
      this.scheduleReconnect();
    }
  }

  // Simulate WebSocket connection (replace with real WebSocket in production)
  private simulateConnection(): void {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.emit('connected');
    
    // Simulate periodic events
    setInterval(() => {
      if (this.isConnected) {
        this.simulateRandomEvent();
      }
    }, 10000); // Every 10 seconds
  }

  // Simulate random events for demonstration
  private simulateRandomEvent(): void {
    const eventTypes: RealtimeEventType[] = ['item_updated', 'user_activity', 'tag_updated'];
    const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    const event: RealtimeEvent = {
      id: `sim_${Date.now()}`,
      type: randomType,
      userId: this.userId || 'unknown',
      timestamp: new Date().toISOString(),
      data: {
        itemType: 'project',
        itemId: `sim_item_${Math.random()}`,
        changes: { title: 'Updated via real-time sync' },
      },
    };

    this.handleIncomingEvent(event);
  }

  // Disconnect
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.emit('disconnected');
  }

  // Send optimistic update
  async sendOptimisticUpdate(
    type: RealtimeEventType,
    itemType: 'project' | 'area' | 'resource' | 'note',
    itemId: string,
    originalData: any,
    optimisticData: any
  ): Promise<string> {
    const updateId = `opt_${Date.now()}_${Math.random()}`;
    
    const optimisticUpdate: OptimisticUpdate = {
      id: updateId,
      type,
      itemType,
      itemId,
      originalData,
      optimisticData,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    // Store optimistic update
    this.optimisticUpdates.set(updateId, optimisticUpdate);

    // Apply optimistic update immediately
    this.emit('optimistic_update', optimisticUpdate);

    // Send to server (simulated)
    setTimeout(() => {
      this.confirmOptimisticUpdate(updateId, Math.random() > 0.1); // 90% success rate
    }, 500 + Math.random() * 1000); // Random delay 500-1500ms

    return updateId;
  }

  // Confirm optimistic update
  private confirmOptimisticUpdate(updateId: string, success: boolean): void {
    const update = this.optimisticUpdates.get(updateId);
    if (!update) return;

    if (success) {
      update.status = 'confirmed';
      this.emit('optimistic_confirmed', update);
    } else {
      update.status = 'failed';
      this.emit('optimistic_failed', update);
      
      // Revert optimistic changes
      this.emit('revert_optimistic', update);
    }

    // Clean up after a delay
    setTimeout(() => {
      this.optimisticUpdates.delete(updateId);
    }, 5000);
  }

  // Handle incoming real-time events
  private handleIncomingEvent(event: RealtimeEvent): void {
    // Check for conflicts with optimistic updates
    const conflictingUpdate = Array.from(this.optimisticUpdates.values())
      .find(update => 
        update.itemType === event.data.itemType &&
        update.itemId === event.data.itemId &&
        update.status === 'pending'
      );

    if (conflictingUpdate) {
      this.handleConflict(event, conflictingUpdate);
    } else {
      this.emit('realtime_event', event);
    }
  }

  // Handle conflicts between optimistic updates and server events
  private handleConflict(serverEvent: RealtimeEvent, optimisticUpdate: OptimisticUpdate): void {
    const conflictEvent: RealtimeEvent = {
      id: `conflict_${Date.now()}`,
      type: 'sync_conflict',
      userId: this.userId || 'unknown',
      timestamp: new Date().toISOString(),
      data: {
        conflictData: {
          serverEvent,
          optimisticUpdate,
          strategy: this.getConflictResolutionStrategy(serverEvent, optimisticUpdate),
        },
      },
    };

    this.conflictQueue.push(conflictEvent);
    this.emit('sync_conflict', conflictEvent);
  }

  // Determine conflict resolution strategy
  private getConflictResolutionStrategy(
    serverEvent: RealtimeEvent,
    optimisticUpdate: OptimisticUpdate
  ): ConflictResolutionStrategy {
    // Simple strategy: server wins for now
    // In a real implementation, this could be more sophisticated
    return 'server_wins';
  }

  // Resolve conflict
  async resolveConflict(
    conflictId: string,
    strategy: ConflictResolutionStrategy,
    manualResolution?: any
  ): Promise<void> {
    const conflict = this.conflictQueue.find(c => c.id === conflictId);
    if (!conflict) return;

    const { serverEvent, optimisticUpdate } = conflict.data.conflictData;

    switch (strategy) {
      case 'server_wins':
        // Revert optimistic update and apply server changes
        this.emit('revert_optimistic', optimisticUpdate);
        this.emit('realtime_event', serverEvent);
        break;

      case 'client_wins':
        // Keep optimistic update, ignore server event
        this.confirmOptimisticUpdate(optimisticUpdate.id, true);
        break;

      case 'merge':
        // Attempt to merge changes
        const mergedData = this.mergeChanges(
          optimisticUpdate.originalData,
          optimisticUpdate.optimisticData,
          serverEvent.data.item
        );
        
        const mergedEvent: RealtimeEvent = {
          ...serverEvent,
          data: { ...serverEvent.data, item: mergedData },
        };
        
        this.emit('realtime_event', mergedEvent);
        break;

      case 'manual':
        // Use manual resolution provided by user
        if (manualResolution) {
          const manualEvent: RealtimeEvent = {
            ...serverEvent,
            data: { ...serverEvent.data, item: manualResolution },
          };
          
          this.emit('realtime_event', manualEvent);
        }
        break;
    }

    // Remove from conflict queue
    this.conflictQueue = this.conflictQueue.filter(c => c.id !== conflictId);
  }

  // Simple merge strategy for conflicts
  private mergeChanges(original: any, optimistic: any, server: any): any {
    // Simple merge: take non-conflicting changes from both
    const merged = { ...original };
    
    // Apply server changes first
    Object.keys(server).forEach(key => {
      if (server[key] !== original[key]) {
        merged[key] = server[key];
      }
    });

    // Apply optimistic changes that don't conflict
    Object.keys(optimistic).forEach(key => {
      if (optimistic[key] !== original[key] && server[key] === original[key]) {
        merged[key] = optimistic[key];
      }
    });

    return merged;
  }

  // Setup event handlers
  private setupEventHandlers(): void {
    this.on('connected', () => {
      console.log('Real-time sync connected');
    });

    this.on('disconnected', () => {
      console.log('Real-time sync disconnected');
      this.scheduleReconnect();
    });

    this.on('sync_conflict', (event: RealtimeEvent) => {
      console.warn('Sync conflict detected:', event);
    });
  }

  // Schedule reconnection
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId);
      }
    }, delay);
  }

  // Get connection status
  getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    pendingUpdates: number;
    conflicts: number;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      pendingUpdates: Array.from(this.optimisticUpdates.values())
        .filter(u => u.status === 'pending').length,
      conflicts: this.conflictQueue.length,
    };
  }

  // Get pending optimistic updates
  getPendingUpdates(): OptimisticUpdate[] {
    return Array.from(this.optimisticUpdates.values())
      .filter(u => u.status === 'pending');
  }

  // Get conflicts
  getConflicts(): RealtimeEvent[] {
    return [...this.conflictQueue];
  }
}

// Global instance
export const realtimeSync = new RealtimeSyncManager();
