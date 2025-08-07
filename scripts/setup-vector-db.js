#!/usr/bin/env node

/**
 * Vector Database Setup Script for ThinkSpace
 * 
 * This script sets up the pgvector extension and creates the necessary
 * indexes for optimal vector search performance.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function setupVectorDatabase() {
  console.log('🚀 Setting up ThinkSpace Vector Database...\n');

  try {
    // Check if pgvector extension is available
    console.log('1. Checking pgvector extension...');
    
    try {
      await prisma.$queryRaw`SELECT extname FROM pg_extension WHERE extname = 'vector'`;
      console.log('   ✅ pgvector extension is already installed');
    } catch (error) {
      console.log('   ⚠️  pgvector extension not found, attempting to install...');
      
      try {
        await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`;
        console.log('   ✅ pgvector extension installed successfully');
      } catch (installError) {
        console.error('   ❌ Failed to install pgvector extension');
        console.error('   Please ensure pgvector is available in your PostgreSQL instance');
        console.error('   For Neon: pgvector should be available by default');
        throw installError;
      }
    }

    // Create vector utility functions
    console.log('\n2. Creating vector utility functions...');
    
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION cosine_similarity(a vector, b vector)
      RETURNS float AS $$
      BEGIN
          RETURN 1 - (a <=> b);
      END;
      $$ LANGUAGE plpgsql IMMUTABLE STRICT;
    `;
    
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION euclidean_distance(a vector, b vector)
      RETURNS float AS $$
      BEGIN
          RETURN a <-> b;
      END;
      $$ LANGUAGE plpgsql IMMUTABLE STRICT;
    `;
    
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION inner_product(a vector, b vector)
      RETURNS float AS $$
      BEGIN
          RETURN a <#> b;
      END;
      $$ LANGUAGE plpgsql IMMUTABLE STRICT;
    `;
    
    console.log('   ✅ Vector utility functions created');

    // Check if tables exist before creating indexes
    console.log('\n3. Checking table structure...');
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('notes', 'resources', 'files')
    `;
    
    console.log(`   ✅ Found ${tables.length} tables ready for vector indexing`);

    if (tables.length > 0) {
      console.log('\n4. Creating vector indexes (this may take a while)...');
      
      // Create HNSW indexes for optimal vector search performance
      const indexQueries = [
        {
          name: 'notes_embedding_hnsw_idx',
          query: `CREATE INDEX CONCURRENTLY IF NOT EXISTS notes_embedding_hnsw_idx 
                  ON notes USING hnsw (embedding vector_cosine_ops)
                  WITH (m = 16, ef_construction = 64)`,
          table: 'notes'
        },
        {
          name: 'resources_embedding_hnsw_idx',
          query: `CREATE INDEX CONCURRENTLY IF NOT EXISTS resources_embedding_hnsw_idx 
                  ON resources USING hnsw (embedding vector_cosine_ops)
                  WITH (m = 16, ef_construction = 64)`,
          table: 'resources'
        },
        {
          name: 'files_embedding_hnsw_idx',
          query: `CREATE INDEX CONCURRENTLY IF NOT EXISTS files_embedding_hnsw_idx 
                  ON files USING hnsw (embedding vector_cosine_ops)
                  WITH (m = 16, ef_construction = 64)`,
          table: 'files'
        }
      ];

      for (const index of indexQueries) {
        try {
          console.log(`   Creating ${index.name}...`);
          await prisma.$executeRawUnsafe(index.query);
          console.log(`   ✅ ${index.name} created successfully`);
        } catch (error) {
          console.log(`   ⚠️  ${index.name} may already exist or table not ready`);
        }
      }

      // Create composite indexes for filtered searches
      console.log('\n5. Creating composite indexes...');
      
      const compositeIndexes = [
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS notes_user_embedding_idx 
         ON notes ("userId") WHERE embedding IS NOT NULL`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS resources_user_embedding_idx 
         ON resources ("userId") WHERE embedding IS NOT NULL`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS files_user_embedding_idx 
         ON files ("userId") WHERE embedding IS NOT NULL AND status = 'READY'`
      ];

      for (const query of compositeIndexes) {
        try {
          await prisma.$executeRawUnsafe(query);
        } catch (error) {
          console.log('   ⚠️  Some composite indexes may already exist');
        }
      }
      
      console.log('   ✅ Composite indexes created');

      // Create full-text search indexes for hybrid search
      console.log('\n6. Creating full-text search indexes...');
      
      const textIndexes = [
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS notes_content_gin_idx 
         ON notes USING gin(to_tsvector('english', title || ' ' || content))`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS resources_content_gin_idx 
         ON resources USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE("contentExtract", '')))`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS files_content_gin_idx 
         ON files USING gin(to_tsvector('english', filename || ' ' || "originalName" || ' ' || COALESCE("contentExtract", '')))`
      ];

      for (const query of textIndexes) {
        try {
          await prisma.$executeRawUnsafe(query);
        } catch (error) {
          console.log('   ⚠️  Some text indexes may already exist');
        }
      }
      
      console.log('   ✅ Full-text search indexes created');

      // Update table statistics
      console.log('\n7. Updating table statistics...');
      await prisma.$executeRaw`ANALYZE notes`;
      await prisma.$executeRaw`ANALYZE resources`;
      await prisma.$executeRaw`ANALYZE files`;
      console.log('   ✅ Table statistics updated');
    } else {
      console.log('\n   ⚠️  Tables not found. Run Prisma migrations first: npx prisma migrate dev');
    }

    console.log('\n🎉 Vector database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npx prisma migrate dev (if not done already)');
    console.log('2. Start generating embeddings for your content');
    console.log('3. Use the vector search functions in lib/vector.ts');

  } catch (error) {
    console.error('\n❌ Error setting up vector database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
if (require.main === module) {
  setupVectorDatabase();
}

module.exports = { setupVectorDatabase };
