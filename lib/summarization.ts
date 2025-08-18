/**
 * AI Summarization Service for ThinkSpace Resources
 * 
 * This service provides automatic content summarization using OpenAI API
 * with customizable summary types, lengths, and quality rating system.
 */

import { generateChatCompletion } from './openai';
import prisma from './prisma';
import type {
  ResourceSummary,
  SummaryGenerationOptions,
  ContentAnalysisResult,
  TopicExtractionOptions
} from '../types/resources';

import type {
  SummaryLength,
} from '@prisma/client'

// =============================================================================
// SUMMARIZATION PROMPTS
// =============================================================================

const SUMMARY_PROMPTS = {
  GENERAL: {
    SHORT: "Provide a concise 2-3 sentence summary of the main points in this content.",
    MEDIUM: "Create a comprehensive summary in 1-2 paragraphs covering the key points, main arguments, and important details.",
    LONG: "Generate a detailed summary that covers all major points, supporting details, context, and implications. Structure it with clear sections if appropriate."
  },
  TECHNICAL: {
    SHORT: "Summarize the technical aspects, methodologies, and key findings in 2-3 sentences.",
    MEDIUM: "Provide a technical summary covering methodologies, key findings, technical details, and implementation aspects in 1-2 paragraphs.",
    LONG: "Create a comprehensive technical summary including methodologies, detailed findings, technical specifications, implementation details, and technical implications."
  },
  EXECUTIVE: {
    SHORT: "Provide an executive summary focusing on key decisions, outcomes, and business impact in 2-3 sentences.",
    MEDIUM: "Create an executive summary covering strategic points, key decisions, outcomes, and business implications in 1-2 paragraphs.",
    LONG: "Generate a detailed executive summary with strategic overview, key decisions, outcomes, business impact, and recommendations."
  },
  BRIEF: {
    SHORT: "Extract the most essential point in one sentence.",
    MEDIUM: "Provide the 3-5 most important points in bullet format.",
    LONG: "List the key takeaways and action items in a structured format."
  },
  DETAILED: {
    SHORT: "Provide a detailed overview of the main topic and its significance in 2-3 sentences.",
    MEDIUM: "Create a thorough summary covering all important aspects, context, and details in 2-3 paragraphs.",
    LONG: "Generate an exhaustive summary covering all aspects, background, details, implications, and related information."
  },
  LAYMAN: {
    SHORT: "Explain the main idea in simple terms that anyone can understand in 2-3 sentences.",
    MEDIUM: "Provide a clear, jargon-free explanation of the content that's accessible to a general audience in 1-2 paragraphs.",
    LONG: "Create a comprehensive explanation using simple language, analogies, and examples that make complex topics accessible to everyone."
  }
};

const TOPIC_EXTRACTION_PROMPT = `
Analyze the following content and extract the main topics, themes, and keywords.
Return a JSON object with the following structure:
{
  "topics": ["topic1", "topic2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "themes": ["theme1", "theme2", ...],
  "categories": ["category1", "category2", ...],
  "language": "detected_language",
  "complexity": "beginner|intermediate|advanced",
  "sentiment": "positive|neutral|negative"
}

Content to analyze:
`;

// =============================================================================
// CORE SUMMARIZATION FUNCTIONS
// =============================================================================

/**
 * Generate a summary for resource content
 */
