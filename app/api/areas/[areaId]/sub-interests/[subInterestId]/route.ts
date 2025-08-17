/**
 * Individual Sub-Interest API Routes for ThinkSpace Areas
 * 
 * This API handles operations for individual sub-interests including
 * get, update, delete, and relationship management.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';

// Update sub-interest validation schema
const updateSubInterestSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  parentId: z.string().cuid().nullable().optional(),
  notes: z.string().optional(),
  observations: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  // Content associations
  projectIds: z.array(z.string().cuid()).optional(),
  resourceIds: z.array(z.string().cuid()).optional(),
  noteIds: z.array(z.string().cuid()).optional(),
  // Cross-references
  relatedSubInterestIds: z.array(z.string().cuid()).optional(),
});

interface RouteParams {
  params: Promise<{ areaId: string; subInterestId: string }>;
}

/**
 * GET /api/areas/[areaId]/sub-interests/[subInterestId]
 * Get a specific sub-interest with full details
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const { areaId, subInterestId } = await params;

    const subInterest = await prisma.subInterest.findFirst({
      where: {
        id: subInterestId,
        areaId,
        userId: session.user.id,
      },
      include: {
        area: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
            level: true,
          },
        },
        children: {
          select: {
            id: true,
            title: true,
            level: true,
            description: true,
            createdAt: true,
          },
          orderBy: {
            title: 'asc',
          },
        },
        projects: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            progress: true,
            dueDate: true,
            createdAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
        resources: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            sourceUrl: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        notes_rel: {
          select: {
            id: true,
            title: true,
            content: true,
            type: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
        relatedSubInterests: {
          select: {
            id: true,
            title: true,
            description: true,
            level: true,
            area: {
              select: {
                id: true,
                title: true,
                color: true,
              },
            },
          },
        },
        referencedBy: {
          select: {
            id: true,
            title: true,
            description: true,
            level: true,
            area: {
              select: {
                id: true,
                title: true,
                color: true,
              },
            },
          },
        },
        _count: {
          select: {
            children: true,
            projects: true,
            resources: true,
            notes_rel: true,
            relatedSubInterests: true,
            referencedBy: true,
          },
        },
      },
    });

    if (!subInterest) {
      throw new AppError('Sub-interest not found', 404);
    }

    return NextResponse.json({
      success: true,
      data: { subInterest },
    });

  } catch (error) {
    console.error('Get sub-interest error:', error);
    const { message, statusCode } = handleApiError(error);

    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

/**
 * PATCH /api/areas/[areaId]/sub-interests/[subInterestId]
 * Update a sub-interest
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const { areaId, subInterestId } = await params;
    const body = await request.json();
    const validatedData = updateSubInterestSchema.parse(body);

    // Verify sub-interest ownership
    const existingSubInterest = await prisma.subInterest.findFirst({
      where: {
        id: subInterestId,
        areaId,
        userId: session.user.id,
      },
    });

    if (!existingSubInterest) {
      throw new AppError('Sub-interest not found', 404);
    }

    // Calculate new level if parent changed
    let level = existingSubInterest.level;
    if (validatedData.parentId !== undefined) {
      if (validatedData.parentId) {
        // Prevent circular references
        if (validatedData.parentId === subInterestId) {
          throw new AppError('Cannot set sub-interest as its own parent', 400);
        }

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
      } else {
        level = 0;
      }
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      level,
    };

    // Handle content associations
    if (validatedData.projectIds !== undefined) {
      updateData.projects = {
        set: validatedData.projectIds.map(id => ({ id })),
      };
    }

    if (validatedData.resourceIds !== undefined) {
      updateData.resources = {
        set: validatedData.resourceIds.map(id => ({ id })),
      };
    }

    if (validatedData.noteIds !== undefined) {
      updateData.notes_rel = {
        set: validatedData.noteIds.map(id => ({ id })),
      };
    }

    if (validatedData.relatedSubInterestIds !== undefined) {
      updateData.relatedSubInterests = {
        set: validatedData.relatedSubInterestIds.map(id => ({ id })),
      };
    }

    // Remove the array fields from the main update data
    delete updateData.projectIds;
    delete updateData.resourceIds;
    delete updateData.noteIds;
    delete updateData.relatedSubInterestIds;

    const subInterest = await prisma.subInterest.update({
      where: { id: subInterestId },
      data: updateData,
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
    });

  } catch (error) {
    console.error('Update sub-interest error:', error);

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

/**
 * DELETE /api/areas/[areaId]/sub-interests/[subInterestId]
 * Delete a sub-interest and handle children
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const { areaId, subInterestId } = await params;
    const { searchParams } = new URL(request.url);
    const handleChildren = searchParams.get('handleChildren') || 'promote'; // 'promote' or 'delete'

    // Verify sub-interest ownership
    const subInterest = await prisma.subInterest.findFirst({
      where: {
        id: subInterestId,
        areaId,
        userId: session.user.id,
      },
      include: {
        children: true,
      },
    });

    if (!subInterest) {
      throw new AppError('Sub-interest not found', 404);
    }

    // Handle children based on strategy
    if (subInterest.children.length > 0) {
      if (handleChildren === 'promote') {
        // Promote children to parent's level
        await prisma.subInterest.updateMany({
          where: {
            parentId: subInterestId,
          },
          data: {
            parentId: subInterest.parentId,
            level: subInterest.level,
          },
        });
      } else if (handleChildren === 'delete') {
        // Delete all children recursively
        await prisma.subInterest.deleteMany({
          where: {
            parentId: subInterestId,
          },
        });
      }
    }

    // Delete the sub-interest
    await prisma.subInterest.delete({
      where: { id: subInterestId },
    });

    return NextResponse.json({
      success: true,
      message: 'Sub-interest deleted successfully',
    });

  } catch (error) {
    console.error('Delete sub-interest error:', error);
    const { message, statusCode } = handleApiError(error);

    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
