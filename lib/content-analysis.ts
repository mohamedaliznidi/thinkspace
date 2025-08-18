/**
 * Smart Content Analysis Service for ThinkSpace
 * 
 * This service provides advanced content analysis including topic extraction,
 * content clustering, automatic tag suggestions, and related resource recommendations.
 */

import { generateChatCompletion } from './openai';
import { searchSimilarResources, generateEmbedding } from './vector';
import prisma from './prisma';
import type {
  ContentAnalysisResult,
  TopicExtractionOptions,
  ResourceRecommendation,
  SmartSuggestions,
  EnhancedResource
} from '../types/resources';

// =============================================================================
// TOPIC EXTRACTION AND CLUSTERING
// =============================================================================

/**
 * Extract topics and themes from content using AI
 */
export async function extractTopicsAndThemes(
  content: string,
  options: TopicExtractionOptions = {}
): Promise<{
  topics: string[];
  themes: string[];
  keywords: string[];
  categories: string[];
  confidence: number;
}> {
  try {
    const {
      maxTopics = 10,
      minConfidence = 0.5,
      includeKeywords = true,
      language = 'auto'
    } = options;

    const prompt = `
Analyze the following content and extract key information. Return a JSON object with this structure:
{
  "topics": ["topic1", "topic2", ...],
  "themes": ["theme1", "theme2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "categories": ["category1", "category2", ...],
  "confidence": 0.85
}

Guidelines:
- Topics: Main subjects discussed (max ${maxTopics})
- Themes: Underlying concepts or patterns
- Keywords: Important terms and phrases${includeKeywords ? '' : ' (skip this)'}
- Categories: High-level classifications
- Confidence: Overall confidence in analysis (0-1)
- Focus on the most relevant and specific terms
- Avoid generic or overly broad terms

Content to analyze:
${content.substring(0, 4000)}${content.length > 4000 ? '...' : ''}
`;

    const response = await generateChatCompletion([
      { role: 'system', content: 'You are an expert content analyst. Provide accurate, specific topic extraction in valid JSON format.' },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.3,
      maxTokens: 1000
    });

    const analysisText = response.choices[0]?.message?.content;
    if (!analysisText) {
      throw new Error('No analysis result received');
    }

    // Parse JSON response
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      // Fallback to basic extraction if JSON parsing fails
      console.warn('Failed to parse AI response, using fallback:', parseError);
      analysis = extractTopicsBasic(content, options);
    }

    // Validate and filter results
    const result = {
      topics: (analysis.topics || []).slice(0, maxTopics),
      themes: analysis.themes || [],
      keywords: includeKeywords ? (analysis.keywords || []) : [],
      categories: analysis.categories || [],
      confidence: Math.max(minConfidence, analysis.confidence || 0.7)
    };

    return result;
  } catch (error) {
    console.error('Error extracting topics and themes:', error);
    // Return fallback analysis
    return extractTopicsBasic(content, options);
  }
}

/**
 * Cluster resources by content similarity
 */
