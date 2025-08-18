/**
 * Graph Layout Engine for ThinkSpace
 * 
 * Provides different layout algorithms and graph analysis utilities
 * for positioning nodes and analyzing graph structure.
 */

'use client';

import { useCallback, useMemo } from 'react';
import type { GraphNode, GraphEdge, GraphLayout, GraphData } from '@/types/graph';

export interface LayoutEngine {
  applyLayout: (nodes: GraphNode[], edges: GraphEdge[]) => GraphNode[];
  name: string;
  description: string;
}

// Force-directed layout using D3 simulation
export class ForceDirectedLayout implements LayoutEngine {
  name = 'Force-Directed';
  description = 'Physics-based layout with attractive and repulsive forces';

  private simulation: any = null;

  applyLayout(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
    // This will be handled by react-force-graph's built-in D3 simulation
    // We just return the nodes with initial positions if needed
    return nodes.map((node, index) => ({
      ...node,
      x: node.x ?? Math.random() * 800,
      y: node.y ?? Math.random() * 600,
    }));
  }
}

// Hierarchical layout
export class HierarchicalLayout implements LayoutEngine {
  name = 'Hierarchical';
  description = 'Tree-like structure with clear parent-child relationships';

  applyLayout(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const adjacencyList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize adjacency list and in-degree count
    nodes.forEach(node => {
      adjacencyList.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    // Build adjacency list and calculate in-degrees
    edges.forEach(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      
      adjacencyList.get(sourceId)?.push(targetId);
      inDegree.set(targetId, (inDegree.get(targetId) || 0) + 1);
    });

    // Find root nodes (nodes with no incoming edges)
    const roots = nodes.filter(node => inDegree.get(node.id) === 0);
    
    // If no roots found, use nodes with highest centrality
    if (roots.length === 0) {
      const sortedNodes = [...nodes].sort((a, b) => 
        (b.centralityScore || 0) - (a.centralityScore || 0)
      );
      roots.push(sortedNodes[0]);
    }

    const levels = new Map<string, number>();
    const positioned = new Set<string>();
    
    // BFS to assign levels
    const queue = roots.map(root => ({ node: root, level: 0 }));
    
    while (queue.length > 0) {
      const { node, level } = queue.shift()!;
      
      if (positioned.has(node.id)) continue;
      
      levels.set(node.id, level);
      positioned.add(node.id);
      
      const children = adjacencyList.get(node.id) || [];
      children.forEach(childId => {
        if (!positioned.has(childId)) {
          const childNode = nodeMap.get(childId);
          if (childNode) {
            queue.push({ node: childNode, level: level + 1 });
          }
        }
      });
    }

    // Position nodes based on levels
    const levelGroups = new Map<number, GraphNode[]>();
    const maxLevel = Math.max(...Array.from(levels.values()));
    
    nodes.forEach(node => {
      const level = levels.get(node.id) ?? maxLevel + 1;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node);
    });

    const width = 800;
    const height = 600;
    const levelHeight = height / (maxLevel + 2);

    return nodes.map(node => {
      const level = levels.get(node.id) ?? maxLevel + 1;
      const levelNodes = levelGroups.get(level) || [];
      const nodeIndex = levelNodes.indexOf(node);
      const levelWidth = width / (levelNodes.length + 1);

      return {
        ...node,
        x: levelWidth * (nodeIndex + 1),
        y: levelHeight * (level + 1),
        fx: levelWidth * (nodeIndex + 1), // Fix position
        fy: levelHeight * (level + 1),
      };
    });
  }
}

// Circular layout
export class CircularLayout implements LayoutEngine {
  name = 'Circular';
  description = 'Nodes arranged in concentric circles by type or importance';

