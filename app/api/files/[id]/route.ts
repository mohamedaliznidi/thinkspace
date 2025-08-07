/**
 * Individual File API Routes for ThinkSpace
 * 
 * This API handles operations for specific files including
 * fetching details, serving content, and deleting files.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';
import type { ResourceWithRelations, FileWithRelations } from '@/types/database';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface RouteParams {
  params: Promise<{ fileId: string }>;
}

// GET - Fetch file details or serve file content
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { fileId } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'details' or 'content'

    // Find the file resource and its related File record
    const resource = await prisma.resource.findFirst({
      where: {
        id: fileId,
        userId: session.user.id,
        filePath: { not: null },
      },
      include: {
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        areas: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
        files: true, // get related File(s)
      },
    }) as ResourceWithRelations | null;

    if (!resource) {
      throw new AppError('File not found', 404);
    }

    // If requesting file details
    if (action === 'details' || !action) {
      return NextResponse.json({
        success: true,
        data: { file: resource },
      });
    }

    // If requesting file content
    if (action === 'content') {
      if (!resource.filePath) {
        throw new AppError('File path not found', 404);
      }

      // Find the related File record (should be only one)
      const fileRecord = resource.files && resource.files.length > 0 ? resource.files[0] as FileWithRelations : null;
      const mimeType = fileRecord?.mimeType || 'application/octet-stream';
      const fileName = fileRecord?.originalName || fileRecord?.filename || 'file';

      const fullPath = join(process.cwd(), resource.filePath.replace(/^\//, ''));
      if (!existsSync(fullPath)) {
        throw new AppError('File not found on disk', 404);
      }

      try {
        const fileBuffer = await readFile(fullPath);
        // Set appropriate headers
        const headers = new Headers();
        headers.set('Content-Type', mimeType);
        headers.set('Content-Length', fileBuffer.length.toString());
        headers.set('Content-Disposition', `inline; filename="${fileName}"`);
        return new NextResponse(fileBuffer, {
          status: 200,
          headers,
        });
      } catch (error) {
        console.error('Error reading file:', error);
        throw new AppError('Error reading file', 500);
      }
    }

    // If requesting extracted content
    if (action === 'extract') {
      // Find the related File record (should be only one)
      const fileRecord = resource.files && resource.files.length > 0 ? resource.files[0] as FileWithRelations : null;
      const mimeType = fileRecord?.mimeType || 'application/octet-stream';
      const fileName = fileRecord?.originalName || fileRecord?.filename || 'file';
      return NextResponse.json({
        success: true,
        data: {
          content: resource.contentExtract || '',
          fileType: mimeType,
          fileName: fileName,
        },
      });
    }

    throw new AppError('Invalid action parameter', 400);

  } catch (error) {
    console.error('Get file error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// DELETE - Delete file
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { fileId } = await params;

    // Find the file resource
    const resource = await prisma.resource.findFirst({
      where: {
        id: fileId,
        userId: session.user.id,
        filePath: { not: null },
      },
    });

    if (!resource) {
      throw new AppError('File not found', 404);
    }

    // Delete file from disk
    if (resource.filePath) {
      const fullPath = join(process.cwd(), resource.filePath.replace(/^\//, ''));
      
      if (existsSync(fullPath)) {
        try {
          await unlink(fullPath);
        } catch (error) {
          console.error('Error deleting file from disk:', error);
          // Continue with database deletion even if file deletion fails
        }
      }
    }

    // Delete resource record from database
    await prisma.resource.delete({
      where: { id: fileId },
    });

    // Log file deletion
    console.log(`File deleted: ${resource.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('Delete file error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// PUT - Update file metadata
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { fileId } = await params;
    const body = await request.json();
    const { title, description, projectIds, areaIds, tags } = body;

    // Find the file resource
    const existingResource = await prisma.resource.findFirst({
      where: {
        id: fileId,
        userId: session.user.id,
        filePath: { not: null },
      },
      include: {
        projects: true,
        areas: true,
      },
    });

    if (!existingResource) {
      throw new AppError('File not found', 404);
    }

    // Update resource metadata
    const updatedResource = await prisma.resource.update({
      where: { id: fileId },
      data: {
        title: title || existingResource.title,
        description: description !== undefined ? description : existingResource.description,
        tags: tags !== undefined ? tags : existingResource.tags,
        // Update project/area relations if provided
        ...(projectIds ? { projects: { set: projectIds.map((id: string) => ({ id })) } } : {}),
        ...(areaIds ? { areas: { set: areaIds.map((id: string) => ({ id })) } } : {}),
      },
      include: {
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        areas: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
      },
    });

    // Log file update
    console.log(`File updated: ${updatedResource.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: { file: updatedResource },
      message: 'File updated successfully',
    });

  } catch (error) {
    console.error('Update file error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
