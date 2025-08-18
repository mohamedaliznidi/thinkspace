/**
 * Summary Regeneration API Route
 * 
 * Handles regenerating existing summaries with new options
 * while preserving the original summary for comparison.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { regenerateSummary } from '@/lib/summarization';
import { AppError, handleApiError } from '@/lib/utils';
import type { SummaryGenerationOptions } from '@/types/resources';

// Validation schema
const regenerateSummarySchema = z.object({
  summaryId: z.string().cuid(),
  type: z.enum(['GENERAL', 'TECHNICAL', 'EXECUTIVE', 'BRIEF', 'DETAILED', 'LAYMAN']).default('GENERAL'),
  length: z.enum(['SHORT', 'MEDIUM', 'LONG', 'CUSTOM']).default('MEDIUM'),
  tone: z.enum(['professional', 'casual', 'academic', 'technical']).optional(),
  audience: z.enum(['general', 'expert', 'beginner']).optional(),
  focus: z.array(z.string()).optional(),
  customPrompt: z.string().optional(),
  preserveOriginal: z.boolean().default(true),
});

// POST - Regenerate summary with new options
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
    const validatedData = regenerateSummarySchema.parse(body);

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

    // Verify summary ownership
    const existingSummary = await prisma.resourceSummary.findFirst({
      where: {
        id: validatedData.summaryId,
        resourceId,
        userId: session.user.id,
      },
    });

    if (!existingSummary) {
      throw new AppError('Summary not found', 404);
    }

    // Get content to summarize
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

    let newSummary;

    if (validatedData.preserveOriginal) {
      // Create a new summary instead of updating the existing one
      newSummary = await prisma.resourceSummary.create({
        data: {
          content: '', // Will be updated by generateResourceSummary
          type: options.type,
          length: options.length,
          resourceId,
          userId: session.user.id,
          generatedAt: new Date(),
        },
      });

      // Generate new summary content
      newSummary = await regenerateSummary(
        newSummary.id,
        content,
        options,
        session.user.id
      );
    } else {
      // Update the existing summary
      newSummary = await regenerateSummary(
        validatedData.summaryId,
        content,
        options,
        session.user.id
      );
    }

    return NextResponse.json({
      success: true,
      data: { 
        summary: newSummary,
        originalSummary: validatedData.preserveOriginal ? existingSummary : null
      },
    });

  } catch (error) {
    console.error('Regenerate summary error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
