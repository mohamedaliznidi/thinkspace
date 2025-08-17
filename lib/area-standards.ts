/**
 * Area Standards Utility Functions for ThinkSpace
 * 
 * Utility functions for managing area standards, criteria,
 * assessments, and analytics.
 */

import type {
  AreaStandard,
  StandardCriteria,
  StandardAssessment,
  AreaAssessment,
  CreateStandardData,
  UpdateStandardData,
  CreateAssessmentData,
  StandardValidation,
  AssessmentValidation,
  AssessmentAnalytics,
  TrendDirection,
  AssessmentFrequency,
  StandardsUtils,
} from '@/types/area-standards';

/**
 * Calculate overall score from individual standard assessments
 */
export function calculateOverallScore(
  assessments: Record<string, StandardAssessment>,
  standards: AreaStandard[]
): number {
  const standardsMap = new Map(standards.map(s => [s.id, s]));
  let totalWeightedScore = 0;
  let totalWeight = 0;

  Object.entries(assessments).forEach(([standardId, assessment]) => {
    const standard = standardsMap.get(standardId);
    if (!standard) return;

    const standardScore = assessment.overallScore || 
      calculateStandardScore(assessment, standard);
    
    // Use priority as weight (CRITICAL=4, HIGH=3, MEDIUM=2, LOW=1)
    const weight = getPriorityWeight(standard.priority);
    totalWeightedScore += standardScore * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
}

/**
 * Calculate score for a single standard based on criteria
 */
export function calculateStandardScore(
  assessment: StandardAssessment,
  standard: AreaStandard
): number {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  standard.criteria.forEach(criteria => {
    const score = assessment.criteriaScores[criteria.id];
    if (score === undefined) return;

    const normalizedScore = normalizeCriteriaScore(score, criteria);
    totalWeightedScore += normalizedScore * criteria.weight;
    totalWeight += criteria.weight;
  });

  return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
}

/**
 * Normalize criteria score to 0-1 range
 */
function normalizeCriteriaScore(
  score: string | number | boolean,
  criteria: StandardCriteria
): number {
  switch (criteria.type) {
    case 'BOOLEAN':
      return score === true || score === 'true' ? 1 : 0;
    
    case 'SCALE':
      if (typeof score === 'number' && criteria.scale) {
        const { min, max } = criteria.scale;
        return Math.max(0, Math.min(1, (score - min) / (max - min)));
      }
      return 0;
    
    case 'PERCENTAGE':
      if (typeof score === 'number') {
        return Math.max(0, Math.min(1, score / 100));
      }
      return 0;
    
    case 'NUMERIC':
      if (typeof score === 'number' && criteria.target) {
        const target = typeof criteria.target === 'number' ? criteria.target : parseFloat(criteria.target);
        // Simple scoring: 1.0 if at or above target, proportional if below
        return Math.min(1, score / target);
      }
      return 0;
    
    case 'TEXT':
      // For text criteria, assume manual scoring or predefined values
      if (typeof score === 'number') {
        return Math.max(0, Math.min(1, score));
      }
      return 0;
    
    default:
      return 0;
  }
}

/**
 * Get priority weight for calculations
 */
function getPriorityWeight(priority: string): number {
  switch (priority) {
    case 'CRITICAL': return 4;
    case 'HIGH': return 3;
    case 'MEDIUM': return 2;
    case 'LOW': return 1;
    default: return 2;
  }
}

/**
 * Validate standard data
 */
export function validateStandard(
  standard: CreateStandardData | UpdateStandardData
): StandardValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Title validation
  if (!standard.title || standard.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (standard.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }

  // Description validation
  if (standard.description && standard.description.length > 1000) {
    errors.push('Description must be less than 1000 characters');
  }

  // Criteria validation
  if (!standard.criteria || standard.criteria.length === 0) {
    errors.push('At least one criteria is required');
  } else {
    if (standard.criteria.length > 20) {
      errors.push('Maximum 20 criteria allowed per standard');
    }

    standard.criteria.forEach((criteria, index) => {
      if (!criteria.name || criteria.name.trim().length === 0) {
        errors.push(`Criteria ${index + 1}: Name is required`);
      }

      if (criteria.weight < 0 || criteria.weight > 1) {
        errors.push(`Criteria ${index + 1}: Weight must be between 0 and 1`);
      }

      if (criteria.type === 'SCALE' && !criteria.scale) {
        errors.push(`Criteria ${index + 1}: Scale definition required for SCALE type`);
      }
    });

    // Check total weight
    const totalWeight = standard.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (Math.abs(totalWeight - 1) > 0.01) {
      warnings.push('Criteria weights should sum to 1.0 for optimal scoring');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate assessment data
 */
export function validateAssessment(
  assessment: CreateAssessmentData,
  standards: AreaStandard[]
): AssessmentValidation {
  const errors: string[] = [];
  const missingRequired: string[] = [];
  const outOfRange: string[] = [];

  const standardsMap = new Map(standards.map(s => [s.id, s]));

  Object.entries(assessment.assessments).forEach(([standardId, standardAssessment]) => {
    const standard = standardsMap.get(standardId);
    if (!standard) {
      errors.push(`Unknown standard: ${standardId}`);
      return;
    }

    // Check required criteria
    const requiredCriteria = standard.criteria.filter(c => c.isRequired);
    requiredCriteria.forEach(criteria => {
      if (!(criteria.id in standardAssessment.criteriaScores)) {
        missingRequired.push(`${standard.title}: ${criteria.name}`);
      }
    });

    // Validate criteria scores
    Object.entries(standardAssessment.criteriaScores).forEach(([criteriaId, score]) => {
      const criteria = standard.criteria.find(c => c.id === criteriaId);
      if (!criteria) {
        errors.push(`Unknown criteria: ${criteriaId} in standard ${standard.title}`);
        return;
      }

      // Type-specific validation
      switch (criteria.type) {
        case 'SCALE':
          if (criteria.scale && typeof score === 'number') {
            if (score < criteria.scale.min || score > criteria.scale.max) {
              outOfRange.push(`${standard.title}: ${criteria.name} (${score} not in range ${criteria.scale.min}-${criteria.scale.max})`);
            }
          }
          break;
        
        case 'PERCENTAGE':
          if (typeof score === 'number' && (score < 0 || score > 100)) {
            outOfRange.push(`${standard.title}: ${criteria.name} (${score}% not in range 0-100%)`);
          }
          break;
        
        case 'BOOLEAN':
          if (typeof score !== 'boolean' && score !== 'true' && score !== 'false') {
            errors.push(`${standard.title}: ${criteria.name} must be boolean`);
          }
          break;
      }
    });
  });

  // Overall health score validation
  if (assessment.overallHealthScore !== undefined) {
    if (assessment.overallHealthScore < 0 || assessment.overallHealthScore > 1) {
      errors.push('Overall health score must be between 0 and 1');
    }
  }

  return {
    isValid: errors.length === 0 && missingRequired.length === 0,
    errors,
    missingRequired,
    outOfRange,
  };
}

/**
 * Calculate trend direction from score array
 */
export function calculateTrend(scores: number[]): TrendDirection {
  if (scores.length < 2) return 'stable';

  // Use linear regression to determine trend
  const n = scores.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = scores;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  if (slope > 0.05) return 'improving';
  if (slope < -0.05) return 'declining';
  return 'stable';
}

/**
 * Check if assessment is due for a standard
 */
export function isAssessmentDue(
  standard: AreaStandard,
  lastAssessment?: string
): boolean {
  if (!lastAssessment) return true;

  const nextDue = getNextAssessmentDate(standard.assessmentFrequency, lastAssessment);
  return new Date() >= nextDue;
}

/**
 * Calculate next assessment date
 */
export function getNextAssessmentDate(
  frequency: AssessmentFrequency,
  lastAssessment?: string
): Date {
  const baseDate = lastAssessment ? new Date(lastAssessment) : new Date();
  const nextDate = new Date(baseDate);

  switch (frequency) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'QUARTERLY':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'ANNUALLY':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case 'ON_DEMAND':
      // For on-demand, return far future date
      nextDate.setFullYear(nextDate.getFullYear() + 10);
      break;
  }

  return nextDate;
}

/**
 * Generate recommendations based on analytics
 */
export function generateRecommendations(
  analytics: AssessmentAnalytics,
  standards: AreaStandard[]
): string[] {
  const recommendations: string[] = [];
  const standardsMap = new Map(standards.map(s => [s.id, s]));

  // Low performance recommendations
  Object.entries(analytics.standardsPerformance).forEach(([standardId, performance]) => {
    const standard = standardsMap.get(standardId);
    if (!standard) return;

    if (performance.averageScore < 0.6) {
      recommendations.push(`Focus improvement efforts on "${standard.title}" - performance below target (${Math.round(performance.averageScore * 100)}%)`);
    }

    if (performance.trend === 'declining') {
      recommendations.push(`Address declining trend in "${standard.title}" - consider reviewing processes or resources`);
    }
  });

  // Overall health recommendations
  if (analytics.averageHealthScore < 0.7) {
    recommendations.push('Overall area health is below optimal - consider comprehensive review of standards and processes');
  }

  // Assessment frequency recommendations
  const lowAssessmentStandards = Object.entries(analytics.standardsPerformance)
    .filter(([_, performance]) => performance.assessmentCount < 3)
    .map(([standardId]) => standardsMap.get(standardId)?.title)
    .filter(Boolean);

  if (lowAssessmentStandards.length > 0) {
    recommendations.push(`Increase assessment frequency for: ${lowAssessmentStandards.join(', ')}`);
  }

  return recommendations;
}

// Export utility functions object
export const standardsUtils: StandardsUtils = {
  calculateOverallScore,
  validateStandard,
  validateAssessment,
  generateRecommendations,
  calculateTrend,
  isAssessmentDue,
  getNextAssessmentDate,
};
