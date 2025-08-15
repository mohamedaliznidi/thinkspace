/**
 * Individual Project API Routes for ThinkSpace
 * 
 * This API handles operations for specific projects including
 * fetching details, updating, and deleting projects.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';
import { generateEmbedding } from '@/lib/vector';

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

// Update project validation schema
const updateProjectSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  areaId: z.string().cuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  progress: z.number().min(0).max(100).optional(),
});

// GET - Fetch project details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { projectId } = await params;
    console.log("🚀 ~ GET ~ projectId:", projectId)

    if (!projectId) {
      throw new AppError('Project ID is required', 400);
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
      include: {
        areas: {
          select: {
            id: true,
            title: true,
            color: true,
            description: true,
          },
        },
        notes: {
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
        _count: {
          select: {
            notes: true,
            resources: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    return NextResponse.json({
      success: true,
      data: { project },
    });

  } catch (error) {
    console.error('Get project error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// PUT - Update project
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { projectId } = await params;
    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!existingProject) {
      throw new AppError('Project not found', 404);
    }

   

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : validatedData.dueDate,
      },
      include: {
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
            resources: true,
          },
        },
      },
    });

    // Log project update
    console.log(`Project updated: ${updatedProject.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: { project: updatedProject },
      message: 'Project updated successfully',
    });

  } catch (error) {
    console.error('Update project error:', error);

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

// DELETE - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { projectId } = await params;

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!existingProject) {
      throw new AppError('Project not found', 404);
    }

    // Delete project (cascade will handle related records)
    await prisma.project.delete({
      where: { id: projectId },
    });

    // Log project deletion
    console.log(`Project deleted: ${existingProject.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });

  } catch (error) {
    console.error('Delete project error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// Handle unsupported methods
export async function PATCH() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use PUT for updates.',
  }, { status: 405 });
}
