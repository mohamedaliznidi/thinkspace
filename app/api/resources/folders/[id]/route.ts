/**
 * Individual Resource Folder API Routes
 * 
 * Handles operations on specific folders including
 * getting folder details, updating, and deleting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  updateResourceFolder,
  deleteResourceFolder,
} from '@/lib/folder-management';
import { AppError, handleApiError } from '@/lib/utils';
import type { UpdateFolderRequest } from '@/types/resources';

// Validation schema
const updateFolderSchema = z.object({
  name: z.string()
    .min(1, 'Folder name is required')
    .max(100, 'Folder name must be less than 100 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color')
    .optional(),
  parentId: z.string().cuid().nullable().optional(),
});

// GET - Get folder details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { id: folderId } = await params;
    const { searchParams } = new URL(request.url);
    const includeResources = searchParams.get('includeResources') === 'true';
    const includeChildren = searchParams.get('includeChildren') === 'true';

    const folder = await prisma.resourceFolder.findFirst({
      where: {
        id: folderId,
        userId: session.user.id,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            path: true,
            color: true,
          },
        },
        ...(includeChildren && {
          children: {
            select: {
              id: true,
              name: true,
              description: true,
              color: true,
              level: true,
              createdAt: true,
              _count: {
                select: {
                  resources: true,
                  children: true,
                },
              },
            },
            orderBy: {
              name: 'asc',
            },
          },
        }),
        ...(includeResources && {
          resources: {
            select: {
              id: true,
              title: true,
              description: true,
              type: true,
              sourceUrl: true,
              tags: true,
              createdAt: true,
              updatedAt: true,
              _count: {
                select: {
                  summaries: true,
                  references: true,
                  referencedBy: true,
                },
              },
            },
            orderBy: {
              title: 'asc',
            },
          },
        }),
        _count: {
          select: {
            resources: true,
            children: true,
          },
        },
      },
    });

    if (!folder) {
      throw new AppError('Folder not found', 404);
    }

    return NextResponse.json({
      success: true,
      data: { folder },
    });

  } catch (error) {
    console.error('Get resource folder error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// PUT - Update folder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { id: folderId } = await params;
    const body = await request.json();
    
    // Validate update data
    const validatedData = updateFolderSchema.parse(body);

    const updatedFolder = await updateResourceFolder(
      folderId,
      validatedData,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: { folder: updatedFolder },
    });

  } catch (error) {
    console.error('Update resource folder error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// DELETE - Delete folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { id: folderId } = await params;
    const { searchParams } = new URL(request.url);
    const moveResourcesToParent = searchParams.get('moveResourcesToParent') === 'true';
    const deleteSubfolders = searchParams.get('deleteSubfolders') === 'true';

    await deleteResourceFolder(folderId, session.user.id, {
      moveResourcesToParent,
      deleteSubfolders,
    });

    return NextResponse.json({
      success: true,
      message: 'Folder deleted successfully',
    });

  } catch (error) {
    console.error('Delete resource folder error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
