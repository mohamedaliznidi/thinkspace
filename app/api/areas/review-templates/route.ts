/**
 * Area Review Templates API Routes for ThinkSpace
 * 
 * This API handles CRUD operations for area review templates,
 * including predefined and custom templates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { AppError, handleApiError } from '@/lib/utils';

// Review template validation schema
const createReviewTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  areaType: z.enum(['RESPONSIBILITY', 'INTEREST', 'LEARNING', 'HEALTH', 'FINANCE', 'CAREER', 'PERSONAL', 'OTHER']).optional(),
  template: z.object({
    sections: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
      type: z.enum(['text', 'rating', 'checklist', 'criteria']),
      required: z.boolean().default(false),
      options: z.record(z.any()).optional(),
    })),
    criteria: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      weight: z.number().min(0).max(1).default(1),
      scale: z.object({
        min: z.number(),
        max: z.number(),
        labels: z.record(z.string()).optional(),
      }),
    })).optional(),
    instructions: z.string().optional(),
  }),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

const updateReviewTemplateSchema = createReviewTemplateSchema.partial();

/**
 * GET /api/areas/review-templates
 * List available review templates
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

    // Get custom templates (if we had a templates table)
    // For now, we'll just return predefined templates
    const templates = predefinedTemplates.filter(template => {
      if (search) {
        const searchLower = search.toLowerCase();
        return template.name.toLowerCase().includes(searchLower) ||
               template.description?.toLowerCase().includes(searchLower);
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      data: { templates },
    });

  } catch (error) {
    console.error('Get review templates error:', error);
    const { message, statusCode } = handleApiError(error);

    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

/**
 * Get predefined review templates
 */
function getPredefinedTemplates(areaType?: string) {
  const templates = [
    {
      id: 'general-area-review',
      name: 'General Area Review',
      description: 'A comprehensive review template suitable for most areas',
      areaType: null,
      template: {
        sections: [
          {
            id: 'overview',
            title: 'Area Overview',
            description: 'Current state and recent developments',
            type: 'text',
            required: true,
          },
          {
            id: 'achievements',
            title: 'Key Achievements',
            description: 'What has been accomplished since the last review?',
            type: 'text',
            required: false,
          },
          {
            id: 'challenges',
            title: 'Current Challenges',
            description: 'What obstacles or issues are you facing?',
            type: 'text',
            required: false,
          },
          {
            id: 'health-rating',
            title: 'Overall Health Rating',
            description: 'Rate the overall health of this area',
            type: 'rating',
            required: true,
            options: {
              scale: { min: 1, max: 10 },
              labels: {
                1: 'Critical',
                3: 'Poor',
                5: 'Fair',
                7: 'Good',
                10: 'Excellent'
              }
            },
          },
          {
            id: 'improvements',
            title: 'Improvement Actions',
            description: 'What actions will you take to improve this area?',
            type: 'checklist',
            required: false,
          },
        ],
        criteria: [
          {
            id: 'progress',
            name: 'Progress Toward Goals',
            description: 'How well are you progressing toward your goals in this area?',
            weight: 0.3,
            scale: { min: 1, max: 5 },
          },
          {
            id: 'maintenance',
            name: 'Maintenance Quality',
            description: 'How well are you maintaining standards in this area?',
            weight: 0.3,
            scale: { min: 1, max: 5 },
          },
          {
            id: 'satisfaction',
            name: 'Personal Satisfaction',
            description: 'How satisfied are you with this area?',
            weight: 0.2,
            scale: { min: 1, max: 5 },
          },
          {
            id: 'alignment',
            name: 'Value Alignment',
            description: 'How well does this area align with your values?',
            weight: 0.2,
            scale: { min: 1, max: 5 },
          },
        ],
        instructions: 'Take time to reflect on each section. Be honest about challenges and specific about improvement actions.',
      },
      isPublic: true,
      tags: ['general', 'comprehensive'],
    },
    {
      id: 'responsibility-review',
      name: 'Responsibility Area Review',
      description: 'Focused review template for areas of responsibility',
      areaType: 'RESPONSIBILITY',
      template: {
        sections: [
          {
            id: 'standards-check',
            title: 'Standards Compliance',
            description: 'How well are you meeting your defined standards?',
            type: 'criteria',
            required: true,
          },
          {
            id: 'stakeholder-feedback',
            title: 'Stakeholder Feedback',
            description: 'What feedback have you received from stakeholders?',
            type: 'text',
            required: false,
          },
          {
            id: 'process-improvements',
            title: 'Process Improvements',
            description: 'What processes can be improved or optimized?',
            type: 'text',
            required: false,
          },
          {
            id: 'resource-needs',
            title: 'Resource Requirements',
            description: 'What resources do you need to maintain or improve this area?',
            type: 'text',
            required: false,
          },
        ],
        criteria: [
          {
            id: 'quality',
            name: 'Quality of Output',
            description: 'Quality of work or results in this area',
            weight: 0.4,
            scale: { min: 1, max: 5 },
          },
          {
            id: 'timeliness',
            name: 'Timeliness',
            description: 'Meeting deadlines and commitments',
            weight: 0.3,
            scale: { min: 1, max: 5 },
          },
          {
            id: 'efficiency',
            name: 'Efficiency',
            description: 'Efficient use of time and resources',
            weight: 0.3,
            scale: { min: 1, max: 5 },
          },
        ],
        instructions: 'Focus on measurable outcomes and stakeholder impact. Consider both internal and external perspectives.',
      },
      isPublic: true,
      tags: ['responsibility', 'standards', 'stakeholders'],
    },
    {
      id: 'interest-review',
      name: 'Interest Area Review',
      description: 'Review template for areas of personal interest and learning',
      areaType: 'INTEREST',
      template: {
        sections: [
          {
            id: 'learning-progress',
            title: 'Learning Progress',
            description: 'What have you learned or discovered recently?',
            type: 'text',
            required: true,
          },
          {
            id: 'engagement-level',
            title: 'Engagement Level',
            description: 'How engaged and motivated are you in this area?',
            type: 'rating',
            required: true,
            options: {
              scale: { min: 1, max: 10 },
            },
          },
          {
            id: 'connections',
            title: 'Connections Made',
            description: 'What connections have you made to other areas or interests?',
            type: 'text',
            required: false,
          },
          {
            id: 'next-steps',
            title: 'Next Learning Steps',
            description: 'What do you want to explore or learn next?',
            type: 'text',
            required: false,
          },
        ],
        criteria: [
          {
            id: 'growth',
            name: 'Personal Growth',
            description: 'How much have you grown in this area?',
            weight: 0.4,
            scale: { min: 1, max: 5 },
          },
          {
            id: 'enjoyment',
            name: 'Enjoyment',
            description: 'How much do you enjoy this area?',
            weight: 0.3,
            scale: { min: 1, max: 5 },
          },
          {
            id: 'relevance',
            name: 'Relevance',
            description: 'How relevant is this area to your goals?',
            weight: 0.3,
            scale: { min: 1, max: 5 },
          },
        ],
        instructions: 'Focus on personal development and intrinsic motivation. Consider how this area contributes to your overall growth.',
      },
      isPublic: true,
      tags: ['interest', 'learning', 'growth'],
    },
  ];

  if (areaType) {
    return templates.filter(template => 
      template.areaType === areaType || template.areaType === null
    );
  }

  return templates;
}
