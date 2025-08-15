/**
 * Individual Resource API Routes for ThinkSpace
 * 
 * This API handles operations for specific resources including
 * fetching details, updating, and deleting resources.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';
import { generateEmbedding } from '@/lib/vector';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Resource update validation schema
const updateResourceSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  type: z.enum(['DOCUMENT', 'LINK', 'IMAGE', 'VIDEO', 'AUDIO', 'BOOK', 'ARTICLE', 'RESEARCH', 'REFERENCE', 'TEMPLATE', 'OTHER']).optional(),
  sourceUrl: z.string().url().optional(),
  filePath: z.string().optional(),
  contentExtract: z.string().optional(),
  projectIds: z.array(z.string().cuid()).optional(),
  areaIds: z.array(z.string().cuid()).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// GET - Fetch resource details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { id: resourceId } = await params;

    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
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
        areas: {
          select: {
            id: true,
            title: true,
            description: true,
            color: true,
            type: true,
            isActive: true,
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
            isPinned: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
        _count: {
          select: {
            projects: true,
            areas: true,
            notes: true,
          },
        },
      },
    });

    if (!resource) {
      throw new AppError('Resource not found', 404);
    }

    return NextResponse.json({
      success: true,
      data: { resource },
    });

  } catch (error) {
    console.error('Get resource error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// PUT - Update resource
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { id: resourceId } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = updateResourceSchema.parse(body);
    const { projectIds = [], areaIds = [], ...resourceData } = validatedData;

    // Check if resource exists and belongs to user
    const existingResource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        userId: session.user.id,
      },
    });

    if (!existingResource) {
      throw new AppError('Resource not found', 404);
    }

    // Generate embedding if content changed
    let embedding = undefined;
    if (resourceData.title || resourceData.description || resourceData.contentExtract) {
      const content = [
        resourceData.title || existingResource.title,
        resourceData.description || existingResource.description,
        resourceData.contentExtract || existingResource.contentExtract,
      ].filter(Boolean).join(' ');
      
      if (content.trim()) {
        embedding = await generateEmbedding(content);
      }
    }

    // Update resource with relationships
    const resource = await prisma.resource.update({
      where: { id: resourceId },
      data: {
        ...resourceData,
        ...(embedding && { embedding }),
        // Update project relationships if provided
        ...(projectIds.length >= 0 && {
          projects: {
            set: projectIds.map(id => ({ id }))
          }
        }),
        // Update area relationships if provided
        ...(areaIds.length >= 0 && {
          areas: {
            set: areaIds.map(id => ({ id }))
          }
        }),
      },
      include: {
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
            description: true,
          },
        },
        areas: {
          select: {
            id: true,
            title: true,
            color: true,
            description: true,
          },
        },
        _count: {
          select: {
            projects: true,
            areas: true,
            notes: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { resource },
    });

  } catch (error) {
    console.error('Update resource error:', error);

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

// DELETE - Delete resource
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { id: resourceId } = await params;

    // Check if resource exists and belongs to user
    const existingResource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        userId: session.user.id,
      },
    });

    if (!existingResource) {
      throw new AppError('Resource not found', 404);
    }

    // Delete resource (cascade will handle related records)
    await prisma.resource.delete({
      where: { id: resourceId },
    });

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully',
    });

  } catch (error) {
    console.error('Delete resource error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
