/**
 * Area Templates API Routes for ThinkSpace
 * 
 * This API handles CRUD operations for area templates including
 * predefined templates and custom user templates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { AppError, handleApiError } from '@/lib/utils';

// Area template validation schema
const createAreaTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  areaType: z.enum(['RESPONSIBILITY', 'INTEREST', 'LEARNING', 'HEALTH', 'FINANCE', 'CAREER', 'PERSONAL', 'OTHER']).optional(),
  template: z.object({
    area: z.object({
      title: z.string(),
      description: z.string().optional(),
      type: z.enum(['RESPONSIBILITY', 'INTEREST', 'LEARNING', 'HEALTH', 'FINANCE', 'CAREER', 'PERSONAL', 'OTHER']),
      responsibilityLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
      reviewFrequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'BIANNUALLY', 'ANNUALLY', 'CUSTOM']).default('MONTHLY'),
      color: z.string().optional(),
      tags: z.array(z.string()).default([]),
    }),
    standards: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      type: z.enum(['QUALITATIVE', 'QUANTITATIVE', 'BINARY', 'SCALE']),
      category: z.string().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
      assessmentFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ON_DEMAND']).default('MONTHLY'),
      criteria: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        type: z.enum(['NUMERIC', 'PERCENTAGE', 'BOOLEAN', 'TEXT', 'SCALE']),
        target: z.union([z.string(), z.number()]).optional(),
        unit: z.string().optional(),
        weight: z.number().min(0).max(1).default(1),
        isRequired: z.boolean().default(false),
      })),
    })).default([]),
    subInterests: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      level: z.number().min(0).max(10).default(0),
      parentIndex: z.number().optional(), // Index of parent in the array
      tags: z.array(z.string()).default([]),
    })).default([]),
    initialContent: z.object({
      projects: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED']).default('PLANNING'),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
      })).default([]),
      resources: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        type: z.enum(['DOCUMENT', 'LINK', 'IMAGE', 'VIDEO', 'AUDIO', 'BOOK', 'ARTICLE', 'COURSE', 'TOOL', 'OTHER']).default('OTHER'),
        sourceUrl: z.string().optional(),
      })).default([]),
      notes: z.array(z.object({
        title: z.string(),
        content: z.string(),
        type: z.enum(['QUICK', 'MEETING', 'IDEA', 'REFLECTION', 'SUMMARY', 'RESEARCH', 'TEMPLATE', 'OTHER']).default('QUICK'),
      })).default([]),
    }).optional(),
  }),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

/**
 * GET /api/areas/templates
 * List available area templates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const areaType = searchParams.get('areaType') || '';
    const search = searchParams.get('search') || '';
    const includePublic = searchParams.get('includePublic') !== 'false';

    // Get predefined templates
    const predefinedTemplates = getPredefinedTemplates(areaType);

    // Filter templates based on search
    const templates = predefinedTemplates.filter(template => {
      if (search) {
        const searchLower = search.toLowerCase();
        return template.name.toLowerCase().includes(searchLower) ||
               template.description?.toLowerCase().includes(searchLower) ||
               template.tags.some(tag => tag.toLowerCase().includes(searchLower));
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      data: { templates },
    });

  } catch (error) {
    console.error('Get templates error:', error);
    const { message, statusCode } = handleApiError(error);

    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

/**
 * POST /api/areas/templates/[templateId]/apply
 * Apply a template to create a new area
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const body = await request.json();
    const { templateId, customizations } = body;

    // Get the template
    const templates = getPredefinedTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      throw new AppError('Template not found', 404);
    }

    // Apply customizations to template
    const areaData = {
      ...template.template.area,
      ...customizations?.area,
    };

    // This would typically create the area and related content
    // For now, we'll return the processed template data
    return NextResponse.json({
      success: true,
      data: {
        template,
        areaData,
        message: 'Template ready to apply',
      },
    });

  } catch (error) {
    console.error('Apply template error:', error);
    const { message, statusCode } = handleApiError(error);

    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

/**
 * Get predefined area templates
 */
