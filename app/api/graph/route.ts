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

    // Get all nodes (projects, areas, resources, notes)
    const [projects, areas, resources, notes] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          areaId: true,
          createdAt: true,
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
          projectId: true,
          areaId: true,
          createdAt: true,
        },
      }),
      prisma.note.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          type: true,
          projectId: true,
          areaId: true,
          resourceId: true,
          createdAt: true,
        },
      }),
    ]);

    // Transform to graph nodes
    const nodes = [
      ...projects.map(p => ({
        id: p.id,
        label: p.title,
        type: 'project',
        status: p.status,
        priority: p.priority,
        color: '#228be6', // Blue for projects
        size: 20,
        createdAt: p.createdAt,
      })),
      ...areas.map(a => ({
        id: a.id,
        label: a.title,
        type: 'area',
        areaType: a.type,
        color: a.color || '#7950f2', // Purple for areas
        size: 25,
        createdAt: a.createdAt,
      })),
      ...resources.map(r => ({
        id: r.id,
        label: r.title,
        type: 'resource',
        resourceType: r.type,
        color: '#51cf66', // Green for resources
        size: 15,
        createdAt: r.createdAt,
      })),
      ...notes.map(n => ({
        id: n.id,
        label: n.title,
        type: 'note',
        noteType: n.type,
        color: '#868e96', // Gray for notes
        size: 10,
        createdAt: n.createdAt,
      })),
    ];

    // Create edges based on relationships
    const edges = [];

    // Project -> Area relationships
    projects.forEach(project => {
      if (project.areaId) {
        edges.push({
          id: `${project.id}-${project.areaId}`,
          from: project.id,
          to: project.areaId,
          type: 'belongs_to',
          label: 'belongs to',
        });
      }
    });

    // Resource -> Project/Area relationships
    resources.forEach(resource => {
      if (resource.projectId) {
        edges.push({
          id: `${resource.id}-${resource.projectId}`,
          from: resource.id,
          to: resource.projectId,
          type: 'supports',
          label: 'supports',
        });
      }
      if (resource.areaId) {
        edges.push({
          id: `${resource.id}-${resource.areaId}`,
          from: resource.id,
          to: resource.areaId,
          type: 'relates_to',
          label: 'relates to',
        });
      }
    });

    // Note relationships
    notes.forEach(note => {
      if (note.projectId) {
        edges.push({
          id: `${note.id}-${note.projectId}`,
          from: note.id,
          to: note.projectId,
          type: 'documents',
          label: 'documents',
        });
      }
      if (note.areaId) {
        edges.push({
          id: `${note.id}-${note.areaId}`,
          from: note.id,
          to: note.areaId,
          type: 'notes_on',
          label: 'notes on',
        });
      }
      if (note.resourceId) {
        edges.push({
          id: `${note.id}-${note.resourceId}`,
          from: note.id,
          to: note.resourceId,
          type: 'annotates',
          label: 'annotates',
        });
      }
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
            if (edge.from === nodeId) connectedNodeIds.add(edge.to);
            if (edge.to === nodeId) connectedNodeIds.add(edge.from);
          });
        });
      }

      filteredNodes = nodes.filter(node => connectedNodeIds.has(node.id));
      filteredEdges = edges.filter(edge => 
        connectedNodeIds.has(edge.from) && connectedNodeIds.has(edge.to)
      );
    }

    if (type && type !== 'full') {
      filteredNodes = filteredNodes.filter(node => node.type === type);
      filteredEdges = filteredEdges.filter(edge => {
        const fromNode = filteredNodes.find(n => n.id === edge.from);
        const toNode = filteredNodes.find(n => n.id === edge.to);
        return fromNode && toNode;
      });
    }

    const graphData = {
      nodes: filteredNodes,
      edges: filteredEdges,
      stats: {
        totalNodes: filteredNodes.length,
        totalEdges: filteredEdges.length,
        nodeTypes: {
          projects: filteredNodes.filter(n => n.type === 'project').length,
          areas: filteredNodes.filter(n => n.type === 'area').length,
          resources: filteredNodes.filter(n => n.type === 'resource').length,
          notes: filteredNodes.filter(n => n.type === 'note').length,
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

    // This would typically create relationships in Neo4j
    // For now, we'll simulate by updating the database relationships
    
    // Example: If creating a project -> area relationship
    if (relationshipType === 'belongs_to') {
      await prisma.project.update({
        where: { id: fromId, userId: session.user.id },
        data: { areaId: toId },
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
