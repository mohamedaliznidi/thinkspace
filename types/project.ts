/**
 * Project Type Definitions for ThinkSpace
 * 
 * Centralized type definitions for projects, including base types,
 * extended types with relations, form data types, and API types.
 */

import type {
  Project as PrismaProject,
  ProjectStatus,
  ProjectPriority,
  ProjectTemplateCategory,
  User,
  Area,
  Resource,
  Note,
  Task,
  Chat,
  File,
  Activity,
  Connection
} from '@prisma/client';

// Re-export Prisma project types
export type { ProjectStatus, ProjectPriority, ProjectTemplateCategory } from '@prisma/client';

// Base Project type from Prisma
export type Project = PrismaProject;

// Project with minimal area information (for lists)
export interface ProjectWithArea extends Project {
  area?: {
    id: string;
    title: string;
    color: string;
  };
}

// Project with counts (for UI display)
export interface ProjectWithCounts extends ProjectWithArea {
  _count: {
    notes: number;
    resources: number;
    tasks: number;
    areas?: number;
    chats?: number;
    files?: number;
    activities?: number;
  };
}

// Project for display in components (commonly used interface)
export interface ProjectDisplay extends Omit<Project, 'startDate' | 'dueDate' | 'completedAt' | 'createdAt' | 'updatedAt'> {
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  areas?: Array<{
    id: string;
    title: string;
    color: string;
    description?: string;
  }>;
  resources?: Array<{
    id: string;
    title: string;
    description?: string;
    type: string;
    createdAt: string;
  }>;
  notes?: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    createdAt: string;
    updatedAt: string;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string;
    completedAt?: string;
  }>;
  _count: {
    notes: number;
    resources: number;
    tasks: number;
    areas?: number;
    chats?: number;
    files?: number;
    activities?: number;
  };
}

// Full Project with all relations (most comprehensive)
export interface ProjectWithRelations extends Project {
  user?: User;
  areas?: Area[];
  resources?: Resource[];
  notes?: Note[];
  tasks?: Task[];
  chats?: Chat[];
  files?: File[];
  activities?: Activity[];
  sourceConnections?: Connection[];
  targetConnections?: Connection[];
  template?: ProjectTemplate;
}

// Project for forms (create/update)
export interface ProjectFormData {
  title: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: Date | string;
  dueDate?: Date | string;
  tags?: string[];
  areaIds?: string[];
  templateId?: string;
}

// Project for creation (minimal required fields)
export interface ProjectCreateData {
  title: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: Date | string;
  dueDate?: Date | string;
  tags?: string[];
  areaIds?: string[];
  templateId?: string;
}

// Project for updates (all fields optional except id)
export interface ProjectUpdateData {
  id: string;
  title?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: Date | string | null;
  dueDate?: Date | string | null;
  completedAt?: Date | string | null;
  progress?: number;
  tags?: string[];
  areaIds?: string[];
}

