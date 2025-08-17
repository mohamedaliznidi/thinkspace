/**
 * Area Template Type Definitions for ThinkSpace
 * 
 * Centralized type definitions for area templates, including
 * template structures, customization options, and application.
 */

import type {
  AreaType,
  ResponsibilityLevel,
  ReviewFrequency,
} from '@prisma/client';

// Template area definition
export interface TemplateAreaData {
  title: string;
  description?: string;
  type: AreaType;
  responsibilityLevel: ResponsibilityLevel;
  reviewFrequency: ReviewFrequency;
  color?: string;
  tags: string[];
}

// Template standard definition
export interface TemplateStandard {
  title: string;
  description?: string;
  type: 'QUALITATIVE' | 'QUANTITATIVE' | 'BINARY' | 'SCALE';
  category?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assessmentFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'ON_DEMAND';
  criteria: TemplateStandardCriteria[];
}

export interface TemplateStandardCriteria {
  name: string;
  description?: string;
  type: 'NUMERIC' | 'PERCENTAGE' | 'BOOLEAN' | 'TEXT' | 'SCALE';
  target?: string | number;
  unit?: string;
  weight: number; // 0-1
  isRequired: boolean;
}

// Template sub-interest definition
export interface TemplateSubInterest {
  title: string;
  description?: string;
  level: number;
  parentIndex?: number; // Index of parent in the array
  tags: string[];
}

// Template initial content
export interface TemplateInitialContent {
  projects: TemplateProject[];
  resources: TemplateResource[];
  notes: TemplateNote[];
}

