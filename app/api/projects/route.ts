/**
 * Projects API Routes for ThinkSpace
 * 
 * This API handles CRUD operations for projects in the PARA methodology,
 * including listing, creating, updating, and managing project relationships.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';

// Project validation schema
const createProjectSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED']).default('PLANNING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  areaIds: z.array(z.string().uuid()).default([]), // Many-to-many relationship
  resourceIds: z.array(z.string().uuid()).default([]), // Many-to-many relationship
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
});

const updateProjectSchema = createProjectSchema.partial();

// GET - List projects with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const areaId = searchParams.get('areaId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause for many-to-many relationships
    const where: any = {
      userId: session.user.id,
      ...(status && { status }),
      ...(priority && { priority }),
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
        ],
      }),
    };

    // Get projects with related data
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
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
          resources: {
            select: {
              id: true,
              title: true,
              type: true,
            },
            take: 5, // Limit to avoid large payloads
          },
          _count: {
            select: {
              notes: true,
              resources: true,
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
      prisma.project.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        projects,
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
    console.error('Get projects error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// POST - Create new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    // Prepare data for creation (exclude relationship arrays)
    const { areaIds, resourceIds, ...projectData } = validatedData;

    // Create project with relationships
    const project = await prisma.project.create({
      data: {
        ...projectData,
        userId: session.user.id,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        // Connect to areas if provided
        ...(areaIds.length > 0 && {
          areas: {
            connect: areaIds.map(id => ({ id }))
          }
        }),
        // Connect to resources if provided
        ...(resourceIds.length > 0 && {
          resources: {
            connect: resourceIds.map(id => ({ id }))
          }
        }),
      },
      include: {
        areas: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
        resources: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        _count: {
          select: {
            notes: true,
            resources: true,
            areas: true,
          },
        },
      },
    });

    // Log project creation
    console.log(`Project created: ${project.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: { project },
      message: 'Project created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Create project error:', error);

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

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use /api/projects/[id] for updates.',
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use /api/projects/[id] for deletion.',
  }, { status: 405 });
}
