/**
 * Area Reviews API Routes for ThinkSpace
 * 
 * This API handles CRUD operations for area reviews including
 * scheduled reviews, templates, and progress tracking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';

// Area Review validation schema
const createAreaReviewSchema = z.object({
  reviewType: z.enum(['SCHEDULED', 'AD_HOC', 'MILESTONE', 'CRISIS']).default('SCHEDULED'),
  notes: z.string().optional(),
  findings: z.record(z.any()).optional(), // Structured review findings
  improvements: z.record(z.any()).optional(), // Improvement actions
  healthScore: z.number().min(0).max(1).optional(),
  criteriaScores: z.record(z.number()).optional(), // Individual criteria scores
  templateId: z.string().optional(),
  template: z.record(z.any()).optional(), // Template snapshot
});



interface RouteParams {
  params: Promise<{ areaId: string }>;
}

/**
 * GET /api/areas/[areaId]/reviews
 * List reviews for an area
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const { areaId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const reviewType = searchParams.get('reviewType') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Verify area ownership
    const area = await prisma.area.findFirst({
      where: {
        id: areaId,
        userId: session.user.id,
      },
    });

    if (!area) {
      throw new AppError('Area not found', 404);
    }

    // Build where clause
    const where: any = {
      areaId,
      userId: session.user.id,
    };

    if (reviewType) {
      where.reviewType = reviewType;
    }

    if (startDate || endDate) {
      where.reviewDate = {};
      if (startDate) {
        where.reviewDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.reviewDate.lte = new Date(endDate);
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.areaReview.count({ where });
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    const reviews = await prisma.areaReview.findMany({
      where,
      include: {
        area: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
      },
      orderBy: {
        reviewDate: 'desc',
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    const { message, statusCode } = handleApiError(error);

    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

/**
 * POST /api/areas/[areaId]/reviews
 * Create a new area review
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const { areaId } = await params;
    const body = await request.json();
    const validatedData = createAreaReviewSchema.parse(body);

    // Verify area ownership
    const area = await prisma.area.findFirst({
      where: {
        id: areaId,
        userId: session.user.id,
      },
    });

    if (!area) {
      throw new AppError('Area not found', 404);
    }

    // Create the review
    const review = await prisma.areaReview.create({
      data: {
        ...validatedData,
        areaId,
        userId: session.user.id,
      },
      include: {
        area: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
      },
    });

    // Update area's last reviewed date and health score if provided
    const updateData: any = {
      lastReviewedAt: new Date(),
    };

    if (validatedData.healthScore !== undefined) {
      updateData.healthScore = validatedData.healthScore;
    }

    // Calculate next review date based on review frequency
    if (area.reviewFrequency) {
      const nextReviewDate = calculateNextReviewDate(new Date(), area.reviewFrequency);
      updateData.nextReviewDate = nextReviewDate;
    }

    await prisma.area.update({
      where: { id: areaId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: { review },
    }, { status: 201 });

  } catch (error) {
    console.error('Create review error:', error);

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

/**
 * Calculate next review date based on frequency
 */
function calculateNextReviewDate(
  currentDate: Date,
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'BIANNUALLY' | 'ANNUALLY' | 'CUSTOM'
): Date {
  const nextDate = new Date(currentDate);

  switch (frequency) {
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'BIWEEKLY':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'QUARTERLY':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'BIANNUALLY':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'ANNUALLY':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case 'CUSTOM':
      // For custom frequency, don't auto-calculate
      return currentDate;
  }

  return nextDate;
}


