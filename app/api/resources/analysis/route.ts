/**
 * Content Analysis API Routes
 * 
 * Handles smart content analysis including topic extraction,
 * clustering, tag suggestions, and resource recommendations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  extractTopicsAndThemes,
  clusterResourcesByContent,
  generateTagSuggestions,
  generateResourceRecommendations,
  generateSmartSuggestions
} from '@/lib/content-analysis';
import { AppError, handleApiError } from '@/lib/utils';

// Validation schemas
const topicExtractionSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters'),
  maxTopics: z.number().min(1).max(20).default(10),
  minConfidence: z.number().min(0).max(1).default(0.5),
  includeKeywords: z.boolean().default(true),
  language: z.string().default('auto'),
});

const clusteringSchema = z.object({
  minClusterSize: z.number().min(2).max(10).default(2),
  maxClusters: z.number().min(1).max(50).default(20),
  similarityThreshold: z.number().min(0).max(1).default(0.7),
});

const tagSuggestionsSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters'),
  existingTags: z.array(z.string()).default([]),
  maxSuggestions: z.number().min(1).max(20).default(10),
  includeUserTags: z.boolean().default(true),
  includePopularTags: z.boolean().default(true),
});

const recommendationsSchema = z.object({
  resourceId: z.string().cuid(),
  maxRecommendations: z.number().min(1).max(20).default(10),
  includeProjects: z.boolean().default(true),
  includeAreas: z.boolean().default(true),
  includeNotes: z.boolean().default(true),
});

// POST - Perform various content analysis operations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const { analysisType } = body;

    switch (analysisType) {
      case 'topics': {
        const validatedData = topicExtractionSchema.parse(body);
        
        const result = await extractTopicsAndThemes(validatedData.content, {
          maxTopics: validatedData.maxTopics,
          minConfidence: validatedData.minConfidence,
          includeKeywords: validatedData.includeKeywords,
          language: validatedData.language,
        });

        return NextResponse.json({
          success: true,
          data: { analysis: result },
        });
      }

      case 'clustering': {
        const validatedData = clusteringSchema.parse(body);
        
        const clusters = await clusterResourcesByContent(session.user.id, {
          minClusterSize: validatedData.minClusterSize,
          maxClusters: validatedData.maxClusters,
          similarityThreshold: validatedData.similarityThreshold,
        });

        return NextResponse.json({
          success: true,
          data: { clusters },
        });
      }

      case 'tags': {
        const validatedData = tagSuggestionsSchema.parse(body);
        
        const suggestions = await generateTagSuggestions(
          validatedData.content,
          validatedData.existingTags,
          session.user.id,
          {
            maxSuggestions: validatedData.maxSuggestions,
            includeUserTags: validatedData.includeUserTags,
            includePopularTags: validatedData.includePopularTags,
          }
        );

        return NextResponse.json({
          success: true,
          data: { suggestions },
        });
      }

      case 'recommendations': {
        const validatedData = recommendationsSchema.parse(body);
        
        const recommendations = await generateResourceRecommendations(
          validatedData.resourceId,
          session.user.id,
          {
            maxRecommendations: validatedData.maxRecommendations,
            includeProjects: validatedData.includeProjects,
            includeAreas: validatedData.includeAreas,
            includeNotes: validatedData.includeNotes,
          }
        );

        return NextResponse.json({
          success: true,
          data: { recommendations },
        });
      }

      case 'smart-suggestions': {
        const { resourceId } = body;
        
        if (!resourceId) {
          throw new AppError('Resource ID is required for smart suggestions', 400);
        }

        const suggestions = await generateSmartSuggestions(resourceId, session.user.id);

        return NextResponse.json({
          success: true,
          data: { suggestions },
        });
      }

      default:
        throw new AppError('Invalid analysis type. Supported types: topics, clustering, tags, recommendations, smart-suggestions', 400);
    }

  } catch (error) {
    console.error('Content analysis error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// GET - Get analysis overview for user's resources
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const includeTopics = searchParams.get('includeTopics') !== 'false';
    const includeClusters = searchParams.get('includeClusters') === 'true';
    const includeStats = searchParams.get('includeStats') !== 'false';

    const overview: any = {};

    if (includeStats) {
      // Get basic statistics
      const [totalResources, resourcesWithContent, resourcesWithTopics] = await Promise.all([
        prisma.resource.count({ where: { userId: session.user.id } }),
        prisma.resource.count({ 
          where: { 
            userId: session.user.id,
            contentExtract: { not: null }
          }
        }),
        prisma.resource.count({ 
          where: { 
            userId: session.user.id,
            extractedTopics: { isEmpty: false }
          }
        }),
      ]);

      overview.stats = {
        totalResources,
        resourcesWithContent,
        resourcesWithTopics,
        analysisProgress: totalResources > 0 ? resourcesWithTopics / totalResources : 0,
      };
    }

    if (includeTopics) {
      // Get most common topics across user's resources
      const resources = await prisma.resource.findMany({
        where: {
          userId: session.user.id,
          extractedTopics: { isEmpty: false }
        },
        select: { extractedTopics: true },
        take: 1000,
      });

      const topicCount = new Map<string, number>();
      resources.forEach(resource => {
        resource.extractedTopics.forEach(topic => {
          topicCount.set(topic, (topicCount.get(topic) || 0) + 1);
        });
      });

      overview.commonTopics = Array.from(topicCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([topic, count]) => ({ topic, count }));
    }

    if (includeClusters) {
      try {
        const clusters = await clusterResourcesByContent(session.user.id, {
          minClusterSize: 2,
          maxClusters: 10,
          similarityThreshold: 0.7,
        });

        overview.clusters = clusters.map(cluster => ({
          clusterId: cluster.clusterId,
          theme: cluster.theme,
          resourceCount: cluster.resources.length,
          commonTopics: cluster.commonTopics,
        }));
      } catch (error) {
        console.warn('Failed to generate clusters for overview:', error);
        overview.clusters = [];
      }
    }

    return NextResponse.json({
      success: true,
      data: { overview },
    });

  } catch (error) {
    console.error('Get analysis overview error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
