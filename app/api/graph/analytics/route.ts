/**
 * Graph Analytics API Route for ThinkSpace
 * 
 * This API provides analytics and metrics for the knowledge graph
 * including centrality measures, community detection, and influence analysis.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';

// GET - Get graph analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const userId = session.user.id;

    // Get basic counts
    const [projectCount, areaCount, resourceCount, noteCount] = await Promise.all([
      prisma.project.count({ where: { userId } }),
      prisma.area.count({ where: { userId } }),
      prisma.resource.count({ where: { userId } }),
      prisma.note.count({ where: { userId } }),
    ]);

    // Get relationship counts
    const [
      projectAreaConnections,
      resourceProjectConnections,
      resourceAreaConnections,
      noteProjectConnections,
      noteAreaConnections,
      noteResourceConnections,
    ] = await Promise.all([
      prisma.project.count({ where: { userId, areaId: { not: null } } }),
      prisma.resource.count({ where: { userId, projectId: { not: null } } }),
      prisma.resource.count({ where: { userId, areaId: { not: null } } }),
      prisma.note.count({ where: { userId, projectId: { not: null } } }),
      prisma.note.count({ where: { userId, areaId: { not: null } } }),
      prisma.note.count({ where: { userId, resourceId: { not: null } } }),
    ]);

    // Calculate connectivity metrics
    const totalNodes = projectCount + areaCount + resourceCount + noteCount;
    const totalEdges = projectAreaConnections + resourceProjectConnections + 
                      resourceAreaConnections + noteProjectConnections + 
                      noteAreaConnections + noteResourceConnections;

    const density = totalNodes > 1 ? (2 * totalEdges) / (totalNodes * (totalNodes - 1)) : 0;

    // Get most connected nodes
    const mostConnectedAreas = await prisma.area.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            projects: true,
            resources: true,
            notes: true,
          },
        },
      },
      orderBy: {
        projects: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    const mostConnectedProjects = await prisma.project.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            resources: true,
            notes: true,
          },
        },
      },
      orderBy: {
        resources: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    // Calculate node centrality (simplified)
    const nodeCentrality = [
      ...mostConnectedAreas.map(area => ({
        id: area.id,
        title: area.title,
        type: 'area',
        connections: area._count.projects + area._count.resources + area._count.notes,
        centrality: (area._count.projects + area._count.resources + area._count.notes) / totalNodes,
      })),
      ...mostConnectedProjects.map(project => ({
        id: project.id,
        title: project.title,
        type: 'project',
        connections: project._count.resources + project._count.notes,
        centrality: (project._count.resources + project._count.notes) / totalNodes,
      })),
    ].sort((a, b) => b.centrality - a.centrality).slice(0, 10);

    // Get activity over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activityData = await Promise.all([
      prisma.project.groupBy({
        by: ['createdAt'],
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo },
        },
        _count: { id: true },
      }),
      prisma.area.groupBy({
        by: ['createdAt'],
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo },
        },
        _count: { id: true },
      }),
      prisma.resource.groupBy({
        by: ['createdAt'],
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo },
        },
        _count: { id: true },
      }),
      prisma.note.groupBy({
        by: ['createdAt'],
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo },
        },
        _count: { id: true },
      }),
    ]);

    // Get status distribution for projects
    const projectStatusDistribution = await prisma.project.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true },
    });

    // Get type distribution for areas
    const areaTypeDistribution = await prisma.area.groupBy({
      by: ['type'],
      where: { userId },
      _count: { id: true },
    });

    const analytics = {
      overview: {
        totalNodes,
        totalEdges,
        density: Math.round(density * 100) / 100,
        avgConnectionsPerNode: totalNodes > 0 ? Math.round((totalEdges * 2) / totalNodes * 100) / 100 : 0,
      },
      nodeDistribution: {
        projects: projectCount,
        areas: areaCount,
        resources: resourceCount,
        notes: noteCount,
      },
      connectionTypes: {
        projectAreaConnections,
        resourceProjectConnections,
        resourceAreaConnections,
        noteProjectConnections,
        noteAreaConnections,
        noteResourceConnections,
      },
      centrality: nodeCentrality,
      distributions: {
        projectStatus: projectStatusDistribution.map(item => ({
          status: item.status,
          count: item._count.id,
        })),
        areaTypes: areaTypeDistribution.map(item => ({
          type: item.type,
          count: item._count.id,
        })),
      },
      trends: {
        // Simplified activity trends
        recentActivity: {
          projects: activityData[0].length,
          areas: activityData[1].length,
          resources: activityData[2].length,
          notes: activityData[3].length,
        },
      },
    };

    return NextResponse.json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    console.error('Get graph analytics error:', error);
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
