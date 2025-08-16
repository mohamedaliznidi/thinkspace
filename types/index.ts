/**
 * ThinkSpace Type Definitions
 *
 * Central type definitions for the ThinkSpace PARA methodology
 * knowledge management system. Includes database models, API types,
 * authentication types, and utility types.
 */

// Import and re-export centralized task types
export * from './task';

// Import and re-export centralized project types
export * from './project';

import type {
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
  File,
  Task,
  UserRole,
  ProjectStatus,
  ProjectPriority,
  TaskStatus,
  TaskPriority,
  ProjectTemplateCategory,
  AreaType,
  ResourceType,
  NoteType,
  ChatType,
  MessageRole,
  FileStatus,
  ActivityType,
  ConnectionType
} from '@prisma/client';

// Re-export Prisma generated types
export type {
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
  File,
  Task,
  UserRole,
  ProjectStatus,
  ProjectPriority,
  TaskStatus,
  TaskPriority,
  ProjectTemplateCategory,
  AreaType,
  ResourceType,
  NoteType,
  ChatType,
  MessageRole,
  FileStatus,
  ActivityType,
  ConnectionType
} from '@prisma/client';

// Enhanced types with relations
export interface UserWithRelations extends User {
  projects?: Project[];
  areas?: Area[];
  resources?: Resource[];
  notes?: Note[];
  chats?: Chat[];
  messages?: Message[];
  connections?: Connection[];
  activities?: Activity[];
  files?: File[];
  searches?: Search[];
  graphSnapshots?: GraphSnapshot[];
}

export interface ProjectWithRelations extends Project {
  user?: User;
  areas?: Area[];
  resources?: Resource[];
  notes?: Note[];
  chats?: Chat[];
  files?: File[];
  activities?: Activity[];
  sourceConnections?: Connection[];
  targetConnections?: Connection[];
}

export interface AreaWithRelations extends Area {
  user?: User;
  projects?: Project[];
  resources?: Resource[];
  notes?: Note[];
  chats?: Chat[];
  files?: File[];
  activities?: Activity[];
  sourceConnections?: Connection[];
  targetConnections?: Connection[];
}

export interface ResourceWithRelations extends Resource {
  user?: User;
  projects?: Project[];
  areas?: Area[];
  notes?: Note[];
  chats?: Chat[];
  files?: File[];
  activities?: Activity[];
  sourceConnections?: Connection[];
  targetConnections?: Connection[];
}

export interface NoteWithRelations extends Note {
  user?: User;
  projects?: Project[];
  areas?: Area[];
  resources?: Resource[];
  chats?: Chat[];
  files?: File[];
  activities?: Activity[];
  sourceConnections?: Connection[];
  targetConnections?: Connection[];
}

export interface ChatWithRelations extends Chat {
  user?: User;
  project?: Project;
  area?: Area;
  resource?: Resource;
  note?: Note;
  messages?: Message[];
}

export interface MessageWithRelations extends Message {
  user?: User;
  chat?: Chat;
}

export interface ConnectionWithRelations extends Connection {
  user?: User;
  sourceNote?: Note;
  sourceProject?: Project;
  sourceArea?: Area;
  sourceResource?: Resource;
  targetNote?: Note;
  targetProject?: Project;
  targetArea?: Area;
  targetResource?: Resource;
}

export interface FileWithRelations extends File {
  user?: User;
  projects?: Project[];
  areas?: Area[];
  resources?: Resource[];
  notes?: Note[];
  activities?: Activity[];
}

export interface TaskWithRelations extends Task {
  user?: User;
  project?: Project;
  parentTask?: Task;
  subtasks?: Task[];
  dependsOnTasks?: Task[];
  dependentTasks?: Task[];
  activities?: Activity[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: ApiMeta;
}

export interface ApiMeta {
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
  totalPages?: number;
  nextPage?: number;
  prevPage?: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filter?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: ApiMeta;
}

// Search Types
export interface SearchParams {
  query: string;
  type?: 'all' | 'notes' | 'resources' | 'projects' | 'areas' | 'files';
  limit?: number;
  threshold?: number;
  includeContent?: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  content?: string;
  excerpt?: string;
  type: 'note' | 'resource' | 'project' | 'area' | 'file';
  similarity?: number;
  score?: number;
  highlights?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  total: number;
  duration: number;
  suggestions?: string[];
}

// Vector Search Types
export interface VectorSearchParams {
  query: string;
  limit?: number;
  threshold?: number;
  includeNotes?: boolean;
  includeResources?: boolean;
  includeFiles?: boolean;
}

export interface VectorSearchResult extends SearchResult {
  embedding?: number[];
  distance?: number;
}

// Graph Types
export interface GraphNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
}

