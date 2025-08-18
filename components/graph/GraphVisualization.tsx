/**
 * Graph Visualization Component for ThinkSpace
 * 
 * Interactive graph visualization using react-force-graph-2d with comprehensive
 * features including zoom, pan, drag, and dynamic layouts.
 */

'use client';

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Box, Loader, Center, Text } from '@mantine/core';
import type {
  GraphVisualizationProps,
  GraphNode,
  GraphEdge,
  GraphInteractionEvent,
  GraphVisualizationConfig
} from '@/types/graph';
// Helper function to get PARA colors
const getParaColor = (type: string) => {
  switch (type) {
    case 'projects': return '#228be6';
    case 'areas': return '#7950f2';
    case 'resources': return '#51cf66';
    case 'notes': return '#868e96';
    default: return '#868e96';
  }
};

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <Center h="100%">
      <Loader size="lg" color="blue" />
    </Center>
  ),
});

// Default configuration
const defaultConfig: GraphVisualizationConfig = {
  width: 800,
  height: 600,
  layout: 'force',
  nodeSize: {
    min: 8,
    max: 30,
    scale: 'sqrt',
  },
  forceSettings: {
    linkDistance: 100,
    linkStrength: 0.5,
    chargeStrength: -300,
    centerStrength: 0.1,
    collisionRadius: 20,
  },
  showLabels: true,
  showEdgeLabels: false,
  enableZoom: true,
  enablePan: true,
  enableDrag: true,
  colorScheme: {
    projects: getParaColor('projects'),
    areas: getParaColor('areas'),
    resources: getParaColor('resources'),
    notes: '#868e96',
    edges: '#e9ecef',
    background: '#ffffff',
  },
  animationDuration: 1000,
  enableAnimations: true,
  clickToSelect: true,
  hoverEffects: true,
  contextMenuEnabled: true,
};

