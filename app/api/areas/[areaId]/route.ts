/**
 * Individual Area API Routes for ThinkSpace
 * 
 * This API handles operations for specific areas including
 * fetching details, updating, and deleting areas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';
import { generateEmbedding } from '@/lib/vector';

// Update area validation schema
const updateAreaSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
    .optional(),  
  type: z.enum(['RESPONSIBILITY', 'INTEREST', 'LEARNING', 'HEALTH', 'FINANCE', 'CAREER', 'PERSONAL', 'OTHER']).optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

interface RouteParams {
  params: Promise<{ areaId: string }>;
}


// GET - Fetch area details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const {areaId} = await params

    const area = await prisma.area.findFirst({
      where: {
        id: areaId,
        userId: session.user.id,
      },
      include: {
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
            updatedAt: true,
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
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        notes: {
          select: {
            id: true,
            title: true,
            content: true,
            type: true,
            createdAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
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
    });

    if (!area) {
      throw new AppError('Area not found', 404);
    }

    return NextResponse.json({
      success: true,
      data: { area },
    });

  } catch (error) {
    console.error('Get area error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// PUT - Update area
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { areaId } = await params;
    const body = await request.json();
    const validatedData = updateAreaSchema.parse(body);

    // Check if area exists and belongs to user
    const existingArea = await prisma.area.findFirst({
      where: {
        id: areaId,
        userId: session.user.id,
      },
    });

    if (!existingArea) {
      throw new AppError('Area not found', 404);
    }

    // Update area
    const { type, ...rest } = validatedData;
    const updateData = {
      ...rest,
      ...(type !== undefined ? { type: { set: type } } : {}),
    };

    const updatedArea = await prisma.area.update({
      where: { id: areaId },
      data: updateData,
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

    // Log area update
    console.log(`Area updated: ${updatedArea.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: { area: updatedArea },
      message: 'Area updated successfully',
    });

  } catch (error) {
    console.error('Update area error:', error);

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

// DELETE - Delete area
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { areaId } = await params;

    // Check if area exists and belongs to user
    const existingArea = await prisma.area.findFirst({
      where: {
        id: areaId,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!existingArea) {
      throw new AppError('Area not found', 404);
    }

    // Check if area has active projects
    if (existingArea._count.projects > 0) {
      throw new AppError(
        'Cannot delete area with active projects. Please move or complete projects first.',
        400
      );
    }

    // Delete area
    await prisma.area.delete({
      where: { id: areaId },
    });

    // Log area deletion
    console.log(`Area deleted: ${existingArea.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Area deleted successfully',
    });

  } catch (error) {
    console.error('Delete area error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