export interface TemplateProject {
  title: string;
  description?: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface TemplateResource {
  title: string;
  description?: string;
  type: 'DOCUMENT' | 'LINK' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'BOOK' | 'ARTICLE' | 'COURSE' | 'TOOL' | 'OTHER';
  sourceUrl?: string;
}

export interface TemplateNote {
  title: string;
  content: string;
  type: 'QUICK' | 'MEETING' | 'IDEA' | 'REFLECTION' | 'SUMMARY' | 'RESEARCH' | 'TEMPLATE' | 'OTHER';
}

// Complete template structure
export interface AreaTemplateData {
  area: TemplateAreaData;
  standards: TemplateStandard[];
  subInterests: TemplateSubInterest[];
  initialContent?: TemplateInitialContent;
}

// Area template definition
export interface AreaTemplate {
  id: string;
  name: string;
  description?: string;
  areaType?: AreaType;
  template: AreaTemplateData;
  isPublic: boolean;
  tags: string[];
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  usageCount?: number;
}

// Template customization options
export interface TemplateCustomizations {
  area?: Partial<TemplateAreaData>;
  includeStandards?: boolean;
  selectedStandards?: string[]; // Standard titles to include
  includeSubInterests?: boolean;
  selectedSubInterests?: string[]; // Sub-interest titles to include
  includeInitialContent?: boolean;
  contentSelections?: {
    projects?: string[];
    resources?: string[];
    notes?: string[];
  };
  additionalTags?: string[];
}

// Template application result
export interface TemplateApplicationResult {
  areaId: string;
  createdStandards: number;
  createdSubInterests: number;
  createdProjects: number;
  createdResources: number;
  createdNotes: number;
  warnings?: string[];
  errors?: string[];
}

// Template validation
export interface TemplateValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// API response types
export interface AreaTemplateListResponse {
  success: boolean;
  data: {
    templates: AreaTemplate[];
  };
}

export interface AreaTemplateDetailResponse {
  success: boolean;
  data: {
    template: AreaTemplate;
  };
}

export interface TemplateApplicationResponse {
  success: boolean;
  data: {
    result: TemplateApplicationResult;
  };
}

// Component prop types
export interface TemplateCardProps {
  template: AreaTemplate;
  onSelect?: (template: AreaTemplate) => void;
  onPreview?: (template: AreaTemplate) => void;
  onCustomize?: (template: AreaTemplate) => void;
  selected?: boolean;
  showUsageCount?: boolean;
}

export interface TemplatePreviewProps {
  template: AreaTemplate;
  customizations?: TemplateCustomizations;
  onApply?: (template: AreaTemplate, customizations?: TemplateCustomizations) => void;
  onCustomize?: () => void;
}

export interface TemplateCustomizationProps {
  template: AreaTemplate;
  customizations: TemplateCustomizations;
  onCustomizationsChange: (customizations: TemplateCustomizations) => void;
  onApply: () => void;
  onCancel: () => void;
}

export interface TemplateGalleryProps {
  templates: AreaTemplate[];
  selectedAreaType?: AreaType;
  onAreaTypeChange?: (areaType: AreaType | undefined) => void;
  onTemplateSelect: (template: AreaTemplate) => void;
  loading?: boolean;
}

// Template creation and editing
export interface CreateTemplateData {
  name: string;
  description?: string;
  areaType?: AreaType;
  template: AreaTemplateData;
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {
  id: string;
}

// Template categories and filtering
export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  areaTypes: AreaType[];
  templateCount: number;
  icon?: string;
}

export interface TemplateFilters {
  search?: string;
  areaTypes?: AreaType[];
  tags?: string[];
  isPublic?: boolean;
  createdBy?: string;
  sortBy?: 'name' | 'createdAt' | 'usageCount' | 'areaType';
  sortOrder?: 'asc' | 'desc';
}

// Template statistics and analytics
export interface TemplateStats {
  totalTemplates: number;
  publicTemplates: number;
  userTemplates: number;
  templatesByAreaType: Record<AreaType, number>;
  mostUsedTemplates: Array<{
    template: AreaTemplate;
    usageCount: number;
  }>;
  recentlyCreated: AreaTemplate[];
}

// Template import/export
export interface TemplateExportData {
  template: AreaTemplate;
  exportDate: string;
  version: string;
}

export interface TemplateImportData {
  template: Omit<AreaTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>;
  replaceExisting?: boolean;
}

// Template sharing and collaboration
export interface TemplateShare {
  id: string;
  templateId: string;
  sharedBy: string;
  sharedWith?: string; // User ID, or null for public
  permissions: 'VIEW' | 'USE' | 'EDIT';
  expiresAt?: Date;
  createdAt: Date;
}

// Validation constants
export const TemplateValidation = {
  name: {
    minLength: 1,
    maxLength: 100,
  },
  description: {
    maxLength: 500,
  },
  maxStandards: 20,
  maxSubInterests: 50,
  maxInitialProjects: 10,
  maxInitialResources: 20,
  maxInitialNotes: 10,
  maxTags: 10,
} as const;

// Utility types
export interface TemplateUtils {
  validateTemplate: (template: AreaTemplateData) => TemplateValidation;
  applyCustomizations: (template: AreaTemplateData, customizations: TemplateCustomizations) => AreaTemplateData;
  generatePreview: (template: AreaTemplate, customizations?: TemplateCustomizations) => string;
  calculateComplexity: (template: AreaTemplateData) => number;
  extractTags: (template: AreaTemplateData) => string[];
}

// Template builder types (for creating custom templates)
export interface TemplateBuilder {
  area: Partial<TemplateAreaData>;
  standards: TemplateStandard[];
  subInterests: TemplateSubInterest[];
  initialContent: Partial<TemplateInitialContent>;
}

export interface TemplateBuilderStep {
  id: string;
  title: string;
  description: string;
  component: string;
  isComplete: boolean;
  isOptional: boolean;
}

// Predefined template categories
export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'personal-development',
    name: 'Personal Development',
    description: 'Templates for personal growth, health, and self-improvement',
    areaTypes: ['HEALTH', 'PERSONAL', 'LEARNING'],
    templateCount: 0,
    icon: 'IconUser',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Career development and work-related area templates',
    areaTypes: ['CAREER', 'RESPONSIBILITY'],
    templateCount: 0,
    icon: 'IconBriefcase',
  },
  {
    id: 'financial',
    name: 'Financial',
    description: 'Money management and financial planning templates',
    areaTypes: ['FINANCE'],
    templateCount: 0,
    icon: 'IconCoin',
  },
  {
    id: 'hobbies-interests',
    name: 'Hobbies & Interests',
    description: 'Templates for personal interests and hobby management',
    areaTypes: ['INTEREST', 'LEARNING'],
    templateCount: 0,
    icon: 'IconHeart',
  },
  {
    id: 'general',
    name: 'General',
    description: 'Versatile templates suitable for various area types',
    areaTypes: ['OTHER'],
    templateCount: 0,
    icon: 'IconCategory',
  },
] as const;
