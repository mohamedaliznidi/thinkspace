/**
 * Sub-Interest Type Definitions for ThinkSpace Areas
 * 
 * Centralized type definitions for sub-interests, including base types,
 * extended types with relations, form data types, and API types.
 */

import type {
  SubInterest as PrismaSubInterest,
  Area,
  Project,
  Resource,
  Note,
  User
} from '@prisma/client';

// Re-export Prisma sub-interest type
export type SubInterest = PrismaSubInterest;

// Sub-Interest with minimal relations (for lists and trees)
export interface SubInterestWithBasic extends SubInterest {
  parent?: {
    id: string;
    title: string;
    level?: number;
  } | null;
  children?: {
    id: string;
    title: string;
    level: number;
    description?: string | null;
    createdAt: Date;
  }[];
  _count: {
    children: number;
    projects: number;
    resources: number;
    notes_rel: number;
    relatedSubInterests: number;
    referencedBy?: number;
  };
}

// Sub-Interest with full content associations
export interface SubInterestWithContent extends SubInterestWithBasic {
  area: {
    id: string;
    title: string;
    color?: string;
  };
  projects: Array<{
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    progress: number;
    dueDate?: Date;
    createdAt: Date;
  }>;
  resources: Array<{
    id: string;
    title: string;
    description?: string;
    type: string;
    sourceUrl?: string;
    createdAt: Date;
  }>;
  notes_rel: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  relatedSubInterests: Array<{
    id: string;
    title: string;
    description?: string | null;
    level: number;
    area: {
      id: string;
      title: string;
      color?: string;
    };
  }>;
  referencedBy: Array<{
    id: string;
    title: string;
    description?: string | null;
    level: number;
    area: {
      id: string;
      title: string;
      color?: string;
    };
  }>;
}

// Form data types for creating/updating sub-interests
export interface CreateSubInterestData {
  title: string;
  description?: string;
  parentId?: string;
  notes?: string;
  observations?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  // Content associations
  projectIds?: string[];
  resourceIds?: string[];
  noteIds?: string[];
  // Cross-references
  relatedSubInterestIds?: string[];
}

export interface UpdateSubInterestData extends Partial<Omit<CreateSubInterestData, 'parentId'>> {
  parentId?: string | null;
}

// Tree structure types for hierarchical display
export interface SubInterestTreeNode extends SubInterestWithBasic {
  children: SubInterestTreeNode[];
  expanded?: boolean;
  selected?: boolean;
}

// API response types
export interface SubInterestListResponse {
  success: boolean;
  data: {
    subInterests: SubInterestWithBasic[];
  };
}

export interface SubInterestDetailResponse {
  success: boolean;
  data: {
    subInterest: SubInterestWithContent;
  };
}

export interface SubInterestCreateResponse {
  success: boolean;
  data: {
    subInterest: SubInterestWithBasic;
  };
}

// Search and filter types
export interface SubInterestFilters {
  search?: string;
  level?: number;
  parentId?: string | null;
  includeContent?: boolean;
  tags?: string[];
}

// Display and UI types
export interface SubInterestDisplayOptions {
  showHierarchy: boolean;
  showCounts: boolean;
  showContent: boolean;
  expandAll: boolean;
  maxDepth?: number;
}

// Analytics and metrics types
export interface SubInterestMetrics {
  totalCount: number;
  maxDepth: number;
  averageDepth: number;
  contentDistribution: {
    projects: number;
    resources: number;
    notes: number;
  };
  connectionStrength: {
    internal: number; // connections within same area
    external: number; // connections to other areas
  };
}

// Bulk operations types
export interface BulkSubInterestOperation {
  action: 'move' | 'delete' | 'tag' | 'associate';
  subInterestIds: string[];
  targetParentId?: string;
  tags?: string[];
  associations?: {
    projectIds?: string[];
    resourceIds?: string[];
    noteIds?: string[];
  };
}

// Export and import types
export interface SubInterestExportData {
  subInterest: SubInterest;
  hierarchy: string[]; // Array of parent titles for context
  contentSummary: {
    projectCount: number;
    resourceCount: number;
    noteCount: number;
    relationshipCount: number;
  };
}

// Validation helpers
export const SubInterestValidation = {
  title: {
    minLength: 1,
    maxLength: 200,
  },
  description: {
    maxLength: 1000,
  },
  notes: {
    maxLength: 5000,
  },
  observations: {
    maxLength: 5000,
  },
  maxDepth: 10, // Maximum nesting depth
  maxChildren: 100, // Maximum children per parent
} as const;

// Utility types for component props
export interface SubInterestCardProps {
  subInterest: SubInterestWithBasic;
  showParent?: boolean;
  showChildren?: boolean;
  onEdit?: (subInterest: SubInterestWithBasic) => void;
  onDelete?: (subInterest: SubInterestWithBasic) => void;
  onSelect?: (subInterest: SubInterestWithBasic) => void;
}

export interface SubInterestTreeProps {
  subInterests: SubInterestTreeNode[];
  onNodeSelect?: (node: SubInterestTreeNode) => void;
  onNodeExpand?: (node: SubInterestTreeNode) => void;
  onNodeEdit?: (node: SubInterestTreeNode) => void;
  onNodeDelete?: (node: SubInterestTreeNode) => void;
  maxDepth?: number;
  showCounts?: boolean;
}

export interface SubInterestFormProps {
  areaId: string;
  subInterest?: SubInterestWithBasic;
  parentId?: string;
  onSubmit: (data: CreateSubInterestData | UpdateSubInterestData) => void;
  onCancel: () => void;
  loading?: boolean;
}
