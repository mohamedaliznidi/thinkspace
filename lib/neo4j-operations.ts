/**
 * Neo4j Operations for ThinkSpace PARA Methodology
 * 
 * This file provides high-level operations for managing
 * the knowledge graph using Neo4j for PARA entities.
 */

import { executeWriteQuery, executeReadQuery } from './neo4j';
import { NODE_LABELS, RELATIONSHIP_TYPES } from './neo4j-schema';

// =============================================================================
// NODE CREATION OPERATIONS
// =============================================================================

/**
 * Create or update a user node
 */
export async function createUserNode(userData: {
  id: string;
  email: string;
  name: string;
  role?: string;
}) {
  const query = `
    MERGE (u:${NODE_LABELS.USER} {id: $id})
    SET u.email = $email,
        u.name = $name,
        u.role = $role,
        u.updatedAt = datetime()
    ON CREATE SET u.createdAt = datetime()
    RETURN u
  `;

  return await executeWriteQuery(query, userData);
}

/**
 * Create or update a project node
 */
export async function createProjectNode(projectData: {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
}) {
  const query = `
    MATCH (u:${NODE_LABELS.USER} {id: $userId})
    MERGE (p:${NODE_LABELS.PROJECT} {id: $id})
    SET p.title = $title,
        p.description = $description,
        p.status = $status,
        p.priority = $priority,
        p.dueDate = $dueDate,
        p.updatedAt = datetime()
    ON CREATE SET p.createdAt = datetime()
    MERGE (u)-[:${RELATIONSHIP_TYPES.OWNS}]->(p)
    RETURN p
  `;

  return await executeWriteQuery(query, projectData);
}

/**
 * Create or update an area node
 */
export async function createAreaNode(areaData: {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: string;
  isActive: boolean;
}) {
  const query = `
    MATCH (u:${NODE_LABELS.USER} {id: $userId})
    MERGE (a:${NODE_LABELS.AREA} {id: $id})
    SET a.title = $title,
        a.description = $description,
        a.type = $type,
        a.isActive = $isActive,
        a.updatedAt = datetime()
    ON CREATE SET a.createdAt = datetime()
    MERGE (u)-[:${RELATIONSHIP_TYPES.OWNS}]->(a)
    RETURN a
  `;

  return await executeWriteQuery(query, areaData);
}

/**
 * Create or update a resource node
 */
export async function createResourceNode(resourceData: {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: string;
  sourceUrl?: string;
  contentExtract?: string;
}) {
  const query = `
    MATCH (u:${NODE_LABELS.USER} {id: $userId})
    MERGE (r:${NODE_LABELS.RESOURCE} {id: $id})
    SET r.title = $title,
        r.description = $description,
        r.type = $type,
        r.sourceUrl = $sourceUrl,
        r.contentExtract = $contentExtract,
        r.updatedAt = datetime()
    ON CREATE SET r.createdAt = datetime()
    MERGE (u)-[:${RELATIONSHIP_TYPES.OWNS}]->(r)
    RETURN r
  `;

  return await executeWriteQuery(query, resourceData);
}

/**
 * Create or update a note node
 */
export async function createNoteNode(noteData: {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: string;
}) {
  const query = `
    MATCH (u:${NODE_LABELS.USER} {id: $userId})
    MERGE (n:${NODE_LABELS.NOTE} {id: $id})
    SET n.title = $title,
        n.content = $content,
        n.type = $type,
        n.updatedAt = datetime()
    ON CREATE SET n.createdAt = datetime()
    MERGE (u)-[:${RELATIONSHIP_TYPES.OWNS}]->(n)
    RETURN n
  `;

  return await executeWriteQuery(query, noteData);
}

// =============================================================================
// RELATIONSHIP OPERATIONS
// =============================================================================

/**
 * Create a relationship between two nodes
 */
export async function createRelationship(
  sourceId: string,
  targetId: string,
  relationshipType: string,
  properties: Record<string, any> = {}
) {
  const query = `
    MATCH (source {id: $sourceId})
    MATCH (target {id: $targetId})
    MERGE (source)-[r:${relationshipType}]->(target)
    SET r += $properties,
        r.createdAt = CASE WHEN r.createdAt IS NULL THEN datetime() ELSE r.createdAt END,
        r.updatedAt = datetime()
    RETURN r
  `;

  return await executeWriteQuery(query, {
    sourceId,
    targetId,
    properties,
  });
}

/**
 * Create PARA relationships (Project belongs to Area, etc.)
 */
export async function createParaRelationship(
  entityId: string,
  parentId: string,
  relationshipType: string = RELATIONSHIP_TYPES.BELONGS_TO
) {
  return await createRelationship(entityId, parentId, relationshipType, {
    type: 'para_structure',
  });
}

/**
 * Create semantic similarity relationship
 */
export async function createSimilarityRelationship(
  sourceId: string,
  targetId: string,
  similarity: number
) {
  return await createRelationship(
    sourceId,
    targetId,
    RELATIONSHIP_TYPES.SIMILAR_TO,
    { similarity, type: 'semantic' }
  );
}

// =============================================================================
// QUERY OPERATIONS
// =============================================================================

/**
 * Get user's knowledge graph overview
 */
