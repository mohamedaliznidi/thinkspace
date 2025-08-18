/**
 * Resource File Upload API Route
 * 
 * Handles file uploads with content extraction and automatic
 * resource creation from various file types.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createResourceFromFile } from '@/lib/resource-input';
import { AppError, handleApiError } from '@/lib/utils';
import type { ResourceImportOptions } from '@/types/resources';

// Supported file types and size limits
const SUPPORTED_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/json',
  'application/xml',
  'text/xml',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 10; // Maximum files per upload

// POST - Upload and process files
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    // Parse multipart form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const folderId = formData.get('folderId') as string | null;
    const tags = formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [];
    const generateSummary = formData.get('generateSummary') === 'true';
    const extractMetadata = formData.get('extractMetadata') !== 'false';
    const detectDuplicates = formData.get('detectDuplicates') !== 'false';

    // Validate files
    if (!files || files.length === 0) {
      throw new AppError('No files provided', 400);
    }

    if (files.length > MAX_FILES) {
      throw new AppError(`Maximum ${MAX_FILES} files allowed per upload`, 400);
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
        }

        // Validate file type
        if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
          throw new Error(`Unsupported file type: ${file.type}`);
        }

        // Prepare import options
        const options: ResourceImportOptions = {
          source: 'file',
          folderId: folderId || undefined,
          tags,
          generateSummary,
          extractMetadata,
          detectDuplicates,
        };

        // Create resource from file
        const resource = await createResourceFromFile(
          file,
          file.name,
          file.type,
          options,
          session.user.id
        );

        results.push({
          filename: file.name,
          resource,
          success: true,
        });

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        errors.push({
          filename: file.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const success = errors.length === 0;
    const response = {
      success,
      data: {
        results,
        summary: {
          totalFiles: files.length,
          successCount: results.length,
          errorCount: errors.length,
        },
        ...(errors.length > 0 && { errors }),
      },
    };

    return NextResponse.json(response, { 
      status: success ? 200 : 207 // 207 Multi-Status for partial success
    });

  } catch (error) {
    console.error('File upload error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// GET - Get supported file types and limits
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        supportedTypes: SUPPORTED_MIME_TYPES,
        maxFileSize: MAX_FILE_SIZE,
        maxFiles: MAX_FILES,
        limits: {
          maxFileSizeMB: MAX_FILE_SIZE / (1024 * 1024),
          maxFilesPerUpload: MAX_FILES,
        },
        typeCategories: {
          documents: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          ],
          text: [
            'text/plain',
            'text/markdown',
            'text/csv',
            'application/json',
            'application/xml',
            'text/xml',
          ],
          images: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
          ],
        },
      },
    });
  } catch (error) {
    console.error('Get upload info error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