  applyLayout(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
    const centerX = 400;
    const centerY = 300;
    const maxRadius = 250;

    // Group nodes by type
    const typeGroups = new Map<string, GraphNode[]>();
    nodes.forEach(node => {
      if (!typeGroups.has(node.type)) {
        typeGroups.set(node.type, []);
      }
      typeGroups.get(node.type)!.push(node);
    });

    const types = Array.from(typeGroups.keys());
    const radiusStep = maxRadius / types.length;

    return nodes.map(node => {
      const typeIndex = types.indexOf(node.type);
      const radius = radiusStep * (typeIndex + 1);
      const typeNodes = typeGroups.get(node.type) || [];
      const nodeIndex = typeNodes.indexOf(node);
      const angle = (2 * Math.PI * nodeIndex) / typeNodes.length;

      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        fx: centerX + radius * Math.cos(angle),
        fy: centerY + radius * Math.sin(angle),
      };
    });
  }
}

// Grid layout
export class GridLayout implements LayoutEngine {
  name = 'Grid';
  description = 'Organized grid layout grouped by node type';

  applyLayout(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
    const width = 800;
    const height = 600;
    const padding = 50;

    // Group nodes by type
    const typeGroups = new Map<string, GraphNode[]>();
    nodes.forEach(node => {
      if (!typeGroups.has(node.type)) {
        typeGroups.set(node.type, []);
      }
      typeGroups.get(node.type)!.push(node);
    });

    const types = Array.from(typeGroups.keys());
    const cols = Math.ceil(Math.sqrt(types.length));
    const rows = Math.ceil(types.length / cols);
    
    const sectionWidth = (width - padding * 2) / cols;
    const sectionHeight = (height - padding * 2) / rows;

    return nodes.map(node => {
      const typeIndex = types.indexOf(node.type);
      const sectionRow = Math.floor(typeIndex / cols);
      const sectionCol = typeIndex % cols;
      
      const typeNodes = typeGroups.get(node.type) || [];
      const nodeIndex = typeNodes.indexOf(node);
      
      // Arrange nodes within each section
      const nodesPerRow = Math.ceil(Math.sqrt(typeNodes.length));
      const nodeRow = Math.floor(nodeIndex / nodesPerRow);
      const nodeCol = nodeIndex % nodesPerRow;
      
      const nodeSpacingX = sectionWidth / (nodesPerRow + 1);
      const nodeSpacingY = sectionHeight / (Math.ceil(typeNodes.length / nodesPerRow) + 1);

      return {
        ...node,
        x: padding + sectionCol * sectionWidth + nodeSpacingX * (nodeCol + 1),
        y: padding + sectionRow * sectionHeight + nodeSpacingY * (nodeRow + 1),
        fx: padding + sectionCol * sectionWidth + nodeSpacingX * (nodeCol + 1),
        fy: padding + sectionRow * sectionHeight + nodeSpacingY * (nodeRow + 1),
      };
    });
  }
}

// Radial layout
export class RadialLayout implements LayoutEngine {
  name = 'Radial';
  description = 'Central hub with nodes radiating outward by connection strength';

  applyLayout(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
    const centerX = 400;
    const centerY = 300;
    const maxRadius = 250;

    // Find the most connected node as center
    const centralNode = nodes.reduce((prev, current) => 
      (current.connectionCount > prev.connectionCount) ? current : prev
    );

    // Calculate distances from central node using BFS
    const distances = new Map<string, number>();
    const queue = [{ nodeId: centralNode.id, distance: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { nodeId, distance } = queue.shift()!;
      
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      distances.set(nodeId, distance);

      // Find connected nodes
      edges.forEach(edge => {
        const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
        
        if (sourceId === nodeId && !visited.has(targetId)) {
          queue.push({ nodeId: targetId, distance: distance + 1 });
        } else if (targetId === nodeId && !visited.has(sourceId)) {
          queue.push({ nodeId: sourceId, distance: distance + 1 });
        }
      });
    }

    // Group nodes by distance
    const distanceGroups = new Map<number, GraphNode[]>();
    nodes.forEach(node => {
      const distance = distances.get(node.id) ?? 999;
      if (!distanceGroups.has(distance)) {
        distanceGroups.set(distance, []);
      }
      distanceGroups.get(distance)!.push(node);
    });

    return nodes.map(node => {
      const distance = distances.get(node.id) ?? 999;
      
      if (distance === 0) {
        // Central node
        return { ...node, x: centerX, y: centerY, fx: centerX, fy: centerY };
      }

      const radius = Math.min(maxRadius, (maxRadius / 4) * distance);
      const distanceNodes = distanceGroups.get(distance) || [];
      const nodeIndex = distanceNodes.indexOf(node);
      const angle = (2 * Math.PI * nodeIndex) / distanceNodes.length;

      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        fx: centerX + radius * Math.cos(angle),
        fy: centerY + radius * Math.sin(angle),
      };
    });
  }
}