// Project template types
export interface ProjectTemplate {
  id: string;
  title: string;
  description?: string;
  category: ProjectTemplateCategory;
  projectData: Record<string, any>;
  taskData?: Record<string, any>;
  milestones?: Record<string, any>;
  isPublic: boolean;
  isOfficial: boolean;
  tags: string[];
  metadata?: Record<string, any>;
  usageCount: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Project filter and query types
export interface ProjectFilters {
  status?: ProjectStatus | ProjectStatus[];
  priority?: ProjectPriority | ProjectPriority[];
  areaId?: string;
  overdue?: boolean;
  dueThisWeek?: boolean;
  dueThisMonth?: boolean;
  tags?: string[];
  search?: string;
  progress?: {
    min?: number;
    max?: number;
  };
}

export interface ProjectSortOptions {
  field: 'title' | 'status' | 'priority' | 'progress' | 'dueDate' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface ProjectQueryOptions {
  filters?: ProjectFilters;
  sort?: ProjectSortOptions;
  page?: number;
  limit?: number;
  includeAreas?: boolean;
  includeResources?: boolean;
  includeNotes?: boolean;
  includeTasks?: boolean;
  includeCounts?: boolean;
}

// Project statistics and analytics
export interface ProjectStats {
  total: number;
  byStatus: Record<ProjectStatus, number>;
  byPriority: Record<ProjectPriority, number>;
  overdue: number;
  completedThisWeek: number;
  completedThisMonth: number;
  averageProgress: number;
  averageCompletionTime?: number;
}

// Project component prop types
export interface ProjectCardProps {
  project: ProjectDisplay;
  onEdit?: (project: ProjectDisplay) => void;
  onDelete?: (project: ProjectDisplay) => void;
  onStatusChange?: (projectId: string, status: ProjectStatus) => void;
  onPriorityChange?: (projectId: string, priority: ProjectPriority) => void;
  showArea?: boolean;
  compact?: boolean;
}

export interface ProjectListProps {
  projects: ProjectDisplay[];
  loading?: boolean;
  error?: string;
  onProjectCreate?: () => void;
  onProjectEdit?: (project: ProjectDisplay) => void;
  onProjectDelete?: (project: ProjectDisplay) => void;
  onProjectStatusChange?: (projectId: string, status: ProjectStatus) => void;
  onProjectSelect?: (projectIds: string[]) => void;
  selectedProjects?: string[];
  showArea?: boolean;
  showBulkActions?: boolean;
}

export interface ProjectFormProps {
  project?: ProjectDisplay;
  areas: Array<{ id: string; title: string; color: string }>;
  templates?: ProjectTemplate[];
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

// Project status configuration
export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, {
  label: string;
  color: string;
  description: string;
  icon?: string;
}> = {
  PLANNING: {
    label: 'Planning',
    color: 'gray',
    description: 'Project is in planning phase',
  },
  ACTIVE: {
    label: 'Active',
    color: 'blue',
    description: 'Project is actively being worked on',
  },
  ON_HOLD: {
    label: 'On Hold',
    color: 'yellow',
    description: 'Project is temporarily paused',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'green',
    description: 'Project has been completed successfully',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'red',
    description: 'Project has been cancelled',
  },
  ARCHIVED: {
    label: 'Archived',
    color: 'dark',
    description: 'Project has been archived',
  },
};

// Project priority configuration
export const PROJECT_PRIORITY_CONFIG: Record<ProjectPriority, {
  label: string;
  color: string;
  weight: number;
  description: string;
}> = {
  LOW: {
    label: 'Low',
    color: 'green',
    weight: 1,
    description: 'Low priority project',
  },
  MEDIUM: {
    label: 'Medium',
    color: 'yellow',
    weight: 2,
    description: 'Medium priority project',
  },
  HIGH: {
    label: 'High',
    color: 'orange',
    weight: 3,
    description: 'High priority project',
  },
  URGENT: {
    label: 'Urgent',
    color: 'red',
    weight: 4,
    description: 'Urgent priority project',
  },
};

// Project template category configuration
export const PROJECT_TEMPLATE_CATEGORY_CONFIG: Record<ProjectTemplateCategory, {
  label: string;
  description: string;
  icon?: string;
}> = {
  SOFTWARE_DEVELOPMENT: {
    label: 'Software Development',
    description: 'Templates for software development projects',
  },
  MARKETING: {
    label: 'Marketing',
    description: 'Templates for marketing campaigns and projects',
  },
  DESIGN: {
    label: 'Design',
    description: 'Templates for design projects',
  },
  RESEARCH: {
    label: 'Research',
    description: 'Templates for research projects',
  },
  EVENT_PLANNING: {
    label: 'Event Planning',
    description: 'Templates for event planning projects',
  },
  PRODUCT_LAUNCH: {
    label: 'Product Launch',
    description: 'Templates for product launch projects',
  },
  CONTENT_CREATION: {
    label: 'Content Creation',
    description: 'Templates for content creation projects',
  },
  BUSINESS_PLANNING: {
    label: 'Business Planning',
    description: 'Templates for business planning projects',
  },
  EDUCATION: {
    label: 'Education',
    description: 'Templates for educational projects',
  },
  PERSONAL: {
    label: 'Personal',
    description: 'Templates for personal projects',
  },
  OTHER: {
    label: 'Other',
    description: 'Other project templates',
  },
};
