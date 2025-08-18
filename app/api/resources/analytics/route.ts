/**
 * Resource Analytics API Routes
 * 
 * Handles comprehensive resource analytics including usage patterns,
 * reference networks, and performance metrics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import {
  getResourceAnalytics,
  getResourceUsageMetrics,
  analyzeReferenceNetwork
} from '@/lib/resource-analytics';
import { AppError, handleApiError } from '@/lib/utils';

// Validation schemas
const analyticsSchema = z.object({
  timeframe: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  includeUsage: z.boolean().default(true),
  includeContent: z.boolean().default(true),
  includeQuality: z.boolean().default(true),
});

const usageMetricsSchema = z.object({
  resourceId: z.string().cuid(),
});

const networkAnalysisSchema = z.object({
  includeProjects: z.boolean().default(true),
  includeAreas: z.boolean().default(true),
  includeNotes: z.boolean().default(true),
  maxNodes: z.number().min(10).max(500).default(100),
});

// GET - Get comprehensive resource analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const analysisType = searchParams.get('type') || 'overview';

    switch (analysisType) {
      case 'overview': {
        const timeframe = (searchParams.get('timeframe') || 'month') as 'week' | 'month' | 'quarter' | 'year';
        
        const analytics = await getResourceAnalytics(session.user.id, timeframe);

        return NextResponse.json({
          success: true,
          data: { analytics },
        });
      }

      case 'usage': {
        const resourceId = searchParams.get('resourceId');
        
        if (!resourceId) {
          throw new AppError('Resource ID is required for usage metrics', 400);
        }

        const metrics = await getResourceUsageMetrics(resourceId, session.user.id);

        return NextResponse.json({
          success: true,
          data: { metrics },
        });
      }

      case 'network': {
        const options = {
          includeProjects: searchParams.get('includeProjects') !== 'false',
          includeAreas: searchParams.get('includeAreas') !== 'false',
          includeNotes: searchParams.get('includeNotes') !== 'false',
          maxNodes: parseInt(searchParams.get('maxNodes') || '100'),
        };

        const validatedOptions = networkAnalysisSchema.parse(options);
        const network = await analyzeReferenceNetwork(session.user.id, validatedOptions);

        return NextResponse.json({
          success: true,
          data: { network },
        });
      }

      default:
        throw new AppError('Invalid analysis type. Supported types: overview, usage, network', 400);
    }

  } catch (error) {
    console.error('Get resource analytics error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// POST - Generate custom analytics reports
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const { reportType } = body;

    switch (reportType) {
      case 'comprehensive': {
        const validatedData = analyticsSchema.parse(body);
        
        // Get comprehensive analytics
        const analytics = await getResourceAnalytics(session.user.id, validatedData.timeframe);
        
        // Get network analysis if requested
        let network = null;
        if (body.includeNetwork) {
          network = await analyzeReferenceNetwork(session.user.id, {
            maxNodes: 50, // Smaller network for comprehensive report
          });
        }

        return NextResponse.json({
          success: true,
          data: {
            analytics,
            network,
            generatedAt: new Date().toISOString(),
            timeframe: validatedData.timeframe,
          },
        });
      }

      case 'usage-summary': {
        // Get usage-focused analytics
        const analytics = await getResourceAnalytics(session.user.id, body.timeframe || 'month');
        
        // Focus on usage data
        const usageSummary = {
          overview: analytics.overview,
          usage: analytics.usage,
          topResources: analytics.usage.mostReferenced.slice(0, 10),
          underutilizedResources: analytics.usage.leastUsed.slice(0, 10),
        };

        return NextResponse.json({
          success: true,
          data: { usageSummary },
        });
      }

      case 'content-analysis': {
        // Get content-focused analytics
        const analytics = await getResourceAnalytics(session.user.id, body.timeframe || 'month');
        
        const contentAnalysis = {
          overview: {
            totalResources: analytics.overview.totalResources,
            resourcesByType: analytics.overview.resourcesByType,
          },
          content: analytics.content,
          quality: analytics.quality,
        };

        return NextResponse.json({
          success: true,
          data: { contentAnalysis },
        });
      }

      default:
        throw new AppError('Invalid report type. Supported types: comprehensive, usage-summary, content-analysis', 400);
    }

  } catch (error) {
    console.error('Generate analytics report error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
