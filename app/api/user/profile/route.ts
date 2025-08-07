/**
 * User Profile API Route for ThinkSpace
 * 
 * This API endpoint handles user profile operations including
 * fetching, updating user information, preferences, and settings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';

// Profile update validation schema
const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .trim()
    .optional(),
  avatar: z.string()
    .url('Invalid avatar URL')
    .optional()
    .nullable(),
  timezone: z.string()
    .optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    notifications: z.boolean().optional(),
    autoSave: z.boolean().optional(),
    defaultView: z.enum(['dashboard', 'projects', 'areas', 'resources', 'notes']).optional(),
    sidebarCollapsed: z.boolean().optional(),
    language: z.string().optional(),
  }).optional(),
  settings: z.object({
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    weeklyDigest: z.boolean().optional(),
    monthlyReport: z.boolean().optional(),
    shareAnalytics: z.boolean().optional(),
    publicProfile: z.boolean().optional(),
    twoFactorEnabled: z.boolean().optional(),
  }).optional(),
});

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 'UNAUTHORIZED', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        timezone: true,
        preferences: true,
        settings: true,
        createdAt: true,
        lastLoginAt: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    return NextResponse.json({
      success: true,
      data: { user },
    });

  } catch (error) {
    console.error('Get profile error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 'UNAUTHORIZED', 401);
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.bio !== undefined && { bio: validatedData.bio }),
        ...(validatedData.avatar !== undefined && { avatar: validatedData.avatar }),
        ...(validatedData.timezone && { timezone: validatedData.timezone }),
        ...(validatedData.preferences && { preferences: validatedData.preferences }),
        ...(validatedData.settings && { settings: validatedData.settings }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        timezone: true,
        preferences: true,
        settings: true,
        updatedAt: true,
      },
    });

    // Log the profile update
    console.log(`Profile updated for user: ${updatedUser.email}`);

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
      message: 'Profile updated successfully',
    });

  } catch (error) {
    console.error('Update profile error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.reduce((acc, err) => {
        const field = err.path.join('.');
        acc[field] = err.message;
        return acc;
      }, {} as Record<string, string>);

      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: fieldErrors,
      }, { status: 400 });
    }

    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// DELETE - Deactivate user account
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 'UNAUTHORIZED', 401);
    }

    // Deactivate user account instead of deleting
    await prisma.user.update({
      where: { id: session.user.id },
      data: { isActive: false },
    });

    // Log the account deactivation
    console.log(`Account deactivated for user: ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Account deactivated successfully',
    });

  } catch (error) {
    console.error('Delete profile error:', error);
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
