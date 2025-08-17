/**
 * Area Analytics Type Definitions for ThinkSpace
 * 
 * Centralized type definitions for area analytics, monitoring,
 * and dashboard functionality.
 */

// Basic metric types
export interface AreaOverview {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalResources: number;
  totalNotes: number;
  totalSubInterests: number;
  healthScore: number;
  lastReviewDate?: Date;
  nextReviewDate?: Date;
}

export interface HealthTrendPoint {
  date: Date;
  score: number;
  reviewType?: string;
}

export interface ProjectAnalytics {
  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  averageProgress: number;
  completionRate: number;
  projectsCreatedInPeriod: number;
  projectsCompletedInPeriod: number;
}

export interface ContentGrowthAnalytics {
  resourcesAdded: number;
  notesCreated: number;
  notesUpdated: number;
  resourceTypeDistribution: Record<string, number>;
  noteTypeDistribution: Record<string, number>;
}

export interface SubInterestAnalytics {
  totalSubInterests: number;
  maxDepth: number;
  averageDepth: number;
  subInterestsCreatedInPeriod: number;
  contentDistribution: {
    projects: number;
    resources: number;
    notes: number;
  };
  hierarchyDistribution: Record<number, number>;
}

export interface ConnectionAnalytics {
  totalOutgoingConnections: number;
  totalIncomingConnections: number;
  connectionStrength: {
    outgoing: number;
    incoming: number;
  };
  connectionTypes: Record<string, number>;
  connectedAreas: Array<{
    id: string;
    title: string;
    color?: string;
    strength?: number;
  }>;
  connectionsCreatedInPeriod: number;
}

export interface TimeInvestmentAnalytics {
  totalActivities: number;
  activitiesInPeriod: number;
  activityTypes: Record<string, number>;
  estimatedTimeSpent: number;
}

export interface MaintenanceHealth {
  daysSinceLastReview?: number;
  isReviewOverdue: boolean;
  daysUntilNextReview?: number;
  standardsCompliance?: {
    compliance: number;
    assessedStandards: number;
    totalStandards: number;
    lastAssessmentDate?: string;
  };
}

// Comprehensive area analytics
export interface AreaAnalytics {
  overview: AreaOverview;
  healthTrend: HealthTrendPoint[];
  projectAnalytics: ProjectAnalytics;
  contentGrowth: ContentGrowthAnalytics;
  subInterestAnalytics?: SubInterestAnalytics;
  connectionAnalytics?: ConnectionAnalytics;
  timeInvestment: TimeInvestmentAnalytics;
  maintenanceHealth: MaintenanceHealth;
}

// Dashboard-level analytics
export interface DashboardOverview {
  totalAreas: number;
  averageHealthScore: number;
  totalProjects: number;
  activeProjects: number;
  totalResources: number;
  totalNotes: number;
  totalSubInterests: number;
}

export interface MaintenanceAlert {
  id: string;
  title: string;
  color?: string;
  daysOverdue?: number;
  daysUntilDue?: number;
  healthScore?: number;
  daysSinceActivity?: number;
  lastReviewDate?: Date;
  issues?: string[];
}

export interface MaintenanceAlerts {
  reviewsOverdue: MaintenanceAlert[];
  reviewsDueSoon: MaintenanceAlert[];
  lowHealthAreas: MaintenanceAlert[];
  inactiveAreas: MaintenanceAlert[];
}

export interface GrowthTrends {
  areasCreated: number;
  projectsCreated: number;
  projectsCompleted: number;
  resourcesAdded: number;
  notesCreated: number;
  subInterestsCreated: number;
}

export interface ActivityTrends {
  totalActivities: number;
  activityTypes: Record<string, number>;
  weeklyActivity: Array<{
    week: string;
    count: number;
  }>;
}

export interface TopPerformingArea {
  id: string;
  title: string;
  color?: string;
  type: string;
  healthScore: number;
  projectCount: number;
  lastReviewDate?: Date;
}

