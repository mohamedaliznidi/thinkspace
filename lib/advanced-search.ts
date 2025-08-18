/**
 * Advanced Search Service for ThinkSpace Resources
 * 
 * This service provides enhanced search capabilities including semantic search,
 * content-based filtering, and intelligent resource discovery.
 */

import type {
  ResourceType
} from '@prisma/client';

import { searchSimilarResources, generateEmbedding } from './vector';
import { extractTopicsAndThemes } from './content-analysis';
import prisma from './prisma';
import type {
  ResourceSearchRequest,
  SemanticSearchOptions,
  SemanticSearchResult,
  ResourceRecommendation,
  EnhancedResource,
} from '../types/resources';

// =============================================================================
// SEMANTIC SEARCH FUNCTIONS
// =============================================================================

/**
 * Perform semantic search across resources
 */
export async function performSemanticSearch(
  query: string,
  userId: string,
  options: SemanticSearchOptions = { query }
): Promise<SemanticSearchResult[]> {
  try {
    const {
      threshold = 0.7,
      limit = 20,
      includeContent = true,
      includeSummaries = true,
      resourceTypes,
      folderIds
    } = options;

    // Use existing vector search as base
    const similarResources = await searchSimilarResources(
      query,
      userId,
      limit * 2, // Get more results to filter
      threshold
    );

    // Apply additional filters
    let filteredResults: any[] = similarResources as any[];

    if (resourceTypes && resourceTypes.length > 0) {
      filteredResults = filteredResults.filter((resource: any) => 
        resourceTypes.includes(resource.type)
      );
    }

    if (folderIds && folderIds.length > 0) {
      filteredResults = filteredResults.filter((resource: any) => 
        folderIds.includes(resource.folderId)
      );
    }

    // Enhance results with match information
    const enhancedResults: SemanticSearchResult[] = await Promise.all(
      filteredResults.slice(0, limit).map(async (resource: any) => {
        const matchedContent = await determineMatchedContent(
          query,
          resource,
          includeContent,
          includeSummaries
        );

        return {
          resource: resource as EnhancedResource,
          similarity: resource.similarity || 0.7,
          matchedContent: matchedContent.content,
          matchType: matchedContent.type,
        };
      })
    );

    return enhancedResults;
  } catch (error) {
    console.error('Error performing semantic search:', error);
    throw new Error(`Failed to perform semantic search: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Perform hybrid search combining semantic and keyword search
 */
export async function performHybridSearch(
  searchRequest: ResourceSearchRequest,
  userId: string
): Promise<{
  results: EnhancedResource[];
  facets: {
    types: Array<{ type: ResourceType; count: number }>;
    folders: Array<{ folder: any; count: number }>;
    tags: Array<{ tag: string; count: number }>;
  };
  totalCount: number;
}> {
  try {
    const {
      query,
      type,
      folderId,
      tags,
      projectIds,
      areaIds,
      collectionIds,
      hasContent,
      hasSummary,
      dateFrom,
      dateTo,
      sortBy = 'relevance',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = searchRequest;

    // Build base where clause
    const whereClause: any = {
      userId,
      ...(type && { type }),
      ...(folderId && { folderId }),
      ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),
      ...(hasContent !== undefined && {
        contentExtract: hasContent ? { not: null } : null
      }),
      ...(hasSummary !== undefined && {
        summaries: hasSummary ? { some: {} } : { none: {} }
      }),
      ...(dateFrom || dateTo) && {
        createdAt: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        }
      },
    };

    // Add relationship filters
    if (projectIds && projectIds.length > 0) {
      whereClause.projects = { some: { id: { in: projectIds } } };
    }

    if (areaIds && areaIds.length > 0) {
      whereClause.areas = { some: { id: { in: areaIds } } };
    }

    if (collectionIds && collectionIds.length > 0) {
      whereClause.collections = { some: { id: { in: collectionIds } } };
    }

    let results: EnhancedResource[] = [];
    let totalCount = 0;
    let options = {
        query: (query ?? ""),
        threshold: 0.6,
        limit: limit * 3, // Get more for filtering
        resourceTypes: type ? [type] : undefined,
        folderIds: folderId ? [folderId] : undefined,
      }

    if (query && sortBy === 'relevance') {
      // Semantic search for relevance-based queries
      const semanticResults = await performSemanticSearch(query, userId, options);

      // Filter semantic results by additional criteria
      const filteredSemanticResults = semanticResults.filter(result => {
        const resource = result.resource;
        
        // Apply tag filter
        if (tags && tags.length > 0) {
          if (!tags.some(tag => resource.tags.includes(tag))) return false;
        }

        // Apply content filter
        if (hasContent !== undefined) {
          if (hasContent && !resource.contentExtract) return false;
          if (!hasContent && resource.contentExtract) return false;
        }

        // Apply date filter
        if (dateFrom && new Date(resource.createdAt) < new Date(dateFrom)) return false;
        if (dateTo && new Date(resource.createdAt) > new Date(dateTo)) return false;

        return true;
      });

      results = filteredSemanticResults
        .slice((page - 1) * limit, page * limit)
        .map(result => result.resource);
      
      totalCount = filteredSemanticResults.length;
    } else {
      // Traditional database search
      const skip = (page - 1) * limit;

      // Add text search if query provided
      if (query) {
        whereClause.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { contentExtract: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query] } },
        ];
      }

      // Determine sort order
      let orderBy: any = { createdAt: 'desc' };
      if (sortBy === 'title') orderBy = { title: sortOrder };
      else if (sortBy === 'updatedAt') orderBy = { updatedAt: sortOrder };
      else if (sortBy === 'type') orderBy = { type: sortOrder };

      const [resources, count] = await Promise.all([
        prisma.resource.findMany({
          where: whereClause,
          include: {
            folder: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
            _count: {
              select: {
                summaries: true,
                references: true,
                referencedBy: true,
                collections: true,
                projects: true,
                notes: true,
                areas: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.resource.count({ where: whereClause }),
      ]);

      results = resources as EnhancedResource[];
      totalCount = count;
    }

    // Generate facets for filtering
    const facets = await generateSearchFacets(whereClause, userId);

    return {
      results,
      facets,
      totalCount,
    };
  } catch (error) {
    console.error('Error performing hybrid search:', error);
    throw new Error(`Failed to perform hybrid search: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// INTELLIGENT DISCOVERY FUNCTIONS
// =============================================================================

/**
 * Discover resources based on user behavior and content analysis
 */
export async function discoverResources(
  userId: string,
  options: {
    basedOn?: 'recent_activity' | 'similar_content' | 'popular' | 'recommendations';
    limit?: number;
    excludeIds?: string[];
  } = {}
): Promise<ResourceRecommendation[]> {
  try {
    const {
      basedOn = 'recommendations',
      limit = 10,
      excludeIds = []
    } = options;

    let discoveries: ResourceRecommendation[] = [];

    switch (basedOn) {
      case 'recent_activity':
        discoveries = await discoverByRecentActivity(userId, limit, excludeIds);
        break;
      
      case 'similar_content':
        discoveries = await discoverBySimilarContent(userId, limit, excludeIds);
        break;
      
      case 'popular':
        discoveries = await discoverPopularResources(userId, limit, excludeIds);
        break;
      
      case 'recommendations':
      default:
        discoveries = await discoverByRecommendations(userId, limit, excludeIds);
        break;
    }

    return discoveries;
  } catch (error) {
    console.error('Error discovering resources:', error);
    throw new Error(`Failed to discover resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get search suggestions based on query
 */
export async function getSearchSuggestions(
  query: string,
  userId: string,
  limit: number = 5
): Promise<Array<{
  suggestion: string;
  type: 'tag' | 'title' | 'topic' | 'folder';
  count?: number;
}>> {
  try {
    const suggestions: Array<{
      suggestion: string;
      type: 'tag' | 'title' | 'topic' | 'folder';
      count?: number;
    }> = [];

    const queryLower = query.toLowerCase();

    // Get tag suggestions
    const resources = await prisma.resource.findMany({
      where: { userId },
      select: { tags: true, title: true, extractedTopics: true },
    });

    // Collect tag suggestions
    const tagCounts = new Map<string, number>();
    resources.forEach(resource => {
      resource.tags.forEach(tag => {
        if (tag.toLowerCase().includes(queryLower)) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      });
    });

    Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([tag, count]) => {
        suggestions.push({
          suggestion: tag,
          type: 'tag',
          count,
        });
      });

    // Collect title suggestions
    resources
      .filter(resource => resource.title.toLowerCase().includes(queryLower))
      .slice(0, 2)
      .forEach(resource => {
        suggestions.push({
          suggestion: resource.title,
          type: 'title',
        });
      });

    // Collect topic suggestions
    const topicCounts = new Map<string, number>();
    resources.forEach(resource => {
      resource.extractedTopics.forEach(topic => {
        if (topic.toLowerCase().includes(queryLower)) {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        }
      });
    });

    Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .forEach(([topic, count]) => {
        suggestions.push({
          suggestion: topic,
          type: 'topic',
          count,
        });
      });

    // Get folder suggestions
    const folders = await prisma.resourceFolder.findMany({
      where: {
        userId,
        name: { contains: query, mode: 'insensitive' },
      },
      select: { name: true },
      take: 2,
    });

    folders.forEach(folder => {
      suggestions.push({
        suggestion: folder.name,
        type: 'folder',
      });
    });

    return suggestions.slice(0, limit);
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Determine what content matched in a search result
 */
async function determineMatchedContent(
  query: string,
  resource: any,
  includeContent: boolean,
  includeSummaries: boolean
): Promise<{ content: string; type: 'title' | 'description' | 'content' | 'summary' | 'tags' }> {
  const queryLower = query.toLowerCase();

  // Check title match
  if (resource.title.toLowerCase().includes(queryLower)) {
    return {
      content: resource.title,
      type: 'title'
    };
  }

  // Check description match
  if (resource.description && resource.description.toLowerCase().includes(queryLower)) {
    return {
      content: resource.description.substring(0, 200) + '...',
      type: 'description'
    };
  }

  // Check tags match
  if (resource.tags.some((tag: string) => tag.toLowerCase().includes(queryLower))) {
    const matchedTags = resource.tags.filter((tag: string) => 
      tag.toLowerCase().includes(queryLower)
    );
    return {
      content: `Tags: ${matchedTags.join(', ')}`,
      type: 'tags'
    };
  }

  // Check content match
  if (includeContent && resource.contentExtract) {
    const contentMatch = findContentMatch(resource.contentExtract, query);
    if (contentMatch) {
      return {
        content: contentMatch,
        type: 'content'
      };
    }
  }

  // Default to title
  return {
    content: resource.title,
    type: 'title'
  };
}

/**
 * Find matching content snippet
 */
function findContentMatch(content: string, query: string): string | null {
  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();
  
  const index = contentLower.indexOf(queryLower);
  if (index === -1) return null;
  
  const start = Math.max(0, index - 50);
  const end = Math.min(content.length, index + query.length + 50);
  
  return '...' + content.substring(start, end) + '...';
}

/**
 * Generate search facets for filtering
 */
async function generateSearchFacets(baseWhere: any, userId: string) {
  try {
    // Get type distribution
    const typeGroups = await prisma.resource.groupBy({
      by: ['type'],
      where: baseWhere,
      _count: { id: true },
    });

    const types = typeGroups.map(group => ({
      type: group.type,
      count: group._count.id,
    }));

    // Get folder distribution
    const folderGroups = await prisma.resource.groupBy({
      by: ['folderId'],
      where: baseWhere,
      _count: { id: true },
    });

    const folderIds = folderGroups
      .filter(group => group.folderId)
      .map(group => group.folderId!);

    const folders = await prisma.resourceFolder.findMany({
      where: { id: { in: folderIds } },
      select: { id: true, name: true, color: true },
    });

    const folderFacets = folderGroups.map(group => ({
      folder: group.folderId 
        ? folders.find(f => f.id === group.folderId) || { id: 'unknown', name: 'Unknown', color: '#gray' }
        : { id: 'root', name: 'Root', color: '#6366f1' },
      count: group._count.id,
    }));

    // Get tag distribution (simplified)
    const resources = await prisma.resource.findMany({
      where: baseWhere,
      select: { tags: true },
      take: 1000, // Limit for performance
    });

    const tagCounts = new Map<string, number>();
    resources.forEach(resource => {
      resource.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const tags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    return { types, folders: folderFacets, tags };
  } catch (error) {
    console.error('Error generating search facets:', error);
    return { types: [], folders: [], tags: [] };
  }
}

// Discovery helper functions (simplified implementations)
async function discoverByRecentActivity(userId: string, limit: number, excludeIds: string[]) {
  // Would implement based on recent user activity
  return [];
}

async function discoverBySimilarContent(userId: string, limit: number, excludeIds: string[]) {
  // Would implement based on content similarity to recently viewed resources
  return [];
}

async function discoverPopularResources(userId: string, limit: number, excludeIds: string[]) {
  // Would implement based on popular resources across the system
  return [];
}

async function discoverByRecommendations(userId: string, limit: number, excludeIds: string[]) {
  // Would implement ML-based recommendations
  return [];
}
