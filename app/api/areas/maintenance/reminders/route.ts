/**
 * Area Review Reminders API Routes for ThinkSpace
 * 
 * This API handles automated reminder generation and management
 * for area reviews and maintenance tasks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';

/**
 * GET /api/areas/maintenance/reminders
 * Get active reminders for area reviews and maintenance
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'all', 'overdue', 'due_soon', 'scheduled'
    const limit = parseInt(searchParams.get('limit') || '50');

    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Build where clause based on type
    let whereClause: any = {
      userId: session.user.id,
      isActive: true,
    };

    switch (type) {
      case 'overdue':
        whereClause.nextReviewDate = {
          lt: now,
        };
        break;
      case 'due_soon':
        whereClause.nextReviewDate = {
          gte: now,
          lte: oneWeekFromNow,
        };
        break;
      case 'scheduled':
        whereClause.nextReviewDate = {
          gte: now,
          lte: twoWeeksFromNow,
        };
        break;
      default:
        // For 'all', include areas with review dates or those that need attention
        whereClause.OR = [
          {
            nextReviewDate: {
              lte: twoWeeksFromNow,
            },
          },
          {
            healthScore: {
              lt: 0.4,
            },
          },
          {
            lastReviewedAt: {
              lt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
            },
          },
        ];
    }

    const areas = await prisma.area.findMany({
      where: whereClause,
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
      },
      orderBy: [
        { nextReviewDate: 'asc' },
        { healthScore: 'asc' },
      ],
      take: limit,
    });

    // Generate reminders
    const reminders = areas.map(area => {
      const reminder: any = {
        id: `reminder_${area.id}`,
        areaId: area.id,
        areaTitle: area.title,
        areaColor: area.color,
        areaType: area.type,
        responsibilityLevel: area.responsibilityLevel,
        reviewFrequency: area.reviewFrequency,
        healthScore: area.healthScore,
        lastReviewDate: area.lastReviewedAt,
        nextReviewDate: area.nextReviewDate,
        lastActivity: area.activities[0]?.createdAt,
      };

      // Determine reminder type and urgency
      if (area.nextReviewDate) {
        const daysUntilReview = Math.floor(
          (new Date(area.nextReviewDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilReview < 0) {
          reminder.type = 'OVERDUE';
          reminder.urgency = 'HIGH';
          reminder.message = `Review is ${Math.abs(daysUntilReview)} day${Math.abs(daysUntilReview) !== 1 ? 's' : ''} overdue`;
          reminder.daysOverdue = Math.abs(daysUntilReview);
        } else if (daysUntilReview <= 3) {
          reminder.type = 'DUE_SOON';
          reminder.urgency = 'MEDIUM';
          reminder.message = `Review due in ${daysUntilReview} day${daysUntilReview !== 1 ? 's' : ''}`;
          reminder.daysUntilDue = daysUntilReview;
        } else if (daysUntilReview <= 7) {
          reminder.type = 'UPCOMING';
          reminder.urgency = 'LOW';
          reminder.message = `Review scheduled in ${daysUntilReview} day${daysUntilReview !== 1 ? 's' : ''}`;
          reminder.daysUntilDue = daysUntilReview;
        } else {
          reminder.type = 'SCHEDULED';
          reminder.urgency = 'LOW';
          reminder.message = `Next review scheduled`;
          reminder.daysUntilDue = daysUntilReview;
        }
      } else {
        reminder.type = 'NO_SCHEDULE';
        reminder.urgency = 'MEDIUM';
        reminder.message = 'No review scheduled';
      }

      // Add health-based urgency
      if (area.healthScore && area.healthScore < 0.3) {
        reminder.urgency = 'HIGH';
        reminder.healthAlert = true;
      } else if (area.healthScore && area.healthScore < 0.5) {
        if (reminder.urgency === 'LOW') reminder.urgency = 'MEDIUM';
        reminder.healthAlert = true;
      }

      // Add activity-based alerts
      if (area.activities[0]) {
        const daysSinceActivity = Math.floor(
          (now.getTime() - new Date(area.activities[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceActivity > 30) {
          reminder.inactivityAlert = true;
          reminder.daysSinceActivity = daysSinceActivity;
          if (reminder.urgency === 'LOW') reminder.urgency = 'MEDIUM';
        }
      } else {
        reminder.inactivityAlert = true;
        reminder.daysSinceActivity = null;
        if (reminder.urgency === 'LOW') reminder.urgency = 'MEDIUM';
      }

      return reminder;
    });

    // Group reminders by urgency
    const groupedReminders = {
      high: reminders.filter(r => r.urgency === 'HIGH'),
      medium: reminders.filter(r => r.urgency === 'MEDIUM'),
      low: reminders.filter(r => r.urgency === 'LOW'),
    };

    const summary = {
      total: reminders.length,
      overdue: reminders.filter(r => r.type === 'OVERDUE').length,
      dueSoon: reminders.filter(r => r.type === 'DUE_SOON').length,
      upcoming: reminders.filter(r => r.type === 'UPCOMING').length,
      noSchedule: reminders.filter(r => r.type === 'NO_SCHEDULE').length,
      healthAlerts: reminders.filter(r => r.healthAlert).length,
      inactivityAlerts: reminders.filter(r => r.inactivityAlert).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        reminders: groupedReminders,
        summary,
        allReminders: reminders,
      },
    });

  } catch (error) {
    console.error('Get reminders error:', error);
    const { message, statusCode } = handleApiError(error);

    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

/**
 * POST /api/areas/maintenance/reminders/dismiss
 * Dismiss or snooze reminders
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const body = await request.json();
    const { areaId, action, snoozeUntil } = body;

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

    let updateData: any = {};

    switch (action) {
      case 'dismiss':
        // Mark as reviewed to dismiss reminder temporarily
        updateData.lastReviewedAt = new Date();
        break;

      case 'snooze':
        if (snoozeUntil) {
          updateData.nextReviewDate = new Date(snoozeUntil);
        } else {
          // Default snooze for 1 week
          updateData.nextReviewDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
        break;

      case 'schedule_review':
        // Schedule a review for next week
        updateData.nextReviewDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        break;

      default:
        throw new AppError('Invalid action', 400);
    }

    await prisma.area.update({
      where: { id: areaId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Reminder ${action}ed successfully`,
    });

  } catch (error) {
    console.error('Dismiss reminder error:', error);
    const { message, statusCode } = handleApiError(error);

    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

/**
 * POST /api/areas/maintenance/reminders/bulk
 * Bulk operations on reminders
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const body = await request.json();
    const { areaIds, action, options } = body;

    const results = [];

    for (const areaId of areaIds) {
      try {
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

        let updateData: any = {};

        switch (action) {
          case 'schedule_all':
            updateData.nextReviewDate = new Date(options.reviewDate);
            break;

          case 'update_frequency':
            updateData.reviewFrequency = options.frequency;
            updateData.nextReviewDate = calculateNextReviewDate(new Date(), options.frequency);
            break;

          case 'dismiss_all':
            updateData.lastReviewedAt = new Date();
            break;

          default:
            throw new Error(`Unknown action: ${action}`);
        }

        await prisma.area.update({
          where: { id: areaId },
          data: updateData,
        });

        results.push({
          areaId,
          success: true,
          message: `${action} completed`,
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
    console.error('Bulk reminder action error:', error);
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
      nextDate.setMonth(nextDate.getMonth() + 1);
  }

  return nextDate;
}
