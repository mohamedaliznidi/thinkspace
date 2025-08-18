/**
 * Graph API Routes for ThinkSpace
 * 
 * This API handles knowledge graph operations including
 * retrieving graph data, creating relationships, and graph analytics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppError, handleApiError } from '@/lib/utils';

// GET - Get graph data for visualization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'full', 'project', 'area', 'resource'
    const nodeId = searchParams.get('nodeId');
    const depth = parseInt(searchParams.get('depth') || '2');

    const userId = session.user.id;

    // Get all nodes (projects, areas, resources, notes) with their relationships
    const [projects, areas, resources, notes] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
          areas: {
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.area.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          type: true,
          color: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.resource.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          type: true,
          createdAt: true,
          projects: {
            select: {
              id: true,
            },
          },
          areas: {
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.note.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          type: true,
          createdAt: true,
          projects: {
            select: {
              id: true,
            },
          },
          areas: {
            select: {
              id: true,
            },
          },
          resources: {
            select: {
              id: true,
            },
          },
        },
      }),
    ]);

    // Transform to graph nodes
    const nodes = [
      ...projects.map(p => ({
        id: p.id,
        label: p.title,
        type: 'project' as const,
        status: p.status,
        priority: p.priority,
        color: '#228be6', // Blue for projects
        size: 20,
        connectionCount: 0, // Will be calculated below
        createdAt: p.createdAt.toISOString(),
      })),
      ...areas.map(a => ({
        id: a.id,
        label: a.title,
        type: 'area' as const,
        areaType: a.type,
        color: a.color || '#7950f2', // Purple for areas
        size: 25,
        connectionCount: 0, // Will be calculated below
        createdAt: a.createdAt.toISOString(),
      })),
      ...resources.map(r => ({
        id: r.id,
        label: r.title,
        type: 'resource' as const,
        resourceType: r.type,
        color: '#51cf66', // Green for resources
        size: 15,
        connectionCount: 0, // Will be calculated below
        createdAt: r.createdAt.toISOString(),
      })),
      ...notes.map(n => ({
        id: n.id,
        label: n.title,
        type: 'note' as const,
        noteType: n.type,
        color: '#868e96', // Gray for notes
        size: 10,
        connectionCount: 0, // Will be calculated below
        createdAt: n.createdAt.toISOString(),
      })),
    ];

    // Create edges based on relationships
    const edges: Array<{
      id: string;
      source: string;
      target: string;
      type: string;
      label: string;
      strength: number;
      color: string;
      width: number;
      createdAt: string;
    }> = [];

    // Project -> Area relationships
    projects.forEach(project => {
      project.areas.forEach(area => {
        edges.push({
          id: `${project.id}-${area.id}`,
          source: project.id,
          target: area.id,
          type: 'project_area',
          label: 'belongs to',
          strength: 0.9,
          color: '#e9ecef',
          width: 2,
          createdAt: new Date().toISOString(),
        });
      });
    });

    // Resource -> Project/Area relationships
    resources.forEach(resource => {
      resource.projects.forEach(project => {
        edges.push({
          id: `${resource.id}-${project.id}`,
          source: resource.id,
          target: project.id,
          type: 'resource_project',
          label: 'supports',
          strength: 0.8,
          color: '#e9ecef',
          width: 1.5,
          createdAt: new Date().toISOString(),
        });
      });
      resource.areas.forEach(area => {
        edges.push({
          id: `${resource.id}-${area.id}`,
          source: resource.id,
          target: area.id,
          type: 'resource_area',
          label: 'relates to',
          strength: 0.7,
          color: '#e9ecef',
          width: 1.5,
          createdAt: new Date().toISOString(),
        });
      });
    });

    // Note relationships
    notes.forEach(note => {
      note.projects.forEach(project => {
        edges.push({
          id: `${note.id}-${project.id}`,
          source: note.id,
          target: project.id,
          type: 'note_project',
          label: 'documents',
          strength: 0.6,
          color: '#e9ecef',
          width: 1,
          createdAt: new Date().toISOString(),
        });
      });
      note.areas.forEach(area => {
        edges.push({
          id: `${note.id}-${area.id}`,
          source: note.id,
          target: area.id,
          type: 'note_area',
          label: 'notes on',
          strength: 0.5,
          color: '#e9ecef',
          width: 1,
          createdAt: new Date().toISOString(),
        });
      });
      note.resources.forEach(resource => {
        edges.push({
          id: `${note.id}-${resource.id}`,
          source: note.id,
          target: resource.id,
          type: 'note_resource',
          label: 'annotates',
          strength: 0.4,
          color: '#e9ecef',
          width: 1,
          createdAt: new Date().toISOString(),
        });
      });
    });

    // Filter based on type and nodeId if specified
    let filteredNodes = nodes;
    let filteredEdges = edges;

    if (nodeId) {
      // Get connected nodes within specified depth
      const connectedNodeIds = new Set([nodeId]);
      
      for (let d = 0; d < depth; d++) {
        const currentNodes = Array.from(connectedNodeIds);
        currentNodes.forEach(nodeId => {
          edges.forEach(edge => {
            if (edge.source === nodeId) connectedNodeIds.add(edge.target);
            if (edge.target === nodeId) connectedNodeIds.add(edge.source);
          });
        });
      }

      filteredNodes = nodes.filter(node => connectedNodeIds.has(node.id));
      filteredEdges = edges.filter(edge =>
        connectedNodeIds.has(edge.source) && connectedNodeIds.has(edge.target)
      );
    }

    if (type && type !== 'full') {
      filteredNodes = filteredNodes.filter(node => node.type === type);
      filteredEdges = filteredEdges.filter(edge => {
        const fromNode = filteredNodes.find(n => n.id === edge.source);
        const toNode = filteredNodes.find(n => n.id === edge.target);
        return fromNode && toNode;
      });
    }

    // Calculate connection counts
    const connectionCounts = new Map<string, number>();
    filteredEdges.forEach(edge => {
      connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1);
      connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + 1);
    });

    // Update nodes with connection counts
    filteredNodes = filteredNodes.map(node => ({
      ...node,
      connectionCount: connectionCounts.get(node.id) || 0,
    }));

    const graphData = {
      nodes: filteredNodes,
      edges: filteredEdges,
      stats: {
        totalNodes: filteredNodes.length,
        totalEdges: filteredEdges.length,
        density: filteredNodes.length > 1 ? (2 * filteredEdges.length) / (filteredNodes.length * (filteredNodes.length - 1)) : 0,
        avgDegree: filteredNodes.length > 0 ? (2 * filteredEdges.length) / filteredNodes.length : 0,
        nodeDistribution: {
          projects: filteredNodes.filter(n => n.type === 'project').length,
          areas: filteredNodes.filter(n => n.type === 'area').length,
          resources: filteredNodes.filter(n => n.type === 'resource').length,
          notes: filteredNodes.filter(n => n.type === 'note').length,
        },
        relationshipDistribution: {
          direct_reference: 0,
          shared_tag: 0,
          content_similarity: 0,
          temporal_proximity: 0,
          project_area: filteredEdges.filter(e => e.type === 'project_area').length,
          resource_project: filteredEdges.filter(e => e.type === 'resource_project').length,
          resource_area: filteredEdges.filter(e => e.type === 'resource_area').length,
          note_project: filteredEdges.filter(e => e.type === 'note_project').length,
          note_area: filteredEdges.filter(e => e.type === 'note_area').length,
          note_resource: filteredEdges.filter(e => e.type === 'note_resource').length,
          custom: 0,
        },
        centrality: {
          mostConnected: filteredNodes
            .sort((a, b) => b.connectionCount - a.connectionCount)
            .slice(0, 10)
            .map(node => ({
              nodeId: node.id,
              connections: node.connectionCount,
              score: node.connectionCount,
            })),
          clusters: [],
        },
      },
    };

    return NextResponse.json({
      success: true,
      data: graphData,
    });

  } catch (error) {
    console.error('Get graph data error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}

// POST - Create relationship between nodes
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const body = await request.json();
    const { fromId, toId, relationshipType } = body;

    if (!fromId || !toId || !relationshipType) {
      throw new AppError('Missing required fields: fromId, toId, relationshipType', 400);
    }

    // Create relationships using the many-to-many connections
    // Note: This is a simplified implementation. In a real app, you'd want to
    // validate the relationship types and handle different connection types

    // Example: If creating a project -> area relationship
    if (relationshipType === 'belongs_to') {
      // Connect project to area
      await prisma.project.update({
        where: { id: fromId, userId: session.user.id },
        data: {
          areas: {
            connect: { id: toId },
          },
        },
      });
    } else if (relationshipType === 'supports') {
      // Connect resource to project
      await prisma.resource.update({
        where: { id: fromId, userId: session.user.id },
        data: {
          projects: {
            connect: { id: toId },
          },
        },
      });
    } else if (relationshipType === 'relates_to') {
      // Connect resource to area
      await prisma.resource.update({
        where: { id: fromId, userId: session.user.id },
        data: {
          areas: {
            connect: { id: toId },
          },
        },
      });
    } else if (relationshipType === 'documents') {
      // Connect note to project
      await prisma.note.update({
        where: { id: fromId, userId: session.user.id },
        data: {
          projects: {
            connect: { id: toId },
          },
        },
      });
    } else if (relationshipType === 'notes_on') {
      // Connect note to area
      await prisma.note.update({
        where: { id: fromId, userId: session.user.id },
        data: {
          areas: {
            connect: { id: toId },
          },
        },
      });
    } else if (relationshipType === 'annotates') {
      // Connect note to resource
      await prisma.note.update({
        where: { id: fromId, userId: session.user.id },
        data: {
          resources: {
            connect: { id: toId },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Relationship created successfully',
      data: {
        fromId,
        toId,
        relationshipType,
      },
    });

  } catch (error) {
    console.error('Create relationship error:', error);
    const { message, statusCode } = handleApiError(error);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: statusCode });
  }
}