function getPredefinedTemplates(areaType?: string) {
  const templates = [
    {
      id: 'personal-health-wellness',
      name: 'Personal Health & Wellness',
      description: 'Comprehensive template for managing personal health, fitness, and wellness goals',
      areaType: 'HEALTH',
      template: {
        area: {
          title: 'Health & Wellness',
          description: 'Managing my physical and mental health, fitness goals, and overall wellness',
          type: 'HEALTH' as const,
          responsibilityLevel: 'HIGH' as const,
          reviewFrequency: 'WEEKLY' as const,
          color: '#51cf66',
          tags: ['health', 'fitness', 'wellness', 'personal'],
        },
        standards: [
          {
            title: 'Physical Fitness',
            description: 'Maintaining regular exercise and physical activity',
            type: 'QUANTITATIVE' as const,
            category: 'fitness',
            priority: 'HIGH' as const,
            assessmentFrequency: 'WEEKLY' as const,
            criteria: [
              {
                name: 'Weekly Exercise Sessions',
                description: 'Number of exercise sessions per week',
                type: 'NUMERIC' as const,
                target: 4,
                unit: 'sessions',
                weight: 0.4,
                isRequired: true,
              },
              {
                name: 'Exercise Duration',
                description: 'Average duration of exercise sessions',
                type: 'NUMERIC' as const,
                target: 45,
                unit: 'minutes',
                weight: 0.3,
                isRequired: true,
              },
              {
                name: 'Activity Variety',
                description: 'Variety of physical activities',
                type: 'SCALE' as const,
                weight: 0.3,
                isRequired: false,
              },
            ],
          },
          {
            title: 'Nutrition',
            description: 'Maintaining healthy eating habits',
            type: 'QUALITATIVE' as const,
            category: 'nutrition',
            priority: 'HIGH' as const,
            assessmentFrequency: 'WEEKLY' as const,
            criteria: [
              {
                name: 'Balanced Meals',
                description: 'Eating balanced, nutritious meals',
                type: 'SCALE' as const,
                weight: 0.5,
                isRequired: true,
              },
              {
                name: 'Water Intake',
                description: 'Daily water consumption',
                type: 'NUMERIC' as const,
                target: 8,
                unit: 'glasses',
                weight: 0.3,
                isRequired: true,
              },
              {
                name: 'Processed Food Limit',
                description: 'Limiting processed and junk food',
                type: 'SCALE' as const,
                weight: 0.2,
                isRequired: false,
              },
            ],
          },
        ],
        subInterests: [
          {
            title: 'Fitness & Exercise',
            description: 'Physical fitness activities and exercise routines',
            level: 0,
            tags: ['fitness', 'exercise'],
          },
          {
            title: 'Cardio Training',
            description: 'Cardiovascular exercise and endurance training',
            level: 1,
            parentIndex: 0,
            tags: ['cardio', 'endurance'],
          },
          {
            title: 'Strength Training',
            description: 'Weight lifting and muscle building exercises',
            level: 1,
            parentIndex: 0,
            tags: ['strength', 'weights'],
          },
          {
            title: 'Nutrition & Diet',
            description: 'Healthy eating habits and nutritional planning',
            level: 0,
            tags: ['nutrition', 'diet'],
          },
          {
            title: 'Mental Health',
            description: 'Stress management, mindfulness, and mental wellness',
            level: 0,
            tags: ['mental-health', 'mindfulness'],
          },
        ],
        initialContent: {
          projects: [
            {
              title: 'Establish Weekly Exercise Routine',
              description: 'Create and maintain a consistent weekly exercise schedule',
              status: 'PLANNING' as const,
              priority: 'HIGH' as const,
            },
            {
              title: 'Improve Daily Nutrition',
              description: 'Plan and implement healthier eating habits',
              status: 'PLANNING' as const,
              priority: 'HIGH' as const,
            },
          ],
          resources: [
            {
              title: 'MyFitnessPal App',
              description: 'Calorie and nutrition tracking application',
              type: 'TOOL' as const,
              sourceUrl: 'https://www.myfitnesspal.com',
            },
            {
              title: 'Local Gym Membership',
              description: 'Access to fitness equipment and classes',
              type: 'OTHER' as const,
            },
          ],
          notes: [
            {
              title: 'Health Goals for This Year',
              content: 'Key health and fitness goals I want to achieve this year...',
              type: 'DETAILED' as const,
            },
          ],
        },
      },
      isPublic: true,
      tags: ['health', 'fitness', 'wellness', 'personal', 'template'],
    },
    {
      id: 'career-development',
      name: 'Career Development',
      description: 'Professional growth, skill development, and career advancement tracking',
      areaType: 'CAREER',
      template: {
        area: {
          title: 'Career Development',
          description: 'Managing my professional growth, skills, and career advancement',
          type: 'CAREER' as const,
          responsibilityLevel: 'HIGH' as const,
          reviewFrequency: 'MONTHLY' as const,
          color: '#339af0',
          tags: ['career', 'professional', 'skills', 'growth'],
        },
        standards: [
          {
            title: 'Skill Development',
            description: 'Continuous learning and skill improvement',
            type: 'QUANTITATIVE' as const,
            category: 'learning',
            priority: 'HIGH' as const,
            assessmentFrequency: 'MONTHLY' as const,
            criteria: [
              {
                name: 'Learning Hours per Month',
                description: 'Hours dedicated to learning new skills',
                type: 'NUMERIC' as const,
                target: 20,
                unit: 'hours',
                weight: 0.4,
                isRequired: true,
              },
              {
                name: 'Courses Completed',
                description: 'Number of courses or certifications completed',
                type: 'NUMERIC' as const,
                target: 1,
                unit: 'courses',
                weight: 0.3,
                isRequired: false,
              },
              {
                name: 'Skill Application',
                description: 'Applying new skills in work projects',
                type: 'SCALE' as const,
                weight: 0.3,
                isRequired: true,
              },
            ],
          },
        ],
        subInterests: [
          {
            title: 'Technical Skills',
            description: 'Programming, tools, and technical competencies',
            level: 0,
            tags: ['technical', 'programming'],
          },
          {
            title: 'Soft Skills',
            description: 'Communication, leadership, and interpersonal skills',
            level: 0,
            tags: ['soft-skills', 'communication'],
          },
          {
            title: 'Industry Knowledge',
            description: 'Domain expertise and industry trends',
            level: 0,
            tags: ['industry', 'domain'],
          },
        ],
        initialContent: {
          projects: [
            {
              title: 'Complete Professional Certification',
              description: 'Earn a relevant professional certification',
              status: 'PLANNING' as const,
              priority: 'HIGH' as const,
            },
          ],
          resources: [
            {
              title: 'LinkedIn Learning',
              description: 'Online learning platform for professional skills',
              type: 'COURSE' as const,
              sourceUrl: 'https://www.linkedin.com/learning',
            },
          ],
          notes: [
            {
              title: 'Career Goals and Milestones',
              content: 'My professional development goals and key milestones...',
              type: 'DETAILED' as const,
            },
          ],
        },
      },
      isPublic: true,
      tags: ['career', 'professional', 'development', 'template'],
    },
    {
      id: 'financial-management',
      name: 'Personal Finance Management',
      description: 'Budgeting, savings, investments, and financial goal tracking',
      areaType: 'FINANCE',
      template: {
        area: {
          title: 'Personal Finance',
          description: 'Managing my budget, savings, investments, and financial goals',
          type: 'FINANCE' as const,
          responsibilityLevel: 'HIGH' as const,
          reviewFrequency: 'MONTHLY' as const,
          color: '#ffd43b',
          tags: ['finance', 'budget', 'savings', 'investments'],
        },
        standards: [
          {
            title: 'Budget Management',
            description: 'Maintaining and following monthly budget',
            type: 'QUANTITATIVE' as const,
            category: 'budgeting',
            priority: 'CRITICAL' as const,
            assessmentFrequency: 'MONTHLY' as const,
            criteria: [
              {
                name: 'Budget Adherence',
                description: 'Percentage of budget categories stayed within limits',
                type: 'PERCENTAGE' as const,
                target: 90,
                unit: '%',
                weight: 0.5,
                isRequired: true,
              },
              {
                name: 'Savings Rate',
                description: 'Percentage of income saved',
                type: 'PERCENTAGE' as const,
                target: 20,
                unit: '%',
                weight: 0.3,
                isRequired: true,
              },
              {
                name: 'Emergency Fund',
                description: 'Months of expenses covered by emergency fund',
                type: 'NUMERIC' as const,
                target: 6,
                unit: 'months',
                weight: 0.2,
                isRequired: true,
              },
            ],
          },
        ],
        subInterests: [
          {
            title: 'Budgeting & Expenses',
            description: 'Monthly budget planning and expense tracking',
            level: 0,
            tags: ['budget', 'expenses'],
          },
          {
            title: 'Savings & Emergency Fund',
            description: 'Building savings and emergency fund',
            level: 0,
            tags: ['savings', 'emergency-fund'],
          },
          {
            title: 'Investments',
            description: 'Investment portfolio and retirement planning',
            level: 0,
            tags: ['investments', 'retirement'],
          },
        ],
        initialContent: {
          projects: [
            {
              title: 'Create Monthly Budget System',
              description: 'Establish a comprehensive monthly budgeting system',
              status: 'PLANNING' as const,
              priority: 'HIGH' as const,
            },
            {
              title: 'Build Emergency Fund',
              description: 'Save 6 months of expenses for emergency fund',
              status: 'PLANNING' as const,
              priority: 'HIGH' as const,
            },
          ],
          resources: [
            {
              title: 'Mint Budgeting App',
              description: 'Personal finance and budgeting application',
              type: 'TOOL' as const,
              sourceUrl: 'https://www.mint.com',
            },
          ],
          notes: [
            {
              title: 'Financial Goals and Priorities',
              content: 'My short-term and long-term financial goals...',
              type: 'DETAILED' as const,
            },
          ],
        },
      },
      isPublic: true,
      tags: ['finance', 'budget', 'money', 'template'],
    },
  ];

  if (areaType) {
    return templates.filter(template => 
      template.areaType === areaType || !template.areaType
    );
  }

  return templates;
}
