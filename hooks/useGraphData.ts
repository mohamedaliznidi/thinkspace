/**
 * Graph Data Management Hook for ThinkSpace
 * 
 * This hook provides comprehensive graph data management including fetching,
 * caching, filtering, and real-time updates for the knowledge graph visualization.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import type { 
  GraphData, 
  GraphFilters, 
  GraphNode, 
  GraphEdge, 
  UseGraphDataReturn,
  GraphExportOptions,
  RelationshipType 
} from '@/types/graph';

interface GraphApiResponse {
  success: boolean;
  data?: GraphData;
  error?: string;
}

interface UseGraphDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableCaching?: boolean;
  initialFilters?: Partial<GraphFilters>;
}

export function useGraphData(options: UseGraphDataOptions = {}): UseGraphDataReturn {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    enableCaching = true,
    initialFilters = {}
  } = options;

  // State management
  const [data, setData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GraphFilters>({
    nodeTypes: ['project', 'area', 'resource', 'note'],
    relationshipTypes: [
      'direct_reference',
      'shared_tag',
      'content_similarity',
      'temporal_proximity',
      'project_area',
      'resource_project',
      'resource_area',
      'note_project',
      'note_area',
      'note_resource'
    ],
    ...initialFilters
  });

  // Debounced filters for API calls
  const [debouncedFilters] = useDebouncedValue(filters, 500);

  // Cache management
  const cacheKey = useMemo(() => {
    return `graph_data_${JSON.stringify(debouncedFilters)}`;
  }, [debouncedFilters]);

  // Fetch graph data from API
  const fetchGraphData = useCallback(async (currentFilters: GraphFilters = filters) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check cache first
      if (enableCaching) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const cachedData = JSON.parse(cached);
            const cacheAge = Date.now() - new Date(cachedData.timestamp).getTime();
            
            // Use cache if less than 5 minutes old
            if (cacheAge < 5 * 60 * 1000) {
              setData(cachedData.data);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            // Invalid cache, continue with API call
          }
        }
      }

      // Build query parameters
      const params = new URLSearchParams();
      
      if (currentFilters.nodeTypes.length < 4) {
        params.append('nodeTypes', currentFilters.nodeTypes.join(','));
      }
      
      if (currentFilters.relationshipTypes.length > 0) {
        params.append('relationshipTypes', currentFilters.relationshipTypes.join(','));
      }
      
      if (currentFilters.searchQuery) {
        params.append('search', currentFilters.searchQuery);
      }
      
      if (currentFilters.dateRange) {
        params.append('startDate', currentFilters.dateRange.start.toISOString());
        params.append('endDate', currentFilters.dateRange.end.toISOString());
      }
      
      if (currentFilters.minConnections !== undefined) {
        params.append('minConnections', currentFilters.minConnections.toString());
      }
      
      if (currentFilters.maxConnections !== undefined) {
        params.append('maxConnections', currentFilters.maxConnections.toString());
      }

      // Make API call
      const response = await fetch(`/api/graph?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: GraphApiResponse = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch graph data');
      }

      // Process and enhance the data
      const processedData = processGraphData(result.data);
      
      setData(processedData);

      // Cache the result
      if (enableCaching) {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: processedData,
          timestamp: new Date().toISOString()
        }));
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      notifications.show({
        title: 'Graph Data Error',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, cacheKey, enableCaching]);

  // Process raw graph data to add computed properties
  const processGraphData = useCallback((rawData: GraphData): GraphData => {
    const { nodes, edges, stats } = rawData;

    // Calculate connection counts for each node
    const connectionCounts = new Map<string, number>();
    edges.forEach(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      
      connectionCounts.set(sourceId, (connectionCounts.get(sourceId) || 0) + 1);
      connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1);
    });

    // Enhance nodes with computed properties
    const enhancedNodes: GraphNode[] = nodes.map(node => ({
      ...node,
      connectionCount: connectionCounts.get(node.id) || 0,
      centralityScore: calculateCentralityScore(node.id, edges),
      clusterGroup: assignClusterGroup(node, edges, nodes),
    }));

    // Enhance edges with computed properties
    const enhancedEdges: GraphEdge[] = edges.map(edge => ({
      ...edge,
      strength: calculateEdgeStrength(edge, enhancedNodes),
    }));

    return {
      nodes: enhancedNodes,
      edges: enhancedEdges,
      stats: {
        ...stats,
        centrality: calculateCentralityMetrics(enhancedNodes, enhancedEdges),
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        version: '1.0',
        filters: filters,
      },
    };
  }, [filters]);

  // Calculate centrality score for a node
  const calculateCentralityScore = useCallback((nodeId: string, edges: GraphEdge[]): number => {
    const connections = edges.filter(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      return sourceId === nodeId || targetId === nodeId;
    });

    // Simple degree centrality with strength weighting
    return connections.reduce((score, edge) => score + edge.strength, 0);
  }, []);

  // Calculate edge strength based on relationship type and node properties
  const calculateEdgeStrength = useCallback((edge: GraphEdge, nodes: GraphNode[]): number => {
    const baseStrength = edge.strength || 1;
    
    // Adjust strength based on relationship type
    const typeMultipliers: Record<RelationshipType, number> = {
      'direct_reference': 1.0,
      'shared_tag': 0.7,
      'content_similarity': 0.8,
      'temporal_proximity': 0.5,
      'project_area': 0.9,
      'resource_project': 0.8,
      'resource_area': 0.7,
      'note_project': 0.6,
      'note_area': 0.5,
      'note_resource': 0.4,
      'custom': 0.6,
    };

    return baseStrength * (typeMultipliers[edge.type] || 0.5);
  }, []);

  // Assign cluster group to nodes (simplified clustering)
  const assignClusterGroup = useCallback((node: GraphNode, edges: GraphEdge[], allNodes: GraphNode[]): string => {
    // Simple clustering based on node type and connections
    const typePrefix = node.type.charAt(0).toUpperCase();
    const connectionHash = edges
      .filter(edge => {
        const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
        return sourceId === node.id || targetId === node.id;
      })
      .map(edge => edge.type)
      .sort()
      .join('');
    
    return `${typePrefix}_${connectionHash.slice(0, 8)}`;
  }, []);

  // Calculate centrality metrics for the entire graph
  const calculateCentralityMetrics = useCallback((nodes: GraphNode[], edges: GraphEdge[]) => {
    const mostConnected = nodes
      .sort((a, b) => b.connectionCount - a.connectionCount)
      .slice(0, 10)
      .map(node => ({
        nodeId: node.id,
        connections: node.connectionCount,
        score: node.centralityScore || 0,
      }));

    // Simple cluster detection based on cluster groups
    const clusterGroups = new Map<string, GraphNode[]>();
    nodes.forEach(node => {
      if (node.clusterGroup) {
        if (!clusterGroups.has(node.clusterGroup)) {
          clusterGroups.set(node.clusterGroup, []);
        }
        clusterGroups.get(node.clusterGroup)!.push(node);
      }
    });

    const clusters = Array.from(clusterGroups.entries())
      .filter(([_, nodes]) => nodes.length > 1)
      .map(([id, clusterNodes]) => ({
        id,
        nodeCount: clusterNodes.length,
        density: calculateClusterDensity(clusterNodes, edges),
      }));

    return {
      mostConnected,
      clusters,
    };
  }, []);

  // Calculate density within a cluster
  const calculateClusterDensity = useCallback((clusterNodes: GraphNode[], edges: GraphEdge[]): number => {
    const nodeIds = new Set(clusterNodes.map(n => n.id));
    const internalEdges = edges.filter(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });

    const maxPossibleEdges = (clusterNodes.length * (clusterNodes.length - 1)) / 2;
    return maxPossibleEdges > 0 ? internalEdges.length / maxPossibleEdges : 0;
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<GraphFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Export graph data
  const exportGraph = useCallback(async (options: GraphExportOptions) => {
    if (!data) {
      notifications.show({
        title: 'Export Error',
        message: 'No graph data available to export',
        color: 'red',
      });
      return;
    }

    try {
      const response = await fetch('/api/graph/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          options,
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `graph_export.${options.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notifications.show({
        title: 'Export Successful',
        message: `Graph exported as ${options.format.toUpperCase()}`,
        color: 'green',
      });

    } catch (err) {
      notifications.show({
        title: 'Export Error',
        message: 'Failed to export graph data',
        color: 'red',
      });
    }
  }, [data]);

  // Refetch data
  const refetch = useCallback(async () => {
    await fetchGraphData(filters);
  }, [fetchGraphData, filters]);

  // Initial data fetch
  useEffect(() => {
    fetchGraphData(debouncedFilters);
  }, [debouncedFilters]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchGraphData(filters);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchGraphData, filters]);

  return {
    data,
    isLoading,
    error,
    refetch,
    updateFilters,
    exportGraph,
  };
}
