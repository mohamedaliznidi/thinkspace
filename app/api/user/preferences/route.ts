/**
 * User Preferences API for ThinkSpace
 * 
 * Handles user preference storage, retrieval, and synchronization
 * across all application features.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';
import { z } from 'zod';

// Preference validation schema
const preferencesSchema = z.object({
  display: z.object({
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    colorScheme: z.enum(['default', 'colorful', 'minimal']).optional(),
    density: z.enum(['compact', 'comfortable', 'spacious']).optional(),
    fontSize: z.enum(['small', 'medium', 'large']).optional(),
    showAnimations: z.boolean().optional(),
    showTooltips: z.boolean().optional(),
  }).optional(),
  
  layout: z.object({
    sidebarCollapsed: z.boolean().optional(),
    sidebarWidth: z.number().min(200).max(500).optional(),
    showQuickActions: z.boolean().optional(),
    showRecentItems: z.boolean().optional(),
    defaultView: z.enum(['grid', 'list', 'kanban']).optional(),
    itemsPerPage: z.number().min(10).max(100).optional(),
  }).optional(),
  
  search: z.object({
    defaultSearchType: z.enum(['text', 'semantic', 'hybrid']).optional(),
    includeArchived: z.boolean().optional(),
    maxResults: z.number().min(10).max(200).optional(),
    saveSearchHistory: z.boolean().optional(),
    showSuggestions: z.boolean().optional(),
  }).optional(),
  
  notifications: z.object({
    enabled: z.boolean().optional(),
    realTimeUpdates: z.boolean().optional(),
    conflictAlerts: z.boolean().optional(),
    syncStatus: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
  }).optional(),
  
  para: z.object({
    projects: z.object({
      defaultStatus: z.string().optional(),
      defaultPriority: z.string().optional(),
      showProgress: z.boolean().optional(),
      autoArchiveCompleted: z.boolean().optional(),
      reminderSettings: z.object({
        enabled: z.boolean().optional(),
        daysBeforeDue: z.number().min(1).max(30).optional(),
      }).optional(),
    }).optional(),
    areas: z.object({
      defaultType: z.string().optional(),
      showHealthScore: z.boolean().optional(),
      autoCalculateHealth: z.boolean().optional(),
      reviewFrequency: z.enum(['weekly', 'monthly', 'quarterly']).optional(),
    }).optional(),
    resources: z.object({
      defaultType: z.string().optional(),
      autoExtractContent: z.boolean().optional(),
      showPreview: z.boolean().optional(),
      groupByType: z.boolean().optional(),
    }).optional(),
    notes: z.object({
      defaultType: z.string().optional(),
      autoSave: z.boolean().optional(),
      autoSaveInterval: z.number().min(10).max(300).optional(),
      showWordCount: z.boolean().optional(),
      enableMarkdown: z.boolean().optional(),
    }).optional(),
  }).optional(),
  
  sync: z.object({
    enabled: z.boolean().optional(),
    optimisticUpdates: z.boolean().optional(),
    conflictResolution: z.enum(['manual', 'server_wins', 'client_wins']).optional(),
    offlineMode: z.boolean().optional(),
    syncInterval: z.number().min(10).max(300).optional(),
  }).optional(),
  
  privacy: z.object({
    shareUsageData: z.boolean().optional(),
    enableAnalytics: z.boolean().optional(),
    dataRetention: z.enum(['30days', '90days', '1year', 'forever']).optional(),
  }).optional(),
  
  accessibility: z.object({
    highContrast: z.boolean().optional(),
    reducedMotion: z.boolean().optional(),
    screenReaderOptimized: z.boolean().optional(),
    keyboardNavigation: z.boolean().optional(),
    focusIndicators: z.boolean().optional(),
  }).optional(),
  
  advanced: z.object({
    enableBetaFeatures: z.boolean().optional(),
    debugMode: z.boolean().optional(),
    performanceMode: z.boolean().optional(),
    customCSS: z.string().optional(),
  }).optional(),
});

// GET - Retrieve user preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    // Get user preferences from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        preferences: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return NextResponse.json({
      success: true,
      data: user.preferences || {},
      lastUpdated: user.updatedAt.toISOString(),
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// PUT - Update user preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    
    // Validate preferences
    const validatedPreferences = preferencesSchema.parse(body);

    // Get current preferences
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferences: true },
    });

    // Merge with existing preferences
    const updatedPreferences = {
      ...(currentUser?.preferences as Record<string, any> || {}),
      ...validatedPreferences,
    };

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        preferences: updatedPreferences,
        updatedAt: new Date(),
      },
      select: {
        preferences: true,
        updatedAt: true,
      },
    });

    // Log preference update for analytics (if enabled)
    if (updatedPreferences.privacy?.enableAnalytics) {
      await logPreferenceUpdate(session.user.id, validatedPreferences);
    }

    return NextResponse.json({
      success: true,
      data: updatedUser.preferences,
      lastUpdated: updatedUser.updatedAt.toISOString(),
      message: 'Preferences updated successfully',
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// PATCH - Partially update user preferences
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const { category, updates } = body;

    if (!category || !updates) {
      throw new AppError('Category and updates are required', 400);
    }

    // Get current preferences
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferences: true },
    });

    const currentPreferences = (currentUser?.preferences as Record<string, any>) || {};

    // Update specific category
    const updatedPreferences = {
      ...currentPreferences,
      [category]: {
        ...(currentPreferences[category] as Record<string, any> || {}),
        ...updates,
      },
    };

    // Validate the updated preferences
    preferencesSchema.parse(updatedPreferences);

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        preferences: updatedPreferences,
        updatedAt: new Date(),
      },
      select: {
        preferences: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser.preferences,
      lastUpdated: updatedUser.updatedAt.toISOString(),
      message: `${category} preferences updated successfully`,
    });

  } catch (error) {
    console.error('Patch preferences error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// DELETE - Reset preferences to defaults
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (category) {
      // Reset specific category
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { preferences: true },
      });

      const currentPreferences = (currentUser?.preferences as Record<string, any>) || {};
      const updatedPreferences = { ...currentPreferences };
      delete (updatedPreferences as any)[category];

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          preferences: updatedPreferences,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `${category} preferences reset to defaults`,
      });
    } else {
      // Reset all preferences
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          preferences: {},
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'All preferences reset to defaults',
      });
    }

  } catch (error) {
    console.error('Delete preferences error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// Helper function to log preference updates
async function logPreferenceUpdate(userId: string, updates: any): Promise<void> {
  try {
    // In a real implementation, you might want to store preference change logs
    // For now, we'll just log to console
    console.log('Preference update:', {
      userId,
      updates,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log preference update:', error);
  }
}
