#!/usr/bin/env node

/**
 * Neo4j Schema Setup Script for ThinkSpace
 * 
 * This script sets up the Neo4j schema with constraints, indexes,
 * and validates the knowledge graph structure.
 */

const { checkNeo4jConnection } = require('../lib/neo4j');

// Import schema functions (we'll use dynamic import since it's TypeScript)
async function setupNeo4jSchema() {
  console.log('🚀 Setting up ThinkSpace Neo4j Schema...\n');

  try {
    // Check Neo4j connection first
    console.log('1. Checking Neo4j connection...');
    const isConnected = await checkNeo4jConnection();
    
    if (!isConnected) {
      console.error('❌ Cannot connect to Neo4j database');
      console.error('Please check your Neo4j connection settings in .env.local');
      process.exit(1);
    }

    // Import the schema setup functions
    const { setupNeo4jSchema: setupSchema } = await import('../lib/neo4j-schema.js');
    
    // Run the schema setup
    await setupSchema();
    
    console.log('\n🎉 Neo4j schema setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start creating PARA entities in your application');
    console.log('2. The knowledge graph will automatically build relationships');
    console.log('3. Use the graph visualization features to explore connections');

  } catch (error) {
    console.error('\n❌ Error setting up Neo4j schema:', error);
    
    if (error.message.includes('authentication')) {
      console.error('\n💡 Authentication Error:');
      console.error('- Check your NEO4J_USERNAME and NEO4J_PASSWORD in .env.local');
      console.error('- Ensure your Neo4j instance is running and accessible');
    } else if (error.message.includes('connection')) {
      console.error('\n💡 Connection Error:');
      console.error('- Check your NEO4J_URI in .env.local');
      console.error('- Ensure your Neo4j instance is running');
      console.error('- For Neo4j AuraDB, check your connection string format');
    } else if (error.message.includes('permission')) {
      console.error('\n💡 Permission Error:');
      console.error('- Ensure your Neo4j user has admin privileges');
      console.error('- Some operations require database admin access');
    }
    
    process.exit(1);
  }
}

// Test Neo4j operations
async function testNeo4jOperations() {
  console.log('\n🧪 Testing Neo4j operations...');

  try {
    const { executeWriteQuery, executeReadQuery } = await import('../lib/neo4j.js');

    // Test basic write operation
    console.log('   Testing write operations...');
    await executeWriteQuery(`
      CREATE (test:TestNode {
        id: 'test-' + randomUUID(),
        name: 'Test Node',
        createdAt: datetime()
      })
    `);

    // Test basic read operation
    console.log('   Testing read operations...');
    const testNodes = await executeReadQuery(`
      MATCH (test:TestNode)
      WHERE test.id STARTS WITH 'test-'
      RETURN count(test) as count
    `);

    console.log(`   ✅ Found ${testNodes[0].get('count')} test nodes`);

    // Clean up test nodes
    console.log('   Cleaning up test data...');
    await executeWriteQuery(`
      MATCH (test:TestNode)
      WHERE test.id STARTS WITH 'test-'
      DELETE test
    `);

    console.log('   ✅ Neo4j operations test completed successfully');

  } catch (error) {
    console.error('   ❌ Neo4j operations test failed:', error);
    throw error;
  }
}

// Get database information
async function getDatabaseInfo() {
  console.log('\n📊 Getting Neo4j database information...');

  try {
    const { executeReadQuery } = await import('../lib/neo4j.js');

    // Get Neo4j version
    const versionResult = await executeReadQuery(`
      CALL dbms.components() YIELD name, versions, edition
      WHERE name = 'Neo4j Kernel'
      RETURN name, versions[0] as version, edition
    `);

    if (versionResult.length > 0) {
      const version = versionResult[0];
      console.log(`   Neo4j Version: ${version.get('version')} (${version.get('edition')})`);
    }

    // Get database statistics
    const statsResult = await executeReadQuery(`
      MATCH (n)
      OPTIONAL MATCH (n)-[r]-()
      RETURN 
        count(DISTINCT n) as nodeCount,
        count(DISTINCT r) as relationshipCount,
        collect(DISTINCT labels(n)) as nodeLabels
    `);

    if (statsResult.length > 0) {
      const stats = statsResult[0];
      console.log(`   Total Nodes: ${stats.get('nodeCount')}`);
      console.log(`   Total Relationships: ${stats.get('relationshipCount')}`);
      
      const labels = stats.get('nodeLabels').flat().filter(label => label);
      if (labels.length > 0) {
        console.log(`   Node Labels: ${labels.join(', ')}`);
      }
    }

    // Get constraint information
    const constraints = await executeReadQuery(`SHOW CONSTRAINTS`);
    console.log(`   Constraints: ${constraints.length}`);

    // Get index information
    const indexes = await executeReadQuery(`SHOW INDEXES`);
    console.log(`   Indexes: ${indexes.length}`);

  } catch (error) {
    console.error('   ❌ Error getting database info:', error);
  }
}

// Main execution
async function main() {
  try {
    await setupNeo4jSchema();
    await testNeo4jOperations();
    await getDatabaseInfo();
    
    console.log('\n🎉 All Neo4j setup and tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  setupNeo4jSchema,
  testNeo4jOperations,
  getDatabaseInfo,
};
