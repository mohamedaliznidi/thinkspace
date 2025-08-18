/**
 * Resource Summaries API Routes
 * 
 * Handles CRUD operations for resource summaries including
 * automatic generation, quality rating, and approval workflow.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { 
  generateResourceSummary, 
  regenerateSummary,
  updateSummaryQuality,
  analyzeResourceContent
} from '@/lib/summarization';
import { AppError, handleApiError } from '@/lib/utils';
import type { SummaryGenerationOptions } from '@/types/resources';

// Validation schemas
const createSummarySchema = z.object({
  type: z.enum(['GENERAL', 'TECHNICAL', 'EXECUTIVE', 'BRIEF', 'DETAILED', 'LAYMAN']).default('GENERAL'),
  length: z.enum(['SHORT', 'MEDIUM', 'LONG', 'CUSTOM']).default('MEDIUM'),
  tone: z.enum(['professional', 'casual', 'academic', 'technical']).optional(),
  audience: z.enum(['general', 'expert', 'beginner']).optional(),
  focus: z.array(z.string()).optional(),
  customPrompt: z.string().optional(),
});

const updateSummarySchema = z.object({
  content: z.string().optional(),
  qualityScore: z.number().min(0).max(1).optional(),
  isApproved: z.boolean().optional(),
  feedback: z.string().optional(),
});

// GET - List summaries for a resource
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { id: resourceId } = await params;

    // Verify resource ownership
    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        userId: session.user.id,
      },
    });

    if (!resource) {
      throw new AppError('Resource not found', 404);
    }

    // Get summaries for the resource
    const summaries = await prisma.resourceSummary.findMany({
      where: {
        resourceId,
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: { summaries },
    });

  } catch (error) {
    console.error('Get resource summaries error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// POST - Create new summary for resource
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { id: resourceId } = await params;
    const body = await request.json();
    
    // Validate request body
    const validatedData = createSummarySchema.parse(body);

    // Verify resource ownership and get content
    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        userId: session.user.id,
      },
    });

    if (!resource) {
      throw new AppError('Resource not found', 404);
    }

    // Check if resource has content to summarize
    const content = resource.contentExtract || resource.description;
    if (!content || content.trim().length < 50) {
      throw new AppError('Resource must have sufficient content to summarize', 400);
    }

    // Prepare summarization options
    const options: SummaryGenerationOptions = {
      type: validatedData.type,
      length: validatedData.length,
      tone: validatedData.tone,
      audience: validatedData.audience,
      focus: validatedData.focus,
      customPrompt: validatedData.customPrompt,
    };

    // Generate summary
    const summary = await generateResourceSummary(
      resourceId,
      content,
      options,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: { summary },
    });

  } catch (error) {
    console.error('Create resource summary error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// PUT - Update summary quality and approval
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { id: resourceId } = await params;
    const body = await request.json();
    
    // Validate request body
    const validatedData = updateSummarySchema.parse(body);
    const { summaryId, ...updateData } = body;

    if (!summaryId) {
      throw new AppError('Summary ID is required', 400);
    }

    // Verify summary ownership
    const summary = await prisma.resourceSummary.findFirst({
      where: {
        id: summaryId,
        resourceId,
        userId: session.user.id,
      },
    });

    if (!summary) {
      throw new AppError('Summary not found', 404);
    }

    // Update summary
    const updatedSummary = await prisma.resourceSummary.update({
      where: { id: summaryId },
      data: {
        ...validatedData,
        ...(validatedData.content && { isApproved: false }), // Reset approval if content changed
      },
    });

    return NextResponse.json({
      success: true,
      data: { summary: updatedSummary },
    });

  } catch (error) {
    console.error('Update resource summary error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// DELETE - Delete summary
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { id: resourceId } = await params;
    const { searchParams } = new URL(request.url);
    const summaryId = searchParams.get('summaryId');

    if (!summaryId) {
      throw new AppError('Summary ID is required', 400);
    }

    // Verify summary ownership
    const summary = await prisma.resourceSummary.findFirst({
      where: {
        id: summaryId,
        resourceId,
        userId: session.user.id,
      },
    });

    if (!summary) {
      throw new AppError('Summary not found', 404);
    }

    // Delete summary
    await prisma.resourceSummary.delete({
      where: { id: summaryId },
    });

    return NextResponse.json({
      success: true,
      message: 'Summary deleted successfully',
    });

  } catch (error) {
    console.error('Delete resource summary error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
