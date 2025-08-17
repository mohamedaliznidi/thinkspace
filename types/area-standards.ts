/**
 * Area Standards Type Definitions for ThinkSpace
 * 
 * Centralized type definitions for area standards, criteria,
 * assessments, and evaluation functionality.
 */

// Standard types
export type StandardType = 'QUALITATIVE' | 'QUANTITATIVE' | 'BINARY' | 'SCALE';
export type StandardPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AssessmentFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'ON_DEMAND';

// Criteria types
export type CriteriaType = 'NUMERIC' | 'PERCENTAGE' | 'BOOLEAN' | 'TEXT' | 'SCALE';

// Evidence types
export type EvidenceType = 'TEXT' | 'FILE' | 'LINK' | 'METRIC';

// Trend types
export type TrendDirection = 'improving' | 'declining' | 'stable';

// Core standard definition
export interface AreaStandard {
  id: string;
  title: string;
  description?: string;
  type: StandardType;
  category?: string;
  priority: StandardPriority;
  isActive: boolean;
  criteria: StandardCriteria[];
  assessmentFrequency: AssessmentFrequency;
  lastAssessed?: string;
  nextAssessment?: string;
}

// Criteria definition
export interface StandardCriteria {
  id: string;
  name: string;
  description?: string;
  type: CriteriaType;
  target?: string | number;
  unit?: string;
  scale?: {
    min: number;
    max: number;
    labels?: Record<string, string>;
  };
  weight: number; // 0-1
  isRequired: boolean;
}

// Assessment data structures
export interface StandardAssessment {
  standardId: string;
  criteriaScores: Record<string, string | number | boolean>;
  overallScore?: number;
  notes?: string;
  recommendations?: string[];
  evidence?: AssessmentEvidence[];
}

export interface AssessmentEvidence {
  type: EvidenceType;
  content: string;
  metadata?: Record<string, any>;
}

export interface AreaAssessment {
  id: string;
  date: string;
  assessments: Record<string, StandardAssessment>;
  overallHealthScore?: number;
  notes?: string;
  assessor?: string;
  context?: string;
  createdAt: string;
}

// Form data types
export interface CreateStandardData {
  title: string;
  description?: string;
  type: StandardType;
  category?: string;
  priority: StandardPriority;
  criteria: Omit<StandardCriteria, 'id'>[];
  assessmentFrequency: AssessmentFrequency;
}

export interface UpdateStandardData extends Partial<CreateStandardData> {
  id: string;
  isActive?: boolean;
}

export interface CreateAssessmentData {
  assessmentDate?: string;
  assessments: Record<string, Omit<StandardAssessment, 'standardId'>>;
  overallHealthScore?: number;
  notes?: string;
  assessor?: string;
  context?: string;
}

// Analytics and reporting types
export interface StandardPerformance {
  averageScore: number;
  assessmentCount: number;
  trend: TrendDirection;
  lastAssessment?: string;
  targetMet?: boolean;
}

export interface CriteriaAnalysis {
  averageScore: number;
  standardDeviation: number;
  trend: TrendDirection;
  assessmentCount: number;
  targetMet?: boolean;
}

export interface AssessmentAnalytics {
  totalAssessments: number;
  averageHealthScore: number;
  healthTrend: Array<{
    date: string;
    score: number;
  }>;
  standardsPerformance: Record<string, StandardPerformance>;
  criteriaAnalysis: Record<string, CriteriaAnalysis>;
  recommendations: string[];
  periodStart?: string;
  periodEnd?: string;
}

// Dashboard and UI types
export interface StandardsOverview {
  totalStandards: number;
  activeStandards: number;
  averageHealthScore: number;
  standardsByPriority: Record<StandardPriority, number>;
  standardsByType: Record<StandardType, number>;
  assessmentsDue: number;
  overdue: number;
}

export interface StandardCard {
  standard: AreaStandard;
  lastAssessment?: AreaAssessment;
  performance?: StandardPerformance;
  isDue: boolean;
  isOverdue: boolean;
  daysUntilDue?: number;
}

