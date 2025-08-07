/**
 * API Type Definitions for ThinkSpace
 * 
 * Type definitions for API requests, responses, and middleware
 * used throughout the ThinkSpace application.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { Session } from 'next-auth';
import { 
  User, 
  Project, 
  Area, 
  Resource, 
  Note, 
  Chat, 
  Message,
  UserRole,
  ProjectStatus,
  ProjectPriority,
  AreaType,
  ResourceType,
  NoteType,
  ChatType
} from '@prisma/client';

// Base API Types
export interface ApiRequest extends NextApiRequest {
  user?: User;
  session?: Session;
}

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
  duration?: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
  statusCode: number;
}

// Authentication API Types
export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresAt: Date;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  message: string;
}

export interface PasswordUpdateRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// User API Types
export interface UserUpdateRequest {
  name?: string;
  bio?: string;
  avatar?: string;
  timezone?: string;
  preferences?: Record<string, any>;
  settings?: Record<string, any>;
}

export interface UserResponse {
  user: User;
}

export interface UsersListResponse {
  users: User[];
  meta: ApiMeta;
}

// Project API Types
export interface ProjectCreateRequest {
  title: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: string;
  dueDate?: string;
  tags?: string[];
  areaIds?: string[];
}

export interface ProjectUpdateRequest {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  progress?: number;
  tags?: string[];
  areaIds?: string[];
}

export interface ProjectResponse {
  project: Project;
}

export interface ProjectsListResponse {
  projects: Project[];
  meta: ApiMeta;
}

export interface ProjectsListRequest {
  page?: number;
  limit?: number;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  search?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'dueDate' | 'progress';
  sortOrder?: 'asc' | 'desc';
  areaId?: string;
}

// Area API Types
export interface AreaCreateRequest {
  title: string;
  description?: string;
  type: AreaType;
  isActive?: boolean;
  color?: string;
  tags?: string[];
}

export interface AreaUpdateRequest {
  title?: string;
  description?: string;
  type?: AreaType;
  isActive?: boolean;
  color?: string;
  tags?: string[];
}

export interface AreaResponse {
  area: Area;
}

export interface AreasListResponse {
  areas: Area[];
  meta: ApiMeta;
}

export interface AreasListRequest {
  page?: number;
  limit?: number;
  type?: AreaType;
  isActive?: boolean;
  search?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'type';
  sortOrder?: 'asc' | 'desc';
}

// Resource API Types
export interface ResourceCreateRequest {
  title: string;
  description?: string;
  type: ResourceType;
  sourceUrl?: string;
  contentExtract?: string;
  tags?: string[];
  projectIds?: string[];
  areaIds?: string[];
}

export interface ResourceUpdateRequest {
  title?: string;
  description?: string;
  type?: ResourceType;
  sourceUrl?: string;
  contentExtract?: string;
  tags?: string[];
  projectIds?: string[];
  areaIds?: string[];
}

export interface ResourceResponse {
  resource: Resource;
}

export interface ResourcesListResponse {
  resources: Resource[];
  meta: ApiMeta;
}

export interface ResourcesListRequest {
  page?: number;
  limit?: number;
  type?: ResourceType;
  search?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'type';
  sortOrder?: 'asc' | 'desc';
  projectId?: string;
  areaId?: string;
}

// Note API Types
export interface NoteCreateRequest {
  title: string;
  content: string;
  type?: NoteType;
  tags?: string[];
  projectIds?: string[];
  areaIds?: string[];
  resourceIds?: string[];
}

export interface NoteUpdateRequest {
  title?: string;
  content?: string;
  type?: NoteType;
  tags?: string[];
  projectIds?: string[];
  areaIds?: string[];
  resourceIds?: string[];
}

export interface NoteResponse {
  note: Note;
}

export interface NotesListResponse {
  notes: Note[];
  meta: ApiMeta;
}

export interface NotesListRequest {
  page?: number;
  limit?: number;
  type?: NoteType;
  search?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'type';
  sortOrder?: 'asc' | 'desc';
  projectId?: string;
  areaId?: string;
  resourceId?: string;
}

// Chat API Types
export interface ChatCreateRequest {
  title: string;
  type?: ChatType;
  contextId?: string;
  projectId?: string;
  areaId?: string;
  resourceId?: string;
  noteId?: string;
}

export interface ChatUpdateRequest {
  title?: string;
  type?: ChatType;
}

export interface ChatResponse {
  chat: Chat;
}

export interface ChatsListResponse {
  chats: Chat[];
  meta: ApiMeta;
}

export interface MessageCreateRequest {
  content: string;
  role?: 'USER' | 'ASSISTANT' | 'SYSTEM';
  metadata?: Record<string, any>;
}

export interface MessageResponse {
  message: Message;
}

export interface MessagesListResponse {
  messages: Message[];
  meta: ApiMeta;
}

// Search API Types
export interface SearchRequest {
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

// Vector Search API Types
export interface VectorSearchRequest {
  query: string;
  limit?: number;
  threshold?: number;
  includeNotes?: boolean;
  includeResources?: boolean;
  includeFiles?: boolean;
}

export interface VectorSearchResponse {
  results: SearchResult[];
  query: string;
  total: number;
  duration: number;
}

// Graph API Types
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

export interface GraphRequest {
  entityId?: string;
  maxDepth?: number;
  relationshipTypes?: string[];
  limit?: number;
}

export interface GraphResponse {
  graph: GraphData;
  stats: {
    nodeCount: number;
    relationshipCount: number;
    nodeTypes: Record<string, number>;
    relationshipTypes: Record<string, number>;
  };
}

// File Upload API Types
export interface FileUploadRequest {
  filename?: string;
  description?: string;
  tags?: string[];
  projectIds?: string[];
  areaIds?: string[];
  resourceIds?: string[];
  noteIds?: string[];
}

export interface FileUploadResponse {
  file: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    status: string;
  };
  uploadUrl?: string;
}

export interface FileProcessingResponse {
  file: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    status: string;
    contentExtract?: string;
    metadata?: Record<string, any>;
  };
}

// Analytics API Types
export interface AnalyticsRequest {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsResponse {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalAreas: number;
  activeAreas: number;
  totalResources: number;
  totalNotes: number;
  totalConnections: number;
  recentActivity: any[];
  projectProgress: any[];
  areaDistribution: any[];
  contentGrowth: any[];
}

// Middleware Types
export interface AuthenticatedApiRequest extends ApiRequest {
  user: User;
  session: Session;
}

export interface RoleBasedApiRequest extends AuthenticatedApiRequest {
  requiredRole: UserRole;
}

// Validation Types
export interface ValidationRule {
  field: string;
  rules: string[];
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

// Rate Limiting Types
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

// Webhook Types
export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

export interface WebhookResponse {
  received: boolean;
  processed: boolean;
  message?: string;
}

// Export utility type for API handlers
export type ApiHandler<T = any> = (
  req: ApiRequest,
  res: NextApiResponse<ApiResponse<T>>
) => Promise<void> | void;

export type AuthenticatedApiHandler<T = any> = (
  req: AuthenticatedApiRequest,
  res: NextApiResponse<ApiResponse<T>>
) => Promise<void> | void;
