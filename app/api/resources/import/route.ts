/**
 * Resource Import API Routes
 * 
 * Handles multiple resource import methods including web clipping,
 * file uploads, and bulk import operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import {
  createResourceFromUrl,
  createResourceFromFile,
  bulkImportResources,
  extractWebContent
} from '@/lib/resource-input';
import { AppError, handleApiError } from '@/lib/utils';
import type { ResourceImportOptions } from '@/types/resources';

// Validation schemas
const urlImportSchema = z.object({
  url: z.string().url('Invalid URL format'),
  folderId: z.string().cuid().optional(),
  tags: z.array(z.string()).default([]),
  generateSummary: z.boolean().default(false),
  extractMetadata: z.boolean().default(true),
  detectDuplicates: z.boolean().default(true),
});

const textImportSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  description: z.string().optional(),
  folderId: z.string().cuid().optional(),
  tags: z.array(z.string()).default([]),
  generateSummary: z.boolean().default(false),
  extractMetadata: z.boolean().default(true),
});

const bulkImportSchema = z.object({
  sources: z.array(z.object({
    type: z.enum(['url', 'text']),
    data: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
  })).min(1, 'At least one source is required'),
  folderId: z.string().cuid().optional(),
  tags: z.array(z.string()).default([]),
  generateSummary: z.boolean().default(false),
  extractMetadata: z.boolean().default(true),
  detectDuplicates: z.boolean().default(true),
});

// POST - Import resources from various sources
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const { importType } = body;

    const baseOptions: ResourceImportOptions = {
      source: 'api',
      folderId: body.folderId,
      tags: body.tags || [],
      generateSummary: body.generateSummary || false,
      extractMetadata: body.extractMetadata !== false,
      detectDuplicates: body.detectDuplicates !== false,
    };

    switch (importType) {
      case 'url': {
        const validatedData = urlImportSchema.parse(body);
        
        const resource = await createResourceFromUrl(
          validatedData.url,
          {
            ...baseOptions,
            tags: validatedData.tags,
            generateSummary: validatedData.generateSummary,
            extractMetadata: validatedData.extractMetadata,
            detectDuplicates: validatedData.detectDuplicates,
          },
          session.user.id
        );

        return NextResponse.json({
          success: true,
          data: { resource },
        });
      }

      case 'text': {
        const validatedData = textImportSchema.parse(body);
        
        const sources = [{
          type: 'text' as const,
          data: validatedData.content,
          title: validatedData.title,
          description: validatedData.description,
          tags: validatedData.tags,
        }];

        const result = await bulkImportResources(
          sources,
          {
            ...baseOptions,
            folderId: validatedData.folderId,
            generateSummary: validatedData.generateSummary,
            extractMetadata: validatedData.extractMetadata,
          },
          session.user.id
        );

        return NextResponse.json({
          success: result.success,
          data: { 
            resource: result.resources[0],
            importResult: result
          },
        });
      }

      case 'bulk': {
        const validatedData = bulkImportSchema.parse(body);
        
        const result = await bulkImportResources(
          validatedData.sources,
          baseOptions,
          session.user.id
        );

        return NextResponse.json({
          success: result.success,
          data: { importResult: result },
        });
      }

      default:
        throw new AppError('Invalid import type. Supported types: url, text, bulk', 400);
    }

  } catch (error) {
    console.error('Import resource error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// GET - Preview content from URL before importing
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      throw new AppError('URL parameter is required', 400);
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new AppError('Invalid URL format', 400);
    }

    // Extract content preview
    const extracted = await extractWebContent(url);

    return NextResponse.json({
      success: true,
      data: {
        preview: {
          title: extracted.title,
          description: extracted.description,
          content: extracted.content.substring(0, 500) + '...', // Preview only
          metadata: extracted.metadata,
          estimatedWordCount: extracted.content.split(/\s+/).length,
          estimatedReadingTime: Math.ceil(extracted.content.split(/\s+/).length / 200),
        },
      },
    });

  } catch (error) {
    console.error('Preview content error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
