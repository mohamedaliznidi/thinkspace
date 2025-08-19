/**
 * Individual Link Management API for ThinkSpace
 * 
 * Handles operations on specific links including updates and deletion.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';
import { z } from 'zod';

// Route params interface
interface RouteParams {
  params: Promise<{
    linkId: string;
  }>;
}

// Link update schema
const updateLinkSchema = z.object({
  linkType: z.enum(['RELATED', 'DEPENDS_ON', 'BLOCKS', 'REFERENCES', 'CONTAINS', 'PART_OF', 'SIMILAR_TO', 'CUSTOM']).optional(),
  strength: z.number().min(0).max(1).optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// GET - Get specific link details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { linkId } = await params;

    const link = await prisma.connection.findFirst({
      where: {
        id: linkId,
        userId: session.user.id,
      },
    });

    if (!link) {
      throw new AppError('Link not found', 404);
    }

    // Get source and target item details
    const sourceItem = await getItemDetails(link.sourceType || '', link.sourceId || '', session.user.id);
    const targetItem = await getItemDetails(link.targetType || '', link.targetId || '', session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        link: {
          id: link.id,
          sourceType: link.sourceType,
          sourceId: link.sourceId,
          targetType: link.targetType,
          targetId: link.targetId,
          linkType: link.createdBy,
          strength: link.strength,
          description: (link.metadata as any)?.description,
          metadata: link.metadata as Record<string, any>,
          bidirectional: (link.metadata as any)?.bidirectional !== false,
          createdAt: link.createdAt.toISOString(),
          updatedAt: link.updatedAt.toISOString(),
          sourceItem,
          targetItem,
        },
      },
    });

  } catch (error) {
    console.error('Get link error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// PUT - Update link
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { linkId } = await params;
    const body = await request.json();
    const validatedData = updateLinkSchema.parse(body);

    // Find the link
    const existingLink = await prisma.connection.findFirst({
      where: {
        id: linkId,
        userId: session.user.id,
      },
    });

    if (!existingLink) {
      throw new AppError('Link not found', 404);
    }

    // Update the link
    const updatedLink = await prisma.connection.update({
      where: { id: linkId },
      data: {
        ...(validatedData.strength !== undefined && { strength: validatedData.strength }),
        ...(validatedData.linkType && { createdBy: validatedData.linkType as any }),
        metadata: {
          ...(existingLink.metadata as Record<string, any> || {}),
          ...(validatedData.linkType && { linkType: validatedData.linkType }),
          ...(validatedData.description !== undefined && { description: validatedData.description }),
          ...validatedData.metadata,
        },
      },
    });

    // Update bidirectional link if it exists
    if ((existingLink.metadata as any)?.bidirectional) {
      await prisma.connection.updateMany({
        where: {
          userId: session.user.id,
          sourceType: existingLink.targetType,
          sourceId: existingLink.targetId,
          targetType: existingLink.sourceType,
          targetId: existingLink.sourceId,
          metadata: {
            path: ['originalLinkId'],
            equals: linkId,
          },
        },
        data: {
          ...(validatedData.strength !== undefined && { strength: validatedData.strength }),
          ...(validatedData.linkType && { createdBy: validatedData.linkType as any }),
          metadata: {
            ...(existingLink.metadata as Record<string, any> || {}),
            ...(validatedData.linkType && { linkType: validatedData.linkType }),
            ...(validatedData.description !== undefined && { description: validatedData.description }),
            reverseLink: true,
            originalLinkId: linkId,
            ...validatedData.metadata,
          },
        },
      });
    }

    // Get updated item details
    const sourceItem = await getItemDetails(updatedLink.sourceType || '', updatedLink.sourceId || '', session.user.id);
    const targetItem = await getItemDetails(updatedLink.targetType || '', updatedLink.targetId || '', session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        link: {
          id: updatedLink.id,
          sourceType: updatedLink.sourceType,
          sourceId: updatedLink.sourceId,
          targetType: updatedLink.targetType,
          targetId: updatedLink.targetId,
          linkType: updatedLink.createdBy,
          strength: updatedLink.strength,
          description: (updatedLink.metadata as any)?.description,
          metadata: updatedLink.metadata as Record<string, any>,
          bidirectional: (updatedLink.metadata as any)?.bidirectional !== false,
          createdAt: updatedLink.createdAt.toISOString(),
          updatedAt: updatedLink.updatedAt.toISOString(),
          sourceItem,
          targetItem,
        },
      },
      message: 'Link updated successfully',
    });

  } catch (error) {
    console.error('Update link error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// DELETE - Delete link
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { linkId } = await params;

    // Find the link
    const existingLink = await prisma.connection.findFirst({
      where: {
        id: linkId,
        userId: session.user.id,
      },
    });

    if (!existingLink) {
      throw new AppError('Link not found', 404);
    }

    // Delete bidirectional link if it exists
    if ((existingLink.metadata as any)?.bidirectional) {
      await prisma.connection.deleteMany({
        where: {
          userId: session.user.id,
          sourceType: existingLink.targetType,
          sourceId: existingLink.targetId,
          targetType: existingLink.sourceType,
          targetId: existingLink.sourceId,
          metadata: {
            path: ['originalLinkId'],
            equals: linkId,
          },
        },
      });
    }

    // Delete the main link
    await prisma.connection.delete({
      where: { id: linkId },
    });

    return NextResponse.json({
      success: true,
      message: 'Link deleted successfully',
    });

  } catch (error) {
    console.error('Delete link error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// Helper function to get item details
async function getItemDetails(itemType: string, itemId: string, userId: string) {
  const baseSelect = {
    id: true,
    title: true,
    description: true,
    createdAt: true,
    updatedAt: true,
  };

  switch (itemType) {
    case 'project':
      return await prisma.project.findFirst({
        where: { id: itemId, userId },
        select: {
          ...baseSelect,
          status: true,
          priority: true,
          progress: true,
          tags: true,
        },
      });

    case 'area':
      return await prisma.area.findFirst({
        where: { id: itemId, userId },
        select: {
          ...baseSelect,
          type: true,
          color: true,
          isActive: true,
          tags: true,
        },
      });

    case 'resource':
      return await prisma.resource.findFirst({
        where: { id: itemId, userId },
        select: {
          ...baseSelect,
          type: true,
          sourceUrl: true,
          tags: true,
        },
      });

    case 'note':
      return await prisma.note.findFirst({
        where: { id: itemId, userId },
        select: {
          ...baseSelect,
          type: true,
          isPinned: true,
          tags: true,
        },
      });

    default:
      return null;
  }
}
