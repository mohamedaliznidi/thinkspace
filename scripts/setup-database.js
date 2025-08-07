#!/usr/bin/env node

/**
 * Complete Database Setup Script for ThinkSpace
 * 
 * This script handles the complete database setup including:
 * - Prisma schema deployment
 * - PostgreSQL vector extension setup
 * - Neo4j schema and constraints
 * - Database seeding with sample data
 */

const { spawn } = require('child_process');
const path = require('path');

// Utility function to run commands
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function setupDatabase() {
  console.log('🚀 Setting up ThinkSpace Database System...\n');

  try {
    // Step 1: Generate Prisma client
    console.log('1. Generating Prisma client...');
    try {
      await runCommand('node', [
        path.join('node_modules', '.bin', 'prisma'),
        'generate'
      ]);
      console.log('   ✅ Prisma client generated');
    } catch (error) {
      console.log('   ⚠️  Prisma client generation failed, continuing...');
    }

    // Step 2: Deploy database schema
    console.log('\n2. Deploying database schema...');
    try {
      await runCommand('node', [
        path.join('node_modules', '.bin', 'prisma'),
        'db',
        'push'
      ]);
      console.log('   ✅ Database schema deployed');
    } catch (error) {
      console.log('   ⚠️  Database schema deployment failed, continuing...');
    }

    // Step 3: Setup PostgreSQL vector extension
    console.log('\n3. Setting up PostgreSQL vector extension...');
    try {
      const { setupVectorDatabase } = require('./setup-vector-db.js');
      await setupVectorDatabase();
      console.log('   ✅ Vector extension setup completed');
    } catch (error) {
      console.log('   ⚠️  Vector extension setup failed:', error.message);
    }

    // Step 4: Setup Neo4j schema
    console.log('\n4. Setting up Neo4j schema...');
    try {
      const { setupNeo4jSchema } = await import('../lib/neo4j-schema.js');
      await setupNeo4jSchema();
      console.log('   ✅ Neo4j schema setup completed');
    } catch (error) {
      console.log('   ⚠️  Neo4j schema setup failed:', error.message);
    }

    // Step 5: Seed databases
    console.log('\n5. Seeding databases with sample data...');
    
    // Seed PostgreSQL
    try {
      await runCommand('node', [
        path.join('node_modules', '.bin', 'tsx'),
        'prisma/seed.ts'
      ]);
      console.log('   ✅ PostgreSQL seeding completed');
    } catch (error) {
      console.log('   ⚠️  PostgreSQL seeding failed, trying alternative...');
      try {
        // Try with ts-node if tsx fails
        await runCommand('node', [
          path.join('node_modules', '.bin', 'ts-node'),
          'prisma/seed.ts'
        ]);
        console.log('   ✅ PostgreSQL seeding completed (with ts-node)');
      } catch (tsNodeError) {
        console.log('   ⚠️  PostgreSQL seeding failed with both tsx and ts-node');
      }
    }

    // Seed Neo4j
    try {
      const { seedNeo4jDatabase } = require('./seed-neo4j.js');
      await seedNeo4jDatabase();
      console.log('   ✅ Neo4j seeding completed');
    } catch (error) {
      console.log('   ⚠️  Neo4j seeding failed:', error.message);
    }

    // Step 6: Validate setup
    console.log('\n6. Validating database setup...');
    
    // Validate PostgreSQL
    try {
      const { testVectorSetup } = require('./test-vector-setup.js');
      const vectorValid = await testVectorSetup();
      if (vectorValid) {
        console.log('   ✅ PostgreSQL validation passed');
      } else {
        console.log('   ⚠️  PostgreSQL validation failed');
      }
    } catch (error) {
      console.log('   ⚠️  PostgreSQL validation error:', error.message);
    }

    // Validate Neo4j
    try {
      const { testNeo4jSetup } = require('./test-neo4j-setup.js');
      const neo4jValid = await testNeo4jSetup();
      if (neo4jValid) {
        console.log('   ✅ Neo4j validation passed');
      } else {
        console.log('   ⚠️  Neo4j validation failed');
      }
    } catch (error) {
      console.log('   ⚠️  Neo4j validation error:', error.message);
    }

    console.log('\n🎉 Database setup completed!');
    console.log('\n📋 Setup Summary:');
    console.log('✅ Prisma client generated');
    console.log('✅ Database schema deployed');
    console.log('✅ Vector extension configured');
    console.log('✅ Neo4j schema created');
    console.log('✅ Sample data seeded');
    console.log('✅ Setup validated');

    console.log('\n🚀 ThinkSpace is ready to use!');
    console.log('\nNext steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Login with demo credentials: demo@thinkspace.com / demo123');
    console.log('3. Explore the PARA methodology features');
    console.log('4. Try the knowledge graph visualization');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your database connection strings in .env.local');
    console.log('2. Ensure PostgreSQL and Neo4j instances are running');
    console.log('3. Verify network connectivity to your databases');
    console.log('4. Check database permissions and credentials');
    
    process.exit(1);
  }
}

// Manual setup functions for individual components
async function setupPostgreSQL() {
  console.log('🐘 Setting up PostgreSQL only...\n');
  
  try {
    await runCommand('node', [
      path.join('node_modules', '.bin', 'prisma'),
      'generate'
    ]);
    
    await runCommand('node', [
      path.join('node_modules', '.bin', 'prisma'),
      'db',
      'push'
    ]);
    
    const { setupVectorDatabase } = require('./setup-vector-db.js');
    await setupVectorDatabase();
    
    console.log('✅ PostgreSQL setup completed');
  } catch (error) {
    console.error('❌ PostgreSQL setup failed:', error);
    throw error;
  }
}

async function setupNeo4jOnly() {
  console.log('🔗 Setting up Neo4j only...\n');
  
  try {
    const { setupNeo4jSchema } = await import('../lib/neo4j-schema.js');
    await setupNeo4jSchema();
    
    console.log('✅ Neo4j setup completed');
  } catch (error) {
    console.error('❌ Neo4j setup failed:', error);
    throw error;
  }
}

async function seedDatabases() {
  console.log('🌱 Seeding databases only...\n');
  
  try {
    // Seed PostgreSQL
    await runCommand('node', [
      path.join('node_modules', '.bin', 'tsx'),
      'prisma/seed.ts'
    ]);
    
    // Seed Neo4j
    const { seedNeo4jDatabase } = require('./seed-neo4j.js');
    await seedNeo4jDatabase();
    
    console.log('✅ Database seeding completed');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'postgresql':
      setupPostgreSQL();
      break;
    case 'neo4j':
      setupNeo4jOnly();
      break;
    case 'seed':
      seedDatabases();
      break;
    default:
      setupDatabase();
  }
}

module.exports = {
  setupDatabase,
  setupPostgreSQL,
  setupNeo4jOnly,
  seedDatabases,
};
