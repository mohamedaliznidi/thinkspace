/**
 * Area Maintenance API Routes for ThinkSpace
 * 
 * This API handles automated maintenance tasks including
 * review scheduling, health monitoring, and reminder management.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';

/**
 * GET /api/areas/maintenance
 * Get maintenance overview and alerts for all areas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('includeDetails') === 'true';

    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all active areas with maintenance-relevant data
    const areas = await prisma.area.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        areaReviews: {
          select: {
            id: true,
            reviewDate: true,
            healthScore: true,
          },
          orderBy: {
            reviewDate: 'desc',
          },
          take: 1,
        },
        activities: {
          select: {
            id: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        projects: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            projects: true,
            resources: true,
            notes: true,
            subInterests: true,
          },
        },
      },
    });

    // Analyze maintenance needs
    const maintenance = {
      overview: {
        totalAreas: areas.length,
        areasNeedingAttention: 0,
        reviewsOverdue: 0,
        reviewsDueSoon: 0,
        inactiveAreas: 0,
        lowHealthAreas: 0,
      },
      alerts: {
        critical: [] as any[],
        warning: [] as any[],
        info: [] as any[],
      },
      recommendations: [] as string[],
      scheduledMaintenance: [] as any[],
    };

    areas.forEach(area => {
      const alerts: any[] = [];
      let needsAttention = false;

      // Check review status
      const isReviewOverdue = area.nextReviewDate && new Date(area.nextReviewDate) < now;
      const isReviewDueSoon = area.nextReviewDate && 
        new Date(area.nextReviewDate) >= now && 
        new Date(area.nextReviewDate) <= oneWeekFromNow;

      if (isReviewOverdue) {
        maintenance.overview.reviewsOverdue++;
        needsAttention = true;
        alerts.push({
          type: 'REVIEW_OVERDUE',
          severity: 'critical',
          message: 'Review is overdue',
          daysOverdue: Math.floor((now.getTime() - new Date(area.nextReviewDate!).getTime()) / (1000 * 60 * 60 * 24)),
        });
      } else if (isReviewDueSoon) {
        maintenance.overview.reviewsDueSoon++;
        alerts.push({
          type: 'REVIEW_DUE_SOON',
          severity: 'warning',
          message: 'Review due soon',
          daysUntilDue: Math.floor((new Date(area.nextReviewDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        });
      }

      // Check health score
      const healthScore = area.healthScore || 0;
      if (healthScore < 0.4) {
        maintenance.overview.lowHealthAreas++;
        needsAttention = true;
        alerts.push({
          type: 'LOW_HEALTH',
          severity: healthScore < 0.2 ? 'critical' : 'warning',
          message: `Low health score (${Math.round(healthScore * 100)}%)`,
          healthScore,
        });
      }

      // Check activity level
      const lastActivity = area.activities[0]?.createdAt;
      const daysSinceActivity = lastActivity 
        ? Math.floor((now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      if (!lastActivity || daysSinceActivity! > 30) {
        maintenance.overview.inactiveAreas++;
        needsAttention = true;
        alerts.push({
          type: 'INACTIVE_AREA',
          severity: daysSinceActivity! > 60 ? 'warning' : 'info',
          message: `No activity for ${daysSinceActivity || 'unknown'} days`,
          daysSinceActivity,
        });
      }

      // Check for empty areas
      const isEmpty = area._count.projects === 0 && 
                     area._count.resources === 0 && 
                     area._count.notes === 0 && 
                     area._count.subInterests === 0;

      if (isEmpty) {
        alerts.push({
          type: 'EMPTY_AREA',
          severity: 'info',
          message: 'Area has no content',
        });
      }

      // Check for stagnant projects
      const activeProjects = area.projects.filter(p => p.status === 'ACTIVE').length;
      const totalProjects = area.projects.length;
      
      if (totalProjects > 0 && activeProjects === 0) {
        alerts.push({
          type: 'NO_ACTIVE_PROJECTS',
          severity: 'info',
          message: 'No active projects',
        });
      }

      if (needsAttention) {
        maintenance.overview.areasNeedingAttention++;
      }

      // Add area alerts to maintenance alerts
      alerts.forEach(alert => {
        const areaAlert = {
          ...alert,
          areaId: area.id,
          areaTitle: area.title,
          areaColor: area.color,
          areaType: area.type,
        };

        switch (alert.severity) {
          case 'critical':
            maintenance.alerts.critical.push(areaAlert);
            break;
          case 'warning':
            maintenance.alerts.warning.push(areaAlert);
            break;
          case 'info':
            maintenance.alerts.info.push(areaAlert);
            break;
        }
      });
    });

    // Generate recommendations
    if (maintenance.overview.reviewsOverdue > 0) {
      maintenance.recommendations.push(
        `${maintenance.overview.reviewsOverdue} area${maintenance.overview.reviewsOverdue > 1 ? 's' : ''} need immediate review`
      );
    }

    if (maintenance.overview.lowHealthAreas > 0) {
      maintenance.recommendations.push(
        `Focus on improving ${maintenance.overview.lowHealthAreas} area${maintenance.overview.lowHealthAreas > 1 ? 's' : ''} with low health scores`
      );
    }

    if (maintenance.overview.inactiveAreas > 0) {
      maintenance.recommendations.push(
        `Consider reviewing or archiving ${maintenance.overview.inactiveAreas} inactive area${maintenance.overview.inactiveAreas > 1 ? 's' : ''}`
      );
    }

    // Generate scheduled maintenance tasks
    const upcomingReviews = areas
      .filter(area => area.nextReviewDate && new Date(area.nextReviewDate) <= oneWeekFromNow)
      .map(area => ({
        type: 'SCHEDULED_REVIEW',
        areaId: area.id,
        areaTitle: area.title,
        scheduledDate: area.nextReviewDate,
        priority: area.responsibilityLevel,
      }));

    maintenance.scheduledMaintenance = upcomingReviews;

    return NextResponse.json({
      success: true,
      data: { maintenance },
    });

  } catch (error) {
    console.error('Get maintenance error:', error);
    const { message, statusCode } = handleApiError(error);

    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

/**
 * POST /api/areas/maintenance/schedule
 * Schedule maintenance tasks for areas
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const body = await request.json();
    const { areaIds, taskType, scheduledDate, options } = body;

    const results = [];

    for (const areaId of areaIds) {
      // Verify area ownership
      const area = await prisma.area.findFirst({
        where: {
          id: areaId,
          userId: session.user.id,
        },
      });

      if (!area) {
        results.push({
          areaId,
          success: false,
          error: 'Area not found',
        });
        continue;
      }

      try {
        switch (taskType) {
          case 'SCHEDULE_REVIEW':
            await prisma.area.update({
              where: { id: areaId },
              data: {
                nextReviewDate: new Date(scheduledDate),
              },
            });
            break;

          case 'UPDATE_REVIEW_FREQUENCY':
            await prisma.area.update({
              where: { id: areaId },
              data: {
                reviewFrequency: options.frequency,
                nextReviewDate: calculateNextReviewDate(new Date(), options.frequency),
              },
            });
            break;

          case 'RESET_HEALTH_SCORE':
            await prisma.area.update({
              where: { id: areaId },
              data: {
                healthScore: 0.5, // Reset to neutral
              },
            });
            break;

          default:
            throw new Error(`Unknown task type: ${taskType}`);
        }

        results.push({
          areaId,
          success: true,
          message: `${taskType} completed successfully`,
        });

      } catch (error) {
        results.push({
          areaId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { results },
    });

  } catch (error) {
    console.error('Schedule maintenance error:', error);
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
function calculateNextReviewDate(currentDate: Date, frequency: string): Date {
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
    default:
      // For custom or unknown frequencies, default to monthly
      nextDate.setMonth(nextDate.getMonth() + 1);
  }

  return nextDate;
}
