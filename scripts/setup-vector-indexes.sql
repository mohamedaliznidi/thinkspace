-- =============================================================================
-- THINKSPACE VECTOR INDEXES SETUP
-- =============================================================================
-- This script creates optimized vector indexes for semantic search
-- Run this after the main Prisma migration is complete

-- Create HNSW indexes for better vector search performance
-- HNSW (Hierarchical Navigable Small World) is optimal for high-dimensional vectors

-- Notes table vector index
CREATE INDEX CONCURRENTLY IF NOT EXISTS notes_embedding_hnsw_idx 
ON notes USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Resources table vector index  
CREATE INDEX CONCURRENTLY IF NOT EXISTS resources_embedding_hnsw_idx 
ON resources USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Files table vector index
CREATE INDEX CONCURRENTLY IF NOT EXISTS files_embedding_hnsw_idx 
ON files USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create IVFFlat indexes as alternative (good for exact searches)
-- Uncomment these if you prefer IVFFlat over HNSW

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS notes_embedding_ivfflat_idx 
-- ON notes USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS resources_embedding_ivfflat_idx 
-- ON resources USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS files_embedding_ivfflat_idx 
-- ON files USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

-- Create composite indexes for filtered vector searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS notes_user_embedding_idx 
ON notes ("userId") 
WHERE embedding IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS resources_user_embedding_idx 
ON resources ("userId") 
WHERE embedding IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS files_user_embedding_idx 
ON files ("userId") 
WHERE embedding IS NOT NULL AND status = 'READY';

-- Create indexes for hybrid search (combining vector and text search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS notes_content_gin_idx 
ON notes USING gin(to_tsvector('english', title || ' ' || content));

CREATE INDEX CONCURRENTLY IF NOT EXISTS resources_content_gin_idx 
ON resources USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE("contentExtract", '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS files_content_gin_idx 
ON files USING gin(to_tsvector('english', filename || ' ' || "originalName" || ' ' || COALESCE("contentExtract", '')));

-- Analyze tables to update statistics
ANALYZE notes;
ANALYZE resources;
ANALYZE files;
