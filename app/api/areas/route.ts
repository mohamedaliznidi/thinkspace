/**
 * Areas API Routes for ThinkSpace
 * 
 * This API handles CRUD operations for areas of responsibility
 * in the PARA methodology, including listing, creating, and managing areas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';
import { generateEmbedding } from '@/lib/vector';

// Area validation schema
const createAreaSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
    .default('#7950f2'),
  type: z.enum(['RESPONSIBILITY', 'INTEREST', 'LEARNING', 'HEALTH', 'FINANCE', 'CAREER', 'PERSONAL', 'OTHER']).default('RESPONSIBILITY'),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
});

const updateAreaSchema = createAreaSchema.partial();

// GET - List areas with filtering and pagination
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
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: session.user.id,
      ...(type && { type }),
      ...(isActive !== null && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Get areas with related data
    const [areas, total] = await Promise.all([
      prisma.area.findMany({
        where,
        include: {
          projects: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
            take: 5,
            orderBy: {
              updatedAt: 'desc',
            },
          },
          resources: {
            select: {
              id: true,
              title: true,
              type: true,
            },
            take: 5,
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              projects: true,
              resources: true,
              notes: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.area.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        areas,
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
    console.error('Get areas error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// POST - Create new area
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const validatedData = createAreaSchema.parse(body);

    // Create area
    const area = await prisma.area.create({
      data: {
        ...validatedData,
        userId: session.user.id,
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
    });

    // Log area creation
    console.log(`Area created: ${area.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: { area },
      message: 'Area created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Create area error:', error);

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
    error: 'Method not allowed. Use /api/areas/[id] for updates.',
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use /api/areas/[id] for deletion.',
  }, { status: 405 });
}
