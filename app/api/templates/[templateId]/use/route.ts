/**
 * Template Usage API Route for ThinkSpace
 * 
 * This API handles creating projects from templates,
 * including tasks, milestones, and dependencies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ templateId: string }>;
}

// Template usage validation schema
const useTemplateSchema = z.object({
  projectTitle: z.string()
    .min(1, 'Project title is required')
    .max(200, 'Project title must be less than 200 characters')
    .trim()
    .optional(),
  projectDescription: z.string()
    .max(1000, 'Project description must be less than 1000 characters')
    .optional(),
  projectDueDate: z.string().datetime().optional(),
  projectTags: z.array(z.string()).default([]),
  customizations: z.object({
    includeTasks: z.boolean().default(true),
    includeMilestones: z.boolean().default(true),
    taskStatusOverride: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'COMPLETED', 'CANCELLED']).optional(),
    projectStatusOverride: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  }).default({}),
});

// POST - Create project from template
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { templateId } = await params;
    const body = await request.json();
    const validatedData = useTemplateSchema.parse(body);

    // Fetch template
    const template = await prisma.projectTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { userId: session.user.id }, // User's own template
          { isPublic: true }, // Public template
        ],
      },
    });

    if (!template) {
      throw new AppError('Template not found or access denied', 404);
    }

    // Extract template data
    const projectData = template.projectData as any;
    const taskData = template.taskData as any[] || [];
    const milestones = template.milestones as any[] || [];

    // Create project from template
    const project = await prisma.$transaction(async (tx) => {
      // Create the project
      const newProject = await tx.project.create({
        data: {
          title: validatedData.projectTitle || projectData.title,
          description: validatedData.projectDescription || projectData.description,
          status: validatedData.customizations.projectStatusOverride || projectData.status || 'PLANNING',
          priority: projectData.priority || 'MEDIUM',
          dueDate: validatedData.projectDueDate ? new Date(validatedData.projectDueDate) : 
                   projectData.dueDate ? new Date(projectData.dueDate) : undefined,
          tags: [...(validatedData.projectTags || []), ...(projectData.tags || [])],
          metadata: {
            ...projectData.metadata,
            createdFromTemplate: {
              templateId: template.id,
              templateTitle: template.title,
              createdAt: new Date().toISOString(),
            },
          },
          userId: session.user.id,
          templateId: template.id,
        },
      });

      // Create tasks if included
      if (validatedData.customizations.includeTasks && taskData.length > 0) {
        const createdTasks: any[] = [];
        
        // First pass: create all tasks without dependencies
        for (let i = 0; i < taskData.length; i++) {
          const taskTemplate = taskData[i];
          
          const task = await tx.task.create({
            data: {
              title: taskTemplate.title,
              description: taskTemplate.description,
              status: validatedData.customizations.taskStatusOverride || taskTemplate.status || 'TODO',
              priority: taskTemplate.priority || 'MEDIUM',
              estimatedHours: taskTemplate.estimatedHours,
              order: taskTemplate.order || i,
              tags: taskTemplate.tags || [],
              userId: session.user.id,
              projectId: newProject.id,
              // Parent task will be set in second pass if needed
            },
          });
          
          createdTasks.push({ task, templateIndex: i });
        }

        // Second pass: set up parent-child relationships and dependencies
        for (let i = 0; i < taskData.length; i++) {
          const taskTemplate = taskData[i];
          const createdTask = createdTasks[i];
          
          const updates: any = {};
          
          // Set parent task if specified
          if (taskTemplate.parentTaskIndex !== undefined && 
              taskTemplate.parentTaskIndex < createdTasks.length) {
            const parentTask = createdTasks[taskTemplate.parentTaskIndex];
            updates.parentTaskId = parentTask.task.id;
          }
          
          // Apply updates if any
          if (Object.keys(updates).length > 0) {
            await tx.task.update({
              where: { id: createdTask.task.id },
              data: updates,
            });
          }
          
          // Set up dependencies (many-to-many relationship)
          if (taskTemplate.dependsOnTaskIndexes && taskTemplate.dependsOnTaskIndexes.length > 0) {
            const dependencyIds = taskTemplate.dependsOnTaskIndexes
              .filter((index: number) => index < createdTasks.length)
              .map((index: number) => ({ id: createdTasks[index].task.id }));
            
            if (dependencyIds.length > 0) {
              await tx.task.update({
                where: { id: createdTask.task.id },
                data: {
                  dependsOnTasks: {
                    connect: dependencyIds,
                  },
                },
              });
            }
          }
        }
      }
      const metaDataObject = JSON.parse(JSON.stringify(newProject.metadata || '{}'));

      // Create milestones if included
      if (validatedData.customizations.includeMilestones && milestones.length > 0) {
        // Note: Milestones would need to be implemented as a separate model
        // For now, we'll store them in project metadata
        await tx.project.update({
          where: { id: newProject.id },
          data: {
            metadata: {
              ...metaDataObject,
              milestones: milestones,
            },
          },
        });
      }

      return newProject;
    });

    // Increment template usage count
    await prisma.projectTemplate.update({
      where: { id: template.id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    // Log template usage
    console.log(`Template used: ${template.title} to create project ${project.title} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: { 
        project: {
          id: project.id,
          title: project.title,
          description: project.description,
          status: project.status,
        },
        template: {
          id: template.id,
          title: template.title,
        },
      },
      message: 'Project created from template successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Use template error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.reduce((acc, err) => {
        const field = err.path.join('.');
        acc[field] = err.message;
        return acc;
      }, {} as Record<string, string>);

      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: fieldErrors,
      }, { status: 400 });
    }

    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to create project from template.',
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to create project from template.',
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to create project from template.',
  }, { status: 405 });
}
