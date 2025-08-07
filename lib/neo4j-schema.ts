/**
 * Neo4j Schema and Constraints Setup for ThinkSpace
 * 
 * This file defines the Neo4j schema, constraints, and indexes
 * for the ThinkSpace PARA methodology knowledge graph.
 */

import { executeWriteQuery, executeReadQuery } from './neo4j';

// =============================================================================
// NODE LABELS AND PROPERTIES
// =============================================================================

export const NODE_LABELS = {
  USER: 'User',
  PROJECT: 'Project',
  AREA: 'Area',
  RESOURCE: 'Resource',
  NOTE: 'Note',
  FILE: 'File',
  TAG: 'Tag',
  CONCEPT: 'Concept',
} as const;

export const RELATIONSHIP_TYPES = {
  // User relationships
  OWNS: 'OWNS',
  CREATED: 'CREATED',
  
  // PARA relationships
  BELONGS_TO: 'BELONGS_TO',
  RELATES_TO: 'RELATES_TO',
  DEPENDS_ON: 'DEPENDS_ON',
  SUPPORTS: 'SUPPORTS',
  
  // Content relationships
  CONTAINS: 'CONTAINS',
  REFERENCES: 'REFERENCES',
  MENTIONS: 'MENTIONS',
  LINKS_TO: 'LINKS_TO',
  
  // Semantic relationships
  SIMILAR_TO: 'SIMILAR_TO',
  DERIVED_FROM: 'DERIVED_FROM',
  INFLUENCES: 'INFLUENCES',
  
  // Tagging relationships
  TAGGED_WITH: 'TAGGED_WITH',
  
  // Temporal relationships
  PRECEDES: 'PRECEDES',
  FOLLOWS: 'FOLLOWS',
} as const;

// =============================================================================
// SCHEMA SETUP FUNCTIONS
// =============================================================================

/**
 * Create all necessary constraints for the knowledge graph
 */
export async function createConstraints(): Promise<void> {
  console.log('Creating Neo4j constraints...');

  const constraints = [
    // User constraints
    `CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:${NODE_LABELS.USER}) REQUIRE u.id IS UNIQUE`,
    `CREATE CONSTRAINT user_email_unique IF NOT EXISTS FOR (u:${NODE_LABELS.USER}) REQUIRE u.email IS UNIQUE`,
    
    // Project constraints
    `CREATE CONSTRAINT project_id_unique IF NOT EXISTS FOR (p:${NODE_LABELS.PROJECT}) REQUIRE p.id IS UNIQUE`,
    
    // Area constraints
    `CREATE CONSTRAINT area_id_unique IF NOT EXISTS FOR (a:${NODE_LABELS.AREA}) REQUIRE a.id IS UNIQUE`,
    
    // Resource constraints
    `CREATE CONSTRAINT resource_id_unique IF NOT EXISTS FOR (r:${NODE_LABELS.RESOURCE}) REQUIRE r.id IS UNIQUE`,
    
    // Note constraints
    `CREATE CONSTRAINT note_id_unique IF NOT EXISTS FOR (n:${NODE_LABELS.NOTE}) REQUIRE n.id IS UNIQUE`,
    
    // File constraints
    `CREATE CONSTRAINT file_id_unique IF NOT EXISTS FOR (f:${NODE_LABELS.FILE}) REQUIRE f.id IS UNIQUE`,
    
    // Tag constraints
    `CREATE CONSTRAINT tag_name_unique IF NOT EXISTS FOR (t:${NODE_LABELS.TAG}) REQUIRE t.name IS UNIQUE`,
    
    // Concept constraints
    `CREATE CONSTRAINT concept_name_unique IF NOT EXISTS FOR (c:${NODE_LABELS.CONCEPT}) REQUIRE c.name IS UNIQUE`,
  ];

  for (const constraint of constraints) {
    try {
      await executeWriteQuery(constraint);
      console.log(`✅ Created constraint: ${constraint.split(' ')[2]}`);
    } catch (error) {
      console.log(`⚠️  Constraint may already exist: ${constraint.split(' ')[2]}`);
    }
  }
}

