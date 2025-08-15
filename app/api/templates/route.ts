/**
 * Project Templates API Routes for ThinkSpace
 * 
 * This API handles CRUD operations for project templates,
 * including listing, creating, and managing template sharing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';

// Template validation schema
const createTemplateSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
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
  ]).default('OTHER'),
  projectData: z.object({
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    dueDate: z.string().datetime().optional(),
    tags: z.array(z.string()).default([]),
    metadata: z.record(z.any()).optional(),
  }),
  taskData: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'COMPLETED', 'CANCELLED']).default('TODO'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    estimatedHours: z.number().positive().optional(),
    order: z.number().int().default(0),
    tags: z.array(z.string()).default([]),
    parentTaskIndex: z.number().int().optional(), // Reference to parent task by index
    dependsOnTaskIndexes: z.array(z.number().int()).default([]), // References to dependencies by index
  })).optional(),
  milestones: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    dueDate: z.string().datetime(),
    color: z.string().optional(),
  })).optional(),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
});

const updateTemplateSchema = createTemplateSchema.partial();

// GET - List templates with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isPublic = searchParams.get('isPublic');
    const isOfficial = searchParams.get('isOfficial');

    // Build where clause
    const where: any = {
      OR: [
        { userId: session.user.id }, // User's own templates
        { isPublic: true }, // Public templates
      ],
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { tags: { has: search } },
          ],
        },
      ];
    }

    if (isPublic !== null) {
      where.isPublic = isPublic === 'true';
    }

    if (isOfficial !== null) {
      where.isOfficial = isOfficial === 'true';
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch templates with relations
    const [templates, totalCount] = await Promise.all([
      prisma.projectTemplate.findMany({
        where,
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
        orderBy: [
          { isOfficial: 'desc' },
          { usageCount: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.projectTemplate.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        templates,
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
    console.error('List templates error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    // Create template
    const template = await prisma.projectTemplate.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
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

    // Log template creation
    console.log(`Template created: ${template.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: { template },
      message: 'Template created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Create template error:', error);

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

// Handle unsupported methods
export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use /api/templates/[id] for individual template operations.',
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use /api/templates/[id] for individual template operations.',
  }, { status: 405 });
}
