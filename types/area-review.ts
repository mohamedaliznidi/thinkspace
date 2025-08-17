/**
 * Area Review Type Definitions for ThinkSpace
 * 
 * Centralized type definitions for area reviews, templates,
 * and review-related functionality.
 */

import type {
  AreaReview as PrismaAreaReview,
  ReviewType,
  Area,
  User
} from '@prisma/client';

// Re-export Prisma types
export type { ReviewType } from '@prisma/client';
export type AreaReview = PrismaAreaReview;

// Area Review with relations
export interface AreaReviewWithArea extends AreaReview {
  area: {
    id: string;
    title: string;
    description?: string;
    color?: string;
    type: string;
    responsibilityLevel: string;
    reviewFrequency: string;
    standards?: any;
    criteria?: any;
    healthScore?: number;
  };
}

// Review template types
export interface ReviewTemplateSection {
  id: string;
  title: string;
  description?: string;
  type: 'text' | 'rating' | 'checklist' | 'criteria';
  required: boolean;
  options?: {
    scale?: {
      min: number;
      max: number;
      labels?: Record<string, string>;
    };
    items?: string[];
    [key: string]: any;
  };
}

export interface ReviewTemplateCriteria {
  id: string;
  name: string;
  description?: string;
  weight: number; // 0-1
  scale: {
    min: number;
    max: number;
    labels?: Record<string, string>;
  };
}

export interface ReviewTemplate {
  id: string;
  name: string;
  description?: string;
  areaType?: string | null;
  template: {
    sections: ReviewTemplateSection[];
    criteria?: ReviewTemplateCriteria[];
    instructions?: string;
  };
  isPublic: boolean;
  tags: string[];
}

// Review findings and improvements structures
export interface ReviewFindings {
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
  keyInsights?: string[];
  metrics?: Record<string, number>;
  [key: string]: any;
}

export interface ReviewImprovements {
  actions: Array<{
    id: string;
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: Date;
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    assignee?: string;
  }>;
  goals?: Array<{
    id: string;
    title: string;
    target?: string;
    deadline?: Date;
    metrics?: string[];
  }>;
  resources?: Array<{
    type: 'TRAINING' | 'TOOLS' | 'SUPPORT' | 'TIME' | 'BUDGET';
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  [key: string]: any;
}

// Form data types
export interface CreateAreaReviewData {
  reviewType: ReviewType;
  notes?: string;
  findings?: ReviewFindings;
  improvements?: ReviewImprovements;
  healthScore?: number;
  criteriaScores?: Record<string, number>;
  templateId?: string;
  template?: ReviewTemplate['template'];
}

export interface UpdateAreaReviewData extends Partial<CreateAreaReviewData> {}

// Review response data
export interface ReviewResponse {
  [sectionId: string]: {
    type: 'text' | 'rating' | 'checklist' | 'criteria';
    value: string | number | string[] | Record<string, number>;
    notes?: string;
  };
}

// Review analytics types
export interface ReviewAnalytics {
  totalReviews: number;
  averageHealthScore: number;
  healthTrend: Array<{
    date: Date;
    score: number;
  }>;
  reviewFrequency: {
    scheduled: number;
    adhoc: number;
    milestone: number;
    crisis: number;
  };
  improvementTracking: {
    totalActions: number;
    completedActions: number;
    overdue: number;
    completionRate: number;
  };
  criteriaAverages: Record<string, number>;
}

// Review scheduling types
export interface ReviewSchedule {
  areaId: string;
  nextReviewDate: Date;
  frequency: string;
  isOverdue: boolean;
  daysSinceLastReview?: number;
  daysUntilNext?: number;
}

// API response types
export interface AreaReviewListResponse {
  success: boolean;
  data: {
    reviews: AreaReviewWithArea[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface AreaReviewDetailResponse {
  success: boolean;
  data: {
    review: AreaReviewWithArea;
  };
}

export interface ReviewTemplateListResponse {
  success: boolean;
  data: {
    templates: ReviewTemplate[];
  };
}

// Component prop types
export interface ReviewFormProps {
  areaId: string;
  review?: AreaReviewWithArea;
  template?: ReviewTemplate;
  onSubmit: (data: CreateAreaReviewData | UpdateAreaReviewData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface ReviewCardProps {
  review: AreaReviewWithArea;
  showArea?: boolean;
  onEdit?: (review: AreaReviewWithArea) => void;
  onDelete?: (review: AreaReviewWithArea) => void;
  onView?: (review: AreaReviewWithArea) => void;
}

export interface ReviewTemplateCardProps {
  template: ReviewTemplate;
  onSelect?: (template: ReviewTemplate) => void;
  onEdit?: (template: ReviewTemplate) => void;
  onDelete?: (template: ReviewTemplate) => void;
  selected?: boolean;
}

// Review dashboard types
export interface ReviewDashboardData {
  upcomingReviews: Array<{
    area: {
      id: string;
      title: string;
      color?: string;
    };
    nextReviewDate: Date;
    daysUntilDue: number;
    isOverdue: boolean;
  }>;
  recentReviews: AreaReviewWithArea[];
  analytics: ReviewAnalytics;
  healthScoreDistribution: Record<string, number>;
}

// Review reminder types
export interface ReviewReminder {
  id: string;
  areaId: string;
  areaTitle: string;
  dueDate: Date;
  reminderType: 'DUE_SOON' | 'OVERDUE' | 'SCHEDULED';
  daysOverdue?: number;
  lastReviewDate?: Date;
}

// Validation constants
export const ReviewValidation = {
  notes: {
    maxLength: 5000,
  },
  healthScore: {
    min: 0,
    max: 1,
  },
  criteriaScore: {
    min: 1,
    max: 5,
  },
  templateName: {
    minLength: 1,
    maxLength: 100,
  },
  templateDescription: {
    maxLength: 500,
  },
} as const;

// Utility types for review processing
export interface ProcessedReviewData {
  overallScore: number;
  sectionScores: Record<string, number>;
  completionPercentage: number;
  flaggedItems: Array<{
    section: string;
    issue: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  recommendations: string[];
}

// Review export types
export interface ReviewExportData {
  area: {
    id: string;
    title: string;
    type: string;
  };
  review: AreaReview;
  processedData: ProcessedReviewData;
  template?: ReviewTemplate;
}

// Bulk review operations
export interface BulkReviewOperation {
  action: 'schedule' | 'complete' | 'delete' | 'export';
  areaIds: string[];
  scheduleDate?: Date;
  templateId?: string;
  exportFormat?: 'json' | 'csv' | 'pdf';
}
