/**
 * Enhanced Universal Search API for ThinkSpace
 *
 * Provides comprehensive search across all PARA categories with advanced filtering,
 * semantic search, relationship tracking, and cross-system integration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';
import { generateEmbedding } from '@/lib/vector';

// Enhanced search result interface
interface SearchResult {
  id: string;
  title: string;
  description?: string;
  content?: string;
  type: 'project' | 'area' | 'resource' | 'note' | 'archive';
  category: string;
  href: string;
  similarity?: number;
  tags: string[];
  metadata?: any;
  relationships?: {
    projects: number;
    areas: number;
    resources: number;
    notes: number;
  };
  lastModified: string;
  status?: string;
  priority?: string;
  isArchived?: boolean;
}

// Search filters interface
interface SearchFilters {
  contentTypes: string[];
  tags: string[];
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  priority?: string;
  includeArchived: boolean;
  hasRelationships?: boolean;
}

// GET - Enhanced universal search across all content
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'hybrid'; // 'text', 'semantic', or 'hybrid'
    const limit = parseInt(searchParams.get('limit') || '50');

    // Enhanced filtering options
    const filters: SearchFilters = {
      contentTypes: searchParams.get('contentTypes')?.split(',') || ['projects', 'areas', 'resources', 'notes'],
      tags: searchParams.get('tags')?.split(',') || [],
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      includeArchived: searchParams.get('includeArchived') === 'true',
      hasRelationships: searchParams.get('hasRelationships') === 'true' || undefined,
    };

    if (!query || query.trim().length < 2) {
      throw new AppError('Search query must be at least 2 characters', 400);
    }

    const searchQuery = query.trim();
    const results: SearchResult[] = [];

    // Build date filter for queries
    const dateFilter = filters.dateFrom || filters.dateTo ? {
      createdAt: {
        ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
        ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
      }
    } : {};

    // Perform semantic or hybrid search
    if (type === 'semantic' || type === 'hybrid') {
      const queryEmbedding = await generateEmbedding(searchQuery);

      // Search projects with enhanced metadata
      if (filters.contentTypes.includes('projects')) {
        const projectConditions = [
          `"userId" = ${session.user.id}`,
          `1 - (embedding <=> ${queryEmbedding}::vector) > 0.6`,
          ...(filters.status ? [`status = '${filters.status}'`] : []),
          ...(filters.priority ? [`priority = '${filters.priority}'`] : []),
          ...(filters.includeArchived ? [] : [`status != 'ARCHIVED'`]),
        ].join(' AND ');

        const projects = await prisma.$queryRaw`
          SELECT p.id, p.title, p.description, p.status, p.priority, p.tags,
                 p."createdAt", p."updatedAt", p.metadata,
                 1 - (p.embedding <=> ${queryEmbedding}::vector) as similarity,
                 COUNT(DISTINCT pa.id) as area_count,
                 COUNT(DISTINCT pr.id) as resource_count,
                 COUNT(DISTINCT pn.id) as note_count
          FROM "Project" p
          LEFT JOIN "_ProjectAreas" pa ON p.id = pa."A"
          LEFT JOIN "_ProjectResources" pr ON p.id = pr."A"
          LEFT JOIN "_ProjectNotes" pn ON p.id = pn."A"
          WHERE ${projectConditions}
          GROUP BY p.id, p.title, p.description, p.status, p.priority, p.tags,
                   p."createdAt", p."updatedAt", p.metadata, p.embedding
          ORDER BY similarity DESC
          LIMIT ${Math.floor(limit / 4)}
        `;

        results.push(...(projects as any[]).map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          type: 'project' as const,
          category: 'Projects',
          href: `/projects/${p.id}`,
          similarity: p.similarity,
          tags: (p.tags as string[]) || [],
          metadata: p.metadata as Record<string, any>,
          relationships: {
            projects: 0,
            areas: parseInt(p.area_count) || 0,
            resources: parseInt(p.resource_count) || 0,
            notes: parseInt(p.note_count) || 0,
          },
          lastModified: p.updatedAt,
          status: p.status,
          priority: p.priority,
          isArchived: p.status === 'ARCHIVED',
        })));
      }

      // Search areas with enhanced metadata
      if (filters.contentTypes.includes('areas')) {
        const areaConditions = [
          `"userId" = ${session.user.id}`,
          `1 - (embedding <=> ${queryEmbedding}::vector) > 0.6`,
          ...(filters.includeArchived ? [] : [`"isActive" = true`]),
        ].join(' AND ');

        const areas = await prisma.$queryRaw`
          SELECT a.id, a.title, a.description, a.color, a.type, a.tags, a."isActive",
                 a."createdAt", a."updatedAt", a.metadata, a."healthScore",
                 1 - (a.embedding <=> ${queryEmbedding}::vector) as similarity,
                 COUNT(DISTINCT ap.id) as project_count,
                 COUNT(DISTINCT ar.id) as resource_count,
                 COUNT(DISTINCT an.id) as note_count
          FROM "Area" a
          LEFT JOIN "_ProjectAreas" ap ON a.id = ap."B"
          LEFT JOIN "_AreaResources" ar ON a.id = ar."B"
          LEFT JOIN "_AreaNotes" an ON a.id = an."B"
          WHERE ${areaConditions}
          GROUP BY a.id, a.title, a.description, a.color, a.type, a.tags, a."isActive",
                   a."createdAt", a."updatedAt", a.metadata, a."healthScore", a.embedding
          ORDER BY similarity DESC
          LIMIT ${Math.floor(limit / 4)}
        `;

        results.push(...(areas as any[]).map((a: any) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          type: 'area' as const,
          category: 'Areas',
          href: `/areas/${a.id}`,
          similarity: a.similarity,
          tags: (a.tags as string[]) || [],
          metadata: { ...(a.metadata as Record<string, any>), color: a.color, healthScore: a.healthScore },
          relationships: {
            projects: parseInt(a.project_count) || 0,
            areas: 0,
            resources: parseInt(a.resource_count) || 0,
            notes: parseInt(a.note_count) || 0,
          },
          lastModified: a.updatedAt,
          isArchived: !a.isActive,
        })));
      }

      // Search resources with enhanced metadata
      if (filters.contentTypes.includes('resources')) {
        const resources = await prisma.$queryRaw`
          SELECT r.id, r.title, r.description, r.type, r.tags, r."sourceUrl",
                 r."createdAt", r."updatedAt", r.metadata, r."contentExtract",
                 1 - (r.embedding <=> ${queryEmbedding}::vector) as similarity,
                 COUNT(DISTINCT rp.id) as project_count,
                 COUNT(DISTINCT ra.id) as area_count,
                 COUNT(DISTINCT rn.id) as note_count
          FROM "Resource" r
          LEFT JOIN "_ProjectResources" rp ON r.id = rp."B"
          LEFT JOIN "_AreaResources" ra ON r.id = ra."B"
          LEFT JOIN "_NoteResources" rn ON r.id = rn."B"
          WHERE "userId" = ${session.user.id}
            AND 1 - (r.embedding <=> ${queryEmbedding}::vector) > 0.6
          GROUP BY r.id, r.title, r.description, r.type, r.tags, r."sourceUrl",
                   r."createdAt", r."updatedAt", r.metadata, r."contentExtract", r.embedding
          ORDER BY similarity DESC
          LIMIT ${Math.floor(limit / 4)}
        `;

        results.push(...(resources as any[]).map((r: any) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          content: r.contentExtract?.substring(0, 200),
          type: 'resource' as const,
          category: 'Resources',
          href: `/resources/${r.id}`,
          similarity: r.similarity,
          tags: (r.tags as string[]) || [],
          metadata: { ...(r.metadata as Record<string, any>), sourceUrl: r.sourceUrl, resourceType: r.type },
          relationships: {
            projects: parseInt(r.project_count) || 0,
            areas: parseInt(r.area_count) || 0,
            resources: 0,
            notes: parseInt(r.note_count) || 0,
          },
          lastModified: r.updatedAt,
        })));
      }

      // Search notes with enhanced metadata
      if (filters.contentTypes.includes('notes')) {
        const notes = await prisma.$queryRaw`
          SELECT n.id, n.title, n.content, n.type, n."isPinned", n.tags,
                 n."createdAt", n."updatedAt", n.metadata,
                 1 - (n.embedding <=> ${queryEmbedding}::vector) as similarity,
                 COUNT(DISTINCT np.id) as project_count,
                 COUNT(DISTINCT na.id) as area_count,
                 COUNT(DISTINCT nr.id) as resource_count
          FROM "Note" n
          LEFT JOIN "_ProjectNotes" np ON n.id = np."B"
          LEFT JOIN "_AreaNotes" na ON n.id = na."B"
          LEFT JOIN "_NoteResources" nr ON n.id = nr."A"
          WHERE "userId" = ${session.user.id}
            AND 1 - (n.embedding <=> ${queryEmbedding}::vector) > 0.6
          GROUP BY n.id, n.title, n.content, n.type, n."isPinned", n.tags,
                   n."createdAt", n."updatedAt", n.metadata, n.embedding
          ORDER BY similarity DESC
          LIMIT ${Math.floor(limit / 4)}
        `;

        results.push(...(notes as any[]).map((n: any) => ({
          id: n.id,
          title: n.title,
          content: n.content?.substring(0, 200),
          type: 'note' as const,
          category: 'Notes',
          href: `/notes/${n.id}`,
          similarity: n.similarity,
          tags: (n.tags as string[]) || [],
          metadata: { ...(n.metadata as Record<string, any>), isPinned: n.isPinned, noteType: n.type },
          relationships: {
            projects: parseInt(n.project_count) || 0,
            areas: parseInt(n.area_count) || 0,
            resources: parseInt(n.resource_count) || 0,
            notes: 0,
          },
          lastModified: n.updatedAt,
        })));
      }
    }

    // Perform text search for hybrid or text-only search
    if (type === 'text' || type === 'hybrid') {
      // Build text search conditions
      const searchCondition = {
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' as const } },
          { description: { contains: searchQuery, mode: 'insensitive' as const } },
        ],
      };

      // Add tag filtering if specified
      const tagFilter = filters.tags.length > 0 ? {
        tags: { hasSome: filters.tags }
      } : {};

      // Search projects with text search
      if (filters.contentTypes.includes('projects')) {
        const projects = await prisma.project.findMany({
          where: {
            userId: session.user.id,
            ...searchCondition,
            ...tagFilter,
            ...dateFilter,
            ...(filters.status && { status: filters.status as any }),
            ...(filters.priority && { priority: filters.priority as any }),
            ...(filters.includeArchived ? {} : { status: { not: 'ARCHIVED' } }),
          },
          include: {
            _count: {
              select: {
                areas: true,
                resources: true,
                notes: true,
              },
            },
          },
          take: Math.floor(limit / 4),
        });

        results.push(...projects.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description  || '',
          type: 'project' as const,
          category: 'Projects',
          href: `/projects/${p.id}`,
          tags: (p.tags as string[]) || [],
          metadata: p.metadata as Record<string, any>,
          relationships: {
            projects: 0,
            areas: p._count.areas,
            resources: p._count.resources,
            notes: p._count.notes,
          },
          lastModified: p.updatedAt.toISOString(),
          status: p.status,
          priority: p.priority,
          isArchived: p.status === 'ARCHIVED',
        })));
      }

      // Search areas with text search
      if (filters.contentTypes.includes('areas')) {
        const areas = await prisma.area.findMany({
          where: {
            userId: session.user.id,
            ...searchCondition,
            ...tagFilter,
            ...dateFilter,
            ...(filters.includeArchived ? {} : { isActive: true }),
          },
          include: {
            _count: {
              select: {
                projects: true,
                resources: true,
                notes: true,
              },
            },
          },
          take: Math.floor(limit / 4),
        });

        results.push(...areas.map(a => ({
          id: a.id,
          title: a.title,
          description: a.description || undefined,
          type: 'area' as const,
          category: 'Areas',
          href: `/areas/${a.id}`,
          tags: (a.tags as string[]) || [],
          metadata: { ...(a.metadata as Record<string, any> || {}), color: a.color, healthScore: a.healthScore },
          relationships: {
            projects: a._count.projects,
            areas: 0,
            resources: a._count.resources,
            notes: a._count.notes,
          },
          lastModified: a.updatedAt.toISOString(),
          isArchived: !a.isActive,
        })));
      }

      // Search resources with text search
      if (filters.contentTypes.includes('resources')) {
        const resources = await prisma.resource.findMany({
          where: {
            userId: session.user.id,
            OR: [
              ...searchCondition.OR,
              { contentExtract: { contains: searchQuery, mode: 'insensitive' as const } },
            ],
            ...tagFilter,
            ...dateFilter,
          },
          include: {
            _count: {
              select: {
                projects: true,
                areas: true,
                notes: true,
              },
            },
          },
          take: Math.floor(limit / 4),
        });

        results.push(...resources.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description || undefined,
          content: r.contentExtract?.substring(0, 200),
          type: 'resource' as const,
          category: 'Resources',
          href: `/resources/${r.id}`,
          tags: (r.tags as string[]) || [],
          metadata: { ...(r.metadata as Record<string, any> || {}), sourceUrl: r.sourceUrl, resourceType: r.type },
          relationships: {
            projects: r._count.projects,
            areas: r._count.areas,
            resources: 0,
            notes: r._count.notes,
          },
          lastModified: r.updatedAt.toISOString(),
        })));
      }

      // Search notes with text search
      if (filters.contentTypes.includes('notes')) {
        const notes = await prisma.note.findMany({
          where: {
            userId: session.user.id,
            OR: [
              ...searchCondition.OR,
              { content: { contains: searchQuery, mode: 'insensitive' as const } },
            ],
            ...tagFilter,
            ...dateFilter,
          },
          include: {
            _count: {
              select: {
                projects: true,
                areas: true,
                resources: true,
              },
            },
          },
          take: Math.floor(limit / 4),
        });

        results.push(...notes.map(n => ({
          id: n.id,
          title: n.title,
          content: n.content?.substring(0, 200),
          type: 'note' as const,
          category: 'Notes',
          href: `/notes/${n.id}`,
          tags: (n.tags as string[]) || [],
          metadata: { ...(n.metadata as Record<string, any> || {}), isPinned: n.isPinned, noteType: n.type },
          relationships: {
            projects: n._count.projects,
            areas: n._count.areas,
            resources: n._count.resources,
            notes: 0,
          },
          lastModified: n.updatedAt.toISOString(),
        })));
      }
    }

    // Apply tag filtering to results if specified
    let filteredResults = results;
    if (filters.tags.length > 0) {
      filteredResults = results.filter(result =>
        filters.tags.some(tag => result.tags.includes(tag))
      );
    }

    // Apply relationship filtering if specified
    if (filters.hasRelationships) {
      filteredResults = filteredResults.filter(result => {
        const totalRelationships = Object.values(result.relationships || {}).reduce((sum, count) => sum + count, 0);
        return totalRelationships > 0;
      });
    }

    // Sort results by relevance/similarity, then by last modified
    const sortedResults = filteredResults
      .sort((a, b) => {
        // Primary sort by similarity (if available)
        if (a.similarity && b.similarity) {
          return b.similarity - a.similarity;
        }
        // Secondary sort by last modified
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      })
      .slice(0, limit);

    // Calculate result statistics
    const stats = {
      total: sortedResults.length,
      byType: {
        projects: sortedResults.filter(r => r.type === 'project').length,
        areas: sortedResults.filter(r => r.type === 'area').length,
        resources: sortedResults.filter(r => r.type === 'resource').length,
        notes: sortedResults.filter(r => r.type === 'note').length,
      },
      hasSemanticResults: sortedResults.some(r => r.similarity !== undefined),
      averageSimilarity: sortedResults.filter(r => r.similarity).reduce((sum, r) => sum + (r.similarity || 0), 0) / sortedResults.filter(r => r.similarity).length || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        results: sortedResults,
        query: searchQuery,
        type,
        filters,
        stats,
        total: sortedResults.length,
      },
    });

  } catch (error) {
    console.error('Search error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
  }, { status: 405 });
}
