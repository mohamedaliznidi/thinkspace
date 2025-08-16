/**
 * Database Type Definitions for ThinkSpace
 * 
 * Extended type definitions for database operations, queries,
 * and data transformations used throughout the ThinkSpace application.
 */

import { Prisma } from '@prisma/client';

// Prisma Client Types with Relations
export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    projects: true;
    areas: true;
    resources: true;
    notes: true;
    chats: true;
    messages: true;
    connections: true;
    activities: true;
    files: true;
    searches: true;
    graphSnapshots: true;
  };
}>;

export type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    user: true;
    areas: true;
    resources: true;
    notes: true;
    chats: true;
    files: true;
    activities: true;
    sourceConnections: true;
    targetConnections: true;
  };
}>;

export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    user: true;
    project: true;
    parentTask: true;
    subtasks: true;
    dependsOnTasks: true;
    dependentTasks: true;
    activities: true;
  };
}>;

export type AreaWithRelations = Prisma.AreaGetPayload<{
  include: {
    user: true;
    projects: true;
    resources: true;
    notes: true;
    chats: true;
    files: true;
    activities: true;
    sourceConnections: true;
    targetConnections: true;
  };
}>;

export type ResourceWithRelations = Prisma.ResourceGetPayload<{
  include: {
    user: true;
    projects: true;
    areas: true;
    notes: true;
    chats: true;
    files: true;
    activities: true;
    sourceConnections: true;
    targetConnections: true;
  };
}>;

export type NoteWithRelations = Prisma.NoteGetPayload<{
  include: {
    user: true;
    projects: true;
    areas: true;
    resources: true;
    chats: true;
    files: true;
    activities: true;
    sourceConnections: true;
    targetConnections: true;
  };
}>;

export type ChatWithRelations = Prisma.ChatGetPayload<{
  include: {
    user: true;
    project: true;
    area: true;
    resource: true;
    note: true;
    messages: {
      include: {
        user: true;
      };
    };
  };
}>;

export type MessageWithRelations = Prisma.MessageGetPayload<{
  include: {
    user: true;
    chat: true;
  };
}>;

export type ConnectionWithRelations = Prisma.ConnectionGetPayload<{
  include: {
    user: true;
    sourceNote: true;
    sourceProject: true;
    sourceArea: true;
    sourceResource: true;
    targetNote: true;
    targetProject: true;
    targetArea: true;
    targetResource: true;
  };
}>;

export type FileWithRelations = Prisma.FileGetPayload<{
  include: {
    user: true;
    projects: true;
    areas: true;
    resources: true;
    notes: true;
    activities: true;
  };
}>;

export type ActivityWithRelations = Prisma.ActivityGetPayload<{
  include: {
    user: true;
    project: true;
    area: true;
    resource: true;
    note: true;
    file: true;
  };
}>;

// Query Input Types
export type UserCreateInput = Prisma.UserCreateInput;
export type UserUpdateInput = Prisma.UserUpdateInput;
export type UserWhereInput = Prisma.UserWhereInput;
export type UserWhereUniqueInput = Prisma.UserWhereUniqueInput;
export type UserOrderByInput = Prisma.UserOrderByWithRelationInput;

export type ProjectCreateInput = Prisma.ProjectCreateInput;
export type ProjectUpdateInput = Prisma.ProjectUpdateInput;
export type ProjectWhereInput = Prisma.ProjectWhereInput;
export type ProjectWhereUniqueInput = Prisma.ProjectWhereUniqueInput;
export type ProjectOrderByInput = Prisma.ProjectOrderByWithRelationInput;

export type AreaCreateInput = Prisma.AreaCreateInput;
export type AreaUpdateInput = Prisma.AreaUpdateInput;
export type AreaWhereInput = Prisma.AreaWhereInput;
export type AreaWhereUniqueInput = Prisma.AreaWhereUniqueInput;
export type AreaOrderByInput = Prisma.AreaOrderByWithRelationInput;

export type ResourceCreateInput = Prisma.ResourceCreateInput;
export type ResourceUpdateInput = Prisma.ResourceUpdateInput;
export type ResourceWhereInput = Prisma.ResourceWhereInput;
export type ResourceWhereUniqueInput = Prisma.ResourceWhereUniqueInput;
export type ResourceOrderByInput = Prisma.ResourceOrderByWithRelationInput;

export type NoteCreateInput = Prisma.NoteCreateInput;
export type NoteUpdateInput = Prisma.NoteUpdateInput;
export type NoteWhereInput = Prisma.NoteWhereInput;
export type NoteWhereUniqueInput = Prisma.NoteWhereUniqueInput;
export type NoteOrderByInput = Prisma.NoteOrderByWithRelationInput;

export type TaskCreateInput = Prisma.TaskCreateInput;
export type TaskUpdateInput = Prisma.TaskUpdateInput;
export type TaskWhereInput = Prisma.TaskWhereInput;
export type TaskWhereUniqueInput = Prisma.TaskWhereUniqueInput;
export type TaskOrderByInput = Prisma.TaskOrderByWithRelationInput;