/**
 * Create indexes for better query performance
 */
export async function createIndexes(): Promise<void> {
  console.log('Creating Neo4j indexes...');

  const indexes = [
    // User indexes
    `CREATE INDEX user_created_at IF NOT EXISTS FOR (u:${NODE_LABELS.USER}) ON (u.createdAt)`,
    
    // Project indexes
    `CREATE INDEX project_user_id IF NOT EXISTS FOR (p:${NODE_LABELS.PROJECT}) ON (p.userId)`,
    `CREATE INDEX project_status IF NOT EXISTS FOR (p:${NODE_LABELS.PROJECT}) ON (p.status)`,
    `CREATE INDEX project_priority IF NOT EXISTS FOR (p:${NODE_LABELS.PROJECT}) ON (p.priority)`,
    `CREATE INDEX project_due_date IF NOT EXISTS FOR (p:${NODE_LABELS.PROJECT}) ON (p.dueDate)`,
    
    // Area indexes
    `CREATE INDEX area_user_id IF NOT EXISTS FOR (a:${NODE_LABELS.AREA}) ON (a.userId)`,
    `CREATE INDEX area_type IF NOT EXISTS FOR (a:${NODE_LABELS.AREA}) ON (a.type)`,
    `CREATE INDEX area_active IF NOT EXISTS FOR (a:${NODE_LABELS.AREA}) ON (a.isActive)`,
    
    // Resource indexes
    `CREATE INDEX resource_user_id IF NOT EXISTS FOR (r:${NODE_LABELS.RESOURCE}) ON (r.userId)`,
    `CREATE INDEX resource_type IF NOT EXISTS FOR (r:${NODE_LABELS.RESOURCE}) ON (r.type)`,
    `CREATE INDEX resource_created_at IF NOT EXISTS FOR (r:${NODE_LABELS.RESOURCE}) ON (r.createdAt)`,
    
    // Note indexes
    `CREATE INDEX note_user_id IF NOT EXISTS FOR (n:${NODE_LABELS.NOTE}) ON (n.userId)`,
    `CREATE INDEX note_type IF NOT EXISTS FOR (n:${NODE_LABELS.NOTE}) ON (n.type)`,
    `CREATE INDEX note_created_at IF NOT EXISTS FOR (n:${NODE_LABELS.NOTE}) ON (n.createdAt)`,
    
    // File indexes
    `CREATE INDEX file_user_id IF NOT EXISTS FOR (f:${NODE_LABELS.FILE}) ON (f.userId)`,
    `CREATE INDEX file_status IF NOT EXISTS FOR (f:${NODE_LABELS.FILE}) ON (f.status)`,
    `CREATE INDEX file_mime_type IF NOT EXISTS FOR (f:${NODE_LABELS.FILE}) ON (f.mimeType)`,
    
    // Full-text indexes for search
    `CREATE FULLTEXT INDEX project_fulltext IF NOT EXISTS FOR (p:${NODE_LABELS.PROJECT}) ON EACH [p.title, p.description]`,
    `CREATE FULLTEXT INDEX area_fulltext IF NOT EXISTS FOR (a:${NODE_LABELS.AREA}) ON EACH [a.title, a.description]`,
    `CREATE FULLTEXT INDEX resource_fulltext IF NOT EXISTS FOR (r:${NODE_LABELS.RESOURCE}) ON EACH [r.title, r.description, r.contentExtract]`,
    `CREATE FULLTEXT INDEX note_fulltext IF NOT EXISTS FOR (n:${NODE_LABELS.NOTE}) ON EACH [n.title, n.content]`,
    `CREATE FULLTEXT INDEX file_fulltext IF NOT EXISTS FOR (f:${NODE_LABELS.FILE}) ON EACH [f.filename, f.originalName, f.contentExtract]`,
  ];

  for (const index of indexes) {
    try {
      await executeWriteQuery(index);
      console.log(`✅ Created index: ${index.split(' ')[2]}`);
    } catch (error) {
      console.log(`⚠️  Index may already exist: ${index.split(' ')[2]}`);
    }
  }
}

