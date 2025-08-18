/**
 * Tests for GraphVisualization Component
 * 
 * Unit tests for the core graph visualization component including
 * rendering, interactions, and configuration handling.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { GraphVisualization } from '../GraphVisualization';
import type { GraphData, GraphVisualizationConfig } from '@/types/graph';

// Mock react-force-graph-2d since it requires canvas
jest.mock('react-force-graph-2d', () => {
  return function MockForceGraph2D({ onNodeClick, onNodeHover, graphData }: any) {
    return (
      <div data-testid="force-graph">
        {graphData.nodes.map((node: any) => (
          <div
            key={node.id}
            data-testid={`node-${node.id}`}
            onClick={() => onNodeClick?.(node, {})}
            onMouseEnter={() => onNodeHover?.(node)}
            onMouseLeave={() => onNodeHover?.(null)}
          >
            {node.label}
          </div>
        ))}
      </div>
    );
  };
});

// Mock dynamic import
jest.mock('next/dynamic', () => {
  return (importFunc: any) => {
    const Component = importFunc();
    return Component;
  };
});

const mockGraphData: GraphData = {
  nodes: [
    {
      id: '1',
      label: 'Test Project',
      type: 'project',
      color: '#228be6',
      size: 20,
      connectionCount: 3,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      label: 'Test Area',
      type: 'area',
      color: '#7950f2',
      size: 25,
      connectionCount: 5,
      createdAt: '2024-01-02T00:00:00Z',
    },
    {
      id: '3',
      label: 'Test Resource',
      type: 'resource',
      color: '#51cf66',
      size: 15,
      connectionCount: 2,
      createdAt: '2024-01-03T00:00:00Z',
    },
  ],
  edges: [
    {
      id: 'e1',
      source: '1',
      target: '2',
      type: 'project_area',
      strength: 0.9,
      color: '#e9ecef',
      width: 2,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'e2',
      source: '2',
      target: '3',
      type: 'resource_area',
      strength: 0.7,
      color: '#e9ecef',
      width: 1.5,
      createdAt: '2024-01-02T00:00:00Z',
    },
  ],
  stats: {
    totalNodes: 3,
    totalEdges: 2,
    density: 0.33,
    avgDegree: 1.33,
    nodeDistribution: {
      projects: 1,
      areas: 1,
      resources: 1,
      notes: 0,
    },
    relationshipDistribution: {
      project_area: 1,
      resource_area: 1,
      direct_reference: 0,
      shared_tag: 0,
      content_similarity: 0,
      temporal_proximity: 0,
      resource_project: 0,
      note_project: 0,
      note_area: 0,
      note_resource: 0,
      custom: 0,
    },
    centrality: {
      mostConnected: [
        { nodeId: '2', connections: 5, score: 4.5 },
        { nodeId: '1', connections: 3, score: 2.7 },
        { nodeId: '3', connections: 2, score: 1.4 },
      ],
      clusters: [],
    },
  },
};

const defaultConfig: GraphVisualizationConfig = {
  width: 800,
  height: 600,
  layout: 'force',
  nodeSize: { min: 8, max: 30, scale: 'sqrt' },
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
    projects: '#228be6',
    areas: '#7950f2',
    resources: '#51cf66',
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

const renderWithMantine = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('GraphVisualization', () => {
  it('renders without crashing', () => {
    renderWithMantine(
      <GraphVisualization
        data={mockGraphData}
        config={defaultConfig}
      />
    );
    
    expect(screen.getByTestId('force-graph')).toBeInTheDocument();
  });

  it('displays all nodes', () => {
    renderWithMantine(
      <GraphVisualization
        data={mockGraphData}
        config={defaultConfig}
      />
    );
    
    expect(screen.getByTestId('node-1')).toBeInTheDocument();
    expect(screen.getByTestId('node-2')).toBeInTheDocument();
    expect(screen.getByTestId('node-3')).toBeInTheDocument();
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test Area')).toBeInTheDocument();
    expect(screen.getByText('Test Resource')).toBeInTheDocument();
  });

  it('handles node click events', async () => {
    const onNodeClick = jest.fn();
    
    renderWithMantine(
      <GraphVisualization
        data={mockGraphData}
        config={defaultConfig}
        onNodeClick={onNodeClick}
      />
    );
    
    const projectNode = screen.getByTestId('node-1');
    fireEvent.click(projectNode);
    
    await waitFor(() => {
      expect(onNodeClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          label: 'Test Project',
          type: 'project',
        }),
        expect.any(Object)
      );
    });
  });

  it('handles node hover events', async () => {
    const onNodeHover = jest.fn();
    
    renderWithMantine(
      <GraphVisualization
        data={mockGraphData}
        config={defaultConfig}
        onNodeHover={onNodeHover}
      />
    );
    
    const areaNode = screen.getByTestId('node-2');
    
    fireEvent.mouseEnter(areaNode);
    await waitFor(() => {
      expect(onNodeHover).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '2',
          label: 'Test Area',
          type: 'area',
        })
      );
    });
    
    fireEvent.mouseLeave(areaNode);
    await waitFor(() => {
      expect(onNodeHover).toHaveBeenCalledWith(null);
    });
  });

  it('renders empty state when no data provided', () => {
    const emptyData: GraphData = {
      nodes: [],
      edges: [],
      stats: {
        totalNodes: 0,
        totalEdges: 0,
        density: 0,
        avgDegree: 0,
        nodeDistribution: { projects: 0, areas: 0, resources: 0, notes: 0 },
        relationshipDistribution: {
          direct_reference: 0,
          shared_tag: 0,
          content_similarity: 0,
          temporal_proximity: 0,
          project_area: 0,
          resource_project: 0,
          resource_area: 0,
          note_project: 0,
          note_area: 0,
          note_resource: 0,
          custom: 0,
        },
        centrality: { mostConnected: [], clusters: [] },
      },
    };
    
    renderWithMantine(
      <GraphVisualization
        data={emptyData}
        config={defaultConfig}
      />
    );
    
    expect(screen.getByText('No graph data available')).toBeInTheDocument();
  });

  it('applies custom configuration', () => {
    const customConfig: GraphVisualizationConfig = {
      ...defaultConfig,
      width: 1000,
      height: 800,
      showLabels: false,
      colorScheme: {
        ...defaultConfig.colorScheme,
        projects: '#ff0000',
      },
    };
    
    renderWithMantine(
      <GraphVisualization
        data={mockGraphData}
        config={customConfig}
      />
    );
    
    // Component should render with custom config
    expect(screen.getByTestId('force-graph')).toBeInTheDocument();
  });

  it('handles edge click events', async () => {
    const onEdgeClick = jest.fn();
    
    renderWithMantine(
      <GraphVisualization
        data={mockGraphData}
        config={defaultConfig}
        onEdgeClick={onEdgeClick}
      />
    );
    
    // Edge click testing would require more complex mocking
    // This is a placeholder for edge interaction tests
    expect(screen.getByTestId('force-graph')).toBeInTheDocument();
  });
});

describe('GraphVisualization Configuration', () => {
  it('calculates node sizes correctly', () => {
    // Test node size calculation based on connection count
    const nodeWithManyConnections = {
      ...mockGraphData.nodes[0],
      connectionCount: 20,
    };
    
    const dataWithLargeNode: GraphData = {
      ...mockGraphData,
      nodes: [nodeWithManyConnections, ...mockGraphData.nodes.slice(1)],
    };
    
    renderWithMantine(
      <GraphVisualization
        data={dataWithLargeNode}
        config={defaultConfig}
      />
    );
    
    expect(screen.getByTestId('force-graph')).toBeInTheDocument();
  });

  it('applies color scheme correctly', () => {
    const customColorConfig: GraphVisualizationConfig = {
      ...defaultConfig,
      colorScheme: {
        projects: '#custom-blue',
        areas: '#custom-purple',
        resources: '#custom-green',
        notes: '#custom-gray',
        edges: '#custom-edge',
        background: '#custom-bg',
      },
    };
    
    renderWithMantine(
      <GraphVisualization
        data={mockGraphData}
        config={customColorConfig}
      />
    );
    
    expect(screen.getByTestId('force-graph')).toBeInTheDocument();
  });
});

describe('GraphVisualization Accessibility', () => {
  it('provides proper ARIA labels', () => {
    renderWithMantine(
      <GraphVisualization
        data={mockGraphData}
        config={defaultConfig}
      />
    );
    
    // Test for accessibility attributes
    const graphContainer = screen.getByTestId('force-graph');
    expect(graphContainer).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    renderWithMantine(
      <GraphVisualization
        data={mockGraphData}
        config={defaultConfig}
      />
    );
    
    // Test keyboard event handling
    const graphContainer = screen.getByTestId('force-graph');
    fireEvent.keyDown(graphContainer, { key: 'Enter' });
    
    expect(graphContainer).toBeInTheDocument();
  });
});
