/**
 * Data Consistency Manager for ThinkSpace
 * 
 * Handles automatic relationship updates, metadata consistency,
 * and data integrity across all PARA categories.
 */

import prisma from '@/lib/prisma';

// Data consistency event types
export type ConsistencyEventType = 
  | 'item_moved'
  | 'item_archived'
  | 'item_restored'
  | 'relationship_updated'
  | 'metadata_synced'
  | 'preferences_updated';

// Consistency event interface
export interface ConsistencyEvent {
  type: ConsistencyEventType;
  userId: string;
  itemType: 'project' | 'area' | 'resource' | 'note';
  itemId: string;
  changes: {
    from?: any;
    to?: any;
    metadata?: any;
  };
  timestamp: Date;
}

// Relationship update result
export interface RelationshipUpdateResult {
  updated: number;
  created: number;
  deleted: number;
  errors: string[];
}

// Data Consistency Manager
export class DataConsistencyManager {
  
  // Handle item movement between PARA categories
  async handleItemMovement(
    userId: string,
    itemType: 'project' | 'area' | 'resource' | 'note',
    itemId: string,
    fromCategory: string,
    toCategory: string,
    metadata?: any
  ): Promise<RelationshipUpdateResult> {
    const result: RelationshipUpdateResult = {
      updated: 0,
      created: 0,
      deleted: 0,
      errors: [],
    };

    try {
      // Update relationships based on category change
      await this.updateRelationshipsForCategoryChange(
        userId, 
        itemType, 
        itemId, 
        fromCategory, 
        toCategory, 
        result
      );

      // Update metadata to reflect new category
      await this.updateItemMetadata(userId, itemType, itemId, {
        ...metadata,
        category: toCategory,
        movedAt: new Date().toISOString(),
        movedFrom: fromCategory,
      });

      // Log consistency event
      await this.logConsistencyEvent({
        type: 'item_moved',
        userId,
        itemType,
        itemId,
        changes: {
          from: fromCategory,
          to: toCategory,
          metadata,
        },
        timestamp: new Date(),
      });

    } catch (error) {
      result.errors.push(`Failed to handle item movement: ${error}`);
    }

    return result;
  }

  // Handle item archival
  async handleItemArchival(
    userId: string,
    itemType: 'project' | 'area' | 'resource' | 'note',
    itemId: string
  ): Promise<RelationshipUpdateResult> {
    const result: RelationshipUpdateResult = {
      updated: 0,
      created: 0,
      deleted: 0,
      errors: [],
    };

    try {
      // Update item status to archived
      await this.updateItemStatus(userId, itemType, itemId, 'ARCHIVED');

      // Update related items to reflect archival
      await this.updateRelatedItemsForArchival(userId, itemType, itemId, result);

      // Update metadata
      await this.updateItemMetadata(userId, itemType, itemId, {
        archivedAt: new Date().toISOString(),
        isArchived: true,
      });

      // Log consistency event
      await this.logConsistencyEvent({
        type: 'item_archived',
        userId,
        itemType,
        itemId,
        changes: {
          to: 'ARCHIVED',
        },
        timestamp: new Date(),
      });

    } catch (error) {
      result.errors.push(`Failed to handle item archival: ${error}`);
    }

    return result;
  }

  // Handle item restoration from archive
  async handleItemRestoration(
    userId: string,
    itemType: 'project' | 'area' | 'resource' | 'note',
    itemId: string,
    newStatus?: string
  ): Promise<RelationshipUpdateResult> {
    const result: RelationshipUpdateResult = {
      updated: 0,
      created: 0,
      deleted: 0,
      errors: [],
    };

    try {
      // Update item status
      await this.updateItemStatus(userId, itemType, itemId, newStatus || 'ACTIVE');

      // Update related items to reflect restoration
      await this.updateRelatedItemsForRestoration(userId, itemType, itemId, result);

      // Update metadata
      await this.updateItemMetadata(userId, itemType, itemId, {
        restoredAt: new Date().toISOString(),
        isArchived: false,
        archivedAt: null,
      });

      // Log consistency event
      await this.logConsistencyEvent({
        type: 'item_restored',
        userId,
        itemType,
        itemId,
        changes: {
          from: 'ARCHIVED',
          to: newStatus || 'ACTIVE',
        },
        timestamp: new Date(),
      });

    } catch (error) {
      result.errors.push(`Failed to handle item restoration: ${error}`);
    }

    return result;
  }

