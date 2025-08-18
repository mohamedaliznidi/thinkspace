/**
 * Resource Folders API Routes
 * 
 * Handles CRUD operations for resource folders including
 * hierarchical folder management and bulk operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  createResourceFolder,
  updateResourceFolder,
  deleteResourceFolder,
  getFolderTree,
  moveResources
} from '@/lib/folder-management';
import { AppError, handleApiError } from '@/lib/utils';
import type { CreateFolderRequest, UpdateFolderRequest } from '@/types/resources';

// Validation schemas
const createFolderSchema = z.object({
  name: z.string()
    .min(1, 'Folder name is required')
    .max(100, 'Folder name must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color')
    .optional(),
  parentId: z.string().cuid().optional(),
});

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

const moveResourcesSchema = z.object({
  resourceIds: z.array(z.string().cuid()).min(1, 'At least one resource ID is required'),
  targetFolderId: z.string().cuid().nullable(),
});

// GET - List folders or get folder tree
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const treeView = searchParams.get('tree') === 'true';
    const includeResourceCounts = searchParams.get('includeResourceCounts') !== 'false';
    const maxDepth = parseInt(searchParams.get('maxDepth') || '10');
    const parentId = searchParams.get('parentId') || undefined;

    if (treeView) {
      // Return hierarchical tree structure
      const tree = await getFolderTree(session.user.id, {
        includeResourceCounts,
        maxDepth,
        parentId,
      });

      return NextResponse.json({
        success: true,
        data: { folders: tree },
      });
    } else {
      // Return flat list of folders
      const folders = await prisma.resourceFolder.findMany({
        where: {
          userId: session.user.id,
          ...(parentId && { parentId }),
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              path: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
            },
          },
          ...(includeResourceCounts && {
            resources: {
              select: { id: true },
            },
          }),
        },
        orderBy: [
          { level: 'asc' },
          { name: 'asc' },
        ],
      });

      return NextResponse.json({
        success: true,
        data: { folders },
      });
    }

  } catch (error) {
    console.error('Get resource folders error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// POST - Create new folder or move resources
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'move') {
      // Move resources between folders
      const validatedData = moveResourcesSchema.parse(body);
      
      const result = await moveResources(
        validatedData.resourceIds,
        validatedData.targetFolderId,
        session.user.id
      );

      return NextResponse.json({
        success: true,
        data: { result },
      });
    } else {
      // Create new folder
      const validatedData = createFolderSchema.parse(body);
      
      const folderRequest: CreateFolderRequest = {
        name: validatedData.name,
        description: validatedData.description,
        color: validatedData.color,
        parentId: validatedData.parentId,
      };

      const folder = await createResourceFolder(folderRequest, session.user.id);

      return NextResponse.json({
        success: true,
        data: { folder },
      });
    }

  } catch (error) {
    console.error('Create resource folder error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// PUT - Update folder
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const { folderId, ...updateData } = body;
    
    if (!folderId) {
      throw new AppError('Folder ID is required', 400);
    }

    // Validate update data
    const validatedData = updateFolderSchema.parse(updateData);

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
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const moveResourcesToParent = searchParams.get('moveResourcesToParent') === 'true';
    const deleteSubfolders = searchParams.get('deleteSubfolders') === 'true';

    if (!folderId) {
      throw new AppError('Folder ID is required', 400);
    }

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