export async function clusterResourcesByContent(
  userId: string,
  options: {
    minClusterSize?: number;
    maxClusters?: number;
    similarityThreshold?: number;
  } = {}
): Promise<Array<{
  clusterId: string;
  theme: string;
  resources: EnhancedResource[];
  commonTopics: string[];
  similarity: number;
}>> {
  try {
    const {
      minClusterSize = 2,
      maxClusters = 20,
      similarityThreshold = 0.7
    } = options;

    // Get all resources with content (embedding filter removed due to Prisma type limitations)
    const resources = await prisma.resource.findMany({
      where: {
        userId,
        contentExtract: { not: null }
      },
      include: {
        _count: {
          select: {
            summaries: true,
            references: true,
            referencedBy: true,
          }
        }
      },
      take: 1000 // Limit for performance
    });

    if (resources.length < minClusterSize) {
      return [];
    }

    // Perform clustering using content similarity
    const clusters = await performContentClustering(
      resources as EnhancedResource[],
      {
        minClusterSize,
        maxClusters,
        similarityThreshold
      }
    );

    return clusters;
  } catch (error) {
    console.error('Error clustering resources by content:', error);
    throw new Error(`Failed to cluster resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// AUTOMATIC TAG SUGGESTIONS
// =============================================================================

/**
 * Generate intelligent tag suggestions for content
 */
export async function generateTagSuggestions(
  content: string,
  existingTags: string[] = [],
  userId: string,
  options: {
    maxSuggestions?: number;
    includeUserTags?: boolean;
    includePopularTags?: boolean;
  } = {}
): Promise<Array<{
  tag: string;
  confidence: number;
  source: 'content' | 'similar_resources' | 'user_history' | 'popular';
  reason: string;
}>> {
  try {
    const {
      maxSuggestions = 10,
      includeUserTags = true,
      includePopularTags = true
    } = options;

    const suggestions: Array<{
      tag: string;
      confidence: number;
      source: 'content' | 'similar_resources' | 'user_history' | 'popular';
      reason: string;
    }> = [];

    // Extract topics from content
    const topicAnalysis = await extractTopicsAndThemes(content, {
      maxTopics: 8,
      includeKeywords: true
    });

    // Add content-based suggestions
    topicAnalysis.topics.forEach(topic => {
      if (!existingTags.includes(topic.toLowerCase())) {
        suggestions.push({
          tag: topic.toLowerCase(),
          confidence: topicAnalysis.confidence * 0.9,
          source: 'content',
          reason: 'Extracted from content analysis'
        });
      }
    });

    topicAnalysis.keywords.slice(0, 5).forEach(keyword => {
      if (!existingTags.includes(keyword.toLowerCase()) && 
          !suggestions.some(s => s.tag === keyword.toLowerCase())) {
        suggestions.push({
          tag: keyword.toLowerCase(),
          confidence: topicAnalysis.confidence * 0.7,
          source: 'content',
          reason: 'Important keyword in content'
        });
      }
    });

    // Find similar resources and suggest their tags
    try {
      const similarResources = await searchSimilarResources(
        content,
        userId,
        5,
        0.7
      ) as any[];

      const tagFrequency = new Map<string, number>();
      similarResources.forEach((resource: any) => {
        resource.tags?.forEach((tag: string) => {
          if (!existingTags.includes(tag.toLowerCase())) {
            tagFrequency.set(tag.toLowerCase(), (tagFrequency.get(tag.toLowerCase()) || 0) + 1);
          }
        });
      });

      Array.from(tagFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([tag, frequency]) => {
          if (!suggestions.some(s => s.tag === tag)) {
            suggestions.push({
              tag,
              confidence: Math.min(0.8, frequency / (similarResources as any[]).length),
              source: 'similar_resources',
              reason: `Used in ${frequency} similar resource${frequency > 1 ? 's' : ''}`
            });
          }
        });
    } catch (error) {
      console.warn('Failed to get similar resources for tag suggestions:', error);
    }

    // Add user's frequently used tags
    if (includeUserTags) {
      try {
        const userTags = await getUserFrequentTags(userId, existingTags);
        userTags.slice(0, 3).forEach(({ tag, frequency }) => {
          if (!suggestions.some(s => s.tag === tag)) {
            suggestions.push({
              tag,
              confidence: Math.min(0.6, frequency / 10),
              source: 'user_history',
              reason: `Frequently used in your resources (${frequency} times)`
            });
          }
        });
      } catch (error) {
        console.warn('Failed to get user frequent tags:', error);
      }
    }

    // Add popular tags in the system
    if (includePopularTags) {
      try {
        const popularTags = await getPopularTags(existingTags);
        popularTags.slice(0, 2).forEach(({ tag, count }) => {
          if (!suggestions.some(s => s.tag === tag)) {
            suggestions.push({
              tag,
              confidence: 0.4,
              source: 'popular',
              reason: `Popular tag used by ${count} users`
            });
          }
        });
      } catch (error) {
        console.warn('Failed to get popular tags:', error);
      }
    }

    // Sort by confidence and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxSuggestions);

  } catch (error) {
    console.error('Error generating tag suggestions:', error);
    throw new Error(`Failed to generate tag suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// RELATED RESOURCE RECOMMENDATIONS
// =============================================================================

/**
 * Generate intelligent resource recommendations
 */
export async function generateResourceRecommendations(
  resourceId: string,
  userId: string,
  options: {
    maxRecommendations?: number;
    includeProjects?: boolean;
    includeAreas?: boolean;
    includeNotes?: boolean;
  } = {}
): Promise<ResourceRecommendation[]> {
  try {
    const {
      maxRecommendations = 10,
      includeProjects = true,
      includeAreas = true,
      includeNotes = true
    } = options;

    // Get the source resource
    const sourceResource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        userId
      }
    });

    if (!sourceResource) {
      throw new Error('Resource not found');
    }

    const recommendations: ResourceRecommendation[] = [];
    const content = sourceResource.contentExtract || sourceResource.description || sourceResource.title;

    // Content-based recommendations
    if (content) {
      try {
        const similarResources = await searchSimilarResources(
          content,
          userId,
          maxRecommendations * 2,
          0.6
        ) as any[];

        (similarResources as any[])
          .filter((r: any) => r.id !== resourceId)
          .slice(0, Math.floor(maxRecommendations * 0.6))
          .forEach((resource: any) => {
            recommendations.push({
              resource: resource as EnhancedResource,
              score: resource.similarity || 0.7,
              reason: 'similar_content',
              explanation: `Similar content with ${Math.round((resource.similarity || 0.7) * 100)}% similarity`
            });
          });
      } catch (error) {
        console.warn('Failed to get content-based recommendations:', error);
      }
    }

    // Tag-based recommendations
    if (sourceResource.tags.length > 0) {
      try {
        const tagBasedResources = await prisma.resource.findMany({
          where: {
            userId,
            id: { not: resourceId },
            tags: {
              hasSome: sourceResource.tags
            }
          },
          include: {
            _count: {
              select: {
                summaries: true,
                references: true,
                referencedBy: true,
              }
            }
          },
          take: Math.floor(maxRecommendations * 0.4)
        });

        tagBasedResources.forEach(resource => {
          const commonTags = resource.tags.filter(tag => sourceResource.tags.includes(tag));
          const score = commonTags.length / Math.max(resource.tags.length, sourceResource.tags.length);
          
          if (!recommendations.some(r => r.resource.id === resource.id)) {
            recommendations.push({
              resource: resource as EnhancedResource,
              score,
              reason: 'shared_tags',
              explanation: `Shares ${commonTags.length} tag${commonTags.length > 1 ? 's' : ''}: ${commonTags.join(', ')}`
            });
          }
        });
      } catch (error) {
        console.warn('Failed to get tag-based recommendations:', error);
      }
    }

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, maxRecommendations);

  } catch (error) {
    console.error('Error generating resource recommendations:', error);
    throw new Error(`Failed to generate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Basic topic extraction fallback
 */
function extractTopicsBasic(content: string, options: TopicExtractionOptions = {}) {
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);

  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  const topics = Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, options.maxTopics || 10)
    .map(([word]) => word);

  return {
    topics,
    themes: topics.slice(0, 3),
    keywords: options.includeKeywords ? topics.slice(0, 5) : [],
    categories: [],
    confidence: 0.5
  };
}

/**
 * Perform content clustering (simplified implementation)
 */
async function performContentClustering(
  resources: EnhancedResource[],
  options: any
) {
  // Simplified clustering - in a real implementation, you'd use proper clustering algorithms
  const clusters: any[] = [];
  
  // Group resources by similar topics
  const topicGroups = new Map<string, EnhancedResource[]>();
  
  for (const resource of resources) {
    const topics = resource.extractedTopics || [];
    const mainTopic = topics[0] || 'uncategorized';
    
    if (!topicGroups.has(mainTopic)) {
      topicGroups.set(mainTopic, []);
    }
    topicGroups.get(mainTopic)!.push(resource);
  }

  // Convert groups to clusters
  let clusterId = 1;
  for (const [topic, groupResources] of topicGroups) {
    if (groupResources.length >= options.minClusterSize) {
      clusters.push({
        clusterId: `cluster_${clusterId++}`,
        theme: topic,
        resources: groupResources,
        commonTopics: [topic],
        similarity: 0.8
      });
    }
  }

  return clusters.slice(0, options.maxClusters);
}

/**
 * Get user's frequently used tags
 */
async function getUserFrequentTags(userId: string, excludeTags: string[] = []) {
  const resources = await prisma.resource.findMany({
    where: { userId },
    select: { tags: true }
  });

  const tagCount = new Map<string, number>();
  resources.forEach(resource => {
    resource.tags.forEach(tag => {
      if (!excludeTags.includes(tag.toLowerCase())) {
        tagCount.set(tag.toLowerCase(), (tagCount.get(tag.toLowerCase()) || 0) + 1);
      }
    });
  });

  return Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, frequency]) => ({ tag, frequency }));
}

/**
 * Get popular tags across the system
 */
async function getPopularTags(excludeTags: string[] = []) {
  // This would be implemented with proper aggregation queries
  // For now, return empty array
  return [];
}

// =============================================================================
// SMART SUGGESTIONS INTEGRATION
// =============================================================================

/**
 * Generate comprehensive smart suggestions for a resource
 */
export async function generateSmartSuggestions(
  resourceId: string,
  userId: string
): Promise<SmartSuggestions> {
  try {
    const resource = await prisma.resource.findFirst({
      where: { id: resourceId, userId }
    });

    if (!resource) {
      throw new Error('Resource not found');
    }

    const content = resource.contentExtract || resource.description || resource.title;

    // Generate all suggestions in parallel
    const [
      relatedResources,
      tagSuggestions,
      // folderSuggestions would be implemented
    ] = await Promise.all([
      generateResourceRecommendations(resourceId, userId, { maxRecommendations: 5 }),
      generateTagSuggestions(content, resource.tags, userId, { maxSuggestions: 8 }),
      // generateFolderSuggestions(content, userId),
    ]);

    return {
      relatedResources,
      suggestedTags: tagSuggestions,
      suggestedFolders: [], // Would be implemented
      duplicateWarnings: [], // Would be implemented with duplicate detection
    };
  } catch (error) {
    console.error('Error generating smart suggestions:', error);
    throw new Error(`Failed to generate smart suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
