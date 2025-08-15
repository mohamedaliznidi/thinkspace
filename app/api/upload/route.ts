/**
 * File Upload API Routes for ThinkSpace
 * 
 * This API handles file uploads with processing, validation,
 * and integration with the resource management system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';
import { generateEmbedding } from '@/lib/vector';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// File type validation
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// POST - Upload file
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const projectId = formData.get('projectId') as string;
    const areaId = formData.get('areaId') as string;
    const tags = formData.get('tags') as string;

    if (!file) {
      throw new AppError('No file provided', 400);
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new AppError('File type not allowed', 400);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new AppError('File size too large. Maximum size is 10MB', 400);
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${originalName}`;
    const filePath = join(uploadDir, fileName);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Extract content for text files (simplified)
    let extractedContent = '';
    if (file.type === 'text/plain' || file.type === 'text/markdown') {
      extractedContent = buffer.toString('utf-8');
    }

    // Determine resource type based on file type
    let resourceType = 'OTHER';
    if (file.type.startsWith('image/')) {
      resourceType = 'IMAGE';
    } else if (file.type === 'application/pdf') {
      resourceType = 'DOCUMENT';
    } else if (file.type.includes('word') || file.type.includes('excel') || file.type.includes('powerpoint')) {
      resourceType = 'DOCUMENT';
    }

    // Generate embedding for search
    const embeddingText = [
      title || file.name,
      description || '',
      extractedContent,
    ].filter(Boolean).join(' ');
    
    const embedding = await generateEmbedding(embeddingText);

    // Create resource record
    const resource = await prisma.resource.create({
      data: {
        title: title || file.name,
        description: description || undefined,
        type: resourceType as any,
        filePath: `/uploads/${fileName}`,
        userId: session.user.id,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      },
      include: {
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        areas: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
      },
    });

    // Log file upload
    console.log(`File uploaded: ${resource.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: { resource },
      message: 'File uploaded successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('File upload error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// GET - List uploaded files
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const fileType = searchParams.get('fileType');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: session.user.id,
      filePath: { not: null }, // Only files, not links
      ...(fileType && { fileType: { contains: fileType } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { fileName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Get files with related data
    const [files, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        include: {
          projects: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          areas: {
            select: {
              id: true,
              title: true,
              color: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.resource.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        files,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('Get files error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
  }, { status: 405 });
}
