/**
 * Navigation Stats API Route for ThinkSpace
 * 
 * This API provides statistics for the navigation sidebar
 * including counts for each PARA methodology section.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';

// GET - Fetch navigation statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const userId = session.user.id;

    // Get all counts in parallel
    const [
      projectCount,
      areaCount,
      resourceCount,
      noteCount,
      chatCount,
      archivedCount,
    ] = await Promise.all([
      prisma.project.count({
        where: { 
          userId,
          status: { not: 'CANCELLED' }
        },
      }),
      
      prisma.area.count({
        where: { 
          userId,
          isActive: true
        },
      }),
      
      prisma.resource.count({
        where: { userId },
      }),
      
      prisma.note.count({
        where: { userId },
      }),
      
      prisma.chat.count({
        where: { userId },
      }),
      
      // Count archived items (completed/cancelled projects + inactive areas)
      Promise.all([
        prisma.project.count({
          where: { 
            userId,
            OR: [
              { status: 'COMPLETED' },
              { status: 'CANCELLED' }
            ]
          },
        }),
        prisma.area.count({
          where: { 
            userId,
            isActive: false
          },
        }),
      ]).then(([archivedProjects, inactiveAreas]) => archivedProjects + inactiveAreas),
    ]);

    const stats = {
      projects: projectCount,
      areas: areaCount,
      resources: resourceCount,
      notes: noteCount,
      chats: chatCount,
      archived: archivedCount,
    };

    return NextResponse.json({
      success: true,
      data: { stats },
    });

  } catch (error) {
    console.error('Get navigation stats error:', error);
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
