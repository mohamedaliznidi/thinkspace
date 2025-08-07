/**
 * Notes API Routes for ThinkSpace
 * 
 * This API handles CRUD operations for notes with rich text content,
 * categorization, and integration with PARA methodology components.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';
import { generateEmbedding } from '@/lib/vector';

// Note validation schema
const createNoteSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  content: z.string()
    .min(1, 'Content is required'),
  type: z.enum(['FLEETING', 'LITERATURE', 'PERMANENT', 'PROJECT', 'MEETING']).default('FLEETING'),
  isPinned: z.boolean().default(false),
  projectId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
  resourceId: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
});

const updateNoteSchema = createNoteSchema.partial();

// GET - List notes with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const projectId = searchParams.get('projectId');
    const areaId = searchParams.get('areaId');
    const resourceId = searchParams.get('resourceId');
    const isPinned = searchParams.get('isPinned');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: session.user.id,
      ...(type && { type }),
      ...(projectId && { projectId }),
      ...(areaId && { areaId }),
      ...(resourceId && { resourceId }),
      ...(isPinned !== null && { isPinned: isPinned === 'true' }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Get notes with related data
    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          area: {
            select: {
              id: true,
              title: true,
              color: true,
            },
          },
          resource: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
        },
        orderBy: [
          { isPinned: 'desc' }, // Pinned notes first
          { [sortBy]: sortOrder },
        ],
        skip,
        take: limit,
      }),
      prisma.note.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        notes,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('Get notes error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// POST - Create new note
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const validatedData = createNoteSchema.parse(body);

    // Generate embedding for semantic search
    const embeddingText = [
      validatedData.title,
      validatedData.content.replace(/<[^>]*>/g, ''), // Strip HTML tags
    ].join(' ');
    
    const embedding = await generateEmbedding(embeddingText);

    // Create note
    const note = await prisma.note.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        embedding,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        area: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
        resource: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    // Log note creation
    console.log(`Note created: ${note.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: { note },
      message: 'Note created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Create note error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.reduce((acc, err) => {
        const field = err.path.join('.');
        acc[field] = err.message;
        return acc;
      }, {} as Record<string, string>);

      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: fieldErrors,
      }, { status: 400 });
    }

    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
