/**
 * Individual Task API Routes for ThinkSpace
 * 
 * This API handles operations for specific tasks including
 * fetching details, updating, deleting, and managing dependencies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ taskId: string }>;
}

// Task update validation schema
const updateTaskSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  parentTaskId: z.string().cuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  estimatedHours: z.number().positive().nullable().optional(),
  actualHours: z.number().positive().nullable().optional(),
  order: z.number().int().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

const addDependencySchema = z.object({
  dependsOnTaskId: z.string().cuid('Invalid task ID'),
});

// GET - Fetch task details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { taskId } = await params;

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: session.user.id,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
            description: true,
          },
        },
        parentTask: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        subtasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            completedAt: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        dependsOnTasks: {
          select: {
            id: true,
            title: true,
            status: true,
            completedAt: true,
          },
        },
        dependentTasks: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        activities: {
          select: {
            id: true,
            type: true,
            description: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            subtasks: true,
            dependsOnTasks: true,
            dependentTasks: true,
            activities: true,
          },
        },
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return NextResponse.json({
      success: true,
      data: { task },
    });

  } catch (error) {
    console.error('Get task error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// PUT - Update task
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { taskId } = await params;
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Verify task ownership
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: session.user.id,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    // Verify parent task if provided
    if (validatedData.parentTaskId !== undefined) {
      if (validatedData.parentTaskId) {
        // Check if parent task exists and belongs to same project
        const parentTask = await prisma.task.findFirst({
          where: {
            id: validatedData.parentTaskId,
            userId: session.user.id,
            projectId: existingTask.projectId,
          },
        });

        if (!parentTask) {
          throw new AppError('Parent task not found or access denied', 404);
        }

        // Prevent circular dependencies
        if (validatedData.parentTaskId === taskId) {
          throw new AppError('Task cannot be its own parent', 400);
        }
      }
    }

    // Handle status change to completed
    const updateData: any = { ...validatedData };
    if (validatedData.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    } else if (validatedData.status && validatedData.status !== 'COMPLETED') {
      updateData.completedAt = null;
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        parentTask: {
          select: {
            id: true,
            title: true,
          },
        },
        subtasks: {
          select: {
            id: true,
            title: true,
            status: true,
            completedAt: true,
          },
        },
        _count: {
          select: {
            subtasks: true,
            activities: true,
          },
        },
      },
    });

    console.log(`Task updated: ${updatedTask.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: { task: updatedTask },
      message: 'Task updated successfully',
    });

  } catch (error) {
    console.error('Update task error:', error);

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

// DELETE - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { taskId } = await params;

    // Verify task ownership and get subtasks
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: session.user.id,
      },
      include: {
        subtasks: {
          select: { id: true },
        },
        dependentTasks: {
          select: { id: true },
        },
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Check if task has subtasks or dependent tasks
    if (task.subtasks.length > 0) {
      throw new AppError('Cannot delete task with subtasks. Delete subtasks first.', 400);
    }

    if (task.dependentTasks.length > 0) {
      throw new AppError('Cannot delete task with dependent tasks. Remove dependencies first.', 400);
    }

    // Delete the task
    await prisma.task.delete({
      where: { id: taskId },
    });

    console.log(`Task deleted: ${task.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });

  } catch (error) {
    console.error('Delete task error:', error);
    const { message, statusCode } = handleApiError(error);

    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
