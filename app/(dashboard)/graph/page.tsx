/**
 * Knowledge Graph Page for ThinkSpace
 *
 * Comprehensive interactive visualization of the knowledge graph with advanced
 * features including analytics, relationship management, and visual search.
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Stack,
  Title,
  Group,
  Card,
  Text,
  ActionIcon,
  Alert,
  Center,
  Loader,
  SegmentedControl,
  Drawer,
  Button,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconNetwork,
  IconRefresh,
  IconSettings,
  IconAlertTriangle,
  IconChartDots,
  IconAdjustments,
  IconSearch,
  IconShare,
} from '@tabler/icons-react';
import {
  GraphVisualization,
  GraphNavigation,
  RelationshipManager,
  GraphAnalyticsDashboard,
  GraphAdvancedFeatures,
  useGraphLayout,
} from '@/components/graph';
import { GraphResponsiveWrapper } from '@/components/graph/GraphResponsiveWrapper';
import { useGraphData } from '@/hooks/useGraphData';
import type {
  GraphLayout,
  GraphFocusMode,
  GraphVisualizationConfig,
  GraphInteractionEvent,
  GraphNode,
  GraphEdge,
  GraphSearchResult,
  GraphExportOptions,
  GraphAnalytics,
} from '@/types/graph';

export default function GraphPage() {
  // State management
  const [layout, setLayout] = useState<GraphLayout>('force');
  const [focusMode, setFocusMode] = useState<GraphFocusMode>('overview');
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<GraphAnalytics | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  // Drawer states
  const [navigationDrawerOpened, { open: openNavigationDrawer, close: closeNavigationDrawer }] = useDisclosure(false);
  const [relationshipDrawerOpened, { open: openRelationshipDrawer, close: closeRelationshipDrawer }] = useDisclosure(false);
  const [analyticsDrawerOpened, { open: openAnalyticsDrawer, close: closeAnalyticsDrawer }] = useDisclosure(false);
  const [advancedDrawerOpened, { open: openAdvancedDrawer, close: closeAdvancedDrawer }] = useDisclosure(false);

  // Graph data and layout management
  const { data, isLoading, error, refetch, updateFilters, exportGraph } = useGraphData({
    autoRefresh: true,
    refreshInterval: 60000, // 1 minute
  });

  const { applyLayout, availableLayouts } = useGraphLayout();

  // Graph configuration
  const [config, setConfig] = useState<GraphVisualizationConfig>({
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
  });

  // Apply layout to graph data
  const processedData = useMemo(() => {
    if (!data) return null;
    return applyLayout(data, layout);
  }, [data, layout, applyLayout]);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    if (!data) return;

    setIsAnalyticsLoading(true);
    try {
      const response = await fetch('/api/graph/analytics');
      if (response.ok) {
        const result = await response.json();
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, [data]);

  // Event handlers
  const handleNodeClick = useCallback((node: GraphNode, event: GraphInteractionEvent) => {
    if (event.modifiers?.ctrl) {
      // Multi-select with Ctrl
      setSelectedNodes(prev =>
        prev.includes(node.id)
          ? prev.filter(id => id !== node.id)
          : [...prev, node.id]
      );
    } else {
      setSelectedNodes([node.id]);
    }
  }, []);

  const handleEdgeClick = useCallback((edge: GraphEdge, event: GraphInteractionEvent) => {
    setSelectedEdges([edge.id]);
  }, []);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node?.id || null);
  }, []);

  const handleConfigChange = useCallback((newConfig: Partial<GraphVisualizationConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const handleZoomToFit = useCallback(() => {
    // This would be handled by the graph visualization component
  }, []);

  const handleZoomToNode = useCallback((nodeId: string) => {
    // This would be handled by the graph visualization component
  }, []);

  // Search functionality
  const handleSearch = useCallback(async (query: string): Promise<GraphSearchResult> => {
    // Mock implementation - would call actual search API
    const filteredNodes = data?.nodes.filter(node =>
      node.label.toLowerCase().includes(query.toLowerCase())
    ) || [];

    const filteredEdges = data?.edges.filter(edge =>
      edge.label?.toLowerCase().includes(query.toLowerCase())
    ) || [];

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      query,
      totalResults: filteredNodes.length + filteredEdges.length,
    };
  }, [data]);

  // Node highlighting
  const handleNodeHighlight = useCallback((nodeIds: string[]) => {
    // Update highlighted nodes in the graph
    setSelectedNodes(nodeIds);
  }, []);

  const handleEdgeHighlight = useCallback((edgeIds: string[]) => {
    setSelectedEdges(edgeIds);
  }, []);

  // Fetch analytics on data change
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading) {
    return (
      <Center h="50vh">
        <Stack gap="md" align="center">
          <Loader size="lg" color="blue" />
          <Text size="sm" c="dimmed">Loading knowledge graph...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Error" icon={<IconAlertTriangle size="1rem" />}>
        {error}
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={1} c="blue">
            Knowledge Graph
          </Title>
          <Text c="dimmed" size="sm">
            Interactive visualization of your knowledge network with advanced analytics
          </Text>
        </div>

        <Group gap="sm">
          <ActionIcon variant="outline" onClick={refetch}>
            <IconRefresh size="1rem" />
          </ActionIcon>
          <ActionIcon variant="outline" onClick={openNavigationDrawer}>
            <IconSettings size="1rem" />
          </ActionIcon>
          <ActionIcon variant="outline" onClick={openAnalyticsDrawer}>
            <IconChartDots size="1rem" />
          </ActionIcon>
          <ActionIcon variant="outline" onClick={openAdvancedDrawer}>
            <IconSearch size="1rem" />
          </ActionIcon>
        </Group>
      </Group>

      {/* Layout Controls */}
      <Card padding="md" radius="md" withBorder>
        <Group justify="space-between" align="center">
          <Group gap="md">
            <Text fw={600} size="sm">Layout:</Text>
            <SegmentedControl
              value={layout}
              onChange={(value) => setLayout(value as GraphLayout)}
              data={availableLayouts.map(({ key, engine }) => ({
                value: key,
                label: engine.name,
              }))}
              size="sm"
            />
          </Group>

          <Group gap="sm">
            <Button
              variant="light"
              size="xs"
              leftSection={<IconAdjustments size="0.8rem" />}
              onClick={openRelationshipDrawer}
            >
              Relationships
            </Button>
            <Button
              variant="light"
              size="xs"
              leftSection={<IconShare size="0.8rem" />}
              onClick={openAdvancedDrawer}
            >
              Share & Export
            </Button>
          </Group>
        </Group>
      </Card>

      {/* Main Graph Visualization */}
      <Card padding="md" radius="md" withBorder style={{ height: '70vh' }}>
        {processedData ? (
          <GraphResponsiveWrapper
            data={processedData}
            config={config}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onNodeHover={handleNodeHover}
            enableAccessibility={true}
            enableKeyboardNavigation={true}
            enableScreenReader={true}
          >
            <GraphVisualization
              data={processedData}
              config={config}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onNodeHover={handleNodeHover}
              style={{ width: '100%', height: '100%' }}
            />
          </GraphResponsiveWrapper>
        ) : (
          <Center h="100%">
            <Stack gap="md" align="center">
              <IconNetwork size="3rem" color="var(--mantine-color-gray-5)" />
              <Text size="lg" fw={500}>No graph data available</Text>
              <Text size="sm" c="dimmed" ta="center">
                Create some projects, areas, resources, and notes to see connections
              </Text>
            </Stack>
          </Center>
        )}
      </Card>

      {/* Navigation Drawer */}
      <Drawer
        opened={navigationDrawerOpened}
        onClose={closeNavigationDrawer}
        title="Graph Navigation"
        position="left"
        size="md"
      >
        {processedData && (
          <GraphNavigation
            data={processedData}
            selectedNodes={selectedNodes}
            hoveredNode={hoveredNode}
            focusMode={focusMode}
            onNodeSelect={setSelectedNodes}
            onFocusModeChange={setFocusMode}
            onNodeAction={(action, nodeId) => {
              // Handle node actions
              console.log('Node action:', action, nodeId);
            }}
            onZoomToNode={handleZoomToNode}
            onZoomToFit={handleZoomToFit}
            onShowPath={(startId, endId) => {
              // Handle path finding
              console.log('Show path:', startId, endId);
            }}
          />
        )}
      </Drawer>

      {/* Relationship Management Drawer */}
      <Drawer
        opened={relationshipDrawerOpened}
        onClose={closeRelationshipDrawer}
        title="Relationship Management"
        position="right"
        size="lg"
      >
        {processedData && (
          <RelationshipManager
            data={processedData}
            selectedNodes={selectedNodes}
            onUpdateRelationship={(edgeId, updates) => {
              // Handle relationship updates
              console.log('Update relationship:', edgeId, updates);
            }}
            onCreateRelationship={(relationship) => {
              // Handle relationship creation
              console.log('Create relationship:', relationship);
            }}
            onDeleteRelationship={(edgeId) => {
              // Handle relationship deletion
              console.log('Delete relationship:', edgeId);
            }}
            onFilterChange={(filters) => {
              // Handle filter changes
              console.log('Filter change:', filters);
            }}
          />
        )}
      </Drawer>

      {/* Analytics Dashboard Drawer */}
      <Drawer
        opened={analyticsDrawerOpened}
        onClose={closeAnalyticsDrawer}
        title="Graph Analytics"
        position="right"
        size="xl"
      >
        {processedData && (
          <GraphAnalyticsDashboard
            data={processedData}
            analytics={analytics}
            isLoading={isAnalyticsLoading}
            onRefresh={fetchAnalytics}
            onNodeFocus={handleZoomToNode}
            onExportAnalytics={() => {
              // Handle analytics export
              console.log('Export analytics');
            }}
          />
        )}
      </Drawer>

      {/* Advanced Features Drawer */}
      <Drawer
        opened={advancedDrawerOpened}
        onClose={closeAdvancedDrawer}
        title="Advanced Features"
        position="right"
        size="md"
      >
        {processedData && (
          <GraphAdvancedFeatures
            data={processedData}
            config={config}
            onSearch={handleSearch}
            onExport={exportGraph}
            onConfigChange={handleConfigChange}
            onNodeHighlight={handleNodeHighlight}
            onEdgeHighlight={handleEdgeHighlight}
            onZoomToFit={handleZoomToFit}
            onZoomToNode={handleZoomToNode}
            onRefresh={refetch}
          />
        )}
      </Drawer>
    </Stack>
  );
}
