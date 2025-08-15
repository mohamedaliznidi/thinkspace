/**
 * Task Dependencies API Routes for ThinkSpace
 * 
 * This API handles task dependency management including
 * adding, removing, and listing task dependencies.
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

// Dependency validation schema
const addDependencySchema = z.object({
  dependsOnTaskId: z.string().cuid('Invalid task ID'),
});

const removeDependencySchema = z.object({
  dependsOnTaskId: z.string().cuid('Invalid task ID'),
});

// GET - List task dependencies
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

    // Verify task ownership
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: session.user.id,
      },
      include: {
        dependsOnTasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            completedAt: true,
            project: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        dependentTasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            project: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return NextResponse.json({
      success: true,
      data: {
        dependsOn: task.dependsOnTasks,
        dependents: task.dependentTasks,
      },
    });

  } catch (error) {
    console.error('Get task dependencies error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// POST - Add task dependency
export async function POST(
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
    const validatedData = addDependencySchema.parse(body);

    // Verify both tasks exist and belong to user
    const [task, dependsOnTask] = await Promise.all([
      prisma.task.findFirst({
        where: {
          id: taskId,
          userId: session.user.id,
        },
        include: {
          dependsOnTasks: {
            select: { id: true },
          },
        },
      }),
      prisma.task.findFirst({
        where: {
          id: validatedData.dependsOnTaskId,
          userId: session.user.id,
        },
      }),
    ]);

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (!dependsOnTask) {
      throw new AppError('Dependency task not found', 404);
    }

    // Prevent self-dependency
    if (taskId === validatedData.dependsOnTaskId) {
      throw new AppError('Task cannot depend on itself', 400);
    }

    // Check if dependency already exists
    const existingDependency = task.dependsOnTasks.find(
      dep => dep.id === validatedData.dependsOnTaskId
    );

    if (existingDependency) {
      throw new AppError('Dependency already exists', 400);
    }

    // Check for circular dependencies
    const wouldCreateCircle = await checkCircularDependency(
      validatedData.dependsOnTaskId,
      taskId
    );

    if (wouldCreateCircle) {
      throw new AppError('Cannot create circular dependency', 400);
    }

    // Add dependency
    await prisma.task.update({
      where: { id: taskId },
      data: {
        dependsOnTasks: {
          connect: { id: validatedData.dependsOnTaskId },
        },
      },
    });

    console.log(`Dependency added: Task ${taskId} now depends on ${validatedData.dependsOnTaskId} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Dependency added successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Add task dependency error:', error);

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

// DELETE - Remove task dependency
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
    const { searchParams } = new URL(request.url);
    const dependsOnTaskId = searchParams.get('dependsOnTaskId');

    if (!dependsOnTaskId) {
      throw new AppError('dependsOnTaskId parameter is required', 400);
    }

    // Verify task ownership
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: session.user.id,
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Remove dependency
    await prisma.task.update({
      where: { id: taskId },
      data: {
        dependsOnTasks: {
          disconnect: { id: dependsOnTaskId },
        },
      },
    });

    console.log(`Dependency removed: Task ${taskId} no longer depends on ${dependsOnTaskId} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Dependency removed successfully',
    });

  } catch (error) {
    console.error('Remove task dependency error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// Helper function to check for circular dependencies
async function checkCircularDependency(
  startTaskId: string,
  targetTaskId: string,
  visited: Set<string> = new Set()
): Promise<boolean> {
  if (visited.has(startTaskId)) {
    return false; // Already checked this path
  }

  if (startTaskId === targetTaskId) {
    return true; // Found circular dependency
  }

  visited.add(startTaskId);

  // Get all tasks that startTaskId depends on
  const task = await prisma.task.findUnique({
    where: { id: startTaskId },
    include: {
      dependsOnTasks: {
        select: { id: true },
      },
    },
  });

  if (!task) {
    return false;
  }

  // Recursively check each dependency
  for (const dependency of task.dependsOnTasks) {
    if (await checkCircularDependency(dependency.id, targetTaskId, new Set(visited))) {
      return true;
    }
  }

  return false;
}
