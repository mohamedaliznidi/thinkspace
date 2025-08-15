/**
 * Individual Template API Routes for ThinkSpace
 * 
 * This API handles operations for specific templates including
 * fetching details, updating, deleting, and using templates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ templateId: string }>;
}

// Template update validation schema
const updateTemplateSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  category: z.enum([
    'SOFTWARE_DEVELOPMENT',
    'MARKETING',
    'DESIGN',
    'RESEARCH',
    'EVENT_PLANNING',
    'PRODUCT_LAUNCH',
    'CONTENT_CREATION',
    'BUSINESS_PLANNING',
    'EDUCATION',
    'PERSONAL',
    'OTHER'
  ]).optional(),
  projectData: z.object({
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    dueDate: z.string().datetime().optional(),
    tags: z.array(z.string()).default([]),
    metadata: z.record(z.any()).optional(),
  }).optional(),
  taskData: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'COMPLETED', 'CANCELLED']).default('TODO'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    estimatedHours: z.number().positive().optional(),
    order: z.number().int().default(0),
    tags: z.array(z.string()).default([]),
    parentTaskIndex: z.number().int().optional(),
    dependsOnTaskIndexes: z.array(z.number().int()).default([]),
  })).optional(),
  milestones: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    dueDate: z.string().datetime(),
    color: z.string().optional(),
  })).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// GET - Fetch template details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { templateId } = await params;

    const template = await prisma.projectTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { userId: session.user.id }, // User's own template
          { isPublic: true }, // Public template
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
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
            projects: true,
            activities: true,
          },
        },
      },
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    return NextResponse.json({
      success: true,
      data: { template },
    });

  } catch (error) {
    console.error('Get template error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// PUT - Update template
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { templateId } = await params;
    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    // Verify template ownership
    const existingTemplate = await prisma.projectTemplate.findFirst({
      where: {
        id: templateId,
        userId: session.user.id, // Only owner can update
      },
    });

    if (!existingTemplate) {
      throw new AppError('Template not found or access denied', 404);
    }

    // Update template
    const updatedTemplate = await prisma.projectTemplate.update({
      where: { id: templateId },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            projects: true,
            activities: true,
          },
        },
      },
    });

    console.log(`Template updated: ${updatedTemplate.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: { template: updatedTemplate },
      message: 'Template updated successfully',
    });

  } catch (error) {
    console.error('Update template error:', error);

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

// DELETE - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { templateId } = await params;

    // Verify template ownership
    const template = await prisma.projectTemplate.findFirst({
      where: {
        id: templateId,
        userId: session.user.id, // Only owner can delete
      },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!template) {
      throw new AppError('Template not found or access denied', 404);
    }

    // Check if template is being used
    if (template._count.projects > 0) {
      throw new AppError('Cannot delete template that is being used by projects', 400);
    }

    // Delete the template
    await prisma.projectTemplate.delete({
      where: { id: templateId },
    });

    console.log(`Template deleted: ${template.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });

  } catch (error) {
    console.error('Delete template error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