// Component prop types
export interface StandardFormProps {
  standard?: AreaStandard;
  onSubmit: (data: CreateStandardData | UpdateStandardData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface AssessmentFormProps {
  areaId: string;
  standards: AreaStandard[];
  existingAssessment?: AreaAssessment;
  onSubmit: (data: CreateAssessmentData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface StandardCardProps {
  standardCard: StandardCard;
  onAssess?: (standard: AreaStandard) => void;
  onEdit?: (standard: AreaStandard) => void;
  onDelete?: (standard: AreaStandard) => void;
  onViewHistory?: (standard: AreaStandard) => void;
}

// API response types
export interface StandardsResponse {
  success: boolean;
  data: {
    standards: AreaStandard[];
    criteria: Record<string, any>;
  };
}

export interface AssessmentResponse {
  success: boolean;
  data: {
    assessment: AreaAssessment;
    healthScore: number;
  };
}

export interface AssessmentHistoryResponse {
  success: boolean;
  data: {
    assessments: AreaAssessment[];
    total: number;
  };
}

export interface AssessmentAnalyticsResponse {
  success: boolean;
  data: {
    analytics: AssessmentAnalytics;
  };
}

// Validation and utility types
export interface StandardValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface AssessmentValidation {
  isValid: boolean;
  errors: string[];
  missingRequired: string[];
  outOfRange: string[];
}

// Export and import types
export interface StandardsExportData {
  area: {
    id: string;
    title: string;
  };
  standards: AreaStandard[];
  assessments: AreaAssessment[];
  analytics: AssessmentAnalytics;
  exportDate: string;
}

export interface StandardsImportData {
  standards: Omit<AreaStandard, 'id' | 'lastAssessed' | 'nextAssessment'>[];
  replaceExisting?: boolean;
  preserveAssessments?: boolean;
}

// Bulk operations
export interface BulkStandardOperation {
  action: 'activate' | 'deactivate' | 'delete' | 'assess' | 'schedule';
  standardIds: string[];
  assessmentData?: CreateAssessmentData;
  scheduleDate?: string;
}

// Template types for common standards
export interface StandardTemplate {
  id: string;
  name: string;
  description: string;
  areaTypes: string[];
  standards: Omit<AreaStandard, 'id' | 'lastAssessed' | 'nextAssessment'>[];
  tags: string[];
}

// Notification and reminder types
export interface StandardReminder {
  id: string;
  areaId: string;
  areaTitle: string;
  standardId: string;
  standardTitle: string;
  dueDate: string;
  reminderType: 'DUE_SOON' | 'OVERDUE' | 'SCHEDULED';
  daysOverdue?: number;
  priority: StandardPriority;
}

// Validation constants
export const StandardsValidation = {
  title: {
    minLength: 1,
    maxLength: 200,
  },
  description: {
    maxLength: 1000,
  },
  criteriaName: {
    minLength: 1,
    maxLength: 100,
  },
  criteriaDescription: {
    maxLength: 500,
  },
  weight: {
    min: 0,
    max: 1,
  },
  healthScore: {
    min: 0,
    max: 1,
  },
  maxCriteriaPerStandard: 20,
  maxStandardsPerArea: 50,
} as const;

// Utility functions type definitions
export interface StandardsUtils {
  calculateOverallScore: (assessments: Record<string, StandardAssessment>, standards: AreaStandard[]) => number;
  validateStandard: (standard: CreateStandardData | UpdateStandardData) => StandardValidation;
  validateAssessment: (assessment: CreateAssessmentData, standards: AreaStandard[]) => AssessmentValidation;
  generateRecommendations: (analytics: AssessmentAnalytics, standards: AreaStandard[]) => string[];
  calculateTrend: (scores: number[]) => TrendDirection;
  isAssessmentDue: (standard: AreaStandard, lastAssessment?: string) => boolean;
  getNextAssessmentDate: (frequency: AssessmentFrequency, lastAssessment?: string) => Date;
}
