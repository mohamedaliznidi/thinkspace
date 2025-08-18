/**
 * Enhanced Resource Input Service for ThinkSpace
 * 
 * This service provides multiple input methods for resources including
 * web clipping, file upload with content extraction, and automatic metadata extraction.
 */

import { generateEmbedding } from './vector';
import { analyzeResourceContent } from './summarization';
import prisma from './prisma';
import type {
  ResourceImportOptions,
  ImportResult,
  ContentAnalysisResult,
  CreateResourceRequest,
  EnhancedResource
} from '../types/resources';

// =============================================================================
// WEB CLIPPING FUNCTIONS
// =============================================================================

/**
 * Extract content and metadata from a web URL
 */
export async function extractWebContent(url: string): Promise<{
  title: string;
  description?: string;
  content: string;
  metadata: {
    author?: string;
    publishDate?: string;
    siteName?: string;
    imageUrl?: string;
    keywords?: string[];
    language?: string;
  };
}> {
  try {
    // Validate URL
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are supported');
    }

    // Fetch the webpage with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ThinkSpace Resource Extractor 1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract content using basic HTML parsing
    const extracted = extractFromHTML(html, url);
    
    return extracted;
  } catch (error) {
    console.error('Error extracting web content:', error);
    throw new Error(`Failed to extract web content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create resource from web URL
 */
export async function createResourceFromUrl(
  url: string,
  options: ResourceImportOptions,
  userId: string
): Promise<EnhancedResource> {
  try {
    // Extract content from URL
    const extracted = await extractWebContent(url);
    
    // Prepare resource data
    const resourceData: CreateResourceRequest = {
      title: extracted.title,
      description: extracted.description,
      type: 'LINK',
      sourceUrl: url,
      contentExtract: extracted.content,
      tags: options.tags || [],
      folderId: options.folderId,
      generateSummary: options.generateSummary,
    };

    // Add extracted metadata as tags if requested
    if (options.extractMetadata && extracted.metadata.keywords) {
      resourceData.tags = [
        ...(resourceData.tags || []),
        ...extracted.metadata.keywords.slice(0, 5) // Limit to 5 keywords
      ];
    }

    // Create the resource
    const resource = await createResourceWithAnalysis(resourceData, userId, options);
    
    return resource;
  } catch (error) {
    console.error('Error creating resource from URL:', error);
    throw new Error(`Failed to create resource from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// FILE UPLOAD FUNCTIONS
// =============================================================================

/**
 * Extract content from uploaded file
 */
export async function extractFileContent(
  file: File | Buffer,
  filename: string,
  mimeType: string
): Promise<{
  content: string;
  metadata: {
    wordCount?: number;
    pageCount?: number;
    author?: string;
    createdDate?: string;
    language?: string;
  };
}> {
  try {
    let content = '';
    const metadata: any = {};

    // Handle different file types
    if (mimeType.startsWith('text/')) {
      // Plain text files
      if (file instanceof Buffer) {
        content = file.toString('utf-8');
      } else {
        content = await (file as File).text();
      }
    } else if (mimeType === 'application/pdf') {
      // PDF files - would need a PDF parsing library
      content = await extractPDFContent(file);
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      // Word documents - would need a document parsing library
      content = await extractDocumentContent(file, mimeType);
    } else if (mimeType.startsWith('image/')) {
      // Images - would need OCR for text extraction
      content = await extractImageText(file);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Calculate basic metadata
    if (content) {
      metadata.wordCount = content.split(/\s+/).length;
      metadata.language = detectLanguage(content);
    }

    return { content, metadata };
  } catch (error) {
    console.error('Error extracting file content:', error);
    throw new Error(`Failed to extract file content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create resource from uploaded file
 */
export async function createResourceFromFile(
  file: File | Buffer,
  filename: string,
  mimeType: string,
  options: ResourceImportOptions,
  userId: string
): Promise<EnhancedResource> {
  try {
    // Extract content from file
    const extracted = await extractFileContent(file, filename, mimeType);
    
    // Determine resource type based on file type
    const resourceType = getResourceTypeFromMimeType(mimeType);
    
    // Prepare resource data
    const resourceData: CreateResourceRequest = {
      title: filename.replace(/\.[^/.]+$/, ''), // Remove file extension
      description: `Uploaded file: ${filename}`,
      type: resourceType,
      contentExtract: extracted.content,
      tags: options.tags || [],
      folderId: options.folderId,
      generateSummary: options.generateSummary,
    };

    // Create the resource
    const resource = await createResourceWithAnalysis(resourceData, userId, options);
    
    return resource;
  } catch (error) {
    console.error('Error creating resource from file:', error);
    throw new Error(`Failed to create resource from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// BULK IMPORT FUNCTIONS
// =============================================================================

/**
 * Import multiple resources from various sources
 */
export async function bulkImportResources(
  sources: Array<{
    type: 'url' | 'file' | 'text';
    data: string | File | Buffer;
    filename?: string;
    mimeType?: string;
    title?: string;
    description?: string;
    tags?: string[];
  }>,
  options: ResourceImportOptions,
  userId: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    importedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    resources: [],
    errors: [],
    duplicatesFound: [],
  };

  for (const source of sources) {
    try {
      let resource: EnhancedResource;

      switch (source.type) {
        case 'url':
          resource = await createResourceFromUrl(
            source.data as string,
            { ...options, tags: [...(options.tags || []), ...(source.tags || [])] },
            userId
          );
          break;
        
        case 'file':
          resource = await createResourceFromFile(
            source.data as File | Buffer,
            source.filename || 'unknown',
            source.mimeType || 'application/octet-stream',
            { ...options, tags: [...(options.tags || []), ...(source.tags || [])] },
            userId
          );
          break;
        
        case 'text':
          const textResourceData: CreateResourceRequest = {
            title: source.title || 'Imported Text',
            description: source.description,
            type: 'DOCUMENT',
            contentExtract: source.data as string,
            tags: [...(options.tags || []), ...(source.tags || [])],
            folderId: options.folderId,
            generateSummary: options.generateSummary,
          };
          resource = await createResourceWithAnalysis(textResourceData, userId, options);
          break;
        
        default:
          throw new Error(`Unsupported source type: ${source.type}`);
      }

      // Check for duplicates if requested
      if (options.detectDuplicates) {
        const duplicates = await findDuplicateResources(resource, userId);
        if (duplicates.length > 0) {
          result.duplicatesFound.push({
            imported: resource,
            existing: duplicates[0],
            similarity: 0.9, // Placeholder - would be calculated properly
          });
        }
      }

      result.resources.push(resource);
      result.importedCount++;
    } catch (error) {
      result.errors.push({
        source: source.type === 'url' ? source.data as string : source.filename || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      result.errorCount++;
    }
  }

  result.success = result.errorCount === 0;
  return result;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create resource with automatic analysis
 */
async function createResourceWithAnalysis(
  resourceData: CreateResourceRequest,
  userId: string,
  options: ResourceImportOptions
): Promise<EnhancedResource> {
  try {
    // Generate embedding if content exists
    let embedding;
    if (resourceData.contentExtract) {
      try {
        const embeddingVector = await generateEmbedding(resourceData.contentExtract);
        embedding = `[${embeddingVector.join(',')}]`;
      } catch (error) {
        console.warn('Failed to generate embedding:', error);
      }
    }

    // Create the resource
    const resource = await prisma.resource.create({
      data: {
        ...resourceData,
        userId,
        ...(embedding && { embedding }),
      },
      include: {
        folder: true,
        summaries: true,
        references: true,
        referencedBy: true,
        _count: {
          select: {
            summaries: true,
            references: true,
            referencedBy: true,
            projects: true,
            notes: true,
            areas: true,
            collections: true,
          },
        },
      },
    });

    // Perform content analysis if requested
    if (options.extractMetadata && resourceData.contentExtract) {
      try {
        const analysis = await analyzeResourceContent(resourceData.contentExtract);
        
        // Update resource with analysis results
        await prisma.resource.update({
          where: { id: resource.id },
          data: {
            extractedTopics: analysis.topics,
            contentLanguage: analysis.language,
            wordCount: analysis.wordCount,
            readingTime: analysis.readingTime,
            tags: {
              set: Array.from(new Set([
                ...resource.tags,
                ...analysis.suggestedTags.slice(0, 3)
              ]))
            },
          },
        });
      } catch (error) {
        console.warn('Failed to analyze content:', error);
      }
    }

    return resource as EnhancedResource;
  } catch (error) {
    console.error('Error creating resource with analysis:', error);
    throw error;
  }
}

/**
 * Extract content from HTML
 */
function extractFromHTML(html: string, url: string) {
  // Basic HTML content extraction
  // In a real implementation, you'd use a proper HTML parser like cheerio
  
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;
  
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const description = descMatch ? descMatch[1] : undefined;
  
  // Remove HTML tags and extract text content
  const content = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return {
    title,
    description,
    content: content.substring(0, 10000), // Limit content length
    metadata: {
      siteName: new URL(url).hostname,
      language: 'en', // Default - would be detected properly
    },
  };
}

/**
 * Placeholder functions for file content extraction
 * These would be implemented with appropriate libraries
 */
async function extractPDFContent(file: File | Buffer): Promise<string> {
  // Would use pdf-parse or similar library
  throw new Error('PDF extraction not implemented yet');
}

async function extractDocumentContent(file: File | Buffer, mimeType: string): Promise<string> {
  // Would use mammoth.js for Word docs or similar
  throw new Error('Document extraction not implemented yet');
}

async function extractImageText(file: File | Buffer): Promise<string> {
  // Would use OCR library like tesseract.js
  throw new Error('Image text extraction not implemented yet');
}

function detectLanguage(content: string): string {
  // Basic language detection - would use a proper library
  return 'en';
}

function getResourceTypeFromMimeType(mimeType: string) {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType.startsWith('audio/')) return 'AUDIO';
  if (mimeType === 'application/pdf') return 'DOCUMENT';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'DOCUMENT';
  return 'DOCUMENT';
}

async function findDuplicateResources(resource: EnhancedResource, userId: string): Promise<EnhancedResource[]> {
  // Would implement duplicate detection using content similarity
  return [];
}
