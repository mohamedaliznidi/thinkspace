/**
 * Resource Analytics Service for ThinkSpace
 * 
 * This service provides comprehensive analytics for resources including
 * usage patterns, reference networks, and performance metrics.
 */

import prisma from './prisma';
import type {
  ResourceAnalytics,
  ResourceUsageMetrics,
  ReferenceAnalytics,
  EnhancedResource,
  ResourceType
} from '../types/resources';

// =============================================================================
// CORE ANALYTICS FUNCTIONS
// =============================================================================

/**
 * Get comprehensive resource analytics for a user
 */
export async function getResourceAnalytics(
  userId: string,
  timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
): Promise<ResourceAnalytics> {
  try {
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

    // Get overview statistics
    const overview = await getResourceOverview(userId, startDate);
    
    // Get usage analytics
    const usage = await getUsageAnalytics(userId, startDate);
    
    // Get content analytics
    const content = await getContentAnalytics(userId);
    
    // Get quality analytics
    const quality = await getQualityAnalytics(userId);

    return {
      overview,
      usage,
      content,
      quality,
    };
  } catch (error) {
    console.error('Error getting resource analytics:', error);
    throw new Error(`Failed to get resource analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get resource overview statistics
 */
async function getResourceOverview(userId: string, startDate: Date) {
  try {
    // Get total resources
    const totalResources = await prisma.resource.count({
      where: { userId }
    });

    // Get resources by type
    const resourcesByType = await prisma.resource.groupBy({
      by: ['type'],
      where: { userId },
      _count: { id: true },
    });

    const typeDistribution = resourcesByType.map(item => ({
      type: item.type,
      count: item._count.id,
      percentage: totalResources > 0 ? (item._count.id / totalResources) * 100 : 0,
    }));

    // Get resources by folder
    const resourcesByFolder = await prisma.resource.groupBy({
      by: ['folderId'],
      where: { userId },
      _count: { id: true },
    });

    const folderIds = resourcesByFolder
      .filter(item => item.folderId)
      .map(item => item.folderId!);

    const folders = await prisma.resourceFolder.findMany({
      where: {
        id: { in: folderIds },
        userId,
      },
      select: {
        id: true,
        name: true,
        color: true,
        path: true,
        level: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const folderDistribution = resourcesByFolder.map(item => {
      const folder = folders.find(f => f.id === item.folderId);
      return {
        folder: folder || {
          id: 'root',
          name: 'Root',
          color: '#6366f1',
          path: '/',
          level: 0,
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        count: item._count.id,
      };
    });

    // Get recent activity (resources created in timeframe)
    const recentActivity = await prisma.resource.count({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
    });

    return {
      totalResources,
      resourcesByType: typeDistribution,
      resourcesByFolder: folderDistribution,
      recentActivity,
    };
  } catch (error) {
    console.error('Error getting resource overview:', error);
    throw error;
  }
}

/**
 * Get usage analytics
 */
async function getUsageAnalytics(userId: string, startDate: Date) {
  try {
    // Get most referenced resources
    const mostReferenced = await prisma.resource.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            referencedBy: true,
          },
        },
      },
      orderBy: {
        referencedBy: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    // Get least used resources (no references, old creation date)
    const leastUsed = await prisma.resource.findMany({
      where: {
        userId,
        referencedBy: {
          none: {},
        },
        createdAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Older than 30 days
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 10,
    });

    // Get usage trends (simplified - would need proper tracking)
    const usageTrends = await generateUsageTrends(userId, startDate);

    return {
      mostViewed: [], // Would need view tracking
      mostReferenced: mostReferenced as EnhancedResource[],
      leastUsed: leastUsed as EnhancedResource[],
      usageTrends,
    };
  } catch (error) {
    console.error('Error getting usage analytics:', error);
    throw error;
  }
}

/**
 * Get content analytics
 */
async function getContentAnalytics(userId: string) {
  try {
    // Get resources with content
    const resourcesWithContent = await prisma.resource.findMany({
      where: {
        userId,
        contentExtract: { not: null },
      },
      select: {
        wordCount: true,
        readingTime: true,
        contentLanguage: true,
        extractedTopics: true,
      },
    });

    // Calculate total word count
    const totalWordCount = resourcesWithContent.reduce(
      (sum, resource) => sum + (resource.wordCount || 0),
      0
    );

    // Calculate average reading time
    const averageReadingTime = resourcesWithContent.length > 0
      ? resourcesWithContent.reduce(
          (sum, resource) => sum + (resource.readingTime || 0),
          0
        ) / resourcesWithContent.length
      : 0;

    // Get language distribution
    const languageCount = new Map<string, number>();
    resourcesWithContent.forEach(resource => {
      if (resource.contentLanguage) {
        languageCount.set(
          resource.contentLanguage,
          (languageCount.get(resource.contentLanguage) || 0) + 1
        );
      }
    });

    const languageDistribution = Array.from(languageCount.entries()).map(
      ([language, count]) => ({ language, count })
    );

    // Get topic distribution
    const topicCount = new Map<string, number>();
    resourcesWithContent.forEach(resource => {
      resource.extractedTopics.forEach(topic => {
        topicCount.set(topic, (topicCount.get(topic) || 0) + 1);
      });
    });

    const topicDistribution = Array.from(topicCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([topic, count]) => ({ topic, count }));

    return {
      totalWordCount,
      averageReadingTime,
      languageDistribution,
      topicDistribution,
    };
  } catch (error) {
    console.error('Error getting content analytics:', error);
    throw error;
  }
}

/**
 * Get quality analytics
 */
async function getQualityAnalytics(userId: string) {
  try {
    // Get resources with summaries
    const resourcesWithSummaries = await prisma.resource.count({
      where: {
        userId,
        summaries: {
          some: {},
        },
      },
    });

    // Get average summary quality
    const summaries = await prisma.resourceSummary.findMany({
      where: {
        userId,
        qualityScore: { not: null },
      },
      select: {
        qualityScore: true,
      },
    });

    const averageSummaryQuality = summaries.length > 0
      ? summaries.reduce((sum, summary) => sum + (summary.qualityScore || 0), 0) / summaries.length
      : 0;

    // Get resources needing review (low quality summaries or no summaries)
    const resourcesNeedingReview = await prisma.resource.findMany({
      where: {
        userId,
        OR: [
          {
            summaries: {
              none: {},
            },
            contentExtract: { not: null },
          },
          {
            summaries: {
              some: {
                qualityScore: { lt: 0.6 },
              },
            },
          },
        ],
      },
      take: 20,
    });

    return {
      resourcesWithSummaries,
      averageSummaryQuality,
      resourcesNeedingReview: resourcesNeedingReview as EnhancedResource[],
    };
  } catch (error) {
    console.error('Error getting quality analytics:', error);
    throw error;
  }
}

/**
 * Generate usage trends (simplified implementation)
 */
async function generateUsageTrends(userId: string, startDate: Date) {
  try {
    // This would be implemented with proper activity tracking
    // For now, return mock data based on creation dates
    const resources = await prisma.resource.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by day
    const dailyCount = new Map<string, number>();
    resources.forEach(resource => {
      const date = resource.createdAt.toISOString().split('T')[0];
      dailyCount.set(date, (dailyCount.get(date) || 0) + 1);
    });

    return Array.from(dailyCount.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({
        date,
        views: 0, // Would be tracked
        references: count, // Using creation as proxy
      }));
  } catch (error) {
    console.error('Error generating usage trends:', error);
    return [];
  }
}

// =============================================================================
// RESOURCE USAGE METRICS
// =============================================================================

/**
 * Get detailed usage metrics for a specific resource
 */
export async function getResourceUsageMetrics(
  resourceId: string,
  userId: string
): Promise<ResourceUsageMetrics> {
  try {
    // Verify resource ownership
    const resource = await prisma.resource.findFirst({
      where: { id: resourceId, userId },
      include: {
        _count: {
          select: {
            references: true,
            referencedBy: true,
          },
        },
      },
    });

    if (!resource) {
      throw new Error('Resource not found or access denied');
    }

    // Calculate metrics
    const references = resource._count.references + resource._count.referencedBy;
    
    // Determine access frequency (simplified)
    let accessFrequency: 'high' | 'medium' | 'low' = 'low';
    if (references > 10) accessFrequency = 'high';
    else if (references > 3) accessFrequency = 'medium';

    // Determine trend direction (simplified)
    const trendDirection: 'up' | 'down' | 'stable' = 'stable'; // Would be calculated from historical data

    return {
      resourceId,
      views: 0, // Would be tracked
      references,
      lastAccessed: resource.updatedAt,
      accessFrequency,
      trendDirection,
    };
  } catch (error) {
    console.error('Error getting resource usage metrics:', error);
    throw new Error(`Failed to get usage metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// REFERENCE NETWORK ANALYSIS
// =============================================================================

/**
 * Analyze reference network patterns
 */
export async function analyzeReferenceNetwork(
  userId: string,
  options: {
    includeProjects?: boolean;
    includeAreas?: boolean;
    includeNotes?: boolean;
    maxNodes?: number;
  } = {}
) {
  try {
    const {
      includeProjects = true,
      includeAreas = true,
      includeNotes = true,
      maxNodes = 100,
    } = options;

    // Get all references for the user
    const references = await prisma.resourceReference.findMany({
      where: { userId },
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
        project: includeProjects ? {
          select: {
            id: true,
            title: true,
          },
        } : false,
        area: includeAreas ? {
          select: {
            id: true,
            title: true,
          },
        } : false,
        note: includeNotes ? {
          select: {
            id: true,
            title: true,
          },
        } : false,
      },
      take: maxNodes * 2, // Get more references than nodes to build network
    });

    // Build network graph data
    const nodes = new Map();
    const edges: Array<{
      source: string;
      target: string;
      type: string;
      weight: number;
    }> = [];

    references.forEach(ref => {
      // Add resource nodes
      if (ref.resource && !nodes.has(ref.resource.id)) {
        nodes.set(ref.resource.id, {
          id: ref.resource.id,
          title: ref.resource.title,
          type: 'resource',
          resourceType: ref.resource.type,
        });
      }

      if (ref.referencedResource && !nodes.has(ref.referencedResource.id)) {
        nodes.set(ref.referencedResource.id, {
          id: ref.referencedResource.id,
          title: ref.referencedResource.title,
          type: 'resource',
          resourceType: ref.referencedResource.type,
        });
      }

      // Add other entity nodes
      if (ref.project && includeProjects && !nodes.has(`project_${ref.project.id}`)) {
        nodes.set(`project_${ref.project.id}`, {
          id: `project_${ref.project.id}`,
          title: ref.project.title,
          type: 'project',
        });
      }

      if (ref.area && includeAreas && !nodes.has(`area_${ref.area.id}`)) {
        nodes.set(`area_${ref.area.id}`, {
          id: `area_${ref.area.id}`,
          title: ref.area.title,
          type: 'area',
        });
      }

      if (ref.note && includeNotes && !nodes.has(`note_${ref.note.id}`)) {
        nodes.set(`note_${ref.note.id}`, {
          id: `note_${ref.note.id}`,
          title: ref.note.title,
          type: 'note',
        });
      }

      // Add edges
      if (ref.referencedResource) {
        edges.push({
          source: ref.resource.id,
          target: ref.referencedResource.id,
          type: 'resource_reference',
          weight: 1,
        });
      }

      if (ref.project) {
        edges.push({
          source: ref.resource.id,
          target: `project_${ref.project.id}`,
          type: 'project_reference',
          weight: 1,
        });
      }

      if (ref.area) {
        edges.push({
          source: ref.resource.id,
          target: `area_${ref.area.id}`,
          type: 'area_reference',
          weight: 1,
        });
      }

      if (ref.note) {
        edges.push({
          source: ref.resource.id,
          target: `note_${ref.note.id}`,
          type: 'note_reference',
          weight: 1,
        });
      }
    });

    return {
      nodes: Array.from(nodes.values()).slice(0, maxNodes),
      edges,
      stats: {
        totalNodes: nodes.size,
        totalEdges: edges.length,
        resourceNodes: Array.from(nodes.values()).filter(n => n.type === 'resource').length,
        projectNodes: Array.from(nodes.values()).filter(n => n.type === 'project').length,
        areaNodes: Array.from(nodes.values()).filter(n => n.type === 'area').length,
        noteNodes: Array.from(nodes.values()).filter(n => n.type === 'note').length,
      },
    };
  } catch (error) {
    console.error('Error analyzing reference network:', error);
    throw new Error(`Failed to analyze reference network: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