  // Sync metadata across related items
  async syncMetadataAcrossRelatedItems(
    userId: string,
    itemType: 'project' | 'area' | 'resource' | 'note',
    itemId: string,
    metadataUpdates: any
  ): Promise<RelationshipUpdateResult> {
    const result: RelationshipUpdateResult = {
      updated: 0,
      created: 0,
      deleted: 0,
      errors: [],
    };

    try {
      // Get all related items
      const relatedItems = await this.getRelatedItems(userId, itemType, itemId);

      // Update metadata for each related item
      for (const relatedItem of relatedItems) {
        try {
          await this.updateItemMetadata(
            userId,
            relatedItem.type as 'project' | 'area' | 'resource' | 'note',
            relatedItem.id,
            {
              ...relatedItem.metadata,
              lastSyncedWith: itemId,
              lastSyncedAt: new Date().toISOString(),
              ...metadataUpdates,
            }
          );
          result.updated++;
        } catch (error) {
          result.errors.push(`Failed to sync metadata for ${relatedItem.type}:${relatedItem.id}`);
        }
      }

      // Log consistency event
      await this.logConsistencyEvent({
        type: 'metadata_synced',
        userId,
        itemType,
        itemId,
        changes: {
          metadata: metadataUpdates,
        },
        timestamp: new Date(),
      });

    } catch (error) {
      result.errors.push(`Failed to sync metadata: ${error}`);
    }

    return result;
  }

  // Update relationships for category change
  private async updateRelationshipsForCategoryChange(
    userId: string,
    itemType: 'project' | 'area' | 'resource' | 'note',
    itemId: string,
    fromCategory: string,
    toCategory: string,
    result: RelationshipUpdateResult
  ): Promise<void> {
    // Get existing connections
    const connections = await prisma.connection.findMany({
      where: {
        userId,
        OR: [
          { sourceType: itemType, sourceId: itemId },
          { targetType: itemType, targetId: itemId },
        ],
      },
    });

    // Update connection metadata to reflect category change
    for (const connection of connections) {
      try {
        await prisma.connection.update({
          where: { id: connection.id },
          data: {
            metadata: {
              ...(connection.metadata as Record<string, any> || {}),
              categoryChange: {
                itemType,
                itemId,
                from: fromCategory,
                to: toCategory,
                timestamp: new Date().toISOString(),
              },
            },
          },
        });
        result.updated++;
      } catch (error) {
        result.errors.push(`Failed to update connection ${connection.id}`);
      }
    }
  }

  // Update related items for archival
  private async updateRelatedItemsForArchival(
    userId: string,
    itemType: 'project' | 'area' | 'resource' | 'note',
    itemId: string,
    result: RelationshipUpdateResult
  ): Promise<void> {
    // Update connections to mark them as involving an archived item
    const connections = await prisma.connection.findMany({
      where: {
        userId,
        OR: [
          { sourceType: itemType, sourceId: itemId },
          { targetType: itemType, targetId: itemId },
        ],
      },
    });

    for (const connection of connections) {
      try {
        await prisma.connection.update({
          where: { id: connection.id },
          data: {
            metadata: {
              ...(connection.metadata as Record<string, any> || {}),
              hasArchivedItem: true,
              archivedItemType: itemType,
              archivedItemId: itemId,
              archivedAt: new Date().toISOString(),
            },
          },
        });
        result.updated++;
      } catch (error) {
        result.errors.push(`Failed to update connection for archival ${connection.id}`);
      }
    }
  }

  // Update related items for restoration
  private async updateRelatedItemsForRestoration(
    userId: string,
    itemType: 'project' | 'area' | 'resource' | 'note',
    itemId: string,
    result: RelationshipUpdateResult
  ): Promise<void> {
    // Update connections to remove archived item markers
    const connections = await prisma.connection.findMany({
      where: {
        userId,
        OR: [
          { sourceType: itemType, sourceId: itemId },
          { targetType: itemType, targetId: itemId },
        ],
      },
    });

    for (const connection of connections) {
      try {
        const updatedMetadata = { ...(connection.metadata as Record<string, any> || {}) };
        delete updatedMetadata.hasArchivedItem;
        delete updatedMetadata.archivedItemType;
        delete updatedMetadata.archivedItemId;
        delete updatedMetadata.archivedAt;

        await prisma.connection.update({
          where: { id: connection.id },
          data: {
            metadata: {
              ...updatedMetadata,
              restoredAt: new Date().toISOString(),
            },
          },
        });
        result.updated++;
      } catch (error) {
        result.errors.push(`Failed to update connection for restoration ${connection.id}`);
      }
    }
  }

