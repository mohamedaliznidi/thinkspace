/**
 * Enhanced Resource Search API Routes
 * 
 * Handles advanced search capabilities including semantic search,
 * hybrid search, and intelligent resource discovery.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import {
  performSemanticSearch,
  performHybridSearch,
  discoverResources,
  getSearchSuggestions
} from '@/lib/advanced-search';
import { AppError, handleApiError } from '@/lib/utils';
import type { ResourceSearchRequest } from '@/types/resources';

// Validation schemas
const searchSchema = z.object({
  query: z.string().optional(),
  type: z.enum(['DOCUMENT', 'LINK', 'IMAGE', 'VIDEO', 'AUDIO', 'BOOK', 'ARTICLE', 'RESEARCH', 'REFERENCE', 'TEMPLATE', 'OTHER']).optional(),
  folderId: z.string().cuid().optional(),
  tags: z.array(z.string()).optional(),
  projectIds: z.array(z.string().cuid()).optional(),
  areaIds: z.array(z.string().cuid()).optional(),
  collectionIds: z.array(z.string().cuid()).optional(),
  hasContent: z.boolean().optional(),
  hasSummary: z.boolean().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'type', 'relevance']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const semanticSearchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  threshold: z.number().min(0).max(1).default(0.7),
  limit: z.number().min(1).max(50).default(20),
  includeContent: z.boolean().default(true),
  includeSummaries: z.boolean().default(true),
  resourceTypes: z.array(z.enum(['DOCUMENT', 'LINK', 'IMAGE', 'VIDEO', 'AUDIO', 'BOOK', 'ARTICLE', 'RESEARCH', 'REFERENCE', 'TEMPLATE', 'OTHER'])).optional(),
  folderIds: z.array(z.string().cuid()).optional(),
});

const discoverySchema = z.object({
  basedOn: z.enum(['recent_activity', 'similar_content', 'popular', 'recommendations']).default('recommendations'),
  limit: z.number().min(1).max(50).default(10),
  excludeIds: z.array(z.string().cuid()).default([]),
});

// GET - Perform various types of searches
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const searchType = searchParams.get('searchType') || 'hybrid';

    switch (searchType) {
      case 'hybrid': {
        // Parse search parameters
        const searchRequest: ResourceSearchRequest = {
          query: searchParams.get('query') || undefined,
          type: searchParams.get('type') as any,
          folderId: searchParams.get('folderId') || undefined,
          tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
          projectIds: searchParams.get('projectIds') ? searchParams.get('projectIds')!.split(',') : undefined,
          areaIds: searchParams.get('areaIds') ? searchParams.get('areaIds')!.split(',') : undefined,
          collectionIds: searchParams.get('collectionIds') ? searchParams.get('collectionIds')!.split(',') : undefined,
          hasContent: searchParams.get('hasContent') === 'true' ? true : searchParams.get('hasContent') === 'false' ? false : undefined,
          hasSummary: searchParams.get('hasSummary') === 'true' ? true : searchParams.get('hasSummary') === 'false' ? false : undefined,
          dateFrom: searchParams.get('dateFrom') || undefined,
          dateTo: searchParams.get('dateTo') || undefined,
          sortBy: (searchParams.get('sortBy') as any) || 'relevance',
          sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
          page: parseInt(searchParams.get('page') || '1'),
          limit: parseInt(searchParams.get('limit') || '20'),
        };

        const result = await performHybridSearch(searchRequest, session.user.id);

        return NextResponse.json({
          success: true,
          data: result,
        });
      }

      case 'semantic': {
        const query = searchParams.get('query');
        if (!query) {
          throw new AppError('Query is required for semantic search', 400);
        }

        const options = {
          query,
          threshold: parseFloat(searchParams.get('threshold') || '0.7'),
          limit: parseInt(searchParams.get('limit') || '20'),
          includeContent: searchParams.get('includeContent') !== 'false',
          includeSummaries: searchParams.get('includeSummaries') !== 'false',
          resourceTypes: searchParams.get('resourceTypes') ? searchParams.get('resourceTypes')!.split(',') as any[] : undefined,
          folderIds: searchParams.get('folderIds') ? searchParams.get('folderIds')!.split(',') : undefined,
        };

        const validatedOptions = semanticSearchSchema.parse(options);
        const results = await performSemanticSearch(
          validatedOptions.query,
          session.user.id,
          validatedOptions
        );

        return NextResponse.json({
          success: true,
          data: { results },
        });
      }

      case 'discover': {
        const options = {
          basedOn: (searchParams.get('basedOn') as any) || 'recommendations',
          limit: parseInt(searchParams.get('limit') || '10'),
          excludeIds: searchParams.get('excludeIds') ? searchParams.get('excludeIds')!.split(',') : [],
        };

        const validatedOptions = discoverySchema.parse(options);
        const discoveries = await discoverResources(session.user.id, validatedOptions);

        return NextResponse.json({
          success: true,
          data: { discoveries },
        });
      }

      case 'suggestions': {
        const query = searchParams.get('query');
        if (!query) {
          throw new AppError('Query is required for suggestions', 400);
        }

        const limit = parseInt(searchParams.get('limit') || '5');
        const suggestions = await getSearchSuggestions(query, session.user.id, limit);

        return NextResponse.json({
          success: true,
          data: { suggestions },
        });
      }

      default:
        throw new AppError('Invalid search type. Supported types: hybrid, semantic, discover, suggestions', 400);
    }

  } catch (error) {
    console.error('Resource search error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// POST - Perform complex searches with detailed parameters
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const { searchType } = body;

    switch (searchType) {
      case 'hybrid': {
        const validatedData = searchSchema.parse(body);
        const searchRequest: ResourceSearchRequest = validatedData;

        const result = await performHybridSearch(searchRequest, session.user.id);

        return NextResponse.json({
          success: true,
          data: result,
        });
      }

      case 'semantic': {
        const validatedData = semanticSearchSchema.parse(body);
        
        const results = await performSemanticSearch(
          validatedData.query,
          session.user.id,
          validatedData
        );

        return NextResponse.json({
          success: true,
          data: { results },
        });
      }

      case 'discover': {
        const validatedData = discoverySchema.parse(body);
        
        const discoveries = await discoverResources(session.user.id, validatedData);

        return NextResponse.json({
          success: true,
          data: { discoveries },
        });
      }

      case 'batch': {
        // Perform multiple search types in one request
        const { searches } = body;
        
        if (!Array.isArray(searches) || searches.length === 0) {
          throw new AppError('Searches array is required for batch search', 400);
        }

        const results = await Promise.all(
          searches.map(async (search: any) => {
            try {
              switch (search.type) {
                case 'semantic':
                  const semanticResults = await performSemanticSearch(
                    search.query,
                    session.user.id,
                    search.options || {}
                  );
                  return { type: 'semantic', results: semanticResults };
                
                case 'discover':
                  const discoveries = await discoverResources(
                    session.user.id,
                    search.options || {}
                  );
                  return { type: 'discover', results: discoveries };
                
                default:
                  return { type: search.type, error: 'Unsupported search type' };
              }
            } catch (error) {
              return { 
                type: search.type, 
                error: error instanceof Error ? error.message : 'Unknown error' 
              };
            }
          })
        );

        return NextResponse.json({
          success: true,
          data: { results },
        });
      }

      default:
        throw new AppError('Invalid search type. Supported types: hybrid, semantic, discover, batch', 400);
    }

  } catch (error) {
    console.error('Resource search POST error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
