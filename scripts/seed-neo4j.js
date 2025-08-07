#!/usr/bin/env node

/**
 * Neo4j Database Seeding Script for ThinkSpace
 * 
 * This script creates initial seed data in Neo4j for testing and development
 * of the ThinkSpace knowledge graph functionality.
 */

async function seedNeo4jDatabase() {
  console.log('🌱 Seeding ThinkSpace Neo4j database...\n');

  try {
    // Import required modules
    const { executeWriteQuery, executeReadQuery } = await import('../lib/neo4j.js');
    const { 
      createUserNode, 
      createProjectNode, 
      createAreaNode,
      createResourceNode,
      createNoteNode,
      createRelationship 
    } = await import('../lib/neo4j-operations.js');

    // Demo user data
    const demoUserId = 'demo-user-neo4j';
    
    console.log('1. Creating demo user node...');
    await createUserNode({
      id: demoUserId,
      email: 'demo@thinkspace.com',
      name: 'Demo User',
      role: 'USER'
    });
    console.log('   ✅ Demo user node created');

    // Create sample areas
    console.log('\n2. Creating sample area nodes...');
    
    const areas = [
      {
        id: 'area-personal-dev',
        title: 'Personal Development',
        description: 'Continuous learning and self-improvement activities',
        type: 'LEARNING',
        isActive: true
      },
      {
        id: 'area-health-fitness',
        title: 'Health & Fitness',
        description: 'Physical and mental health maintenance',
        type: 'HEALTH',
        isActive: true
      },
      {
        id: 'area-career-dev',
        title: 'Career Development',
        description: 'Professional growth and career advancement',
        type: 'CAREER',
        isActive: true
      },
      {
        id: 'area-finance',
        title: 'Financial Management',
        description: 'Personal finance and investment tracking',
        type: 'FINANCE',
        isActive: true
      }
    ];

    for (const area of areas) {
      await createAreaNode({
        ...area,
        userId: demoUserId
      });
      console.log(`   ✅ Area node created: ${area.title}`);
    }

    // Create sample projects
    console.log('\n3. Creating sample project nodes...');
    
    const projects = [
      {
        id: 'project-typescript',
        title: 'Learn TypeScript Advanced Patterns',
        description: 'Master advanced TypeScript patterns and best practices for better code quality',
        status: 'ACTIVE',
        priority: 'HIGH'
      },
      {
        id: 'project-finance-dashboard',
        title: 'Build Personal Finance Dashboard',
        description: 'Create a comprehensive dashboard to track expenses, investments, and financial goals',
        status: 'PLANNING',
        priority: 'MEDIUM'
      },
      {
        id: 'project-marathon',
        title: 'Complete Marathon Training',
        description: '16-week marathon training program preparation for city marathon',
        status: 'ACTIVE',
        priority: 'HIGH'
      }
    ];

    for (const project of projects) {
      await createProjectNode({
        ...project,
        userId: demoUserId
      });
      console.log(`   ✅ Project node created: ${project.title}`);
    }

    // Create sample resources
    console.log('\n4. Creating sample resource nodes...');
    
    const resources = [
      {
        id: 'resource-ts-handbook',
        title: 'TypeScript Handbook',
        description: 'Official TypeScript documentation and best practices guide',
        type: 'REFERENCE',
        sourceUrl: 'https://www.typescriptlang.org/docs/',
        contentExtract: 'TypeScript is a strongly typed programming language that builds on JavaScript...'
      },
      {
        id: 'resource-finance-template',
        title: 'Personal Finance Spreadsheet Template',
        description: 'Comprehensive Excel template for tracking personal finances',
        type: 'TEMPLATE',
        contentExtract: 'Monthly budget tracker with categories for income, expenses, and savings goals...'
      },
      {
        id: 'resource-marathon-plan',
        title: 'Marathon Training Plan PDF',
        description: '16-week progressive training plan for first-time marathoners',
        type: 'DOCUMENT',
        contentExtract: 'Week 1-4: Base building phase with easy runs and gradual mileage increase...'
      }
    ];

    for (const resource of resources) {
      await createResourceNode({
        ...resource,
        userId: demoUserId
      });
      console.log(`   ✅ Resource node created: ${resource.title}`);
    }

    // Create sample notes
    console.log('\n5. Creating sample note nodes...');
    
    const notes = [
      {
        id: 'note-ts-generics',
        title: 'TypeScript Generic Constraints',
        content: 'Key concepts learned about generic constraints in TypeScript...',
        type: 'RESEARCH'
      },
      {
        id: 'note-training-log',
        title: 'Weekly Training Log - Week 8',
        content: 'Marathon training progress and observations from week 8...',
        type: 'SUMMARY'
      },
      {
        id: 'note-investment-research',
        title: 'Investment Research Notes',
        content: 'Q1 investment research and market analysis notes...',
        type: 'RESEARCH'
      }
    ];

    for (const note of notes) {
      await createNoteNode({
        ...note,
        userId: demoUserId
      });
      console.log(`   ✅ Note node created: ${note.title}`);
    }

    // Create relationships
    console.log('\n6. Creating relationships...');
    
    const relationships = [
      // Project-Area relationships
      { source: 'project-typescript', target: 'area-personal-dev', type: 'BELONGS_TO' },
      { source: 'project-finance-dashboard', target: 'area-finance', type: 'BELONGS_TO' },
      { source: 'project-marathon', target: 'area-health-fitness', type: 'BELONGS_TO' },
      
      // Resource-Project relationships
      { source: 'resource-ts-handbook', target: 'project-typescript', type: 'SUPPORTS' },
      { source: 'resource-finance-template', target: 'project-finance-dashboard', type: 'SUPPORTS' },
      { source: 'resource-marathon-plan', target: 'project-marathon', type: 'SUPPORTS' },
      
      // Note-Project relationships
      { source: 'note-ts-generics', target: 'project-typescript', type: 'RELATES_TO' },
      { source: 'note-training-log', target: 'project-marathon', type: 'RELATES_TO' },
      { source: 'note-investment-research', target: 'project-finance-dashboard', type: 'RELATES_TO' },
      
      // Cross-domain relationships
      { source: 'note-ts-generics', target: 'resource-ts-handbook', type: 'REFERENCES' },
      { source: 'note-training-log', target: 'resource-marathon-plan', type: 'REFERENCES' },
      { source: 'note-investment-research', target: 'resource-finance-template', type: 'REFERENCES' },
    ];

    for (const rel of relationships) {
      await createRelationship(rel.source, rel.target, rel.type, {
        strength: 0.8,
        createdBy: 'MANUAL'
      });
      console.log(`   ✅ Relationship created: ${rel.source} -[${rel.type}]-> ${rel.target}`);
    }

    // Create concept nodes and relationships
    console.log('\n7. Creating concept nodes...');
    
    const concepts = [
      'Knowledge Management',
      'Productivity',
      'Learning',
      'Research',
      'Health',
      'Finance',
      'Programming',
      'TypeScript'
    ];

    for (const concept of concepts) {
      await executeWriteQuery(`
        MERGE (c:Concept {name: $name})
        SET c.createdAt = datetime()
      `, { name: concept });
      console.log(`   ✅ Concept created: ${concept}`);
    }

    // Create concept relationships
    console.log('\n8. Creating concept relationships...');
    
    const conceptRelationships = [
      { source: 'project-typescript', concept: 'Programming' },
      { source: 'project-typescript', concept: 'TypeScript' },
      { source: 'project-typescript', concept: 'Learning' },
      { source: 'project-marathon', concept: 'Health' },
      { source: 'project-finance-dashboard', concept: 'Finance' },
      { source: 'note-ts-generics', concept: 'Programming' },
      { source: 'note-ts-generics', concept: 'Research' },
    ];

    for (const rel of conceptRelationships) {
      await executeWriteQuery(`
        MATCH (entity {id: $sourceId})
        MATCH (concept:Concept {name: $conceptName})
        MERGE (entity)-[:TAGGED_WITH]->(concept)
      `, { sourceId: rel.source, conceptName: rel.concept });
      console.log(`   ✅ Concept relationship: ${rel.source} -> ${rel.concept}`);
    }

    // Create similarity relationships based on shared concepts
    console.log('\n9. Creating similarity relationships...');
    
    await executeWriteQuery(`
      MATCH (n1)-[:TAGGED_WITH]->(concept:Concept)<-[:TAGGED_WITH]-(n2)
      WHERE n1 <> n2
      WITH n1, n2, count(concept) as sharedConcepts
      WHERE sharedConcepts >= 1
      MERGE (n1)-[r:SIMILAR_TO]-(n2)
      SET r.similarity = toFloat(sharedConcepts) / 10.0,
          r.type = 'semantic',
          r.createdAt = datetime()
    `);
    
    console.log('   ✅ Similarity relationships created based on shared concepts');

    // Get final statistics
    console.log('\n10. Getting graph statistics...');
    
    const stats = await executeReadQuery(`
      MATCH (n)
      OPTIONAL MATCH (n)-[r]-()
      RETURN 
        count(DISTINCT n) as nodeCount,
        count(DISTINCT r) as relationshipCount,
        collect(DISTINCT labels(n)) as nodeLabels
    `);

    if (stats.length > 0) {
      const stat = stats[0];
      console.log(`   📊 Total nodes: ${stat.get('nodeCount')}`);
      console.log(`   📊 Total relationships: ${stat.get('relationshipCount')}`);
      
      const labels = stat.get('nodeLabels').flat().filter(label => label);
      console.log(`   📊 Node types: ${labels.join(', ')}`);
    }

    console.log('\n🎉 Neo4j database seeding completed successfully!');
    console.log('\n🚀 Knowledge graph is ready for exploration!');
    console.log('   - Use the graph visualization to see connections');
    console.log('   - Try semantic search to find related content');
    console.log('   - Explore relationship patterns in your PARA structure');

  } catch (error) {
    console.error('❌ Error seeding Neo4j database:', error);
    throw error;
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedNeo4jDatabase().then(() => {
    console.log('✅ Neo4j seeding completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Neo4j seeding failed:', error);
    process.exit(1);
  });
}

module.exports = { seedNeo4jDatabase };