  // Get related items
  private async getRelatedItems(
    userId: string,
    itemType: 'project' | 'area' | 'resource' | 'note',
    itemId: string
  ): Promise<Array<{ type: string; id: string; metadata: any }>> {
    const connections = await prisma.connection.findMany({
      where: {
        userId,
        OR: [
          { sourceType: itemType, sourceId: itemId },
          { targetType: itemType, targetId: itemId },
        ],
      },
    });

    const relatedItems: Array<{ type: string; id: string; metadata: any }> = [];

    for (const connection of connections) {
      // Determine which item is the related one
      if (connection.sourceType === itemType && connection.sourceId === itemId) {
        // The target is the related item
        const item = await this.getItemMetadata(userId, connection.targetType || '', connection.targetId || '');
        if (item) {
          relatedItems.push({
            type: connection.targetType || '',
            id: connection.targetId || '',
            metadata: item.metadata,
          });
        }
      } else {
        // The source is the related item
        const item = await this.getItemMetadata(userId, connection.sourceType || '', connection.sourceId || '');
        if (item) {
          relatedItems.push({
            type: connection.sourceType || '',
            id: connection.sourceId || '',
            metadata: item.metadata,
          });
        }
      }
    }

    return relatedItems;
  }

  // Update item status
  private async updateItemStatus(
    userId: string,
    itemType: 'project' | 'area' | 'resource' | 'note',
    itemId: string,
    status: string
  ): Promise<void> {
    const updateData = { status: status as any };

    switch (itemType) {
      case 'project':
        await prisma.project.update({
          where: { id: itemId, userId },
          data: updateData,
        });
        break;
      case 'area':
        await prisma.area.update({
          where: { id: itemId, userId },
          data: { isActive: status !== 'ARCHIVED' },
        });
        break;
      // Resources and notes don't have status fields in the current schema
      // but we can update their metadata
      case 'resource':
      case 'note':
        await this.updateItemMetadata(userId, itemType, itemId, { status });
        break;
    }
  }

  // Update item metadata
  private async updateItemMetadata(
    userId: string,
    itemType: 'project' | 'area' | 'resource' | 'note',
    itemId: string,
    metadataUpdates: any
  ): Promise<void> {
    const updateData = {
      metadata: metadataUpdates,
      updatedAt: new Date(),
    };

    switch (itemType) {
      case 'project':
        await prisma.project.update({
          where: { id: itemId, userId },
          data: updateData,
        });
        break;
      case 'area':
        await prisma.area.update({
          where: { id: itemId, userId },
          data: updateData,
        });
        break;
      case 'resource':
        await prisma.resource.update({
          where: { id: itemId, userId },
          data: updateData,
        });
        break;
      case 'note':
        await prisma.note.update({
          where: { id: itemId, userId },
          data: updateData,
        });
        break;
    }
  }

  // Get item metadata
  private async getItemMetadata(
    userId: string,
    itemType: string,
    itemId: string
  ): Promise<{ metadata: any } | null> {
    switch (itemType) {
      case 'project':
        return await prisma.project.findFirst({
          where: { id: itemId, userId },
          select: { metadata: true },
        });
      case 'area':
        return await prisma.area.findFirst({
          where: { id: itemId, userId },
          select: { metadata: true },
        });
      case 'resource':
        return await prisma.resource.findFirst({
          where: { id: itemId, userId },
          select: { metadata: true },
        });
      case 'note':
        return await prisma.note.findFirst({
          where: { id: itemId, userId },
          select: { metadata: true },
        });
      default:
        return null;
    }
  }

  // Log consistency event
  private async logConsistencyEvent(event: ConsistencyEvent): Promise<void> {
    // In a real implementation, you might want to store these events
    // For now, we'll just log them
    console.log('Data Consistency Event:', event);
  }
}

// Global instance
export const dataConsistencyManager = new DataConsistencyManager();
