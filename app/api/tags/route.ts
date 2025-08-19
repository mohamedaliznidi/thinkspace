/**
 * Universal Tag Management API for ThinkSpace
 * 
 * Provides comprehensive tag management across all PARA categories with
 * tag suggestions, analytics, and consistent tagging features.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';
import { z } from 'zod';

// Tag analytics interface
interface TagAnalytics {
  tag: string;
  count: number;
  usage: {
    projects: number;
    areas: number;
    resources: number;
    notes: number;
  };
  recentUsage: number; // Usage in last 30 days
  trending: boolean;
  relatedTags: string[];
}

// Tag suggestion interface
interface TagSuggestion {
  tag: string;
  confidence: number;
  source: 'content' | 'similar_items' | 'user_history' | 'popular';
  reason: string;
}

// GET - Retrieve tags with analytics and suggestions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const query = searchParams.get('query');
    const contentType = searchParams.get('contentType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true';

    switch (action) {
      case 'list':
        return await getTagsList(session.user.id, { query, contentType, limit, includeAnalytics });
      
      case 'suggestions':
        const content = searchParams.get('content') || '';
        const existingTags = searchParams.get('existingTags')?.split(',') || [];
        return await getTagSuggestions(session.user.id, content, existingTags, limit);
      
      case 'analytics':
        return await getTagAnalytics(session.user.id, limit);
      
      case 'popular':
        return await getPopularTags(session.user.id, limit);
      
      default:
        throw new AppError('Invalid action', 400);
    }

  } catch (error) {
    console.error('Tag API error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// Get tags list with optional filtering
async function getTagsList(
  userId: string, 
  options: { 
    query?: string | null; 
    contentType?: string | null; 
    limit: number; 
    includeAnalytics: boolean; 
  }
) {
  const { query, contentType, limit, includeAnalytics } = options;

  // Get all tags from all content types
  const [projects, areas, resources, notes] = await Promise.all([
    (!contentType || contentType === 'projects') ? prisma.project.findMany({
      where: { userId },
      select: { tags: true },
    }) : [],
    (!contentType || contentType === 'areas') ? prisma.area.findMany({
      where: { userId },
      select: { tags: true },
    }) : [],
    (!contentType || contentType === 'resources') ? prisma.resource.findMany({
      where: { userId },
      select: { tags: true },
    }) : [],
    (!contentType || contentType === 'notes') ? prisma.note.findMany({
      where: { userId },
      select: { tags: true },
    }) : [],
  ]);

  // Collect all tags with their usage counts
  const tagCounts = new Map<string, TagAnalytics>();

  // Process each content type
  const processItems = (items: any[], type: string) => {
    items.forEach(item => {
      item.tags?.forEach((tag: string) => {
        if (!query || tag.toLowerCase().includes(query.toLowerCase())) {
          const existing = tagCounts.get(tag) || {
            tag,
            count: 0,
            usage: { projects: 0, areas: 0, resources: 0, notes: 0 },
            recentUsage: 0,
            trending: false,
            relatedTags: [],
          };
          
          existing.count++;
          (existing.usage as any)[type]++;
          tagCounts.set(tag, existing);
        }
      });
    });
  };

  processItems(projects, 'projects');
  processItems(areas, 'areas');
  processItems(resources, 'resources');
  processItems(notes, 'notes');

  // Convert to array and sort by usage
  let tags = Array.from(tagCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  // Add analytics if requested
  if (includeAnalytics) {
    tags = await enrichTagsWithAnalytics(tags, userId);
  }

  return NextResponse.json({
    success: true,
    data: {
      tags,
      total: tags.length,
      query,
      contentType,
    },
  });
}

// Get tag suggestions based on content
async function getTagSuggestions(
  userId: string,
  content: string,
  existingTags: string[],
  limit: number
): Promise<NextResponse> {
  const suggestions: TagSuggestion[] = [];

  // Get popular tags from user's content
  const popularTags = await getPopularUserTags(userId, 20);
  
  // Content-based suggestions (simple keyword extraction)
  if (content) {
    const words = content.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !existingTags.includes(word))
      .slice(0, 5);

    words.forEach(word => {
      suggestions.push({
        tag: word,
        confidence: 0.6,
        source: 'content',
        reason: 'Extracted from content',
      });
    });
  }

  // Popular tags suggestions
  popularTags
    .filter(tag => !existingTags.includes(tag.tag))
    .slice(0, 5)
    .forEach(tag => {
      suggestions.push({
        tag: tag.tag,
        confidence: Math.min(0.9, tag.count / 10),
        source: 'user_history',
        reason: `Used ${tag.count} times in your content`,
      });
    });

  // Similar items suggestions (based on existing tags)
  if (existingTags.length > 0) {
    const similarTags = await getSimilarItemsTags(userId, existingTags, 5);
    similarTags.forEach(tag => {
      if (!existingTags.includes(tag.tag)) {
        suggestions.push({
          tag: tag.tag,
          confidence: 0.7,
          source: 'similar_items',
          reason: 'Used in similar items',
        });
      }
    });
  }

  // Sort by confidence and limit
  const sortedSuggestions = suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);

  return NextResponse.json({
    success: true,
    data: {
      suggestions: sortedSuggestions,
      total: sortedSuggestions.length,
    },
  });
}

// Get comprehensive tag analytics
async function getTagAnalytics(userId: string, limit: number): Promise<NextResponse> {
  const tagsList = await getTagsList(userId, { 
    query: null, 
    contentType: null, 
    limit: limit * 2, 
    includeAnalytics: true 
  });
  
  const response = await tagsList.json();
  const tags = response.data.tags;

  // Calculate trending tags (tags with recent usage increase)
  const trendingTags = tags
    .filter((tag: TagAnalytics) => tag.trending)
    .slice(0, Math.floor(limit / 2));

  // Most used tags
  const mostUsedTags = tags
    .sort((a: TagAnalytics, b: TagAnalytics) => b.count - a.count)
    .slice(0, Math.floor(limit / 2));

  // Tag distribution by content type
  const distribution = {
    projects: tags.reduce((sum: number, tag: TagAnalytics) => sum + tag.usage.projects, 0),
    areas: tags.reduce((sum: number, tag: TagAnalytics) => sum + tag.usage.areas, 0),
    resources: tags.reduce((sum: number, tag: TagAnalytics) => sum + tag.usage.resources, 0),
    notes: tags.reduce((sum: number, tag: TagAnalytics) => sum + tag.usage.notes, 0),
  };

  return NextResponse.json({
    success: true,
    data: {
      analytics: {
        totalTags: tags.length,
        totalUsage: tags.reduce((sum: number, tag: TagAnalytics) => sum + tag.count, 0),
        distribution,
        trendingTags,
        mostUsedTags,
        averageTagsPerItem: tags.length > 0 ? 
          tags.reduce((sum: number, tag: TagAnalytics) => sum + tag.count, 0) / tags.length : 0,
      },
    },
  });
}

// Get popular tags
async function getPopularTags(userId: string, limit: number): Promise<NextResponse> {
  const popularTags = await getPopularUserTags(userId, limit);
  
  return NextResponse.json({
    success: true,
    data: {
      tags: popularTags,
      total: popularTags.length,
    },
  });
}

// Helper function to get popular user tags
async function getPopularUserTags(userId: string, limit: number) {
  const [projects, areas, resources, notes] = await Promise.all([
    prisma.project.findMany({ where: { userId }, select: { tags: true } }),
    prisma.area.findMany({ where: { userId }, select: { tags: true } }),
    prisma.resource.findMany({ where: { userId }, select: { tags: true } }),
    prisma.note.findMany({ where: { userId }, select: { tags: true } }),
  ]);

  const tagCounts = new Map<string, number>();
  
  [...projects, ...areas, ...resources, ...notes].forEach(item => {
    item.tags?.forEach((tag: string) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Helper function to get tags from similar items
async function getSimilarItemsTags(userId: string, existingTags: string[], limit: number) {
  // Find items that share tags with the current item
  const [projects, areas, resources, notes] = await Promise.all([
    prisma.project.findMany({
      where: { 
        userId,
        tags: { hasSome: existingTags }
      },
      select: { tags: true }
    }),
    prisma.area.findMany({
      where: { 
        userId,
        tags: { hasSome: existingTags }
      },
      select: { tags: true }
    }),
    prisma.resource.findMany({
      where: { 
        userId,
        tags: { hasSome: existingTags }
      },
      select: { tags: true }
    }),
    prisma.note.findMany({
      where: { 
        userId,
        tags: { hasSome: existingTags }
      },
      select: { tags: true }
    }),
  ]);

  const tagCounts = new Map<string, number>();
  
  [...projects, ...areas, ...resources, ...notes].forEach(item => {
    item.tags?.forEach((tag: string) => {
      if (!existingTags.includes(tag)) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    });
  });

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// POST - Create or update tags
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const { action, itemType, itemId, tags } = body;

    if (!action || !itemType || !itemId || !Array.isArray(tags)) {
      throw new AppError('Missing required fields', 400);
    }

    // Update tags for the specified item
    const updateData = { tags };

    switch (itemType) {
      case 'project':
        await prisma.project.update({
          where: { id: itemId, userId: session.user.id },
          data: updateData,
        });
        break;

      case 'area':
        await prisma.area.update({
          where: { id: itemId, userId: session.user.id },
          data: updateData,
        });
        break;

      case 'resource':
        await prisma.resource.update({
          where: { id: itemId, userId: session.user.id },
          data: updateData,
        });
        break;

      case 'note':
        await prisma.note.update({
          where: { id: itemId, userId: session.user.id },
          data: updateData,
        });
        break;

      default:
        throw new AppError('Invalid item type', 400);
    }

    return NextResponse.json({
      success: true,
      message: 'Tags updated successfully',
      data: { tags },
    });

  } catch (error) {
    console.error('Update tags error:', error);
    const { message, statusCode } = handleApiError(error);

    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// Helper function to enrich tags with analytics
async function enrichTagsWithAnalytics(tags: TagAnalytics[], userId: string): Promise<TagAnalytics[]> {
  // For now, we'll add mock trending data
  // In a real implementation, you'd calculate this based on recent usage patterns
  return tags.map(tag => ({
    ...tag,
    trending: tag.count > 5 && Math.random() > 0.7, // Mock trending logic
    relatedTags: [], // Would be calculated based on co-occurrence
  }));
}
