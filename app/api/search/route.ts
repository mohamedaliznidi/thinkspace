/**
 * Search API Routes for ThinkSpace
 * 
 * This API handles search operations including full-text search,
 * semantic search, and cross-content discovery.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';
import { generateEmbedding } from '@/lib/vector';

// GET - Search across all content
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // 'text' or 'semantic'
    const limit = parseInt(searchParams.get('limit') || '20');
    const contentType = searchParams.get('contentType'); // 'projects', 'areas', 'resources', 'notes'

    if (!query || query.trim().length < 2) {
      throw new AppError('Search query must be at least 2 characters', 400);
    }

    const searchQuery = query.trim();
    const results: any[] = [];

    // Perform semantic search if requested
    if (type === 'semantic') {
      const queryEmbedding = await generateEmbedding(searchQuery);
      
      // Search projects
      if (!contentType || contentType === 'projects') {
        const projects = await prisma.$queryRaw`
          SELECT id, title, description, status, priority, 
                 1 - (embedding <=> ${queryEmbedding}::vector) as similarity
          FROM "Project" 
          WHERE "userId" = ${session.user.id}
            AND 1 - (embedding <=> ${queryEmbedding}::vector) > 0.7
          ORDER BY similarity DESC
          LIMIT ${Math.floor(limit / 4)}
        `;
        
        results.push(...(projects as any[]).map((p: any) => ({
          ...p,
          type: 'project',
          href: `/projects/${p.id}`,
        })));
      }

      // Search areas
      if (!contentType || contentType === 'areas') {
        const areas = await prisma.$queryRaw`
          SELECT id, title, description, color, type,
                 1 - (embedding <=> ${queryEmbedding}::vector) as similarity
          FROM "Area" 
          WHERE "userId" = ${session.user.id}
            AND 1 - (embedding <=> ${queryEmbedding}::vector) > 0.7
          ORDER BY similarity DESC
          LIMIT ${Math.floor(limit / 4)}
        `;
        
        results.push(...(areas as any[]).map((a: any) => ({
          ...a,
          type: 'area',
          href: `/areas/${a.id}`,
        })));
      }

      // Search resources
      if (!contentType || contentType === 'resources') {
        const resources = await prisma.$queryRaw`
          SELECT id, title, description, type, "fileType",
                 1 - (embedding <=> ${queryEmbedding}::vector) as similarity
          FROM "Resource" 
          WHERE "userId" = ${session.user.id}
            AND 1 - (embedding <=> ${queryEmbedding}::vector) > 0.7
          ORDER BY similarity DESC
          LIMIT ${Math.floor(limit / 4)}
        `;
        
        results.push(...(resources as any[]).map((r: any) => ({
          ...r,
          type: 'resource',
          href: `/resources/${r.id}`,
        })));
      }

      // Search notes
      if (!contentType || contentType === 'notes') {
        const notes = await prisma.$queryRaw`
          SELECT id, title, content, type, "isPinned",
                 1 - (embedding <=> ${queryEmbedding}::vector) as similarity
          FROM "Note" 
          WHERE "userId" = ${session.user.id}
            AND 1 - (embedding <=> ${queryEmbedding}::vector) > 0.7
          ORDER BY similarity DESC
          LIMIT ${Math.floor(limit / 4)}
        `;
        
        results.push(...(notes as any[]).map((n: any) => ({
          ...n,
          type: 'note',
          href: `/notes/${n.id}`,
        })));
      }
    } else {
      // Perform full-text search
      const searchCondition = {
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' as const } },
          { description: { contains: searchQuery, mode: 'insensitive' as const } },
        ],
      };

      // Search projects
      if (!contentType || contentType === 'projects') {
        const projects = await prisma.project.findMany({
          where: {
            userId: session.user.id,
            ...searchCondition,
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
          },
          take: Math.floor(limit / 4),
        });
        
        results.push(...projects.map(p => ({
          ...p,
          type: 'project',
          href: `/projects/${p.id}`,
        })));
      }

      // Search areas
      if (!contentType || contentType === 'areas') {
        const areas = await prisma.area.findMany({
          where: {
            userId: session.user.id,
            ...searchCondition,
          },
          select: {
            id: true,
            title: true,
            description: true,
            color: true,
            type: true,
          },
          take: Math.floor(limit / 4),
        });
        
        results.push(...areas.map(a => ({
          ...a,
          type: 'area',
          href: `/areas/${a.id}`,
        })));
      }

      // Search resources
      if (!contentType || contentType === 'resources') {
        const resources = await prisma.resource.findMany({
          where: {
            userId: session.user.id,
            OR: [
              ...searchCondition.OR,
            ],
          },
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
          },
          take: Math.floor(limit / 4),
        });
        
        results.push(...resources.map(r => ({
          ...r,
          type: 'resource',
          href: `/resources/${r.id}`,
        })));
      }

      // Search notes
      if (!contentType || contentType === 'notes') {
        const notes = await prisma.note.findMany({
          where: {
            userId: session.user.id,
            OR: [
              ...searchCondition.OR,
              { content: { contains: searchQuery, mode: 'insensitive' as const } },
            ],
          },
          select: {
            id: true,
            title: true,
            content: true,
            type: true,
          },
          take: Math.floor(limit / 4),
        });
        
        results.push(...notes.map(n => ({
          ...n,
          type: 'note',
          href: `/notes/${n.id}`,
        })));
      }
    }

    // Sort results by relevance/similarity
    const sortedResults = results
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        results: sortedResults,
        query: searchQuery,
        type: type || 'text',
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