// Layout engine factory
export class LayoutEngineFactory {
  private static engines = new Map<GraphLayout, LayoutEngine>([
    ['force', new ForceDirectedLayout()],
    ['hierarchical', new HierarchicalLayout()],
    ['circular', new CircularLayout()],
    ['grid', new GridLayout()],
    ['radial', new RadialLayout()],
  ]);

  static getEngine(layout: GraphLayout): LayoutEngine {
    return this.engines.get(layout) || new ForceDirectedLayout();
  }

  static getAllEngines(): Array<{ key: GraphLayout; engine: LayoutEngine }> {
    return Array.from(this.engines.entries()).map(([key, engine]) => ({ key, engine }));
  }
}

// Graph analysis utilities
export class GraphAnalyzer {
  static calculateShortestPath(
    nodes: GraphNode[], 
    edges: GraphEdge[], 
    startId: string, 
    endId: string
  ): string[] | null {
    const adjacencyList = new Map<string, string[]>();
    
    // Build adjacency list
    nodes.forEach(node => adjacencyList.set(node.id, []));
    edges.forEach(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      
      adjacencyList.get(sourceId)?.push(targetId);
      adjacencyList.get(targetId)?.push(sourceId); // Undirected graph
    });

    // BFS to find shortest path
    const queue = [{ nodeId: startId, path: [startId] }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;
      
      if (nodeId === endId) {
        return path;
      }
      
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const neighbors = adjacencyList.get(nodeId) || [];
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          queue.push({ nodeId: neighborId, path: [...path, neighborId] });
        }
      });
    }

    return null; // No path found
  }

  static findClusters(nodes: GraphNode[], edges: GraphEdge[]): Array<string[]> {
    const adjacencyList = new Map<string, string[]>();
    const visited = new Set<string>();
    const clusters: string[][] = [];

    // Build adjacency list
    nodes.forEach(node => adjacencyList.set(node.id, []));
    edges.forEach(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      
      adjacencyList.get(sourceId)?.push(targetId);
      adjacencyList.get(targetId)?.push(sourceId);
    });

    // DFS to find connected components
    const dfs = (nodeId: string, cluster: string[]) => {
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      cluster.push(nodeId);
      
      const neighbors = adjacencyList.get(nodeId) || [];
      neighbors.forEach(neighborId => dfs(neighborId, cluster));
    };

    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const cluster: string[] = [];
        dfs(node.id, cluster);
        if (cluster.length > 1) {
          clusters.push(cluster);
        }
      }
    });

    return clusters;
  }

  static calculateCentralityScores(nodes: GraphNode[], edges: GraphEdge[]): Map<string, number> {
    const scores = new Map<string, number>();
    
    // Simple degree centrality
    nodes.forEach(node => scores.set(node.id, 0));
    
    edges.forEach(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      
      scores.set(sourceId, (scores.get(sourceId) || 0) + edge.strength);
      scores.set(targetId, (scores.get(targetId) || 0) + edge.strength);
    });

    return scores;
  }
}

// Hook for using layout engines
export function useGraphLayout() {
  const applyLayout = useCallback((
    data: GraphData, 
    layout: GraphLayout
  ): GraphData => {
    const engine = LayoutEngineFactory.getEngine(layout);
    const positionedNodes = engine.applyLayout(data.nodes, data.edges);
    
    return {
      ...data,
      nodes: positionedNodes,
    };
  }, []);

  const availableLayouts = useMemo(() => 
    LayoutEngineFactory.getAllEngines()
  , []);

  return {
    applyLayout,
    availableLayouts,
    analyzer: GraphAnalyzer,
  };
}
