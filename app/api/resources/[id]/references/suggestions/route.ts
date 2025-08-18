/**
 * Reference Suggestions API Route
 * 
 * Provides AI-powered suggestions for resource references based on
 * content similarity and user behavior patterns.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { suggestReferences } from '@/lib/reference-tracking';
import { AppError, handleApiError } from '@/lib/utils';

// Validation schema
const suggestionsSchema = z.object({
  threshold: z.number().min(0).max(1).default(0.7),
  limit: z.number().min(1).max(50).default(10),
  includeProjects: z.boolean().default(true),
  includeAreas: z.boolean().default(true),
  includeNotes: z.boolean().default(true),
  includeResources: z.boolean().default(true),
});

// GET - Get reference suggestions for a resource
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
    const { searchParams } = new URL(request.url);
    
    const options = {
      threshold: parseFloat(searchParams.get('threshold') || '0.7'),
      limit: parseInt(searchParams.get('limit') || '10'),
      includeProjects: searchParams.get('includeProjects') !== 'false',
      includeAreas: searchParams.get('includeAreas') !== 'false',
      includeNotes: searchParams.get('includeNotes') !== 'false',
      includeResources: searchParams.get('includeResources') !== 'false',
    };

    // Validate options
    const validatedOptions = suggestionsSchema.parse(options);

    const suggestions = await suggestReferences(resourceId, session.user.id, validatedOptions);

    return NextResponse.json({
      success: true,
      data: { suggestions },
    });

  } catch (error) {
    console.error('Get reference suggestions error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
