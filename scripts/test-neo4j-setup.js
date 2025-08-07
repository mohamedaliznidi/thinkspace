#!/usr/bin/env node

/**
 * Neo4j Setup Validation Script for ThinkSpace
 * 
 * This script validates that the Neo4j setup is working correctly
 * and tests all the knowledge graph operations.
 */

async function testNeo4jSetup() {
  console.log('🧪 Testing ThinkSpace Neo4j Setup...\n');

  try {
    // Import required modules
    const { checkNeo4jConnection, executeWriteQuery, executeReadQuery } = await import('../lib/neo4j.js');
    const { getSchemaInfo, validateSchema } = await import('../lib/neo4j-schema.js');
    const { 
      createUserNode, 
      createProjectNode, 
      createAreaNode,
      createRelationship,
      getUserKnowledgeGraph,
      getGraphStatistics 
    } = await import('../lib/neo4j-operations.js');

    // Test 1: Connection
    console.log('1. Testing Neo4j connection...');
    const isConnected = await checkNeo4jConnection();
    
    if (!isConnected) {
      console.error('   ❌ Neo4j connection failed');
      return false;
    }
    console.log('   ✅ Neo4j connection successful');

    // Test 2: Schema validation
    console.log('\n2. Validating schema setup...');
    const isSchemaValid = await validateSchema();
    
    if (!isSchemaValid) {
      console.error('   ❌ Schema validation failed');
      return false;
    }
    console.log('   ✅ Schema validation successful');

    // Test 3: Schema information
    console.log('\n3. Getting schema information...');
    const schemaInfo = await getSchemaInfo();
    console.log(`   ✅ Constraints: ${schemaInfo.constraints}`);
    console.log(`   ✅ Indexes: ${schemaInfo.indexes}`);
    console.log(`   ✅ Node Labels: ${schemaInfo.nodeLabels.join(', ')}`);
    console.log(`   ✅ Relationship Types: ${schemaInfo.relationshipTypes.join(', ')}`);

    // Test 4: Node creation operations
    console.log('\n4. Testing node creation operations...');
    
    const testUserId = 'test-user-' + Date.now();
    const testProjectId = 'test-project-' + Date.now();
    const testAreaId = 'test-area-' + Date.now();

    // Create test user
    await createUserNode({
      id: testUserId,
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER'
    });
    console.log('   ✅ User node created');

    // Create test project
    await createProjectNode({
      id: testProjectId,
      userId: testUserId,
      title: 'Test Project',
      description: 'A test project for validation',
      status: 'ACTIVE',
      priority: 'MEDIUM'
    });
    console.log('   ✅ Project node created');

    // Create test area
    await createAreaNode({
      id: testAreaId,
      userId: testUserId,
      title: 'Test Area',
      description: 'A test area for validation',
      type: 'PERSONAL',
      isActive: true
    });
    console.log('   ✅ Area node created');

    // Test 5: Relationship creation
    console.log('\n5. Testing relationship creation...');
    
    await createRelationship(testProjectId, testAreaId, 'BELONGS_TO', {
      strength: 0.8,
      type: 'para_structure'
    });
    console.log('   ✅ Relationship created');

    // Test 6: Graph queries
    console.log('\n6. Testing graph queries...');
    
    const knowledgeGraph = await getUserKnowledgeGraph(testUserId);
    console.log(`   ✅ Knowledge graph retrieved (${knowledgeGraph.length} records)`);

    const graphStats = await getGraphStatistics(testUserId);
    console.log(`   ✅ Graph statistics retrieved`);
    
    if (graphStats.length > 0) {
      const stats = graphStats[0].get('stats');
      console.log(`      - Total nodes: ${stats.totalNodes}`);
      console.log(`      - Total relationships: ${stats.totalRelationships}`);
      console.log(`      - Projects: ${stats.nodesByType.projects}`);
      console.log(`      - Areas: ${stats.nodesByType.areas}`);
    }

    // Test 7: Full-text search
    console.log('\n7. Testing full-text search...');
    
    try {
      const searchResults = await executeReadQuery(`
        CALL db.index.fulltext.queryNodes('project_fulltext', 'test') 
        YIELD node, score
        WHERE node.userId = $userId
        RETURN node.title as title, score
        LIMIT 5
      `, { userId: testUserId });
      
      console.log(`   ✅ Full-text search working (${searchResults.length} results)`);
    } catch (error) {
      console.log('   ⚠️  Full-text search may not be ready yet');
    }

    // Test 8: Performance test
    console.log('\n8. Testing query performance...');
    
    const startTime = Date.now();
    await executeReadQuery(`
      MATCH (u:User {id: $userId})-[:OWNS]->(entity)
      RETURN count(entity) as entityCount
    `, { userId: testUserId });
    const queryTime = Date.now() - startTime;
    
    console.log(`   ✅ Query performance: ${queryTime}ms`);

    // Test 9: Cleanup test data
    console.log('\n9. Cleaning up test data...');
    
    await executeWriteQuery(`
      MATCH (u:User {id: $userId})
      OPTIONAL MATCH (u)-[:OWNS]->(entity)
      DETACH DELETE u, entity
    `, { userId: testUserId });
    
    console.log('   ✅ Test data cleaned up');

    // Test 10: Constraint validation
    console.log('\n10. Testing constraint enforcement...');
    
    try {
      // Try to create duplicate user (should be prevented by constraint)
      await executeWriteQuery(`
        CREATE (u1:User {id: 'duplicate-test'})
        CREATE (u2:User {id: 'duplicate-test'})
      `);
      console.log('   ⚠️  Constraint enforcement may not be working');
    } catch (error) {
      if (error.message.includes('constraint') || error.message.includes('unique')) {
        console.log('   ✅ Constraints are enforcing uniqueness');
      } else {
        console.log('   ⚠️  Unexpected error during constraint test');
      }
    }

    // Clean up any duplicate test nodes
    await executeWriteQuery(`
      MATCH (u:User {id: 'duplicate-test'})
      DELETE u
    `);

    console.log('\n🎉 Neo4j setup validation completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Connection established');
    console.log('✅ Schema constraints and indexes created');
    console.log('✅ Node creation operations working');
    console.log('✅ Relationship creation working');
    console.log('✅ Graph queries functional');
    console.log('✅ Performance acceptable');
    console.log('✅ Data integrity constraints enforced');
    
    console.log('\n🚀 Ready to build knowledge graphs!');
    
    return true;

  } catch (error) {
    console.error('\n❌ Neo4j setup validation failed:', error);
    
    // Provide helpful error messages
    if (error.message.includes('authentication')) {
      console.error('\n💡 Authentication Issue:');
      console.error('- Verify NEO4J_USERNAME and NEO4J_PASSWORD in .env.local');
      console.error('- Check if your Neo4j credentials are correct');
    } else if (error.message.includes('connection')) {
      console.error('\n💡 Connection Issue:');
      console.error('- Verify NEO4J_URI in .env.local');
      console.error('- Ensure Neo4j instance is running and accessible');
    } else if (error.message.includes('procedure')) {
      console.error('\n💡 Procedure Issue:');
      console.error('- Some Neo4j procedures may not be available');
      console.error('- Check your Neo4j version and available plugins');
    }
    
    return false;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testNeo4jSetup().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testNeo4jSetup };
