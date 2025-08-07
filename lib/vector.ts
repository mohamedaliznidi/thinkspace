/**
 * Vector Search and Embedding Utilities for ThinkSpace
 * 
 * This file provides utilities for working with vector embeddings,
 * semantic search, and pgvector operations for the ThinkSpace
 * PARA methodology knowledge management system.
 */

import prisma from './prisma';
import { OpenAI } from 'openai';

// Initialize OpenRouter client (compatible with OpenAI API)
const openai = new OpenAI({
  apiKey: "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",
  baseURL: 'https://api.openai.com/v1',
});

// Vector configuration
export const VECTOR_DIMENSIONS = parseInt(process.env.EMBEDDING_DIMENSIONS || '1536');
export const SIMILARITY_THRESHOLD = parseFloat(process.env.VECTOR_SIMILARITY_THRESHOLD || '0.7');
export const MAX_SEARCH_RESULTS = parseInt(process.env.MAX_SEARCH_RESULTS || '20');

// Embedding model configuration
const EMBEDDING_MODEL = process.env.DEFAULT_EMBEDDING_MODEL || 'text-embedding-3-small';

/**
 * Generate text embeddings using OpenRouter
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Clean and prepare text
    const cleanText = text.replace(/\n/g, ' ').trim();
    
    if (!cleanText) {
      throw new Error('Text cannot be empty');
    }

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: cleanText,
    });

    const embedding = response.data[0]?.embedding;
    
    if (!embedding) {
      throw new Error('No embedding returned from API');
    }

    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const cleanTexts = texts.map(text => text.replace(/\n/g, ' ').trim()).filter(Boolean);
    
    if (cleanTexts.length === 0) {
      return [];
    }

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: cleanTexts,
    });

    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert embedding array to pgvector format
 */
