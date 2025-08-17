/**
 * Areas Dashboard Analytics API Routes for ThinkSpace
 * 
 * This API provides dashboard-level analytics across all areas
 * including health overview, maintenance alerts, and trends.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';

/**
 * GET /api/areas/analytics/dashboard
 * Get dashboard analytics across all user areas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '3months';

    // Calculate period dates
    const now = new Date();
    const periodStart = new Date();
    switch (period) {
      case '1month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        periodStart.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        periodStart.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get all areas with comprehensive data
    const areas = await prisma.area.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        projects: {
          select: {
            id: true,
            status: true,
            priority: true,
            progress: true,
            createdAt: true,
            completedAt: true,
          },
        },
        resources: {
          select: {
            id: true,
            createdAt: true,
          },
        },
        notes: {
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        subInterests: {
          select: {
            id: true,
            createdAt: true,
            level: true,
          },
        },
        areaReviews: {
          select: {
            id: true,
            reviewDate: true,
            healthScore: true,
          },
          where: {
            reviewDate: {
              gte: periodStart,
            },
          },
          orderBy: {
            reviewDate: 'desc',
          },
        },
        activities: {
          select: {
            id: true,
            type: true,
            createdAt: true,
            metadata: true,
          },
          where: {
            createdAt: {
              gte: periodStart,
            },
          },
        },
      },
    });

    // Calculate dashboard analytics
    const analytics = {
      // Overview metrics
      overview: {
        totalAreas: areas.length,
        averageHealthScore: areas.length > 0 
          ? areas.reduce((sum, area) => sum + (area.healthScore || 0), 0) / areas.length
          : 0,
        totalProjects: areas.reduce((sum, area) => sum + area.projects.length, 0),
        activeProjects: areas.reduce((sum, area) => 
          sum + area.projects.filter(p => p.status === 'ACTIVE').length, 0),
        totalResources: areas.reduce((sum, area) => sum + area.resources.length, 0),
        totalNotes: areas.reduce((sum, area) => sum + area.notes.length, 0),
        totalSubInterests: areas.reduce((sum, area) => sum + area.subInterests.length, 0),
      },

      // Health distribution
      healthDistribution: areas.reduce((acc, area) => {
        const score = area.healthScore || 0;
        let category: string;
        
        if (score >= 0.8) category = 'excellent';
        else if (score >= 0.6) category = 'good';
        else if (score >= 0.4) category = 'fair';
        else if (score >= 0.2) category = 'poor';
        else category = 'critical';
        
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),

      // Area type distribution
      typeDistribution: areas.reduce((acc, area) => {
        acc[area.type] = (acc[area.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),

      // Responsibility level distribution
      responsibilityDistribution: areas.reduce((acc, area) => {
        acc[area.responsibilityLevel] = (acc[area.responsibilityLevel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),

      // Review frequency distribution
      reviewFrequencyDistribution: areas.reduce((acc, area) => {
        acc[area.reviewFrequency] = (acc[area.reviewFrequency] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),

      // Maintenance alerts
      maintenanceAlerts: {
        reviewsOverdue: areas.filter(area => 
          area.nextReviewDate && new Date(area.nextReviewDate) < now
        ).map(area => ({
          id: area.id,
          title: area.title,
          color: area.color,
          daysOverdue: Math.floor((now.getTime() - new Date(area.nextReviewDate!).getTime()) / (1000 * 60 * 60 * 24)),
          lastReviewDate: area.lastReviewedAt,
        })),
        
        reviewsDueSoon: areas.filter(area => {
          if (!area.nextReviewDate) return false;
          const daysUntilDue = Math.floor((new Date(area.nextReviewDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilDue >= 0 && daysUntilDue <= 7;
        }).map(area => ({
          id: area.id,
          title: area.title,
          color: area.color,
          daysUntilDue: Math.floor((new Date(area.nextReviewDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          lastReviewDate: area.lastReviewedAt,
        })),

        lowHealthAreas: areas.filter(area => 
          (area.healthScore || 0) < 0.4
        ).map(area => ({
          id: area.id,
          title: area.title,
          color: area.color,
          healthScore: area.healthScore || 0,
          lastReviewDate: area.lastReviewedAt,
        })),

        inactiveAreas: areas.filter(area => {
          const daysSinceActivity = area.activities.length > 0 
            ? Math.floor((now.getTime() - new Date(area.activities[0].createdAt).getTime()) / (1000 * 60 * 60 * 24))
            : null;
          return daysSinceActivity === null || daysSinceActivity > 30;
        }).map(area => ({
          id: area.id,
          title: area.title,
          color: area.color,
          daysSinceActivity: area.activities.length > 0 
            ? Math.floor((now.getTime() - new Date(area.activities[0].createdAt).getTime()) / (1000 * 60 * 60 * 24))
            : null,
        })),
      },

      // Growth trends
      growthTrends: {
        areasCreated: areas.filter(area => 
          new Date(area.createdAt) >= periodStart
        ).length,
        
        projectsCreated: areas.reduce((sum, area) => 
          sum + area.projects.filter(p => new Date(p.createdAt) >= periodStart).length, 0),
        
        projectsCompleted: areas.reduce((sum, area) => 
          sum + area.projects.filter(p => p.completedAt && new Date(p.completedAt) >= periodStart).length, 0),
        
        resourcesAdded: areas.reduce((sum, area) => 
          sum + area.resources.filter(r => new Date(r.createdAt) >= periodStart).length, 0),
        
        notesCreated: areas.reduce((sum, area) => 
          sum + area.notes.filter(n => new Date(n.createdAt) >= periodStart).length, 0),
        
        subInterestsCreated: areas.reduce((sum, area) => 
          sum + area.subInterests.filter(si => new Date(si.createdAt) >= periodStart).length, 0),
      },

      // Activity trends
      activityTrends: {
        totalActivities: areas.reduce((sum, area) => sum + area.activities.length, 0),
        activityTypes: areas.reduce((acc, area) => {
          area.activities.forEach(activity => {
            acc[activity.type] = (acc[activity.type] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>),
        
        // Weekly activity distribution
        weeklyActivity: generateWeeklyActivityData(areas, periodStart, now),
      },

      // Top performing areas
      topPerformingAreas: areas
        .filter(area => area.healthScore !== null)
        .sort((a, b) => (b.healthScore || 0) - (a.healthScore || 0))
        .slice(0, 5)
        .map(area => ({
          id: area.id,
          title: area.title,
          color: area.color,
          type: area.type,
          healthScore: area.healthScore || 0,
          projectCount: area.projects.length,
          lastReviewDate: area.lastReviewedAt,
        })),

      // Areas needing attention
      areasNeedingAttention: areas
        .filter(area => {
          const healthScore = area.healthScore || 0;
          const isOverdue = area.nextReviewDate && new Date(area.nextReviewDate) < now;
          const hasLowActivity = area.activities.length === 0 || 
            Math.floor((now.getTime() - new Date(area.activities[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)) > 14;
          
          return healthScore < 0.6 || isOverdue || hasLowActivity;
        })
        .sort((a, b) => (a.healthScore || 0) - (b.healthScore || 0))
        .slice(0, 5)
        .map(area => ({
          id: area.id,
          title: area.title,
          color: area.color,
          type: area.type,
          healthScore: area.healthScore || 0,
          issues: [
            ...(area.healthScore && area.healthScore < 0.6 ? ['Low health score'] : []),
            ...(area.nextReviewDate && new Date(area.nextReviewDate) < now ? ['Review overdue'] : []),
            ...(area.activities.length === 0 || 
                Math.floor((now.getTime() - new Date(area.activities[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)) > 14 
                ? ['Low activity'] : []),
          ],
          lastReviewDate: area.lastReviewedAt,
        })),
    };

    return NextResponse.json({
      success: true,
      data: { analytics },
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    const { message, statusCode } = handleApiError(error);

    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

/**
 * Generate weekly activity data for trends
 */
function generateWeeklyActivityData(areas: any[], periodStart: Date, now: Date): Array<{ week: string; count: number }> {
  const weeks: Array<{ week: string; count: number }> = [];
  const currentDate = new Date(periodStart);
  
  while (currentDate <= now) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekActivities = areas.reduce((sum, area) => {
      return sum + area.activities.filter((activity: any) => {
        const activityDate = new Date(activity.createdAt);
        return activityDate >= weekStart && activityDate <= weekEnd;
      }).length;
    }, 0);
    
    weeks.push({
      week: weekStart.toISOString().split('T')[0],
      count: weekActivities,
    });
    
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return weeks;
}
