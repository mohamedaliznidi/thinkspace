/**
 * Chat API Routes for ThinkSpace
 * 
 * This API handles chat operations including listing chats,
 * creating new conversations, and managing chat metadata.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';

// Chat validation schema
const createChatSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  projectId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
  resourceId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
});

// GET - List chats with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const projectId = searchParams.get('projectId');
    const areaId = searchParams.get('areaId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: session.user.id,
      ...(projectId && { projectId }),
      ...(areaId && { areaId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Get chats with related data
    const [chats, total] = await Promise.all([
      prisma.chat.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          area: {
            select: {
              id: true,
              title: true,
              color: true,
            },
          },
          resource: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
          messages: {
            select: {
              id: true,
              content: true,
              role: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1, // Get last message for preview
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.chat.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        chats,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('Get chats error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// POST - Create new chat
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const validatedData = createChatSchema.parse(body);

    // Create chat
    const chat = await prisma.chat.create({
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
        area: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
        resource: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    // Log chat creation
    console.log(`Chat created: ${chat.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: { chat },
      message: 'Chat created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Create chat error:', error);

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
