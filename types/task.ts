/**
 * Task Type Definitions for ThinkSpace
 * 
 * Centralized type definitions for tasks, including base types,
 * extended types with relations, form data types, and API types.
 */

import type {
  Task as PrismaTask,
  TaskStatus,
  TaskPriority,
  Project,
  User,
  Activity
} from '@prisma/client';

// Re-export Prisma task types
export type { TaskStatus, TaskPriority } from '@prisma/client';

// Base Task type from Prisma
export type Task = PrismaTask;

// Task with minimal project information (for lists and cards)
export interface TaskWithProject extends Task {
  project: {
    id: string;
    title: string;
    status: string;
  };
}

// Task with parent task information
export interface TaskWithParent extends TaskWithProject {
  parentTask?: {
    id: string;
    title: string;
  };
}

// Task with subtasks information
export interface TaskWithSubtasks extends TaskWithParent {
  subtasks?: {
    id: string;
    title: string;
    status: string;
    completedAt?: string;
  }[];
}

// Task with counts (for UI display)
export interface TaskWithCounts extends TaskWithSubtasks {
  _count: {
    subtasks: number;
    activities: number;
  };
}

// Full Task with all relations (most comprehensive)
export interface TaskWithRelations extends Task {
  user?: User;
  project?: Project;
  parentTask?: Task;
  subtasks?: Task[];
  dependsOnTasks?: Task[];
  dependentTasks?: Task[];
  activities?: Activity[];
}

// Task for display in components (commonly used interface)
export interface TaskDisplay extends Omit<Task, 'dueDate' | 'startDate' | 'completedAt' | 'createdAt' | 'updatedAt'> {
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    title: string;
    status: string;
  };
  parentTask?: {
    id: string;
    title: string;
  };
  subtasks?: {
    id: string;
    title: string;
    status: string;
    completedAt?: string;
  }[];
  _count: {
    subtasks: number;
    activities: number;
  };
}

// Task for forms (create/update)
export interface TaskFormData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId: string;
  parentTaskId?: string;
  dueDate?: Date | string;
  startDate?: Date | string;
  estimatedHours?: number;
  actualHours?: number;
  order?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

// Task for creation (minimal required fields)
export interface TaskCreateData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId: string;
  parentTaskId?: string;
  dueDate?: Date | string;
  startDate?: Date | string;
  estimatedHours?: number;
  order?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

// Task for updates (all fields optional except id)
export interface TaskUpdateData {
  id: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  parentTaskId?: string | null;
  dueDate?: Date | string | null;
  startDate?: Date | string | null;
  completedAt?: Date | string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  order?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

// Task for bulk operations
export interface TaskBulkData {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
}

// Task for planning/Gantt charts
export interface TaskPlanningData {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  parentTask?: {
    id: string;
    title: string;
  };
  dependsOnTasks?: {
    id: string;
    title: string;
    completedAt?: string;
  }[];
  progress?: number;
}

// Task dependency types
export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  createdAt: Date;
}

// Task filter and query types
export interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  projectId?: string;
  parentTaskId?: string;
  assignedToMe?: boolean;
  overdue?: boolean;
  dueThisWeek?: boolean;
  tags?: string[];
  search?: string;
}

export interface TaskSortOptions {
  field: 'title' | 'status' | 'priority' | 'dueDate' | 'createdAt' | 'updatedAt' | 'order';
  direction: 'asc' | 'desc';
}

export interface TaskQueryOptions {
  filters?: TaskFilters;
  sort?: TaskSortOptions;
  page?: number;
  limit?: number;
  includeProject?: boolean;
  includeSubtasks?: boolean;
  includeParent?: boolean;
  includeCounts?: boolean;
}

// Task statistics and analytics
export interface TaskStats {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  overdue: number;
  completedThisWeek: number;
  completedThisMonth: number;
  averageCompletionTime?: number;
  productivityScore?: number;
}

// Task component prop types
export interface TaskCardProps {
  task: TaskDisplay;
  onEdit?: (task: TaskDisplay) => void;
  onDelete?: (task: TaskDisplay) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onPriorityChange?: (taskId: string, priority: TaskPriority) => void;
  showProject?: boolean;
  compact?: boolean;
}

export interface TaskListProps {
  tasks: TaskDisplay[];
  loading?: boolean;
  error?: string;
  onTaskCreate?: () => void;
  onTaskEdit?: (task: TaskDisplay) => void;
  onTaskDelete?: (task: TaskDisplay) => void;
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void;
  onTaskSelect?: (taskIds: string[]) => void;
  selectedTasks?: string[];
  showProject?: boolean;
  showBulkActions?: boolean;
}

export interface TaskFormProps {
  task?: TaskDisplay;
  projectId?: string;
  parentTaskId?: string;
  projects: Array<{ id: string; title: string; status: string }>;
  availableParentTasks?: Array<{ id: string; title: string }>;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

// Task status and priority values for validation
export const TASK_STATUS_VALUES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'COMPLETED', 'CANCELLED'] as const;
export const TASK_PRIORITY_VALUES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

// Task status configuration
export const TASK_STATUS_CONFIG: Record<TaskStatus, {
  label: string;
  color: string;
  description: string;
  icon?: string;
}> = {
  TODO: {
    label: 'To Do',
    color: 'gray',
    description: 'Task is ready to be started',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'blue',
    description: 'Task is currently being worked on',
  },
  IN_REVIEW: {
    label: 'In Review',
    color: 'yellow',
    description: 'Task is completed and awaiting review',
  },
  BLOCKED: {
    label: 'Blocked',
    color: 'red',
    description: 'Task is blocked by dependencies or issues',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'green',
    description: 'Task has been completed successfully',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'dark',
    description: 'Task has been cancelled and will not be completed',
  },
};

// Task priority configuration
export const TASK_PRIORITY_CONFIG: Record<TaskPriority, {
  label: string;
  color: string;
  weight: number;
  description: string;
}> = {
  LOW: {
    label: 'Low',
    color: 'green',
    weight: 1,
    description: 'Low priority task',
  },
  MEDIUM: {
    label: 'Medium',
    color: 'yellow',
    weight: 2,
    description: 'Medium priority task',
  },
  HIGH: {
    label: 'High',
    color: 'orange',
    weight: 3,
    description: 'High priority task',
  },
  URGENT: {
    label: 'Urgent',
    color: 'red',
    weight: 4,
    description: 'Urgent priority task',
  },
};
