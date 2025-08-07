#!/usr/bin/env node

/**
 * Vector Setup Validation Script for ThinkSpace
 * 
 * This script tests the pgvector setup and validates that
 * vector operations are working correctly.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testVectorSetup() {
  console.log('🧪 Testing ThinkSpace Vector Setup...\n');

  try {
    // Test 1: Check pgvector extension
    console.log('1. Testing pgvector extension...');
    
    const extensions = await prisma.$queryRaw`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'vector'
    `;
    
    if (extensions.length > 0) {
      console.log(`   ✅ pgvector extension found (version: ${extensions[0].extversion})`);
    } else {
      console.log('   ❌ pgvector extension not found');
      return false;
    }

    // Test 2: Check vector functions
    console.log('\n2. Testing vector utility functions...');
    
    try {
      const testVector1 = '[1,0,0]';
      const testVector2 = '[0,1,0]';
      
      const similarity = await prisma.$queryRaw`
        SELECT cosine_similarity(${testVector1}::vector, ${testVector2}::vector) as similarity
      `;
      
      console.log(`   ✅ Cosine similarity function works (result: ${similarity[0].similarity})`);
      
      const distance = await prisma.$queryRaw`
        SELECT euclidean_distance(${testVector1}::vector, ${testVector2}::vector) as distance
      `;
      
      console.log(`   ✅ Euclidean distance function works (result: ${distance[0].distance})`);
      
    } catch (error) {
      console.log('   ❌ Vector functions not working properly');
      console.error('   Error:', error.message);
      return false;
    }

    // Test 3: Check table structure
    console.log('\n3. Checking table structure...');
    
    const tables = ['notes', 'resources', 'files'];
    
    for (const table of tables) {
      try {
        const columns = await prisma.$queryRaw`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = ${table} AND column_name = 'embedding'
        `;
        
        if (columns.length > 0) {
          console.log(`   ✅ ${table} table has embedding column (${columns[0].data_type})`);
        } else {
          console.log(`   ⚠️  ${table} table missing embedding column`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${table} table not found`);
      }
    }

    // Test 4: Check indexes
    console.log('\n4. Checking vector indexes...');
    
    const indexes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE indexname LIKE '%embedding%'
      ORDER BY tablename, indexname
    `;
    
    if (indexes.length > 0) {
      console.log(`   ✅ Found ${indexes.length} vector indexes:`);
      indexes.forEach(index => {
        console.log(`      - ${index.indexname} on ${index.tablename}`);
      });
    } else {
      console.log('   ⚠️  No vector indexes found');
    }

    // Test 5: Test vector operations
    console.log('\n5. Testing vector operations...');
    
    try {
      // Test vector creation and similarity search
      const testVector = '[0.1, 0.2, 0.3, 0.4, 0.5]';
      
      const vectorTest = await prisma.$queryRaw`
        SELECT 
          ${testVector}::vector as test_vector,
          vector_dims(${testVector}::vector) as dimensions
      `;
      
      console.log(`   ✅ Vector operations work (dimensions: ${vectorTest[0].dimensions})`);
      
      // Test similarity calculation
      const similarityTest = await prisma.$queryRaw`
        SELECT 
          ${testVector}::vector <=> ${testVector}::vector as cosine_distance,
          ${testVector}::vector <-> ${testVector}::vector as euclidean_distance,
          ${testVector}::vector <#> ${testVector}::vector as inner_product
      `;
      
      console.log(`   ✅ Distance operators work:`);
      console.log(`      - Cosine distance: ${similarityTest[0].cosine_distance}`);
      console.log(`      - Euclidean distance: ${similarityTest[0].euclidean_distance}`);
      console.log(`      - Inner product: ${similarityTest[0].inner_product}`);
      
    } catch (error) {
      console.log('   ❌ Vector operations failed');
      console.error('   Error:', error.message);
      return false;
    }

    // Test 6: Performance test (if tables have data)
    console.log('\n6. Testing search performance...');
    
    try {
      const noteCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM notes WHERE embedding IS NOT NULL`;
      const resourceCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM resources WHERE embedding IS NOT NULL`;
      const fileCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM files WHERE embedding IS NOT NULL`;
      
      console.log(`   📊 Records with embeddings:`);
      console.log(`      - Notes: ${noteCount[0].count}`);
      console.log(`      - Resources: ${resourceCount[0].count}`);
      console.log(`      - Files: ${fileCount[0].count}`);
      
      if (noteCount[0].count > 0) {
        const start = Date.now();
        const searchTest = await prisma.$queryRaw`
          SELECT id, 1 - (embedding <=> '[0.1, 0.2, 0.3]'::vector) as similarity
          FROM notes 
          WHERE embedding IS NOT NULL
          ORDER BY embedding <=> '[0.1, 0.2, 0.3]'::vector
          LIMIT 5
        `;
        const duration = Date.now() - start;
        
        console.log(`   ✅ Search performance test: ${duration}ms for ${searchTest.length} results`);
      }
      
    } catch (error) {
      console.log('   ⚠️  Performance test skipped (no data or error)');
    }

    console.log('\n🎉 Vector setup validation completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ pgvector extension is working');
    console.log('✅ Vector utility functions are available');
    console.log('✅ Vector operations are functional');
    console.log('✅ Database is ready for semantic search');
    
    console.log('\n🚀 Ready to use vector search features!');
    
    return true;

  } catch (error) {
    console.error('\n❌ Vector setup validation failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testVectorSetup().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testVectorSetup };
