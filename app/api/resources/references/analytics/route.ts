/**
 * Reference Analytics API Route
 * 
 * Provides comprehensive analytics for resource references including
 * usage patterns, most referenced resources, and reference trends.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { getReferenceAnalytics, getMostReferencedResources } from '@/lib/reference-tracking';
import { AppError, handleApiError } from '@/lib/utils';

// Validation schema
const analyticsSchema = z.object({
  timeframe: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  resourceId: z.string().cuid().optional(),
  includeDetails: z.boolean().default(true),
});

// GET - Get reference analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    
    const options = {
      timeframe: (searchParams.get('timeframe') || 'month') as 'week' | 'month' | 'quarter' | 'year',
      resourceId: searchParams.get('resourceId') || undefined,
      includeDetails: searchParams.get('includeDetails') !== 'false',
    };

    // Validate options
    const validatedOptions = analyticsSchema.parse(options);

    const analytics = await getReferenceAnalytics(session.user.id, {
      timeframe: validatedOptions.timeframe,
      resourceId: validatedOptions.resourceId,
    });

    // Get additional analytics if details are requested
    let additionalData = {};
    if (validatedOptions.includeDetails) {
      const [mostReferenced] = await Promise.all([
        getMostReferencedResources(session.user.id, 20),
      ]);

      additionalData = {
        topReferencedResources: mostReferenced,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        analytics,
        ...additionalData,
      },
    });

  } catch (error) {
    console.error('Get reference analytics error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
