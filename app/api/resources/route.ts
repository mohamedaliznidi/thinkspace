/**
 * Resources API Routes for ThinkSpace
 * 
 * This API handles CRUD operations for resources in the PARA methodology,
 * including file uploads, content extraction, and resource management.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';
import { generateEmbedding } from '@/lib/vector';

// Resource validation schema
const createResourceSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  type: z.enum(['DOCUMENT', 'LINK', 'IMAGE', 'VIDEO', 'AUDIO', 'BOOK', 'ARTICLE', 'RESEARCH', 'REFERENCE', 'TEMPLATE', 'OTHER']).default('OTHER'),
  sourceUrl: z.string().url().optional(),
  filePath: z.string().optional(),
  contentExtract: z.string().optional(),
  projectIds: z.array(z.string().cuid()).default([]), // Many-to-many relationship
  areaIds: z.array(z.string().cuid()).default([]), // Many-to-many relationship
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
});

const updateResourceSchema = createResourceSchema.partial();

// GET - List resources with filtering and pagination
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
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause for many-to-many relationships
    const where: any = {
      userId: session.user.id,
      ...(type && { type }),
      ...(projectId && {
        projects: {
          some: {
            id: projectId
          }
        }
      }),
      ...(areaId && {
        areas: {
          some: {
            id: areaId
          }
        }
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { contentExtract: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Get resources with related data
    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        include: {
          projects: {
            select: {
              id: true,
              title: true,
              status: true,
            },
            take: 5, // Limit to avoid large payloads
          },
          areas: {
            select: {
              id: true,
              title: true,
              color: true,
            },
            take: 5, // Limit to avoid large payloads
          },
          notes: {
            select: {
              id: true,
              title: true,
            },
            take: 3,
          },
          _count: {
            select: {
              notes: true,
              projects: true,
              areas: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.resource.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        resources,
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
    console.error('Get resources error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// POST - Create new resource
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const validatedData = createResourceSchema.parse(body);

    // Prepare data for creation (exclude relationship arrays)
    const { projectIds, areaIds, ...resourceData } = validatedData;

    // Create resource with relationships
    const resource = await prisma.resource.create({
      data: {
        ...resourceData,
        userId: session.user.id,
        // Connect to projects if provided
        ...(projectIds.length > 0 && {
          projects: {
            connect: projectIds.map(id => ({ id }))
          }
        }),
        // Connect to areas if provided
        ...(areaIds.length > 0 && {
          areas: {
            connect: areaIds.map(id => ({ id }))
          }
        }),
      },
      include: {
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        areas: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
        _count: {
          select: {
            notes: true,
            projects: true,
            areas: true,
          },
        },
      },
    });

    // Log resource creation
    console.log(`Resource created: ${resource.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: { resource },
      message: 'Resource created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Create resource error:', error);

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
