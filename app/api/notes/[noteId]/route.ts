/**
 * Individual Note API Routes for ThinkSpace
 * 
 * This API handles operations for specific notes including
 * fetching details, updating, and deleting notes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';
import { generateEmbedding } from '@/lib/vector';

// Update note validation schema
const updateNoteSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  content: z.string()
    .min(1, 'Content is required')
    .optional(),
  type: z.enum(['FLEETING', 'LITERATURE', 'PERMANENT', 'PROJECT', 'MEETING']).optional(),
  isPinned: z.boolean().optional(),
  projectId: z.string().cuid().optional().nullable(),
  areaId: z.string().cuid().optional().nullable(),
  resourceId: z.string().cuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

interface RouteParams {
  params: Promise<{ noteId: string }>;
}

// GET - Fetch note details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { noteId } = await params;

    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: session.user.id,
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
        resources: {
          select: {
            id: true,
            title: true,
            type: true,
            description: true,
          },
        },
      },
    });

    if (!note) {
      throw new AppError('Note not found', 404);
    }

    return NextResponse.json({
      success: true,
      data: { note },
    });

  } catch (error) {
    console.error('Get note error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// PUT - Update note
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { noteId } = await params;
    const body = await request.json();
    const validatedData = updateNoteSchema.parse(body);

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: session.user.id,
      },
    });

    if (!existingNote) {
      throw new AppError('Note not found', 404);
    }



    // Update note
    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        ...validatedData,
        ...(validatedData.type && { type: validatedData.type as any }), // Explicit cast for Prisma enum
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
        resources: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    // Log note update
    console.log(`Note updated: ${updatedNote.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: { note: updatedNote },
      message: 'Note updated successfully',
    });

  } catch (error) {
    console.error('Update note error:', error);

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

// DELETE - Delete note
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { noteId } = await params;

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: session.user.id,
      },
    });

    if (!existingNote) {
      throw new AppError('Note not found', 404);
    }

    // Delete note
    await prisma.note.delete({
      where: { id: noteId },
    });

    // Log note deletion
    console.log(`Note deleted: ${existingNote.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully',
    });

  } catch (error) {
    console.error('Delete note error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
