/**
 * Universal Linking API for ThinkSpace
 * 
 * Provides comprehensive linking capabilities between any items across all PARA categories
 * with bidirectional relationships and automatic relationship updates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';
import { z } from 'zod';

// Link creation schema
const createLinkSchema = z.object({
  sourceType: z.enum(['project', 'area', 'resource', 'note']),
  sourceId: z.string().cuid(),
  targetType: z.enum(['project', 'area', 'resource', 'note']),
  targetId: z.string().cuid(),
  linkType: z.enum(['RELATED', 'DEPENDS_ON', 'BLOCKS', 'REFERENCES', 'CONTAINS', 'PART_OF', 'SIMILAR_TO', 'CUSTOM']).default('RELATED'),
  strength: z.number().min(0).max(1).default(0.5),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  bidirectional: z.boolean().default(true),
});

// Link update schema
const updateLinkSchema = z.object({
  linkType: z.enum(['RELATED', 'DEPENDS_ON', 'BLOCKS', 'REFERENCES', 'CONTAINS', 'PART_OF', 'SIMILAR_TO', 'CUSTOM']).optional(),
  strength: z.number().min(0).max(1).optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Link interface
interface Link {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  linkType: string;
  strength: number;
  description?: string;
  metadata?: any;
  bidirectional: boolean;
  createdAt: string;
  updatedAt: string;
  sourceItem?: any;
  targetItem?: any;
}

// GET - Retrieve links for an item or all links
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get('itemType');
    const itemId = searchParams.get('itemId');
    const linkType = searchParams.get('linkType');
    const includeItems = searchParams.get('includeItems') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let whereClause: any = {
      userId: session.user.id,
    };

    // Filter by item (source or target)
    if (itemType && itemId) {
      whereClause.OR = [
        { sourceType: itemType, sourceId: itemId },
        { targetType: itemType, targetId: itemId },
      ];
    }

    // Filter by link type
    if (linkType) {
      whereClause.linkType = linkType;
    }

    const links = await prisma.connection.findMany({
      where: whereClause,
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    // Enhance links with source and target item details if requested
    const enhancedLinks: Link[] = [];
    
    for (const link of links) {
      let sourceItem = null;
      let targetItem = null;

      if (includeItems) {
        // Fetch source item
        sourceItem = await getItemDetails(link.sourceType || '', link.sourceId || '', session.user.id);

        // Fetch target item
        targetItem = await getItemDetails(link.targetType || '', link.targetId || '', session.user.id);
      }

      enhancedLinks.push({
        id: link.id,
        sourceType: link.sourceType || '',
        sourceId: link.sourceId || '',
        targetType: link.targetType || '',
        targetId: link.targetId || '',
        linkType: link.createdBy || 'RELATED',
        strength: link.strength,
        description: (link.metadata as any)?.description,
        metadata: link.metadata as Record<string, any>,
        bidirectional: (link.metadata as any)?.bidirectional !== false,
        createdAt: link.createdAt.toISOString(),
        updatedAt: link.updatedAt.toISOString(),
        sourceItem,
        targetItem,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        links: enhancedLinks,
        total: enhancedLinks.length,
      },
    });

  } catch (error) {
    console.error('Get links error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// POST - Create a new link
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const validatedData = createLinkSchema.parse(body);

    // Verify source and target items exist and belong to user
    const sourceItem = await getItemDetails(validatedData.sourceType, validatedData.sourceId, session.user.id);
    const targetItem = await getItemDetails(validatedData.targetType, validatedData.targetId, session.user.id);

    if (!sourceItem) {
      throw new AppError(`Source ${validatedData.sourceType} not found`, 404);
    }

    if (!targetItem) {
      throw new AppError(`Target ${validatedData.targetType} not found`, 404);
    }

    // Check if link already exists
    const existingLink = await prisma.connection.findFirst({
      where: {
        userId: session.user.id,
        OR: [
          {
            sourceType: validatedData.sourceType,
            sourceId: validatedData.sourceId,
            targetType: validatedData.targetType,
            targetId: validatedData.targetId,
          },
          ...(validatedData.bidirectional ? [{
            sourceType: validatedData.targetType,
            sourceId: validatedData.targetId,
            targetType: validatedData.sourceType,
            targetId: validatedData.sourceId,
          }] : []),
        ],
      },
    });

    if (existingLink) {
      throw new AppError('Link already exists between these items', 409);
    }

    // Create the link
    const link = await prisma.connection.create({
      data: {
        userId: session.user.id,
        sourceType: validatedData.sourceType,
        sourceId: validatedData.sourceId,
        targetType: validatedData.targetType,
        targetId: validatedData.targetId,
        strength: validatedData.strength,
        createdBy: validatedData.linkType as any,
        metadata: {
          linkType: validatedData.linkType,
          description: validatedData.description,
          bidirectional: validatedData.bidirectional,
          ...validatedData.metadata,
        },
      },
    });

    // Create bidirectional link if requested
    if (validatedData.bidirectional) {
      await prisma.connection.create({
        data: {
          userId: session.user.id,
          sourceType: validatedData.targetType,
          sourceId: validatedData.targetId,
          targetType: validatedData.sourceType,
          targetId: validatedData.sourceId,
          strength: validatedData.strength,
          createdBy: validatedData.linkType as any,
          metadata: {
            linkType: validatedData.linkType,
            description: validatedData.description,
            bidirectional: true,
            reverseLink: true,
            originalLinkId: link.id,
            ...validatedData.metadata,
          },
        },
      });
    }

    // Update relationship counts in the database
    await updateRelationshipCounts(validatedData.sourceType, validatedData.sourceId, session.user.id);
    await updateRelationshipCounts(validatedData.targetType, validatedData.targetId, session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        link: {
          id: link.id,
          sourceType: validatedData.sourceType,
          sourceId: validatedData.sourceId,
          targetType: validatedData.targetType,
          targetId: validatedData.targetId,
          linkType: validatedData.linkType,
          strength: validatedData.strength,
          description: validatedData.description,
          metadata: validatedData.metadata,
          bidirectional: validatedData.bidirectional,
          createdAt: link.createdAt.toISOString(),
          updatedAt: link.updatedAt.toISOString(),
          sourceItem,
          targetItem,
        },
      },
      message: 'Link created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Create link error:', error);
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

// PUT - Update an existing link
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('linkId');

    if (!linkId) {
      throw new AppError('Link ID is required', 400);
    }

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

    return NextResponse.json({
      success: true,
      data: { link: updatedLink },
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

// DELETE - Delete a link
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('linkId');

    if (!linkId) {
      throw new AppError('Link ID is required', 400);
    }

    // Find and delete the link
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

// Helper function to update relationship counts
async function updateRelationshipCounts(itemType: string, itemId: string, userId: string) {
  // This would update cached relationship counts in the items
  // For now, we'll skip this as it would require schema changes
  // In a production system, you might want to maintain relationship counts
  // for performance optimization
}