export interface GraphRelationship {
  id: string;
  type: string;
  startNodeId: string;
  endNodeId: string;
  properties: Record<string, any>;
  strength?: number;
  color?: string;
  width?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  stats?: GraphStats;
}

export interface GraphStats {
  nodeCount: number;
  relationshipCount: number;
  nodeTypes: Record<string, number>;
  relationshipTypes: Record<string, number>;
  density: number;
  avgDegree: number;
}

export interface GraphVisualizationConfig {
  width: number;
  height: number;
  nodeSize: number;
  linkDistance: number;
  charge: number;
  showLabels: boolean;
  showRelationshipLabels: boolean;
  colorScheme: string;
  layout: 'force' | 'circular' | 'hierarchical';
}

// Authentication Types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  timezone?: string;
  preferences?: UserPreferences;
  settings?: UserSettings;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: boolean;
  autoSave?: boolean;
  defaultView?: 'dashboard' | 'projects' | 'areas' | 'resources' | 'notes';
  sidebarCollapsed?: boolean;
  language?: string;
  timezone?: string;
}

export interface UserSettings {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  weeklyDigest?: boolean;
  monthlyReport?: boolean;
  shareAnalytics?: boolean;
  publicProfile?: boolean;
  twoFactorEnabled?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Task API Types
export interface TaskCreateRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId: string;
  parentTaskId?: string;
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  order?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  parentTaskId?: string | null;
  dueDate?: string | null;
  startDate?: string | null;
  completedAt?: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  order?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TaskResponse {
  task: Task;
}

export interface TasksListResponse {
  tasks: Task[];
  meta: ApiMeta;
}

export interface TasksListRequest {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  parentTaskId?: string;
  search?: string;
  sortBy?: 'title' | 'status' | 'priority' | 'dueDate' | 'createdAt' | 'updatedAt' | 'order';
  sortOrder?: 'asc' | 'desc';
  includeSubtasks?: boolean;
  includeProject?: boolean;
}

// Form Types
export interface ProjectFormData {
  title: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: Date;
  dueDate?: Date;
  tags: string[];
  areaIds?: string[];
}

export interface AreaFormData {
  title: string;
  description?: string;
  type: AreaType;
  isActive: boolean;
  color?: string;
  tags: string[];
}

export interface ResourceFormData {
  title: string;
  description?: string;
  type: ResourceType;
  sourceUrl?: string;
  tags: string[];
  projectIds?: string[];
  areaIds?: string[];
}

export interface NoteFormData {
  title: string;
  content: string;
  type: NoteType;
  tags: string[];
  projectIds?: string[];
  areaIds?: string[];
  resourceIds?: string[];
}

export interface ChatFormData {
  title: string;
  type: ChatType;
  contextId?: string;
  projectId?: string;
  areaId?: string;
  resourceId?: string;
  noteId?: string;
}

// File Upload Types
export interface FileUploadData {
  file: File;
  filename?: string;
  description?: string;
  tags?: string[];
  projectIds?: string[];
  areaIds?: string[];
  resourceIds?: string[];
  noteIds?: string[];
}

export interface FileProcessingResult {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  contentExtract?: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

// Analytics Types
export interface AnalyticsData {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalAreas: number;
  activeAreas: number;
  totalResources: number;
  totalNotes: number;
  totalConnections: number;
  recentActivity: Activity[];
  projectProgress: ProjectProgress[];
  areaDistribution: AreaDistribution[];
  contentGrowth: ContentGrowth[];
}

export interface ProjectProgress {
  id: string;
  title: string;
  progress: number;
  status: ProjectStatus;
  dueDate?: Date;
}

export interface AreaDistribution {
  type: AreaType;
  count: number;
  percentage: number;
}

export interface ContentGrowth {
  date: string;
  notes: number;
  resources: number;
  projects: number;
  total: number;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type EntityType = 'user' | 'project' | 'area' | 'resource' | 'note' | 'chat' | 'message' | 'file' | 'task';

export type SortOrder = 'asc' | 'desc';

export type Theme = 'light' | 'dark' | 'auto';

export type ViewMode = 'list' | 'grid' | 'card' | 'table';

// Configuration Types
export interface AppConfig {
  name: string;
  version: string;
  description: string;
  author: string;
  homepage: string;
  repository: string;
  license: string;
  features: {
    vectorSearch: boolean;
    knowledgeGraph: boolean;
    aiChat: boolean;
    fileUpload: boolean;
    analytics: boolean;
  };
  limits: {
    maxFileSize: number;
    maxProjects: number;
    maxNotes: number;
    maxConnections: number;
  };
}

// Error Types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, { field, ...details });
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND_ERROR', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT_ERROR', 409);
    this.name = 'ConflictError';
  }
}
