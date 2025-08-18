/**
 * Resource Content Analysis API Route
 * 
 * Handles content analysis including topic extraction, language detection,
 * complexity assessment, and related resource suggestions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { analyzeResourceContent } from '@/lib/summarization';
import { searchSimilarResources } from '@/lib/vector';
import { AppError, handleApiError } from '@/lib/utils';
import type { TopicExtractionOptions } from '@/types/resources';

// Validation schema
const analyzeContentSchema = z.object({
  maxTopics: z.number().min(1).max(20).default(10),
  minConfidence: z.number().min(0).max(1).default(0.5),
  includeKeywords: z.boolean().default(true),
  language: z.string().optional(),
  updateResource: z.boolean().default(false), // Whether to update resource with analysis results
});

// POST - Analyze resource content
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
    const validatedData = analyzeContentSchema.parse(body);

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

    // Get content to analyze
    const content = resource.contentExtract || resource.description || resource.title;
    if (!content || content.trim().length < 10) {
      throw new AppError('Resource must have content to analyze', 400);
    }

    // Prepare analysis options
    const options: TopicExtractionOptions = {
      maxTopics: validatedData.maxTopics,
      minConfidence: validatedData.minConfidence,
      includeKeywords: validatedData.includeKeywords,
      language: validatedData.language,
    };

    // Perform content analysis
    const analysisResult = await analyzeResourceContent(content, options);

    // Find related resources using semantic search
    try {
      const relatedResources = await searchSimilarResources(
        content,
        session.user.id,
        5, // limit
        0.7 // threshold
      );
      analysisResult.relatedResources = relatedResources as any[];
    } catch (error) {
      console.warn('Failed to find related resources:', error);
      analysisResult.relatedResources = [];
    }

    // Find potential duplicates based on content similarity
    try {
      const duplicateCandidates = await findDuplicateCandidates(
        resourceId,
        content,
        session.user.id
      );
      analysisResult.duplicateCandidates = duplicateCandidates;
    } catch (error) {
      console.warn('Failed to find duplicate candidates:', error);
      analysisResult.duplicateCandidates = [];
    }

    // Update resource with analysis results if requested
    if (validatedData.updateResource) {
      await prisma.resource.update({
        where: { id: resourceId },
        data: {
          extractedTopics: analysisResult.topics,
          contentLanguage: analysisResult.language,
          wordCount: analysisResult.wordCount,
          readingTime: analysisResult.readingTime,
          // Add suggested tags to existing tags (avoid duplicates)
          tags: {
            set: Array.from(new Set([
              ...resource.tags,
              ...analysisResult.suggestedTags.slice(0, 5) // Limit to 5 new tags
            ]))
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { 
        analysis: analysisResult,
        updated: validatedData.updateResource
      },
    });

  } catch (error) {
    console.error('Analyze resource content error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// Helper function to find duplicate candidates
async function findDuplicateCandidates(
  resourceId: string,
  content: string,
  userId: string
) {
  try {
    // Use semantic search to find similar resources
    const similarResources = await searchSimilarResources(
      content,
      userId,
      10, // Get more candidates for duplicate detection
      0.8 // Higher threshold for duplicates
    );

    // Filter out the current resource and return the resources directly
    const duplicateCandidates = (similarResources as any[])
      .filter((result: any) => result.id !== resourceId)
      .slice(0, 5); // Return top 5 candidates

    return duplicateCandidates;
  } catch (error) {
    console.error('Error finding duplicate candidates:', error);
    return [];
  }
}

// GET - Get cached analysis results
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

    // Verify resource ownership and get analysis data
    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        extractedTopics: true,
        contentLanguage: true,
        wordCount: true,
        readingTime: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!resource) {
      throw new AppError('Resource not found', 404);
    }

    // Return cached analysis data
    const cachedAnalysis = {
      topics: resource.extractedTopics,
      language: resource.contentLanguage,
      wordCount: resource.wordCount,
      readingTime: resource.readingTime,
      suggestedTags: resource.tags,
      lastAnalyzed: resource.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: { analysis: cachedAnalysis },
    });

  } catch (error) {
    console.error('Get resource analysis error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
