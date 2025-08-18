/**
 * Resource References API Routes
 * 
 * Handles CRUD operations for resource references including
 * bi-directional tracking and reference analytics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import {
  createResourceReference,
  getResourceReferences,
  deleteResourceReference,
  updateResourceReference,
  suggestReferences
} from '@/lib/reference-tracking';
import { AppError, handleApiError } from '@/lib/utils';
import type { CreateReferenceRequest } from '@/types/resources';

// Validation schemas
const createReferenceSchema = z.object({
  referencedResourceId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  areaId: z.string().cuid().optional(),
  noteId: z.string().cuid().optional(),
  context: z.string().optional(),
  snippet: z.string().optional(),
  referenceType: z.enum(['MANUAL', 'AI_SUGGESTED', 'AUTO_GENERATED', 'CITATION', 'MENTION', 'RELATED']).default('MANUAL'),
}).refine(
  (data) => !!(data.referencedResourceId || data.projectId || data.areaId || data.noteId),
  {
    message: "At least one reference target must be specified",
  }
);

const updateReferenceSchema = z.object({
  context: z.string().optional(),
  snippet: z.string().optional(),
  referenceType: z.enum(['MANUAL', 'AI_SUGGESTED', 'AUTO_GENERATED', 'CITATION', 'MENTION', 'RELATED']).optional(),
});

// GET - List references for a resource
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
    
    const includeIncoming = searchParams.get('includeIncoming') !== 'false';
    const includeOutgoing = searchParams.get('includeOutgoing') !== 'false';
    const referenceType = searchParams.get('referenceType') as any;
    const limit = parseInt(searchParams.get('limit') || '50');

    const references = await getResourceReferences(resourceId, session.user.id, {
      includeIncoming,
      includeOutgoing,
      referenceType,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: { references },
    });

  } catch (error) {
    console.error('Get resource references error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// POST - Create new reference
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
    const validatedData = createReferenceSchema.parse(body);

    // Create reference request
    const referenceRequest: CreateReferenceRequest = {
      resourceId,
      ...validatedData,
    };

    const reference = await createResourceReference(referenceRequest, session.user.id);

    return NextResponse.json({
      success: true,
      data: { reference },
    });

  } catch (error) {
    console.error('Create resource reference error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// PUT - Update reference
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const { referenceId, ...updateData } = body;
    
    if (!referenceId) {
      throw new AppError('Reference ID is required', 400);
    }

    // Validate update data
    const validatedData = updateReferenceSchema.parse(updateData);

    const updatedReference = await updateResourceReference(
      referenceId,
      validatedData,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: { reference: updatedReference },
    });

  } catch (error) {
    console.error('Update resource reference error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// DELETE - Delete reference
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const referenceId = searchParams.get('referenceId');

    if (!referenceId) {
      throw new AppError('Reference ID is required', 400);
    }

    await deleteResourceReference(referenceId, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Reference deleted successfully',
    });

  } catch (error) {
    console.error('Delete resource reference error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