export function embeddingToVector(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

/**
 * Vector similarity search for notes
 */
export async function searchSimilarNotes(
  query: string,
  userId: string,
  limit: number = MAX_SEARCH_RESULTS,
  threshold: number = SIMILARITY_THRESHOLD
) {
  try {
    const queryEmbedding = await generateEmbedding(query);
    const vectorString = embeddingToVector(queryEmbedding);

    const results = await prisma.$queryRaw`
      SELECT 
        id,
        title,
        content,
        type,
        tags,
        "createdAt",
        "updatedAt",
        1 - (embedding <=> ${vectorString}::vector) as similarity
      FROM notes 
      WHERE "userId" = ${userId}
        AND embedding IS NOT NULL
        AND 1 - (embedding <=> ${vectorString}::vector) > ${threshold}
      ORDER BY embedding <=> ${vectorString}::vector
      LIMIT ${limit}
    `;

    return results;
  } catch (error) {
    console.error('Error searching similar notes:', error);
    throw error;
  }
}

/**
 * Vector similarity search for resources
 */
export async function searchSimilarResources(
  query: string,
  userId: string,
  limit: number = MAX_SEARCH_RESULTS,
  threshold: number = SIMILARITY_THRESHOLD
) {
  try {
    const queryEmbedding = await generateEmbedding(query);
    const vectorString = embeddingToVector(queryEmbedding);

    const results = await prisma.$queryRaw`
      SELECT 
        id,
        title,
        description,
        type,
        "sourceUrl",
        "contentExtract",
        tags,
        "createdAt",
        "updatedAt",
        1 - (embedding <=> ${vectorString}::vector) as similarity
      FROM resources 
      WHERE "userId" = ${userId}
        AND embedding IS NOT NULL
        AND 1 - (embedding <=> ${vectorString}::vector) > ${threshold}
      ORDER BY embedding <=> ${vectorString}::vector
      LIMIT ${limit}
    `;

    return results;
  } catch (error) {
    console.error('Error searching similar resources:', error);
    throw error;
  }
}

/**
 * Vector similarity search for files
 */
export async function searchSimilarFiles(
  query: string,
  userId: string,
  limit: number = MAX_SEARCH_RESULTS,
  threshold: number = SIMILARITY_THRESHOLD
) {
  try {
    const queryEmbedding = await generateEmbedding(query);
    const vectorString = embeddingToVector(queryEmbedding);

    const results = await prisma.$queryRaw`
      SELECT 
        id,
        filename,
        "originalName",
        "mimeType",
        "contentExtract",
        "createdAt",
        "updatedAt",
        1 - (embedding <=> ${vectorString}::vector) as similarity
      FROM files 
      WHERE "userId" = ${userId}
        AND embedding IS NOT NULL
        AND status = 'READY'
        AND 1 - (embedding <=> ${vectorString}::vector) > ${threshold}
      ORDER BY embedding <=> ${vectorString}::vector
      LIMIT ${limit}
    `;

    return results;
  } catch (error) {
    console.error('Error searching similar files:', error);
    throw error;
  }
}

/**
 * Hybrid search combining vector similarity and full-text search
 */
export async function hybridSearch(
  query: string,
  userId: string,
  options: {
    limit?: number;
    threshold?: number;
    includeNotes?: boolean;
    includeResources?: boolean;
    includeFiles?: boolean;
  } = {}
) {
  const {
    limit = MAX_SEARCH_RESULTS,
    threshold = SIMILARITY_THRESHOLD,
    includeNotes = true,
    includeResources = true,
    includeFiles = true,
  } = options;

  const results: any[] = [];

  try {
    // Perform vector searches in parallel
    const searches = [];

    if (includeNotes) {
      searches.push(
        searchSimilarNotes(query, userId, limit, threshold).then(notes =>
          notes.map((note: any) => ({ ...note, type: 'note' }))
        )
      );
    }

    if (includeResources) {
      searches.push(
        searchSimilarResources(query, userId, limit, threshold).then(resources =>
          resources.map((resource: any) => ({ ...resource, type: 'resource' }))
        )
      );
    }

    if (includeFiles) {
      searches.push(
        searchSimilarFiles(query, userId, limit, threshold).then(files =>
          files.map((file: any) => ({ ...file, type: 'file' }))
        )
      );
    }

    const searchResults = await Promise.all(searches);
    
    // Combine and sort results by similarity
    const combinedResults = searchResults.flat();
    combinedResults.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

    return combinedResults.slice(0, limit);
  } catch (error) {
    console.error('Error performing hybrid search:', error);
    throw error;
  }
}

/**
 * Update embedding for a note
 */
export async function updateNoteEmbedding(noteId: string, content: string) {
  try {
    const embedding = await generateEmbedding(content);
    const vectorString = embeddingToVector(embedding);

    await prisma.$executeRaw`
      UPDATE notes 
      SET embedding = ${vectorString}::vector 
      WHERE id = ${noteId}
    `;
  } catch (error) {
    console.error('Error updating note embedding:', error);
    throw error;
  }
}

/**
 * Update embedding for a resource
 */
export async function updateResourceEmbedding(resourceId: string, content: string) {
  try {
    const embedding = await generateEmbedding(content);
    const vectorString = embeddingToVector(embedding);

    await prisma.$executeRaw`
      UPDATE resources 
      SET embedding = ${vectorString}::vector 
      WHERE id = ${resourceId}
    `;
  } catch (error) {
    console.error('Error updating resource embedding:', error);
    throw error;
  }
}

/**
 * Update embedding for a file
 */
export async function updateFileEmbedding(fileId: string, content: string) {
  try {
    const embedding = await generateEmbedding(content);
    const vectorString = embeddingToVector(embedding);

    await prisma.$executeRaw`
      UPDATE files 
      SET embedding = ${vectorString}::vector 
      WHERE id = ${fileId}
    `;
  } catch (error) {
    console.error('Error updating file embedding:', error);
    throw error;
  }
}

/**
 * Get vector statistics for the database
 */
export async function getVectorStats(userId: string) {
  try {
    const stats = await prisma.$queryRaw`
      SELECT 
        'notes' as table_name,
        COUNT(*) as total_records,
        COUNT(embedding) as records_with_embeddings
      FROM notes 
      WHERE "userId" = ${userId}
      
      UNION ALL
      
      SELECT 
        'resources' as table_name,
        COUNT(*) as total_records,
        COUNT(embedding) as records_with_embeddings
      FROM resources 
      WHERE "userId" = ${userId}
      
      UNION ALL
      
      SELECT 
        'files' as table_name,
        COUNT(*) as total_records,
        COUNT(embedding) as records_with_embeddings
      FROM files 
      WHERE "userId" = ${userId}
    `;

    return stats;
  } catch (error) {
    console.error('Error getting vector stats:', error);
    throw error;
  }
}
