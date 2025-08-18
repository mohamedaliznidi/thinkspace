/**
 * Enhanced Resource Types for ThinkSpace
 * 
 * Comprehensive type definitions for the enhanced resource management system
 * including automatic summarization, reference tracking, and folder organization.
 */

import type {
  Resource,
  ResourceType,
  SummaryType,
  SummaryLength,
  ReferenceType,
  User,
  Project,
  Area,
  Note
} from '@prisma/client';

// Re-export Prisma enum types for use in other modules
export type { ResourceType, ReferenceType, SummaryType, SummaryLength } from '@prisma/client';

// =============================================================================
// CORE RESOURCE TYPES
// =============================================================================

export interface ResourceFolder {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  parentId?: string | null;
  parent?: ResourceFolder | null;
  children?: ResourceFolder[];
  path: string;
  level: number;
  userId: string;
  user?: User;
  resources?: Resource[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceSummary {
  id: string;
  content: string;
  type: SummaryType;
  length: SummaryLength;
  qualityScore?: number | null;
  isApproved: boolean;
  feedback?: string | null;
  model?: string | null;
  prompt?: string | null;
  generatedAt: Date;
  resourceId: string;
  resource?: Resource;
  userId: string;
  user?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceReference {
  id: string;
  context?: string | null;
  snippet?: string | null;
  referenceType: ReferenceType;
  resourceId: string;
  resource?: Resource;
  referencedResourceId?: string | null;
  referencedResource?: Resource | null;
  projectId?: string | null;
  project?: Project | null;
  areaId?: string | null;
  area?: Area | null;
  noteId?: string | null;
  note?: Note | null;
  userId: string;
  user?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceCollection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isPublic: boolean;
  userId: string;
  user?: User;
  resources?: Resource[];
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// ENHANCED RESOURCE INTERFACE
// =============================================================================

export interface EnhancedResource extends Resource {
  extractedTopics: string[];
  areas?: Area[];
  notes?: Note[];
  _count?: {
    summaries: number;
    references: number;
    referencedBy: number;
    collections: number;
    projects: number;
    areas: number;
    notes: number;
  };
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

export interface CreateResourceRequest {
  title: string;
  description?: string;
  type: ResourceType;
  sourceUrl?: string;
  filePath?: string;
  contentExtract?: string;
  tags?: string[];
  folderId?: string;
  projectIds?: string[];
  areaIds?: string[];
  collectionIds?: string[];
  generateSummary?: boolean;
  summaryType?: SummaryType;
  summaryLength?: SummaryLength;
}

export interface UpdateResourceRequest {
  title?: string;
  description?: string;
  type?: ResourceType;
  sourceUrl?: string;
  filePath?: string;
  contentExtract?: string;
  tags?: string[];
  folderId?: string;
  projectIds?: string[];
  areaIds?: string[];
  collectionIds?: string[];
}

export interface ResourceSearchRequest {
  query?: string;
  type?: ResourceType;
  folderId?: string;
  tags?: string[];
  projectIds?: string[];
  areaIds?: string[];
  collectionIds?: string[];
  hasContent?: boolean;
  hasSummary?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'type' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ResourceAnalyticsRequest {
  timeframe?: 'week' | 'month' | 'quarter' | 'year';
  includeReferences?: boolean;
  includeUsage?: boolean;
  includeTrends?: boolean;
}

// =============================================================================
// FOLDER MANAGEMENT TYPES
// =============================================================================

export interface CreateFolderRequest {
  name: string;
  description?: string;
  color?: string;
  parentId?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  description?: string;
  color?: string;
  parentId?: string | null; // Allow null to remove parent
}

export interface FolderTreeNode extends ResourceFolder {
  children: FolderTreeNode[];
  resourceCount: number;
  totalResourceCount: number; // Including subfolders
}

// =============================================================================
// SUMMARY MANAGEMENT TYPES
// =============================================================================

export interface CreateSummaryRequest {
  resourceId: string;
  type?: SummaryType;
  length?: SummaryLength;
  customPrompt?: string;
}

export interface UpdateSummaryRequest {
  content?: string;
  type?: SummaryType;
  length?: SummaryLength;
  isApproved?: boolean;
  feedback?: string;
  qualityScore?: number;
}

export interface SummaryGenerationOptions {
  type: SummaryType;
  length: SummaryLength;
  focus?: string[];
  tone?: 'professional' | 'casual' | 'academic' | 'technical';
  audience?: 'general' | 'expert' | 'beginner';
  customPrompt?: string;
}

// =============================================================================
// REFERENCE TRACKING TYPES
// =============================================================================

export interface CreateReferenceRequest {
  resourceId: string;
  referencedResourceId?: string;
  projectId?: string;
  areaId?: string;
  noteId?: string;
  context?: string;
  snippet?: string;
  referenceType?: ReferenceType;
}

export interface ReferenceAnalytics {
  totalReferences: number;
  incomingReferences: number;
  outgoingReferences: number;
  mostReferencedResources: Array<{
    resource: EnhancedResource;
    referenceCount: number;
  }>;
  recentReferences: ResourceReference[];
  referencesByType: Array<{
    type: ReferenceType;
    count: number;
  }>;
}

// =============================================================================
// CONTENT ANALYSIS TYPES
// =============================================================================

export interface ContentAnalysisResult {
  topics: string[];
  language?: string;
  wordCount?: number;
  readingTime?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  suggestedTags: string[];
  relatedResources: EnhancedResource[];
  duplicateCandidates: EnhancedResource[];
}

export interface TopicExtractionOptions {
  maxTopics?: number;
  minConfidence?: number;
  includeKeywords?: boolean;
  language?: string;
}

// =============================================================================
// ANALYTICS TYPES
// =============================================================================

export interface ResourceAnalytics {
  overview: {
    totalResources: number;
    resourcesByType: Array<{
      type: ResourceType;
      count: number;
      percentage: number;
    }>;
    resourcesByFolder: Array<{
      folder: ResourceFolder;
      count: number;
    }>;
    recentActivity: number;
  };
  usage: {
    mostViewed: EnhancedResource[];
    mostReferenced: EnhancedResource[];
    leastUsed: EnhancedResource[];
    usageTrends: Array<{
      date: string;
      views: number;
      references: number;
    }>;
  };
  content: {
    totalWordCount: number;
    averageReadingTime: number;
    languageDistribution: Array<{
      language: string;
      count: number;
    }>;
    topicDistribution: Array<{
      topic: string;
      count: number;
    }>;
  };
  quality: {
    resourcesWithSummaries: number;
    averageSummaryQuality: number;
    resourcesNeedingReview: EnhancedResource[];
  };
}

export interface ResourceUsageMetrics {
  resourceId: string;
  views: number;
  references: number;
  lastAccessed?: Date;
  accessFrequency: 'high' | 'medium' | 'low';
  trendDirection: 'up' | 'down' | 'stable';
}

// =============================================================================
// SEARCH AND DISCOVERY TYPES
// =============================================================================

export interface SemanticSearchOptions {
  query: string;
  threshold?: number;
  limit?: number;
  includeContent?: boolean;
  includeSummaries?: boolean;
  resourceTypes?: ResourceType[];
  folderIds?: string[];
}

export interface SemanticSearchResult {
  resource: EnhancedResource;
  similarity: number;
  matchedContent: string;
  matchType: 'title' | 'description' | 'content' | 'summary' | 'tags';
}

export interface ResourceRecommendation {
  resource: EnhancedResource;
  score: number;
  reason: 'similar_content' | 'related_project' | 'shared_tags' | 'user_behavior' | 'topic_match';
  explanation: string;
}

export interface SmartSuggestions {
  relatedResources: ResourceRecommendation[];
  suggestedTags: Array<{
    tag: string;
    confidence: number;
    source: 'content' | 'similar_resources' | 'user_history' | 'popular';
  }>;
  suggestedFolders: Array<{
    folder: ResourceFolder;
    confidence: number;
    reason: string;
  }>;
  duplicateWarnings: Array<{
    resource: EnhancedResource;
    similarity: number;
    matchedFields: string[];
  }>;
}

// =============================================================================
// BULK OPERATIONS TYPES
// =============================================================================

export interface BulkResourceOperation {
  resourceIds: string[];
  operation: 'move' | 'tag' | 'delete' | 'summarize' | 'analyze' | 'reference';
  parameters?: {
    folderId?: string;
    tags?: string[];
    summaryType?: SummaryType;
    summaryLength?: SummaryLength;
    referenceTargetId?: string;
    referenceType?: ReferenceType;
  };
}

export interface BulkOperationResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: Array<{
    resourceId: string;
    error: string;
  }>;
  results?: any[];
}

// =============================================================================
// IMPORT/EXPORT TYPES
// =============================================================================

export interface ResourceImportOptions {
  source: 'file' | 'url' | 'clipboard' | 'api';
  folderId?: string;
  tags?: string[];
  generateSummary?: boolean;
  extractMetadata?: boolean;
  detectDuplicates?: boolean;
}

export interface ResourceExportOptions {
  format: 'json' | 'csv' | 'markdown' | 'pdf';
  includeContent?: boolean;
  includeSummaries?: boolean;
  includeReferences?: boolean;
  includeMetadata?: boolean;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  resources: EnhancedResource[];
  errors: Array<{
    source: string;
    error: string;
  }>;
  duplicatesFound: Array<{
    imported: EnhancedResource;
    existing: EnhancedResource;
    similarity: number;
  }>;
}

// =============================================================================
// UI STATE TYPES
// =============================================================================

export interface ResourceViewState {
  viewMode: 'list' | 'grid' | 'table' | 'tree';
  sortBy: 'title' | 'createdAt' | 'updatedAt' | 'type' | 'relevance';
  sortOrder: 'asc' | 'desc';
  filters: {
    types: ResourceType[];
    folders: string[];
    tags: string[];
    hasContent: boolean;
    hasSummary: boolean;
    dateRange?: {
      from: Date;
      to: Date;
    };
  };
  selectedResources: string[];
  searchQuery: string;
  currentFolder?: string;
}

export interface ResourceFormState {
  mode: 'create' | 'edit' | 'duplicate';
  resource?: Partial<EnhancedResource>;
  validation: {
    title?: string;
    description?: string;
    sourceUrl?: string;
    tags?: string;
  };
  isSubmitting: boolean;
  isDirty: boolean;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type ResourceWithRelations = EnhancedResource & {
  projects: Project[];
  areas: Area[];
  notes: Note[];
  summaries: ResourceSummary[];
  references: ResourceReference[];
  referencedBy: ResourceReference[];
  collections: ResourceCollection[];
  folder?: ResourceFolder;
};

export type ResourceListItem = Pick<EnhancedResource,
  'id' | 'title' | 'description' | 'type' | 'sourceUrl' | 'tags' | 'createdAt' | 'updatedAt'
> & {
  folder?: Pick<ResourceFolder, 'id' | 'name' | 'color'>;
  _count: {
    summaries: number;
    references: number;
    referencedBy: number;
  };
};

export type ResourceSummaryItem = Pick<ResourceSummary,
  'id' | 'content' | 'type' | 'length' | 'qualityScore' | 'isApproved' | 'createdAt'
>;

export type FolderBreadcrumb = Pick<ResourceFolder, 'id' | 'name' | 'path'>;

// =============================================================================
// EVENT TYPES
// =============================================================================

export interface ResourceEvent {
  type: 'created' | 'updated' | 'deleted' | 'moved' | 'referenced' | 'summarized';
  resourceId: string;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ResourceActivityFeed {
  events: ResourceEvent[];
  hasMore: boolean;
  nextCursor?: string;
}
