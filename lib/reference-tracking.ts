/**
 * Reference Tracking Service for ThinkSpace Resources
 * 
 * This service provides bi-directional reference tracking between resources
 * and other entities (projects, areas, notes) with comprehensive analytics.
 */

import prisma from './prisma';
import { generateEmbedding } from './vector';
import type {
  ResourceReference,
  ReferenceType,
  ReferenceAnalytics,
  CreateReferenceRequest,
  EnhancedResource
} from '../types/resources';

// =============================================================================
// CORE REFERENCE TRACKING FUNCTIONS
// =============================================================================

/**
 * Create a new reference between a resource and another entity
 */
export async function createResourceReference(
  request: CreateReferenceRequest,
  userId: string
): Promise<ResourceReference> {
  try {
    // Validate that at least one target is specified
    const hasTarget = !!(
      request.referencedResourceId ||
      request.projectId ||
      request.areaId ||
      request.noteId
    );

    if (!hasTarget) {
      throw new Error('At least one reference target must be specified');
    }

    // Verify resource ownership
    const resource = await prisma.resource.findFirst({
      where: {
        id: request.resourceId,
        userId,
      },
    });

    if (!resource) {
      throw new Error('Resource not found or access denied');
    }

    // Verify target entity ownership if specified
    if (request.referencedResourceId) {
      const targetResource = await prisma.resource.findFirst({
        where: {
          id: request.referencedResourceId,
          userId,
        },
      });
      if (!targetResource) {
        throw new Error('Referenced resource not found or access denied');
      }
    }

    if (request.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: request.projectId,
          userId,
        },
      });
      if (!project) {
        throw new Error('Project not found or access denied');
      }
    }

    if (request.areaId) {
      const area = await prisma.area.findFirst({
        where: {
          id: request.areaId,
          userId,
        },
      });
      if (!area) {
        throw new Error('Area not found or access denied');
      }
    }

    if (request.noteId) {
      const note = await prisma.note.findFirst({
        where: {
          id: request.noteId,
          userId,
        },
      });
      if (!note) {
        throw new Error('Note not found or access denied');
      }
    }

    // Create the reference
    const reference = await prisma.resourceReference.create({
      data: {
        resourceId: request.resourceId,
        referencedResourceId: request.referencedResourceId,
        projectId: request.projectId,
        areaId: request.areaId,
        noteId: request.noteId,
        context: request.context,
        snippet: request.snippet,
        referenceType: request.referenceType || 'MANUAL',
        userId,
      },
      include: {
        resource: true,
        referencedResource: true,
        project: true,
        area: true,
        note: true,
      },
    });

    return reference;
  } catch (error) {
    console.error('Error creating resource reference:', error);
    throw new Error(`Failed to create reference: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all references for a resource (both incoming and outgoing)
 */
export async function getResourceReferences(
  resourceId: string,
  userId: string,
  options: {
    includeIncoming?: boolean;
    includeOutgoing?: boolean;
    referenceType?: ReferenceType;
    limit?: number;
  } = {}
) {
  try {
    const {
      includeIncoming = true,
      includeOutgoing = true,
      referenceType,
      limit = 50
    } = options;

    // Verify resource ownership
    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        userId,
      },
    });

    if (!resource) {
      throw new Error('Resource not found or access denied');
    }

    const whereConditions = [];

    // Outgoing references (this resource references others)
    if (includeOutgoing) {
      whereConditions.push({
        resourceId,
        userId,
        ...(referenceType && { referenceType }),
      });
    }

    // Incoming references (other resources reference this one)
    if (includeIncoming) {
      whereConditions.push({
        referencedResourceId: resourceId,
        userId,
        ...(referenceType && { referenceType }),
      });
    }

    const references = await prisma.resourceReference.findMany({
      where: {
        OR: whereConditions,
      },
      include: {
        resource: {
          select: {
            id: true,
            title: true,
            type: true,
            description: true,
            tags: true,
          },
        },
        referencedResource: {
          select: {
            id: true,
            title: true,
            type: true,
            description: true,
            tags: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            status: true,
            description: true,
          },
        },
        area: {
          select: {
            id: true,
            title: true,
            type: true,
            color: true,
            description: true,
          },
        },
        note: {
          select: {
            id: true,
            title: true,
            type: true,
            content: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return references;
  } catch (error) {
    console.error('Error getting resource references:', error);
    throw new Error(`Failed to get references: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a reference
 */
export async function deleteResourceReference(
  referenceId: string,
  userId: string
): Promise<void> {
  try {
    // Verify reference ownership
    const reference = await prisma.resourceReference.findFirst({
      where: {
        id: referenceId,
        userId,
      },
    });

    if (!reference) {
      throw new Error('Reference not found or access denied');
    }

    // Delete the reference
    await prisma.resourceReference.delete({
      where: { id: referenceId },
    });
  } catch (error) {
    console.error('Error deleting resource reference:', error);
    throw new Error(`Failed to delete reference: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update reference context or snippet
 */
export async function updateResourceReference(
  referenceId: string,
  updates: {
    context?: string;
    snippet?: string;
    referenceType?: ReferenceType;
  },
  userId: string
): Promise<ResourceReference> {
  try {
    // Verify reference ownership
    const reference = await prisma.resourceReference.findFirst({
      where: {
        id: referenceId,
        userId,
      },
    });

    if (!reference) {
      throw new Error('Reference not found or access denied');
    }

    // Update the reference
    const updatedReference = await prisma.resourceReference.update({
      where: { id: referenceId },
      data: updates,
      include: {
        resource: true,
        referencedResource: true,
        project: true,
        area: true,
        note: true,
      },
    });

    return updatedReference;
  } catch (error) {
    console.error('Error updating resource reference:', error);
    throw new Error(`Failed to update reference: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// REFERENCE ANALYTICS FUNCTIONS
// =============================================================================

/**
 * Get comprehensive reference analytics for a user
 */
export async function getReferenceAnalytics(
  userId: string,
  options: {
    timeframe?: 'week' | 'month' | 'quarter' | 'year';
    resourceId?: string;
  } = {}
): Promise<ReferenceAnalytics> {
  try {
    const { timeframe = 'month', resourceId } = options;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (timeframe) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const whereClause = {
      userId,
      createdAt: {
        gte: startDate,
      },
      ...(resourceId && {
        OR: [
          { resourceId },
          { referencedResourceId: resourceId },
        ],
      }),
    };

    // Get total reference counts
    const [totalReferences, incomingRefs, outgoingRefs] = await Promise.all([
      prisma.resourceReference.count({ where: whereClause }),
      prisma.resourceReference.count({
        where: {
          ...whereClause,
          referencedResourceId: { not: null },
        },
      }),
      prisma.resourceReference.count({
        where: resourceId ? {
          ...whereClause,
          resourceId: resourceId,
        } : whereClause,
      }),
    ]);

    // Get most referenced resources
    const mostReferencedResources = await getMostReferencedResources(userId, 10);

    // Get recent references
    const recentReferences = await prisma.resourceReference.findMany({
      where: whereClause,
      include: {
        resource: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        referencedResource: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        area: {
          select: {
            id: true,
            title: true,
          },
        },
        note: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    // Get references by type
    const referencesByType = await prisma.resourceReference.groupBy({
      by: ['referenceType'],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    return {
      totalReferences,
      incomingReferences: incomingRefs,
      outgoingReferences: outgoingRefs,
      mostReferencedResources,
      recentReferences: recentReferences as ResourceReference[],
      referencesByType: referencesByType.map(item => ({
        type: item.referenceType,
        count: item._count.id,
      })),
    };
  } catch (error) {
    console.error('Error getting reference analytics:', error);
    throw new Error(`Failed to get reference analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get most referenced resources
 */
export async function getMostReferencedResources(
  userId: string,
  limit: number = 10
): Promise<Array<{ resource: EnhancedResource; referenceCount: number }>> {
  try {
    // Get reference counts for each resource
    const referenceCounts = await prisma.resourceReference.groupBy({
      by: ['referencedResourceId'],
      where: {
        userId,
        referencedResourceId: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    // Get resource details
    const resourceIds = referenceCounts
      .map(item => item.referencedResourceId)
      .filter(Boolean) as string[];

    const resources = await prisma.resource.findMany({
      where: {
        id: { in: resourceIds },
        userId,
      },
      include: {
        _count: {
          select: {
            summaries: true,
            references: true,
            referencedBy: true,
          },
        },
      },
    });

    // Combine data
    const result = referenceCounts.map(refCount => {
      const resource = resources.find(r => r.id === refCount.referencedResourceId);
      return {
        resource: resource as EnhancedResource,
        referenceCount: refCount._count.id,
      };
    }).filter(item => item.resource);

    return result;
  } catch (error) {
    console.error('Error getting most referenced resources:', error);
    throw new Error(`Failed to get most referenced resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// AUTO-REFERENCE DETECTION
// =============================================================================

/**
 * Automatically detect and suggest references based on content similarity
 */
export async function suggestReferences(
  resourceId: string,
  userId: string,
  options: {
    threshold?: number;
    limit?: number;
    includeProjects?: boolean;
    includeAreas?: boolean;
    includeNotes?: boolean;
  } = {}
): Promise<Array<{
  type: 'resource' | 'project' | 'area' | 'note';
  entity: any;
  similarity: number;
  suggestedContext: string;
}>> {
  try {
    const {
      threshold = 0.7,
      limit = 10,
      includeProjects = true,
      includeAreas = true,
      includeNotes = true,
    } = options;

    // Get the resource content
    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        userId,
      },
    });

    if (!resource) {
      throw new Error('Resource not found');
    }

    const content = resource.contentExtract || resource.description || resource.title;
    const suggestions: any[] = [];

    // This would use semantic search to find related entities
    // For now, return empty array - will be implemented with vector search integration
    
    return suggestions.slice(0, limit);
  } catch (error) {
    console.error('Error suggesting references:', error);
    throw new Error(`Failed to suggest references: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
