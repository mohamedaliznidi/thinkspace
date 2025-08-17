/**
 * Individual Area Review API Routes for ThinkSpace
 * 
 * This API handles operations for individual area reviews including
 * get, update, delete, and template management.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';

// Update area review validation schema
const updateAreaReviewSchema = z.object({
  reviewType: z.enum(['SCHEDULED', 'AD_HOC', 'MILESTONE', 'CRISIS']).optional(),
  notes: z.string().optional(),
  findings: z.record(z.any()).optional(),
  improvements: z.record(z.any()).optional(),
  healthScore: z.number().min(0).max(1).optional(),
  criteriaScores: z.record(z.number()).optional(),
  templateId: z.string().optional(),
  template: z.record(z.any()).optional(),
});

interface RouteParams {
  params: Promise<{ areaId: string; reviewId: string }>;
}

/**
 * GET /api/areas/[areaId]/reviews/[reviewId]
 * Get a specific area review with full details
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const { areaId, reviewId } = await params;

    const review = await prisma.areaReview.findFirst({
      where: {
        id: reviewId,
        areaId,
        userId: session.user.id,
      },
      include: {
        area: {
          select: {
            id: true,
            title: true,
            description: true,
            color: true,
            type: true,
            responsibilityLevel: true,
            reviewFrequency: true,
            standards: true,
            criteria: true,
            healthScore: true,
          },
        },
      },
    });

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    return NextResponse.json({
      success: true,
      data: { review },
    });

  } catch (error) {
    console.error('Get review error:', error);
    const { message, statusCode } = handleApiError(error);

    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

/**
 * PATCH /api/areas/[areaId]/reviews/[reviewId]
 * Update an area review
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const { areaId, reviewId } = await params;
    const body = await request.json();
    const validatedData = updateAreaReviewSchema.parse(body);

    // Verify review ownership
    const existingReview = await prisma.areaReview.findFirst({
      where: {
        id: reviewId,
        areaId,
        userId: session.user.id,
      },
    });

    if (!existingReview) {
      throw new AppError('Review not found', 404);
    }

    const review = await prisma.areaReview.update({
      where: { id: reviewId },
      data: validatedData,
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

    // Update area's health score if provided
    if (validatedData.healthScore !== undefined) {
      await prisma.area.update({
        where: { id: areaId },
        data: {
          healthScore: validatedData.healthScore,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { review },
    });

  } catch (error) {
    console.error('Update review error:', error);

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
 * DELETE /api/areas/[areaId]/reviews/[reviewId]
 * Delete an area review
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const { areaId, reviewId } = await params;

    // Verify review ownership
    const review = await prisma.areaReview.findFirst({
      where: {
        id: reviewId,
        areaId,
        userId: session.user.id,
      },
    });

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    // Delete the review
    await prisma.areaReview.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });

  } catch (error) {
    console.error('Delete review error:', error);
    const { message, statusCode } = handleApiError(error);

    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
