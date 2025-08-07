/**
 * Dashboard Stats API Route for ThinkSpace
 * 
 * This API provides statistics and metrics for the dashboard
 * including PARA methodology counts and activity summaries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';

// GET - Fetch dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const userId = session.user.id;

    // Get all statistics in parallel
    const [
      projectStats,
      areaStats,
      resourceStats,
      noteStats,
      chatStats,
    ] = await Promise.all([
      // Project statistics
      prisma.project.groupBy({
        by: ['status'],
        where: { userId },
        _count: { id: true },
      }),
      
      // Area statistics
      prisma.area.groupBy({
        by: ['isActive'],
        where: { userId },
        _count: { id: true },
      }),
      
      // Resource statistics
      prisma.resource.aggregate({
        where: { userId },
        _count: { id: true },
      }),
      
      // Note statistics
      prisma.note.aggregate({
        where: { userId },
        _count: { id: true },
      }),
      
      // Chat statistics
      prisma.chat.aggregate({
        where: { userId },
        _count: { id: true },
      }),
    ]);

    // Process project statistics
    const projects = {
      total: projectStats.reduce((sum, stat) => sum + stat._count.id, 0),
      active: projectStats.find(s => s.status === 'ACTIVE')?._count.id || 0,
      completed: projectStats.find(s => s.status === 'COMPLETED')?._count.id || 0,
      overdue: 0, // Would need to calculate based on due dates
    };

    // Process area statistics
    const areas = {
      total: areaStats.reduce((sum, stat) => sum + stat._count.id, 0),
      active: areaStats.find(s => s.isActive === true)?._count.id || 0,
    };

    // Get recent counts (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [recentResources, recentNotes] = await Promise.all([
      prisma.resource.count({
        where: {
          userId,
          createdAt: { gte: weekAgo },
        },
      }),
      prisma.note.count({
        where: {
          userId,
          createdAt: { gte: weekAgo },
        },
      }),
    ]);

    // Calculate overdue projects
    const overdueProjects = await prisma.project.count({
      where: {
        userId,
        status: 'ACTIVE',
        dueDate: { lt: new Date() },
      },
    });

    projects.overdue = overdueProjects;

    // Get connection count (this would be from Neo4j in a real implementation)
    const connections = 0; // Placeholder

    const stats = {
      projects,
      areas,
      resources: {
        total: resourceStats._count.id,
        recent: recentResources,
      },
      notes: {
        total: noteStats._count.id,
        recent: recentNotes,
      },
      chats: {
        total: chatStats._count.id,
        active: chatStats._count.id, // Simplified
      },
      connections,
    };

    return NextResponse.json({
      success: true,
      data: { stats },
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
  }, { status: 405 });
}