export function GraphVisualization({
  data,
  config: userConfig = {},
  onNodeClick,
  onEdgeClick,
  onNodeHover,
  onEdgeHover,
  onBackgroundClick,
  className,
  style,
}: GraphVisualizationProps) {
  const graphRef = useRef<any>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());

  // Merge user config with defaults
  const config = { ...defaultConfig, ...userConfig };

  // Transform data for react-force-graph-2d
  const forceGraphData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };

    return {
      nodes: data.nodes,
      links: data.edges.map(edge => ({
        ...edge,
        source: edge.source,
        target: edge.target,
      }))
    };
  }, [data]);

  // Calculate node size based on connection count
  const getNodeSize = useCallback((node: GraphNode): number => {
    const { min, max, scale } = config.nodeSize;
    const connectionCount = node.connectionCount || 1;
    
    let normalizedSize: number;
    switch (scale) {
      case 'log':
        normalizedSize = Math.log(connectionCount + 1) / Math.log(20); // Assuming max 20 connections
        break;
      case 'sqrt':
        normalizedSize = Math.sqrt(connectionCount) / Math.sqrt(20);
        break;
      default:
        normalizedSize = connectionCount / 20;
    }
    
    return Math.max(min, Math.min(max, min + (max - min) * normalizedSize));
  }, [config.nodeSize]);

  // Get node color based on type and state
  const getNodeColor = useCallback((node: GraphNode): string => {
    if (node.highlighted) {
      return '#ff922b'; // Orange for highlighted
    }
    
    if (selectedNodes.has(node.id)) {
      return '#339af0'; // Light blue for selected
    }
    
    // Use type-specific colors
    switch (node.type) {
      case 'project':
        return config.colorScheme.projects;
      case 'area':
        return config.colorScheme.areas;
      case 'resource':
        return config.colorScheme.resources;
      case 'note':
        return config.colorScheme.notes;
      default:
        return '#868e96';
    }
  }, [config.colorScheme, selectedNodes]);

  // Get edge color and width
  const getEdgeColor = useCallback((edge: GraphEdge): string => {
    if (edge.highlighted) {
      return '#ff922b';
    }
    return edge.color || config.colorScheme.edges;
  }, [config.colorScheme.edges]);

  const getEdgeWidth = useCallback((edge: GraphEdge): number => {
    const baseWidth = 1;
    const strengthMultiplier = edge.strength || 1;
    return Math.max(0.5, baseWidth * strengthMultiplier);
  }, []);

  // Handle node interactions
  const handleNodeClick = useCallback((node: GraphNode, event: MouseEvent) => {
    const interactionEvent: GraphInteractionEvent = {
      type: 'node_click',
      nodeId: node.id,
      position: { x: event.clientX, y: event.clientY },
      modifiers: {
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
      },
    };

    // Handle multi-selection with Ctrl/Cmd
    if (event.ctrlKey || event.metaKey) {
      setSelectedNodes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(node.id)) {
          newSet.delete(node.id);
        } else {
          newSet.add(node.id);
        }
        return newSet;
      });
    } else {
      setSelectedNodes(new Set([node.id]));
    }

    onNodeClick?.(node, interactionEvent);
  }, [onNodeClick]);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
    onNodeHover?.(node);
  }, [onNodeHover]);

  const handleEdgeClick = useCallback((edge: GraphEdge, event: MouseEvent) => {
    const interactionEvent: GraphInteractionEvent = {
      type: 'edge_click',
      edgeId: edge.id,
      position: { x: event.clientX, y: event.clientY },
      modifiers: {
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
      },
    };

    onEdgeClick?.(edge, interactionEvent);
  }, [onEdgeClick]);

  const handleEdgeHover = useCallback((edge: GraphEdge | null) => {
    onEdgeHover?.(edge);
  }, [onEdgeHover]);

  const handleBackgroundClick = useCallback((event: MouseEvent) => {
    const interactionEvent: GraphInteractionEvent = {
      type: 'background_click',
      position: { x: event.clientX, y: event.clientY },
      modifiers: {
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
      },
    };

    // Clear selection on background click
    setSelectedNodes(new Set());
    onBackgroundClick?.(interactionEvent);
  }, [onBackgroundClick]);

  // Custom node rendering
  const nodeCanvasObject = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const size = getNodeSize(node);
    const color = getNodeColor(node);
    
    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Draw border for selected/hovered nodes
    if (selectedNodes.has(node.id) || hoveredNode?.id === node.id) {
      ctx.strokeStyle = '#339af0';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Draw label if enabled and zoom level is appropriate
    if (config.showLabels && globalScale > 0.5) {
      const fontSize = Math.max(8, size / 2);
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const label = node.label.length > 15 ? `${node.label.substring(0, 15)}...` : node.label;
      ctx.fillText(label, node.x!, node.y! + size + fontSize + 2);
    }
  }, [config.showLabels, getNodeSize, getNodeColor, selectedNodes, hoveredNode]);

  // Custom edge rendering
  const linkCanvasObject = useCallback((edge: GraphEdge, ctx: CanvasRenderingContext2D) => {
    const source = edge.source as GraphNode;
    const target = edge.target as GraphNode;
    
    if (!source.x || !source.y || !target.x || !target.y) return;
    
    const color = getEdgeColor(edge);
    const width = getEdgeWidth(edge);
    
    // Draw edge line
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    
    // Apply edge style
    if (edge.style === 'dashed') {
      ctx.setLineDash([5, 5]);
    } else if (edge.style === 'dotted') {
      ctx.setLineDash([2, 2]);
    } else {
      ctx.setLineDash([]);
    }
    
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash
    
    // Draw edge label if enabled
    if (config.showEdgeLabels && edge.label) {
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = '#666666';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(edge.label, midX, midY);
    }
  }, [config.showEdgeLabels, getEdgeColor, getEdgeWidth]);

  // Initialize graph when component mounts
  useEffect(() => {
    if (graphRef.current && data) {
      // Configure force simulation
      const graph = graphRef.current;
      
      // Set up forces
      graph.d3Force('link')
        ?.distance(config.forceSettings.linkDistance)
        ?.strength(config.forceSettings.linkStrength);
        
      graph.d3Force('charge')
        ?.strength(config.forceSettings.chargeStrength);
        
      graph.d3Force('center')
        ?.strength(config.forceSettings.centerStrength);
        
      // Add collision force
      graph.d3Force('collision', graph.d3.forceCollide(config.forceSettings.collisionRadius));
      
      // Zoom to fit
      setTimeout(() => {
        graph.zoomToFit(400, 50);
      }, 100);
    }
  }, [data, config.forceSettings]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (graphRef.current) {
        graphRef.current.resizeCanvas();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!data || !data.nodes.length) {
    return (
      <Center h="100%" style={style} className={className}>
        <Text size="lg" c="dimmed">No graph data available</Text>
      </Center>
    );
  }

  return (
    <Box style={{ ...style, position: 'relative' }} className={className}>
      <ForceGraph2D
        ref={graphRef}
        graphData={forceGraphData}
        width={config.width}
        height={config.height}
        backgroundColor={config.colorScheme.background}

        // Node configuration
        nodeId="id"
        nodeLabel={(node: any) => (node as GraphNode).label}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          nodeCanvasObject(node as GraphNode, ctx, globalScale);
        }}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          const size = getNodeSize(node as GraphNode);
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
          ctx.fill();
        }}

        // Edge configuration
        linkCanvasObject={(link: any, ctx: CanvasRenderingContext2D) => {
          linkCanvasObject(link as GraphEdge, ctx);
        }}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.1}

        // Interaction handlers
        onNodeClick={(node: any, event: MouseEvent) => {
          handleNodeClick(node as GraphNode, event);
        }}
        onNodeHover={(node: any) => {
          handleNodeHover(node as GraphNode);
        }}
        onLinkClick={(link: any, event: MouseEvent) => {
          handleEdgeClick(link as GraphEdge, event);
        }}
        onLinkHover={(link: any) => {
          handleEdgeHover(link as GraphEdge);
        }}
        onBackgroundClick={handleBackgroundClick}

        // Controls
        enableZoomInteraction={config.enableZoom}
        enablePanInteraction={config.enablePan}
        enableNodeDrag={config.enableDrag}

        // Performance
        cooldownTicks={100}
        cooldownTime={15000}

        // Warm up
        warmupTicks={100}

        // Other settings
        linkHoverPrecision={10}
        nodeRelSize={1}
      />
    </Box>
  );
}
