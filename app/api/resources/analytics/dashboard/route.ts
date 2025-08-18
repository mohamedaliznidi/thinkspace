/**
 * Resource Analytics Dashboard API Route
 * 
 * Provides optimized analytics data specifically for dashboard display
 * with performance optimizations and caching considerations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getResourceAnalytics } from '@/lib/resource-analytics';
import { AppError, handleApiError } from '@/lib/utils';

// GET - Get dashboard analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get('timeframe') || 'month') as 'week' | 'month' | 'quarter' | 'year';
    const includeCharts = searchParams.get('includeCharts') !== 'false';
    const includeRecommendations = searchParams.get('includeRecommendations') !== 'false';

    // Get basic analytics
    const analytics = await getResourceAnalytics(session.user.id, timeframe);

    // Get additional dashboard-specific data
    const dashboardData: any = {
      analytics,
      summary: {
        totalResources: analytics.overview.totalResources,
        recentActivity: analytics.overview.recentActivity,
        mostReferencedCount: analytics.usage.mostReferenced.length > 0 
          ? analytics.usage.mostReferenced[0]._count?.referencedBy || 0 
          : 0,
        averageQuality: analytics.quality.averageSummaryQuality,
      },
    };

    // Add chart data if requested
    if (includeCharts) {
      dashboardData.charts = {
        resourcesByType: analytics.overview.resourcesByType.map(item => ({
          name: item.type,
          value: item.count,
          percentage: item.percentage,
        })),
        topicDistribution: analytics.content.topicDistribution.slice(0, 10),
        usageTrends: analytics.usage.usageTrends.slice(-30), // Last 30 data points
        qualityDistribution: await getQualityDistribution(session.user.id),
      };
    }

    // Add recommendations if requested
    if (includeRecommendations) {
      dashboardData.recommendations = await getDashboardRecommendations(session.user.id);
    }

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });

  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

/**
 * Get quality score distribution for charts
 */
async function getQualityDistribution(userId: string) {
  try {
    const summaries = await prisma.resourceSummary.findMany({
      where: {
        userId,
        qualityScore: { not: null },
      },
      select: {
        qualityScore: true,
      },
    });

    // Group by quality ranges
    const ranges = {
      'Excellent (0.8-1.0)': 0,
      'Good (0.6-0.8)': 0,
      'Fair (0.4-0.6)': 0,
      'Poor (0.0-0.4)': 0,
    };

    summaries.forEach(summary => {
      const score = summary.qualityScore || 0;
      if (score >= 0.8) ranges['Excellent (0.8-1.0)']++;
      else if (score >= 0.6) ranges['Good (0.6-0.8)']++;
      else if (score >= 0.4) ranges['Fair (0.4-0.6)']++;
      else ranges['Poor (0.0-0.4)']++;
    });

    return Object.entries(ranges).map(([name, value]) => ({ name, value }));
  } catch (error) {
    console.error('Error getting quality distribution:', error);
    return [];
  }
}

/**
 * Get dashboard recommendations
 */
async function getDashboardRecommendations(userId: string) {
  try {
    const recommendations = [];

    // Check for resources without summaries
    const resourcesWithoutSummaries = await prisma.resource.count({
      where: {
        userId,
        summaries: { none: {} },
        contentExtract: { not: null },
      },
    });

    if (resourcesWithoutSummaries > 0) {
      recommendations.push({
        type: 'action',
        priority: 'medium',
        title: 'Generate Missing Summaries',
        description: `${resourcesWithoutSummaries} resources could benefit from AI-generated summaries`,
        action: 'generate_summaries',
        count: resourcesWithoutSummaries,
      });
    }

    // Check for unused resources
    const unusedResources = await prisma.resource.count({
      where: {
        userId,
        referencedBy: { none: {} },
        references: { none: {} },
        createdAt: {
          lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Older than 60 days
        },
      },
    });

    if (unusedResources > 0) {
      recommendations.push({
        type: 'cleanup',
        priority: 'low',
        title: 'Review Unused Resources',
        description: `${unusedResources} resources haven't been referenced recently`,
        action: 'review_unused',
        count: unusedResources,
      });
    }

    // Check for resources without folders
    const unorganizedResources = await prisma.resource.count({
      where: {
        userId,
        folderId: null,
      },
    });

    if (unorganizedResources > 5) {
      recommendations.push({
        type: 'organization',
        priority: 'medium',
        title: 'Organize Resources',
        description: `${unorganizedResources} resources are not organized in folders`,
        action: 'organize_resources',
        count: unorganizedResources,
      });
    }

    // Check for low-quality summaries
    const lowQualitySummaries = await prisma.resourceSummary.count({
      where: {
        userId,
        qualityScore: { lt: 0.6 },
      },
    });

    if (lowQualitySummaries > 0) {
      recommendations.push({
        type: 'quality',
        priority: 'medium',
        title: 'Improve Summary Quality',
        description: `${lowQualitySummaries} summaries have low quality scores`,
        action: 'improve_summaries',
        count: lowQualitySummaries,
      });
    }

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 } as const;
    recommendations.sort((a, b) => priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]);

    return recommendations.slice(0, 5); // Return top 5 recommendations
  } catch (error) {
    console.error('Error getting dashboard recommendations:', error);
    return [];
  }
}
