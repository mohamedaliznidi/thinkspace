/**
 * ThinkSpace Library Index
 * 
 * Central export file for all ThinkSpace library modules.
 * This provides a convenient way to import commonly used functions
 * and utilities throughout the application.
 */

// Database connections
export { default as prisma } from './prisma';
export { 
  getDriver, 
  executeReadQuery, 
  executeWriteQuery, 
  executeTransaction,
  checkNeo4jConnection,
  closeNeo4jConnection,
  getGraphStatistics as getNeo4jStatistics,
  getDatabaseInfo as getNeo4jDatabaseInfo
} from './neo4j';

// Authentication
export { 
  authOptions,
  hashPassword,
  verifyPassword,
  generateSecureToken,
  validatePassword,
  createUserSession,
  getUserFromSession,
  requireAuth,
  requireRole
} from './auth';

// Utility functions
export {
  formatDate,
  formatRelativeTime,
  validateEmail,
  validateUrl,
  slugify,
  truncateText,
  generateId,
  debounce,
  throttle,
  deepMerge,
  isValidJSON,
  parseJSON,
  sanitizeHtml,
  extractTextFromHtml,
  calculateReadingTime,
  searchInText,
  highlightSearchTerms,
  getFileExtension,
  formatFileSize,
  isImageFile,
  isVideoFile,
  isAudioFile,
  isPdfFile,
  getColorFromString,
  generateColorPalette,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  handleApiError,
  createApiResponse,
  createErrorResponse
} from './utils';

// Vector search and embeddings
export {
  generateEmbedding,
  generateEmbeddings,
  embeddingToVector,
  searchSimilarNotes,
  searchSimilarResources,
  searchSimilarFiles,
  hybridSearch,
  updateNoteEmbedding,
  updateResourceEmbedding,
  updateFileEmbedding,
  getVectorStats,
  VECTOR_DIMENSIONS,
  SIMILARITY_THRESHOLD,
  MAX_SEARCH_RESULTS
} from './vector';

// Neo4j schema and operations
export {
  NODE_LABELS,
  RELATIONSHIP_TYPES,
  createConstraints,
  createIndexes,
  createSampleStructure,
  getSchemaInfo,
  validateSchema,
  setupNeo4jSchema
} from './neo4j-schema';

export {
  createUserNode,
  createProjectNode,
  createAreaNode,
  createResourceNode,
  createNoteNode,
  createRelationship,
  createParaRelationship,
  createSimilarityRelationship,
  getUserKnowledgeGraph,
  findRelatedEntities,
  getEntityConnections,
  searchEntities,
  getGraphStatistics,
  deleteEntity,
  deleteRelationship
} from './neo4j-operations';

// Type definitions for commonly used types
export type {
  // Database types
  User,
  Project,
  Area,
  Resource,
  Note,
  Chat,
  Message,
  Connection,
  Activity,
  Search,
  GraphSnapshot,
  File
} from '@prisma/client';

// Enum types
export {
  UserRole,
  ProjectStatus,
  ProjectPriority,
  AreaType,
  ResourceType,
  NoteType,
  ChatType,
  MessageRole,
  FileStatus,
  ActivityType,
  ConnectionType
} from '@prisma/client';

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  content?: string;
  type: 'note' | 'resource' | 'project' | 'area' | 'file';
  similarity?: number;
  score?: number;
  highlights?: string[];
  metadata?: Record<string, any>;
}

export interface GraphNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
}

export interface GraphRelationship {
  id: string;
  type: string;
  startNodeId: string;
  endNodeId: string;
  properties: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
}

// Configuration constants
export const CONFIG = {
  // Database
  MAX_QUERY_LIMIT: 100,
  DEFAULT_PAGE_SIZE: 20,
  
  // Vector search
  DEFAULT_SIMILARITY_THRESHOLD: 0.7,
  MAX_SEARCH_RESULTS: 50,
  EMBEDDING_DIMENSIONS: 1536,
  
  // File uploads
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  
  // Content processing
  MAX_CONTENT_LENGTH: 50000,
  EXCERPT_LENGTH: 200,
  
  // UI
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 1000,
  
  // Security
  PASSWORD_MIN_LENGTH: 8,
  SESSION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Graph
  MAX_GRAPH_NODES: 500,
  MAX_RELATIONSHIP_DEPTH: 3,
} as const;

// Environment validation
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEO4J_URI',
    'NEO4J_USERNAME',
    'NEO4J_PASSWORD',
    'OPENROUTER_API_KEY',
    'NEXTAUTH_SECRET'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Initialize function for setting up the library
export const initializeThinkSpace = async () => {
  try {
    // Validate environment
    validateEnvironment();
    
    // Test database connections
    await prisma.$connect();
    console.log('✅ PostgreSQL connection established');
    
    const neo4jConnected = await checkNeo4jConnection();
    if (neo4jConnected) {
      console.log('✅ Neo4j connection established');
    } else {
      console.warn('⚠️  Neo4j connection failed');
    }
    
    console.log('🚀 ThinkSpace library initialized successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize ThinkSpace library:', error);
    throw error;
  }
};

// Cleanup function
export const cleanupThinkSpace = async () => {
  try {
    await prisma.$disconnect();
    await closeNeo4jConnection();
    console.log('✅ ThinkSpace library cleanup completed');
  } catch (error) {
    console.error('❌ Error during ThinkSpace library cleanup:', error);
  }
};
