/**
 * Graph Type Definitions for ThinkSpace
 * 
 * Comprehensive type definitions for the interactive graph visualization system,
 * including nodes, edges, layouts, and configuration options.
 */

import type { AreaType, ResourceType, NoteType, ProjectStatus, ProjectPriority } from '@prisma/client';

// Base graph node interface
export interface GraphNode {
  id: string;
  label: string;
  type: 'project' | 'area' | 'resource' | 'note';
  
  // Visual properties
  color: string;
  size: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
  
  // Metadata
  createdAt: string;
  updatedAt?: string;
  
  // Type-specific properties
  status?: ProjectStatus;
  priority?: ProjectPriority;
  areaType?: AreaType;
  resourceType?: ResourceType;
  noteType?: NoteType;
  
  // Connection metrics
  connectionCount: number;
  centralityScore?: number;
  clusterGroup?: string;
  
  // Additional properties for visualization
  highlighted?: boolean;
  selected?: boolean;
  opacity?: number;
  strokeColor?: string;
  strokeWidth?: number;

  // Force graph compatibility
  [key: string]: any;
}

// Graph edge/relationship interface
export interface GraphEdge {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  
  // Relationship properties
  type: RelationshipType;
  label?: string;
  strength: number;
  
  // Visual properties
  color: string;
  width: number;
  opacity?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  
  // Metadata
  createdAt: string;
  properties?: Record<string, any>;
  
  // Interaction properties
  highlighted?: boolean;
  selected?: boolean;
}

// Relationship types
export type RelationshipType = 
  | 'direct_reference'
  | 'shared_tag'
  | 'content_similarity'
  | 'temporal_proximity'
  | 'project_area'
  | 'resource_project'
  | 'resource_area'
  | 'note_project'
  | 'note_area'
  | 'note_resource'
  | 'custom';

// Graph data structure
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: GraphStats;
  metadata?: {
    lastUpdated: string;
    version: string;
    filters?: GraphFilters;
  };
}

// Graph statistics
export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  density: number;
  avgDegree: number;
  
  nodeDistribution: {
    projects: number;
    areas: number;
    resources: number;
    notes: number;
  };
  
  relationshipDistribution: Record<RelationshipType, number>;
  
  centrality: {
    mostConnected: Array<{
      nodeId: string;
      connections: number;
      score: number;
    }>;
    clusters: Array<{
      id: string;
      nodeCount: number;
      density: number;
    }>;
  };
}

// Layout algorithms
export type GraphLayout = 'force' | 'hierarchical' | 'circular' | 'grid' | 'radial';

// Graph visualization configuration
export interface GraphVisualizationConfig {
  // Dimensions
  width: number;
  height: number;
  
  // Layout settings
  layout: GraphLayout;
  nodeSize: {
    min: number;
    max: number;
    scale: 'linear' | 'log' | 'sqrt';
  };
  
  // Force simulation settings (for force layout)
  forceSettings: {
    linkDistance: number;
    linkStrength: number;
    chargeStrength: number;
    centerStrength: number;
    collisionRadius: number;
  };
  
  // Visual settings
  showLabels: boolean;
  showEdgeLabels: boolean;
  enableZoom: boolean;
  enablePan: boolean;
  enableDrag: boolean;
  
  // Color schemes
  colorScheme: {
    projects: string;
    areas: string;
    resources: string;
    notes: string;
    edges: string;
    background: string;
  };
  
  // Animation settings
  animationDuration: number;
  enableAnimations: boolean;
  
  // Interaction settings
  clickToSelect: boolean;
  hoverEffects: boolean;
  contextMenuEnabled: boolean;
}

// Graph filters
export interface GraphFilters {
  nodeTypes: Array<'project' | 'area' | 'resource' | 'note'>;
  relationshipTypes: RelationshipType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
  minConnections?: number;
  maxConnections?: number;
  clusters?: string[];
  tags?: string[];
}

// Focus modes
export type GraphFocusMode = 
  | 'overview'
  | 'node_neighborhood'
  | 'path_between_nodes'
  | 'cluster_view'
  | 'time_filtered'
  | 'search_results';

// Graph interaction events
export interface GraphInteractionEvent {
  type: 'node_click' | 'node_hover' | 'edge_click' | 'edge_hover' | 'background_click';
  nodeId?: string;
  edgeId?: string;
  position?: { x: number; y: number };
  modifiers?: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
  };
}

// Graph analytics data
export interface GraphAnalytics {
  overview: {
    totalNodes: number;
    totalEdges: number;
    density: number;
    avgConnectionsPerNode: number;
    lastUpdated: string;
  };
  
  patterns: {
    knowledgeHubs: Array<{
      nodeId: string;
      label: string;
      type: string;
      connections: number;
      influence: number;
    }>;
    
    isolatedClusters: Array<{
      clusterId: string;
      nodeCount: number;
      internalConnections: number;
      externalConnections: number;
    }>;
    
    orphanedNodes: Array<{
      nodeId: string;
      label: string;
      type: string;
      lastActivity: string;
    }>;
  };
  
  trends: {
    growthRate: number;
    connectionGrowth: number;
    activityHotspots: Array<{
      period: string;
      nodeCount: number;
      edgeCount: number;
    }>;
  };
}

// Search and discovery
export interface GraphSearchResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  paths?: Array<{
    nodes: string[];
    edges: string[];
    length: number;
    strength: number;
  }>;
  query: string;
  totalResults: number;
}

// Export options
export interface GraphExportOptions {
  format: 'png' | 'svg' | 'json' | 'csv';
  includeMetadata: boolean;
  resolution?: number;
  backgroundColor?: string;
  nodeLabels?: boolean;
  edgeLabels?: boolean;
}

// Graph state management
export interface GraphState {
  data: GraphData | null;
  config: GraphVisualizationConfig;
  filters: GraphFilters;
  focusMode: GraphFocusMode;
  selectedNodes: string[];
  selectedEdges: string[];
  hoveredNode: string | null;
  hoveredEdge: string | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// Hook return types
export interface UseGraphDataReturn {
  data: GraphData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateFilters: (filters: Partial<GraphFilters>) => void;
  exportGraph: (options: GraphExportOptions) => Promise<void>;
}

export interface UseGraphAnalyticsReturn {
  analytics: GraphAnalytics | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Component prop types
export interface GraphVisualizationProps {
  data: GraphData;
  config: Partial<GraphVisualizationConfig>;
  onNodeClick?: (node: GraphNode, event: GraphInteractionEvent) => void;
  onEdgeClick?: (edge: GraphEdge, event: GraphInteractionEvent) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  onEdgeHover?: (edge: GraphEdge | null) => void;
  onBackgroundClick?: (event: GraphInteractionEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}
