/**
 * Sub-Interests API Routes for ThinkSpace Areas
 * 
 * This API handles CRUD operations for sub-interests within areas,
 * including hierarchical management and content associations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';

// Sub-Interest validation schema
const createSubInterestSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  parentId: z.string().cuid().optional(),
  notes: z.string().optional(),
  observations: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
  // Content associations
  projectIds: z.array(z.string().cuid()).default([]),
  resourceIds: z.array(z.string().cuid()).default([]),
  noteIds: z.array(z.string().cuid()).default([]),
  // Cross-references
  relatedSubInterestIds: z.array(z.string().cuid()).default([]),
});

const updateSubInterestSchema = createSubInterestSchema.partial();

interface RouteParams {
  params: Promise<{ areaId: string }>;
}

/**
 * GET /api/areas/[areaId]/sub-interests
 * List sub-interests for an area with hierarchical structure
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const { areaId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const search = searchParams.get('search') || '';
    const level = searchParams.get('level') ? parseInt(searchParams.get('level')!) : undefined;
    const parentId = searchParams.get('parentId') || undefined;
    const includeContent = searchParams.get('includeContent') === 'true';

    // Verify area ownership
    const area = await prisma.area.findFirst({
      where: {
        id: areaId,
        userId: session.user.id,
      },
    });

    if (!area) {
      throw new AppError('Area not found', 404);
    }

    // Build where clause
    const where: any = {
      areaId,
      userId: session.user.id,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (level !== undefined) {
      where.level = level;
    }

    if (parentId !== undefined) {
      where.parentId = parentId === 'null' ? null : parentId;
    }

    // Include relations based on request
    const include: any = {
      parent: {
        select: {
          id: true,
          title: true,
        },
      },
      children: {
        select: {
          id: true,
          title: true,
          level: true,
        },
        orderBy: {
          title: 'asc',
        },
      },
      _count: {
        select: {
          children: true,
          projects: true,
          resources: true,
          notes_rel: true,
          relatedSubInterests: true,
        },
      },
    };

    if (includeContent) {
      include.projects = {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
        },
      };
      include.resources = {
        select: {
          id: true,
          title: true,
          type: true,
        },
      };
      include.notes_rel = {
        select: {
          id: true,
          title: true,
          type: true,
        },
      };
      include.relatedSubInterests = {
        select: {
          id: true,
          title: true,
        },
      };
    }

    const subInterests = await prisma.subInterest.findMany({
      where,
      include,
      orderBy: [
        { level: 'asc' },
        { title: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: { subInterests },
    });

  } catch (error) {
    console.error('Get sub-interests error:', error);
    const { message, statusCode } = handleApiError(error);

    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

/**
 * POST /api/areas/[areaId]/sub-interests
 * Create a new sub-interest
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const { areaId } = await params;
    const body = await request.json();
    const validatedData = createSubInterestSchema.parse(body);

    // Verify area ownership
    const area = await prisma.area.findFirst({
      where: {
        id: areaId,
        userId: session.user.id,
      },
    });

    if (!area) {
      throw new AppError('Area not found', 404);
    }

    // Calculate level based on parent
    let level = 0;
    if (validatedData.parentId) {
      const parent = await prisma.subInterest.findFirst({
        where: {
          id: validatedData.parentId,
          areaId,
          userId: session.user.id,
        },
      });

      if (!parent) {
        throw new AppError('Parent sub-interest not found', 404);
      }

      level = parent.level + 1;
    }

    // Create sub-interest with associations
    const subInterest = await prisma.subInterest.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        parentId: validatedData.parentId,
        level,
        notes: validatedData.notes,
        observations: validatedData.observations,
        tags: validatedData.tags,
        metadata: validatedData.metadata,
        areaId,
        userId: session.user.id,
        // Content associations
        projects: {
          connect: validatedData.projectIds.map(id => ({ id })),
        },
        resources: {
          connect: validatedData.resourceIds.map(id => ({ id })),
        },
        notes_rel: {
          connect: validatedData.noteIds.map(id => ({ id })),
        },
        relatedSubInterests: {
          connect: validatedData.relatedSubInterestIds.map(id => ({ id })),
        },
      },
      include: {
        parent: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            children: true,
            projects: true,
            resources: true,
            notes_rel: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { subInterest },
    }, { status: 201 });

  } catch (error) {
    console.error('Create sub-interest error:', error);

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
