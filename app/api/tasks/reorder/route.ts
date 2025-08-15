/**
 * Task Reorder API Routes for ThinkSpace
 * 
 * This API handles task reordering for drag-and-drop functionality
 * within projects and between different task lists.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';

// Reorder validation schema
const reorderTasksSchema = z.object({
  projectId: z.string().cuid('Invalid project ID'),
  parentTaskId: z.string().cuid().nullable().optional(),
  taskOrders: z.array(z.object({
    taskId: z.string().cuid('Invalid task ID'),
    order: z.number().int().min(0),
  })).min(1, 'At least one task order is required'),
});

const moveTaskSchema = z.object({
  taskId: z.string().cuid('Invalid task ID'),
  targetProjectId: z.string().cuid('Invalid target project ID').optional(),
  targetParentTaskId: z.string().cuid().nullable().optional(),
  newOrder: z.number().int().min(0),
});

// POST - Reorder tasks within same context
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const validatedData = reorderTasksSchema.parse(body);

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      throw new AppError('Project not found or access denied', 404);
    }

    // Verify parent task if provided
    if (validatedData.parentTaskId) {
      const parentTask = await prisma.task.findFirst({
        where: {
          id: validatedData.parentTaskId,
          userId: session.user.id,
          projectId: validatedData.projectId,
        },
      });

      if (!parentTask) {
        throw new AppError('Parent task not found or access denied', 404);
      }
    }

    // Verify all tasks belong to user and project
    const taskIds = validatedData.taskOrders.map(t => t.taskId);
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        userId: session.user.id,
        projectId: validatedData.projectId,
        parentTaskId: validatedData.parentTaskId || null,
      },
      select: { id: true },
    });

    if (tasks.length !== taskIds.length) {
      throw new AppError('Some tasks not found or access denied', 404);
    }

    // Update task orders in a transaction
    await prisma.$transaction(
      validatedData.taskOrders.map(({ taskId, order }) =>
        prisma.task.update({
          where: { id: taskId },
          data: { order },
        })
      )
    );

    console.log(`Reordered ${validatedData.taskOrders.length} tasks in project ${project.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: `Successfully reordered ${validatedData.taskOrders.length} tasks`,
    });

  } catch (error) {
    console.error('Reorder tasks error:', error);

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

// PUT - Move task to different context (project/parent)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const validatedData = moveTaskSchema.parse(body);

    // Verify task ownership
    const task = await prisma.task.findFirst({
      where: {
        id: validatedData.taskId,
        userId: session.user.id,
      },
      include: {
        project: {
          select: { id: true, title: true },
        },
        subtasks: {
          select: { id: true },
        },
      },
    });

    if (!task) {
      throw new AppError('Task not found or access denied', 404);
    }

    // If moving to different project, verify target project
    let targetProject = task.project;
    if (validatedData.targetProjectId && validatedData.targetProjectId !== task.projectId) {
      const foundProject = await prisma.project.findFirst({
        where: {
          id: validatedData.targetProjectId,
          userId: session.user.id,
        },
      });

      if (!foundProject) {
        throw new AppError('Target project not found or access denied', 404);
      }

      targetProject = foundProject;

      // Cannot move task with subtasks to different project
      if (task.subtasks.length > 0) {
        throw new AppError('Cannot move task with subtasks to different project', 400);
      }
    }

    // Verify target parent task if provided
    if (validatedData.targetParentTaskId) {
      const parentTask = await prisma.task.findFirst({
        where: {
          id: validatedData.targetParentTaskId,
          userId: session.user.id,
          projectId: validatedData.targetProjectId || task.projectId,
        },
      });

      if (!parentTask) {
        throw new AppError('Target parent task not found or access denied', 404);
      }

      // Prevent circular dependencies
      if (validatedData.targetParentTaskId === validatedData.taskId) {
        throw new AppError('Task cannot be its own parent', 400);
      }
    }

    // Update task
    const updateData: any = {
      order: validatedData.newOrder,
    };

    if (validatedData.targetProjectId) {
      updateData.projectId = validatedData.targetProjectId;
    }

    if (validatedData.targetParentTaskId !== undefined) {
      updateData.parentTaskId = validatedData.targetParentTaskId;
    }

    const updatedTask = await prisma.task.update({
      where: { id: validatedData.taskId },
      data: updateData,
      include: {
        project: {
          select: { id: true, title: true },
        },
        parentTask: {
          select: { id: true, title: true },
        },
      },
    });

    console.log(`Task moved: ${updatedTask.title} to ${targetProject.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: { task: updatedTask },
      message: 'Task moved successfully',
    });

  } catch (error) {
    console.error('Move task error:', error);

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
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST for reordering or PUT for moving tasks.',
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST for reordering or PUT for moving tasks.',
  }, { status: 405 });
}
