/**
 * Tasks API Routes for ThinkSpace
 * 
 * This API handles CRUD operations for tasks within projects,
 * including listing, creating, updating, and managing task relationships.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';
import { TASK_STATUS_VALUES, TASK_PRIORITY_VALUES } from '@/types';

// Task validation schema
const createTaskSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  status: z.enum(TASK_STATUS_VALUES).default('TODO'),
  priority: z.enum(TASK_PRIORITY_VALUES).default('MEDIUM'),
  projectId: z.string().cuid('Invalid project ID'),
  parentTaskId: z.string().cuid().optional(),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  order: z.number().int().default(0),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
});

const updateTaskSchema = createTaskSchema.partial().omit({ projectId: true });

const bulkUpdateSchema = z.object({
  taskIds: z.array(z.string().cuid()),
  updates: z.object({
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'COMPLETED', 'CANCELLED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    dueDate: z.string().datetime().optional(),
    order: z.number().int().optional(),
  }),
});

// GET - List tasks with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const parentTaskId = searchParams.get('parentTaskId');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (parentTaskId === 'null') {
      where.parentTaskId = null;
    } else if (parentTaskId) {
      where.parentTaskId = parentTaskId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch tasks with relations
    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where,
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
            orderBy: {
              order: 'asc',
            },
          },
          _count: {
            select: {
              subtasks: true,
              activities: true,
            },
          },
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('List tasks error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// POST - Create new task
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

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

    // Get next order if not provided
    if (!validatedData.order) {
      const lastTask = await prisma.task.findFirst({
        where: {
          projectId: validatedData.projectId,
          parentTaskId: validatedData.parentTaskId || null,
        },
        orderBy: { order: 'desc' },
      });
      
      validatedData.order = (lastTask?.order || 0) + 1;
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
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

    // Log task creation
    console.log(`Task created: ${task.title} in project ${project.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: { task },
      message: 'Task created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Create task error:', error);

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

// PUT - Bulk update tasks
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const validatedData = bulkUpdateSchema.parse(body);

    // Verify all tasks belong to the user
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: validatedData.taskIds },
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (tasks.length !== validatedData.taskIds.length) {
      throw new AppError('Some tasks not found or access denied', 404);
    }

    // Perform bulk update
    const updatedTasks = await prisma.task.updateMany({
      where: {
        id: { in: validatedData.taskIds },
        userId: session.user.id,
      },
      data: {
        ...validatedData.updates,
        updatedAt: new Date(),
      },
    });

    console.log(`Bulk updated ${updatedTasks.count} tasks by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: { updatedCount: updatedTasks.count },
      message: `Successfully updated ${updatedTasks.count} tasks`,
    });

  } catch (error) {
    console.error('Bulk update tasks error:', error);

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