export async function generateResourceSummary(
  resourceId: string,
  content: string,
  options: SummaryGenerationOptions,
  userId: string
): Promise<ResourceSummary> {
  try {
    // Get the appropriate prompt
    const prompt = options.customPrompt ||
      (options.length !== 'CUSTOM' ? SUMMARY_PROMPTS[options.type][options.length] : undefined) ||
      SUMMARY_PROMPTS.GENERAL.MEDIUM;

    // Create system message with context
    const systemMessage = `You are an expert content summarizer. Your task is to create high-quality summaries that are accurate, concise, and useful. 

Summary Type: ${options.type}
Summary Length: ${options.length}
${options.tone ? `Tone: ${options.tone}` : ''}
${options.audience ? `Target Audience: ${options.audience}` : ''}
${options.focus?.length ? `Focus Areas: ${options.focus.join(', ')}` : ''}

Instructions: ${prompt}

Please provide only the summary without any meta-commentary or explanations.`;

    // Generate summary using AI
    const response = await generateChatCompletion([
      { role: 'system', content: systemMessage },
      { role: 'user', content: content }
    ], {
      temperature: 0.3, // Lower temperature for more consistent summaries
      maxTokens: getSummaryTokenLimit(options.length)
    });

    const summaryContent = response.choices[0]?.message?.content;

    if (!summaryContent) {
      throw new Error('Failed to generate summary content');
    }

    // Calculate quality score based on various factors
    const qualityScore = await calculateSummaryQuality(content, summaryContent, options);

    // Save summary to database
    const summary = await prisma.resourceSummary.create({
      data: {
        content: summaryContent,
        type: options.type,
        length: options.length,
        qualityScore,
        model: response.model,
        prompt: systemMessage,
        resourceId,
        userId,
        generatedAt: new Date()
      }
    });

    return summary;
  } catch (error) {
    console.error('Error generating resource summary:', error);
    throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Regenerate summary with different options
 */
export async function regenerateSummary(
  summaryId: string,
  content: string,
  options: SummaryGenerationOptions,
  userId: string
): Promise<ResourceSummary> {
  try {
    const existingSummary = await prisma.resourceSummary.findFirst({
      where: { id: summaryId, userId }
    });

    if (!existingSummary) {
      throw new Error('Summary not found');
    }

    // Generate new summary content
    const prompt = options.customPrompt ||
      (options.length !== 'CUSTOM' ? SUMMARY_PROMPTS[options.type][options.length] : undefined) ||
      SUMMARY_PROMPTS.GENERAL.MEDIUM;

    const systemMessage = `You are an expert content summarizer. Create a high-quality summary.

Summary Type: ${options.type}
Summary Length: ${options.length}
${options.tone ? `Tone: ${options.tone}` : ''}
${options.audience ? `Target Audience: ${options.audience}` : ''}

Instructions: ${prompt}`;

    const response = await generateChatCompletion([
      { role: 'system', content: systemMessage },
      { role: 'user', content: content }
    ], {
      temperature: 0.3,
      maxTokens: getSummaryTokenLimit(options.length)
    });

    const summaryContent = response.choices[0]?.message?.content;

    if (!summaryContent) {
      throw new Error('Failed to generate summary content');
    }

    const qualityScore = await calculateSummaryQuality(content, summaryContent, options);

    // Update existing summary
    const updatedSummary = await prisma.resourceSummary.update({
      where: { id: summaryId },
      data: {
        content: summaryContent,
        type: options.type,
        length: options.length,
        qualityScore,
        model: response.model,
        prompt: systemMessage,
        isApproved: false, // Reset approval status
        generatedAt: new Date()
      }
    });

    return updatedSummary;
  } catch (error) {
    console.error('Error regenerating summary:', error);
    throw new Error(`Failed to regenerate summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update summary quality score and approval status
 */
export async function updateSummaryQuality(
  summaryId: string,
  qualityScore: number,
  isApproved: boolean,
  feedback?: string,
  userId?: string
): Promise<ResourceSummary> {
  try {
    const whereClause = userId
      ? { id: summaryId, userId }
      : { id: summaryId };

    const updatedSummary = await prisma.resourceSummary.update({
      where: whereClause,
      data: {
        qualityScore: Math.max(0, Math.min(1, qualityScore)), // Ensure 0-1 range
        isApproved,
        feedback
      }
    });

    return updatedSummary;
  } catch (error) {
    console.error('Error updating summary quality:', error);
    throw new Error(`Failed to update summary quality: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// CONTENT ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Analyze content and extract topics, themes, and metadata
 */
export async function analyzeResourceContent(
  content: string,
  options: TopicExtractionOptions = {}
): Promise<ContentAnalysisResult> {
  try {
    // Generate content analysis using AI
    const response = await generateChatCompletion([
      { role: 'system', content: TOPIC_EXTRACTION_PROMPT },
      { role: 'user', content: content }
    ], {
      temperature: 0.2,
      maxTokens: 1000
    });

    const analysisText = response.choices[0]?.message?.content;

    if (!analysisText) {
      throw new Error('Failed to analyze content');
    }

    // Parse AI response
    let analysisData;
    try {
      analysisData = JSON.parse(analysisText);
    } catch {
      // Fallback to basic analysis if JSON parsing fails
      analysisData = {
        topics: extractBasicTopics(content),
        keywords: [],
        themes: [],
        categories: [],
        language: 'en',
        complexity: 'intermediate',
        sentiment: 'neutral'
      };
    }

    // Calculate additional metrics
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Assume 200 words per minute

    // Find related resources using semantic search
    const relatedResources = await findRelatedResources(content, options.maxTopics || 5);

    return {
      topics: analysisData.topics || [],
      language: analysisData.language,
      wordCount,
      readingTime,
      sentiment: analysisData.sentiment,
      complexity: analysisData.complexity,
      suggestedTags: [...(analysisData.topics || []), ...(analysisData.keywords || [])].slice(0, 10),
      relatedResources,
      duplicateCandidates: [] // Will be implemented in duplicate detection
    };
  } catch (error) {
    console.error('Error analyzing content:', error);
    throw new Error(`Failed to analyze content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get token limit based on summary length
 */
function getSummaryTokenLimit(length: SummaryLength): number {
  switch (length) {
    case 'SHORT': return 150;
    case 'MEDIUM': return 500;
    case 'LONG': return 1000;
    case 'CUSTOM': return 800;
    default: return 500;
  }
}

/**
 * Calculate summary quality score
 */
async function calculateSummaryQuality(
  originalContent: string,
  summary: string,
  options: SummaryGenerationOptions
): Promise<number> {
  try {
    // Basic quality metrics
    const originalWordCount = originalContent.split(/\s+/).length;
    const summaryWordCount = summary.split(/\s+/).length;

    // Compression ratio (should be appropriate for length)
    const compressionRatio = summaryWordCount / originalWordCount;

    // Expected compression ratios
    const expectedRatios = {
      SHORT: 0.05,
      MEDIUM: 0.15,
      LONG: 0.3,
      CUSTOM: 0.2
    };

    const expectedRatio = expectedRatios[options.length] || 0.15;
    const ratioScore = 1 - Math.abs(compressionRatio - expectedRatio) / expectedRatio;

    // Content coverage (simplified - could be enhanced with semantic analysis)
    const coverageScore = Math.min(1, summaryWordCount / (expectedRatio * originalWordCount));

    // Combine scores
    const qualityScore = (ratioScore * 0.4 + coverageScore * 0.6);

    return Math.max(0, Math.min(1, qualityScore));
  } catch (error) {
    console.error('Error calculating summary quality:', error);
    return 0.5; // Default score
  }
}

/**
 * Extract basic topics from content (fallback method)
 */
function extractBasicTopics(content: string): string[] {
  // Simple keyword extraction based on frequency and length
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);

  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

/**
 * Find related resources using semantic similarity
 */
async function findRelatedResources(content: string, limit: number = 5) {
  try {
    // This would use the existing vector search functionality
    // For now, return empty array - will be implemented with vector search
    return [];
  } catch (error) {
    console.error('Error finding related resources:', error);
    return [];
  }
}