export interface DashboardAnalytics {
  overview: DashboardOverview;
  healthDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
  responsibilityDistribution: Record<string, number>;
  reviewFrequencyDistribution: Record<string, number>;
  maintenanceAlerts: MaintenanceAlerts;
  growthTrends: GrowthTrends;
  activityTrends: ActivityTrends;
  topPerformingAreas: TopPerformingArea[];
  areasNeedingAttention: MaintenanceAlert[];
}

// API response types
export interface AreaAnalyticsResponse {
  success: boolean;
  data: {
    analytics: AreaAnalytics;
  };
}

export interface DashboardAnalyticsResponse {
  success: boolean;
  data: {
    analytics: DashboardAnalytics;
  };
}

// Component prop types
export interface AreaAnalyticsCardProps {
  analytics: AreaAnalytics;
  period: string;
  onPeriodChange?: (period: string) => void;
}

export interface HealthTrendChartProps {
  data: HealthTrendPoint[];
  height?: number;
  showReviewTypes?: boolean;
}

export interface ProjectAnalyticsChartProps {
  analytics: ProjectAnalytics;
  showDetails?: boolean;
}

export interface MaintenanceAlertsProps {
  alerts: MaintenanceAlerts;
  onAreaClick?: (areaId: string) => void;
  onReviewClick?: (areaId: string) => void;
}

export interface DashboardOverviewProps {
  overview: DashboardOverview;
  healthDistribution: Record<string, number>;
  onAreaTypeClick?: (type: string) => void;
}

// Filter and configuration types
export interface AnalyticsFilters {
  period: '1month' | '3months' | '6months' | '1year';
  includeSubInterests: boolean;
  includeConnections: boolean;
  areaTypes?: string[];
  responsibilityLevels?: string[];
}

export interface AnalyticsConfig {
  refreshInterval: number; // milliseconds
  cacheTimeout: number; // milliseconds
  enableRealTimeUpdates: boolean;
  defaultPeriod: string;
  alertThresholds: {
    lowHealthScore: number;
    reviewOverdueDays: number;
    inactivityDays: number;
  };
}

// Export and reporting types
export interface AnalyticsExportData {
  area?: {
    id: string;
    title: string;
    type: string;
  };
  analytics: AreaAnalytics | DashboardAnalytics;
  period: string;
  exportDate: string;
  filters?: AnalyticsFilters;
}

export interface AnalyticsReport {
  title: string;
  description: string;
  data: AnalyticsExportData;
  format: 'json' | 'csv' | 'pdf';
  sections: string[];
}

// Notification types
export interface AnalyticsNotification {
  id: string;
  type: 'HEALTH_DECLINE' | 'REVIEW_DUE' | 'MILESTONE_REACHED' | 'INACTIVITY_ALERT';
  areaId: string;
  areaTitle: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: Date;
  isRead: boolean;
  actionUrl?: string;
}

// Utility types
export interface AnalyticsUtils {
  calculateHealthTrend: (points: HealthTrendPoint[]) => 'improving' | 'declining' | 'stable';
  generateHealthRecommendations: (analytics: AreaAnalytics) => string[];
  calculateAreaScore: (analytics: AreaAnalytics) => number;
  identifyRiskFactors: (analytics: AreaAnalytics) => string[];
  formatMetricValue: (value: number, type: 'percentage' | 'count' | 'score' | 'days') => string;
}

// Chart data types
export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: 'line' | 'bar' | 'area' | 'scatter';
}

export interface ChartConfig {
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  height?: number;
  width?: number;
  colors?: string[];
}

// Benchmark and comparison types
export interface AreaBenchmark {
  metric: string;
  value: number;
  benchmark: number;
  percentile: number;
  comparison: 'above' | 'below' | 'at';
}

export interface AreaComparison {
  areaId: string;
  areaTitle: string;
  metrics: Record<string, number>;
  rank: number;
  percentile: number;
}

// Real-time update types
export interface AnalyticsUpdate {
  areaId?: string;
  updateType: 'HEALTH_SCORE' | 'PROJECT_STATUS' | 'CONTENT_ADDED' | 'REVIEW_COMPLETED';
  data: Record<string, any>;
  timestamp: Date;
}

export interface AnalyticsSubscription {
  areaIds: string[];
  updateTypes: string[];
  callback: (update: AnalyticsUpdate) => void;
}