export async function getUserKnowledgeGraph(userId: string) {
  const query = `
    MATCH (u:${NODE_LABELS.USER} {id: $userId})
    OPTIONAL MATCH (u)-[:${RELATIONSHIP_TYPES.OWNS}]->(p:${NODE_LABELS.PROJECT})
    OPTIONAL MATCH (u)-[:${RELATIONSHIP_TYPES.OWNS}]->(a:${NODE_LABELS.AREA})
    OPTIONAL MATCH (u)-[:${RELATIONSHIP_TYPES.OWNS}]->(r:${NODE_LABELS.RESOURCE})
    OPTIONAL MATCH (u)-[:${RELATIONSHIP_TYPES.OWNS}]->(n:${NODE_LABELS.NOTE})
    RETURN {
      user: u,
      projects: collect(DISTINCT p),
      areas: collect(DISTINCT a),
      resources: collect(DISTINCT r),
      notes: collect(DISTINCT n)
    } as graph
  `;

  return await executeReadQuery(query, { userId });
}

/**
 * Find related entities using graph traversal
 */
export async function findRelatedEntities(
  entityId: string,
  maxDepth: number = 2,
  relationshipTypes: string[] = []
) {
  const relationshipFilter = relationshipTypes.length > 0 
    ? `[${relationshipTypes.map(t => `'${t}'`).join('|')}]`
    : '';

  const query = `
    MATCH (start {id: $entityId})
    MATCH path = (start)-[*1..${maxDepth}${relationshipFilter}]-(related)
    WHERE start <> related
    RETURN DISTINCT related, 
           length(path) as distance,
           [r in relationships(path) | type(r)] as relationshipPath
    ORDER BY distance, related.title
    LIMIT 50
  `;

  return await executeReadQuery(query, { entityId });
}

/**
 * Get entity connections with relationship details
 */
export async function getEntityConnections(entityId: string) {
  const query = `
    MATCH (entity {id: $entityId})
    OPTIONAL MATCH (entity)-[outgoing]->(target)
    OPTIONAL MATCH (source)-[incoming]->(entity)
    RETURN {
      entity: entity,
      outgoing: collect(DISTINCT {
        relationship: outgoing,
        target: target
      }),
      incoming: collect(DISTINCT {
        relationship: incoming,
        source: source
      })
    } as connections
  `;

  return await executeReadQuery(query, { entityId });
}

/**
 * Search entities using full-text search
 */
export async function searchEntities(
  searchTerm: string,
  userId: string,
  entityTypes: string[] = []
) {
  const typeFilter = entityTypes.length > 0 
    ? `AND any(label in labels(entity) WHERE label IN [${entityTypes.map(t => `'${t}'`).join(', ')}])`
    : '';

  const query = `
    CALL db.index.fulltext.queryNodes('project_fulltext', $searchTerm) YIELD node as project, score as projectScore
    WHERE project.userId = $userId
    WITH collect({entity: project, score: projectScore, type: 'Project'}) as projectResults
    
    CALL db.index.fulltext.queryNodes('area_fulltext', $searchTerm) YIELD node as area, score as areaScore
    WHERE area.userId = $userId
    WITH projectResults + collect({entity: area, score: areaScore, type: 'Area'}) as areaResults
    
    CALL db.index.fulltext.queryNodes('resource_fulltext', $searchTerm) YIELD node as resource, score as resourceScore
    WHERE resource.userId = $userId
    WITH areaResults + collect({entity: resource, score: resourceScore, type: 'Resource'}) as resourceResults
    
    CALL db.index.fulltext.queryNodes('note_fulltext', $searchTerm) YIELD node as note, score as noteScore
    WHERE note.userId = $userId
    WITH resourceResults + collect({entity: note, score: noteScore, type: 'Note'}) as allResults
    
    UNWIND allResults as result
    RETURN result.entity as entity, result.score as score, result.type as type
    ORDER BY result.score DESC
    LIMIT 20
  `;

  return await executeReadQuery(query, { searchTerm, userId });
}

/**
 * Get graph statistics for a user
 */
export async function getGraphStatistics(userId: string) {
  const query = `
    MATCH (u:${NODE_LABELS.USER} {id: $userId})
    OPTIONAL MATCH (u)-[:${RELATIONSHIP_TYPES.OWNS}]->(entity)
    OPTIONAL MATCH (entity)-[r]-()
    RETURN {
      totalNodes: count(DISTINCT entity),
      totalRelationships: count(DISTINCT r),
      nodesByType: {
        projects: size([(u)-[:${RELATIONSHIP_TYPES.OWNS}]->(p:${NODE_LABELS.PROJECT}) | p]),
        areas: size([(u)-[:${RELATIONSHIP_TYPES.OWNS}]->(a:${NODE_LABELS.AREA}) | a]),
        resources: size([(u)-[:${RELATIONSHIP_TYPES.OWNS}]->(r:${NODE_LABELS.RESOURCE}) | r]),
        notes: size([(u)-[:${RELATIONSHIP_TYPES.OWNS}]->(n:${NODE_LABELS.NOTE}) | n])
      }
    } as stats
  `;

  return await executeReadQuery(query, { userId });
}

/**
 * Delete an entity and its relationships
 */
export async function deleteEntity(entityId: string) {
  const query = `
    MATCH (entity {id: $entityId})
    DETACH DELETE entity
    RETURN count(entity) as deletedCount
  `;

  return await executeWriteQuery(query, { entityId });
}

/**
 * Delete a relationship
 */
export async function deleteRelationship(
  sourceId: string,
  targetId: string,
  relationshipType?: string
) {
  const relationshipFilter = relationshipType ? `:${relationshipType}` : '';
  
  const query = `
    MATCH (source {id: $sourceId})-[r${relationshipFilter}]->(target {id: $targetId})
    DELETE r
    RETURN count(r) as deletedCount
  `;

  return await executeWriteQuery(query, { sourceId, targetId });
}