/**
 * Create sample data structure for testing
 */
export async function createSampleStructure(userId: string): Promise<void> {
  console.log('Creating sample knowledge graph structure...');

  const queries = [
    // Create user node
    `
    MERGE (u:${NODE_LABELS.USER} {id: $userId})
    SET u.email = $email,
        u.name = $name,
        u.createdAt = datetime()
    `,
    
    // Create sample concepts
    `
    MERGE (c1:${NODE_LABELS.CONCEPT} {name: "Knowledge Management"})
    MERGE (c2:${NODE_LABELS.CONCEPT} {name: "Productivity"})
    MERGE (c3:${NODE_LABELS.CONCEPT} {name: "Learning"})
    MERGE (c4:${NODE_LABELS.CONCEPT} {name: "Research"})
    `,
    
    // Create sample tags
    `
    MERGE (t1:${NODE_LABELS.TAG} {name: "important"})
    MERGE (t2:${NODE_LABELS.TAG} {name: "urgent"})
    MERGE (t3:${NODE_LABELS.TAG} {name: "reference"})
    MERGE (t4:${NODE_LABELS.TAG} {name: "idea"})
    `,
  ];

  for (const query of queries) {
    try {
      await executeWriteQuery(query, {
        userId,
        email: 'sample@example.com',
        name: 'Sample User',
      });
    } catch (error) {
      console.error('Error creating sample structure:', error);
    }
  }

  console.log('✅ Sample structure created');
}

/**
 * Get schema information
 */
export async function getSchemaInfo(): Promise<any> {
  try {
    const constraints = await executeReadQuery(`
      SHOW CONSTRAINTS
    `);

    const indexes = await executeReadQuery(`
      SHOW INDEXES
    `);

    const nodeLabels = await executeReadQuery(`
      CALL db.labels()
    `);

    const relationshipTypes = await executeReadQuery(`
      CALL db.relationshipTypes()
    `);

    return {
      constraints: constraints.length,
      indexes: indexes.length,
      nodeLabels: nodeLabels.map(record => record.get('label')),
      relationshipTypes: relationshipTypes.map(record => record.get('relationshipType')),
    };
  } catch (error) {
    console.error('Error getting schema info:', error);
    throw error;
  }
}

/**
 * Validate schema setup
 */
export async function validateSchema(): Promise<boolean> {
  try {
    console.log('Validating Neo4j schema...');

    // Check if constraints exist
    const constraints = await executeReadQuery(`SHOW CONSTRAINTS`);
    console.log(`✅ Found ${constraints.length} constraints`);

    // Check if indexes exist
    const indexes = await executeReadQuery(`SHOW INDEXES`);
    console.log(`✅ Found ${indexes.length} indexes`);

    // Test basic operations
    await executeWriteQuery(`
      CREATE (test:TestNode {id: 'test-' + randomUUID(), createdAt: datetime()})
    `);

    const testNodes = await executeReadQuery(`
      MATCH (test:TestNode)
      WHERE test.id STARTS WITH 'test-'
      RETURN count(test) as count
    `);

    // Clean up test nodes
    await executeWriteQuery(`
      MATCH (test:TestNode)
      WHERE test.id STARTS WITH 'test-'
      DELETE test
    `);

    console.log(`✅ Schema validation successful`);
    return true;

  } catch (error) {
    console.error('❌ Schema validation failed:', error);
    return false;
  }
}

/**
 * Setup complete Neo4j schema
 */
export async function setupNeo4jSchema(): Promise<void> {
  try {
    console.log('🚀 Setting up Neo4j schema for ThinkSpace...\n');

    await createConstraints();
    console.log('');
    
    await createIndexes();
    console.log('');

    const isValid = await validateSchema();
    
    if (isValid) {
      console.log('🎉 Neo4j schema setup completed successfully!');
    } else {
      throw new Error('Schema validation failed');
    }

  } catch (error) {
    console.error('❌ Failed to setup Neo4j schema:', error);
    throw error;
  }
}