export type ChatCreateInput = Prisma.ChatCreateInput;
export type ChatUpdateInput = Prisma.ChatUpdateInput;
export type ChatWhereInput = Prisma.ChatWhereInput;
export type ChatWhereUniqueInput = Prisma.ChatWhereUniqueInput;
export type ChatOrderByInput = Prisma.ChatOrderByWithRelationInput;

export type MessageCreateInput = Prisma.MessageCreateInput;
export type MessageUpdateInput = Prisma.MessageUpdateInput;
export type MessageWhereInput = Prisma.MessageWhereInput;
export type MessageWhereUniqueInput = Prisma.MessageWhereUniqueInput;
export type MessageOrderByInput = Prisma.MessageOrderByWithRelationInput;

// Database Operation Types
export interface DatabaseOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  skip?: number;
  take?: number;
}

export interface SortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterOptions {
  search?: string;
  filters?: Record<string, any>;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

export interface QueryOptions extends PaginationOptions, SortOptions, FilterOptions {
  include?: Record<string, boolean | object>;
  select?: Record<string, boolean>;
}

// Repository Pattern Types
export interface BaseRepository<T, CreateInput, UpdateInput, WhereInput, WhereUniqueInput> {
  create(data: CreateInput): Promise<T>;
  findMany(options?: QueryOptions): Promise<T[]>;
  findUnique(where: WhereUniqueInput, options?: QueryOptions): Promise<T | null>;
  findFirst(where: WhereInput, options?: QueryOptions): Promise<T | null>;
  update(where: WhereUniqueInput, data: UpdateInput): Promise<T>;
  delete(where: WhereUniqueInput): Promise<T>;
  count(where?: WhereInput): Promise<number>;
  upsert(where: WhereUniqueInput, create: CreateInput, update: UpdateInput): Promise<T>;
}

export interface UserRepository extends BaseRepository<
  UserWithRelations,
  UserCreateInput,
  UserUpdateInput,
  UserWhereInput,
  UserWhereUniqueInput
> {
  findByEmail(email: string): Promise<UserWithRelations | null>;
  findByIdWithRelations(id: string): Promise<UserWithRelations | null>;
  updatePreferences(id: string, preferences: Record<string, any>): Promise<UserWithRelations>;
  updateSettings(id: string, settings: Record<string, any>): Promise<UserWithRelations>;
}

export interface ProjectRepository extends BaseRepository<
  ProjectWithRelations,
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectWhereInput,
  ProjectWhereUniqueInput
> {
  findByUserId(userId: string, options?: QueryOptions): Promise<ProjectWithRelations[]>;
  findByStatus(status: string, userId: string): Promise<ProjectWithRelations[]>;
  findByPriority(priority: string, userId: string): Promise<ProjectWithRelations[]>;
  findOverdue(userId: string): Promise<ProjectWithRelations[]>;
  updateProgress(id: string, progress: number): Promise<ProjectWithRelations>;
  markCompleted(id: string): Promise<ProjectWithRelations>;
}

export interface AreaRepository extends BaseRepository<
  AreaWithRelations,
  AreaCreateInput,
  AreaUpdateInput,
  AreaWhereInput,
  AreaWhereUniqueInput
> {
  findByUserId(userId: string, options?: QueryOptions): Promise<AreaWithRelations[]>;
  findByType(type: string, userId: string): Promise<AreaWithRelations[]>;
  findActive(userId: string): Promise<AreaWithRelations[]>;
  toggleActive(id: string): Promise<AreaWithRelations>;
}

export interface ResourceRepository extends BaseRepository<
  ResourceWithRelations,
  ResourceCreateInput,
  ResourceUpdateInput,
  ResourceWhereInput,
  ResourceWhereUniqueInput
> {
  findByUserId(userId: string, options?: QueryOptions): Promise<ResourceWithRelations[]>;
  findByType(type: string, userId: string): Promise<ResourceWithRelations[]>;
  findByUrl(url: string): Promise<ResourceWithRelations | null>;
  updateContent(id: string, content: string): Promise<ResourceWithRelations>;
}

export interface NoteRepository extends BaseRepository<
  NoteWithRelations,
  NoteCreateInput,
  NoteUpdateInput,
  NoteWhereInput,
  NoteWhereUniqueInput
> {
  findByUserId(userId: string, options?: QueryOptions): Promise<NoteWithRelations[]>;
  findByType(type: string, userId: string): Promise<NoteWithRelations[]>;
  searchContent(query: string, userId: string): Promise<NoteWithRelations[]>;
  findRecent(userId: string, limit?: number): Promise<NoteWithRelations[]>;
}

export interface ChatRepository extends BaseRepository<
  ChatWithRelations,
  ChatCreateInput,
  ChatUpdateInput,
  ChatWhereInput,
  ChatWhereUniqueInput
> {
  findByUserId(userId: string, options?: QueryOptions): Promise<ChatWithRelations[]>;
  findByType(type: string, userId: string): Promise<ChatWithRelations[]>;
  findWithMessages(id: string): Promise<ChatWithRelations | null>;
  addMessage(chatId: string, messageData: MessageCreateInput): Promise<MessageWithRelations>;
}

export interface TaskRepository extends BaseRepository<
  TaskWithRelations,
  TaskCreateInput,
  TaskUpdateInput,
  TaskWhereInput,
  TaskWhereUniqueInput
> {
  findByUserId(userId: string, options?: QueryOptions): Promise<TaskWithRelations[]>;
  findByProjectId(projectId: string, options?: QueryOptions): Promise<TaskWithRelations[]>;
  findByStatus(status: string, userId: string): Promise<TaskWithRelations[]>;
  findByPriority(priority: string, userId: string): Promise<TaskWithRelations[]>;
  findOverdue(userId: string): Promise<TaskWithRelations[]>;
  findSubtasks(parentTaskId: string): Promise<TaskWithRelations[]>;
  updateStatus(id: string, status: string): Promise<TaskWithRelations>;
  updateProgress(id: string, actualHours: number): Promise<TaskWithRelations>;
  markCompleted(id: string): Promise<TaskWithRelations>;
  addDependency(taskId: string, dependsOnTaskId: string): Promise<void>;
  removeDependency(taskId: string, dependsOnTaskId: string): Promise<void>;
}

// Transaction Types
export interface TransactionContext {
  user: Prisma.TransactionClient['user'];
  project: Prisma.TransactionClient['project'];
  area: Prisma.TransactionClient['area'];
  resource: Prisma.TransactionClient['resource'];
  note: Prisma.TransactionClient['note'];
  task: Prisma.TransactionClient['task'];
  chat: Prisma.TransactionClient['chat'];
  message: Prisma.TransactionClient['message'];
  connection: Prisma.TransactionClient['connection'];
  activity: Prisma.TransactionClient['activity'];
  file: Prisma.TransactionClient['file'];
  search: Prisma.TransactionClient['search'];
  graphSnapshot: Prisma.TransactionClient['graphSnapshot'];
}

export type TransactionCallback<T> = (ctx: TransactionContext) => Promise<T>;

// Vector Search Types
export interface VectorSearchOptions {
  query: string;
  limit?: number;
  threshold?: number;
  userId: string;
}

export interface VectorSearchResult {
  id: string;
  title: string;
  content?: string;
  type: 'note' | 'resource' | 'file';
  similarity: number;
  metadata?: Record<string, any>;
}

// Graph Database Types (Neo4j)
export interface Neo4jNode {
  identity: number;
  labels: string[];
  properties: Record<string, any>;
}

export interface Neo4jRelationship {
  identity: number;
  start: number;
  end: number;
  type: string;
  properties: Record<string, any>;
}

export interface Neo4jPath {
  start: Neo4jNode;
  end: Neo4jNode;
  segments: Array<{
    start: Neo4jNode;
    relationship: Neo4jRelationship;
    end: Neo4jNode;
  }>;
  length: number;
}

export interface Neo4jQueryResult {
  records: any[];
  summary: {
    query: {
      text: string;
      parameters: Record<string, any>;
    };
    queryType: string;
    counters: {
      nodesCreated: number;
      nodesDeleted: number;
      relationshipsCreated: number;
      relationshipsDeleted: number;
      propertiesSet: number;
      labelsAdded: number;
      labelsRemoved: number;
      indexesAdded: number;
      indexesRemoved: number;
      constraintsAdded: number;
      constraintsRemoved: number;
    };
    plan?: any;
    profile?: any;
    notifications: any[];
    resultAvailableAfter: number;
    resultConsumedAfter: number;
  };
}

// Audit and Activity Types
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  type: string;
  description: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Cache Types
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[];
  namespace?: string;
}

export interface CacheResult<T> {
  hit: boolean;
  data?: T;
  ttl?: number;
  createdAt?: Date;
}

// Migration Types
export interface MigrationInfo {
  id: string;
  name: string;
  appliedAt: Date;
  checksum: string;
}

export interface MigrationResult {
  success: boolean;
  migrationsApplied: string[];
  errors?: string[];
}

// Backup Types
export interface BackupOptions {
  includeData?: boolean;
  includeSchema?: boolean;
  compress?: boolean;
  encryption?: {
    enabled: boolean;
    key?: string;
  };
}

export interface BackupResult {
  success: boolean;
  filename: string;
  size: number;
  checksum: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

// Health Check Types
export interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  postgresql: {
    connected: boolean;
    responseTime: number;
    activeConnections: number;
    maxConnections: number;
  };
  neo4j: {
    connected: boolean;
    responseTime: number;
    version: string;
    clusterRole?: string;
  };
  redis?: {
    connected: boolean;
    responseTime: number;
    memory: {
      used: number;
      max: number;
    };
  };
  lastChecked: Date;
}
