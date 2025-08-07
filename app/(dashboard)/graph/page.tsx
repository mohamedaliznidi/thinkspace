/**
 * Knowledge Graph Page for ThinkSpace
 * 
 * This page provides an interactive visualization of the knowledge graph
 * showing relationships between projects, areas, resources, and notes.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Stack,
  Title,
  Group,
  Button,
  Card,
  Text,
  Select,
  ActionIcon,
  Badge,
  Alert,
  Center,
  Loader,
  Paper,
  Grid,
  Switch,
} from '@mantine/core';
import {
  IconNetwork,
  IconZoomIn,
  IconZoomOut,
  IconRefresh,
  IconSettings,
  IconAlertTriangle,
  IconTarget,
  IconMap,
  IconBookmark,
  IconNote,
} from '@tabler/icons-react';

interface GraphNode {
  id: string;
  label: string;
  type: 'project' | 'area' | 'resource' | 'note';
  color: string;
  size: number;
  x?: number;
  y?: number;
}

interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type: string;
  label: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    nodeTypes: {
      projects: number;
      areas: number;
      resources: number;
      notes: number;
    };
  };
}

export default function GraphPage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<string>('');
  const [showLabels, setShowLabels] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch graph data
  const fetchGraphData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(selectedNodeType && { type: selectedNodeType }),
      });

      const response = await fetch(`/api/graph?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setGraphData(data.data);
        setError(null);
      } else {
        throw new Error('Failed to fetch graph data');
      }
    } catch (error) {
      console.error('Error fetching graph data:', error);
      setError('Failed to load graph data');
    } finally {
      setLoading(false);
    }
  };

  // Simple canvas-based graph visualization
  const drawGraph = () => {
    if (!graphData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { nodes, edges } = graphData;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.3;

    // Position nodes in a circle (simple layout)
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
    });

    // Draw edges
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      
      if (fromNode && toNode && fromNode.x && fromNode.y && toNode.x && toNode.y) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      if (!node.x || !node.y) return;

      // Draw node circle
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
      ctx.fill();

      // Draw node border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw labels if enabled
      if (showLabels) {
        ctx.fillStyle = '#000000';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label,
          node.x,
          node.y + node.size + 15
        );
      }
    });
  };

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!graphData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked node
    const clickedNode = graphData.nodes.find(node => {
      if (!node.x || !node.y) return false;
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= node.size;
    });

    setSelectedNode(clickedNode || null);
  };

  useEffect(() => {
    fetchGraphData();
  }, [selectedNodeType]);

  useEffect(() => {
    if (graphData) {
      drawGraph();
    }
  }, [graphData, showLabels]);

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case 'project': return <IconTarget size="1rem" />;
      case 'area': return <IconMap size="1rem" />;
      case 'resource': return <IconBookmark size="1rem" />;
      case 'note': return <IconNote size="1rem" />;
      default: return <IconNetwork size="1rem" />;
    }
  };

  if (loading) {
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
            Visualize connections between your projects, areas, resources, and notes
          </Text>
        </div>
        
        <Group gap="sm">
          <ActionIcon variant="outline" onClick={fetchGraphData}>
            <IconRefresh size="1rem" />
          </ActionIcon>
          <ActionIcon variant="outline">
            <IconZoomIn size="1rem" />
          </ActionIcon>
          <ActionIcon variant="outline">
            <IconZoomOut size="1rem" />
          </ActionIcon>
        </Group>
      </Group>

      <Grid>
        {/* Controls */}
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Stack gap="md">
            {/* Filters */}
            <Card padding="md" radius="md" withBorder>
              <Stack gap="sm">
                <Text fw={600} size="sm">Filters</Text>
                
                <Select
                  label="Node Type"
                  placeholder="All types"
                  data={[
                    { value: '', label: 'All Types' },
                    { value: 'project', label: 'Projects' },
                    { value: 'area', label: 'Areas' },
                    { value: 'resource', label: 'Resources' },
                    { value: 'note', label: 'Notes' },
                  ]}
                  value={selectedNodeType}
                  onChange={(value) => setSelectedNodeType(value || '')}
                />

                <Switch
                  label="Show Labels"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.currentTarget.checked)}
                />
              </Stack>
            </Card>

            {/* Statistics */}
            {graphData && (
              <Card padding="md" radius="md" withBorder>
                <Stack gap="sm">
                  <Text fw={600} size="sm">Statistics</Text>
                  
                  <Group justify="space-between">
                    <Text size="sm">Total Nodes</Text>
                    <Badge variant="light">{graphData.stats.totalNodes}</Badge>
                  </Group>
                  
                  <Group justify="space-between">
                    <Text size="sm">Total Connections</Text>
                    <Badge variant="light">{graphData.stats.totalEdges}</Badge>
                  </Group>

                  <Stack gap="xs" mt="sm">
                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconTarget size="0.8rem" color="var(--mantine-color-blue-6)" />
                        <Text size="xs">Projects</Text>
                      </Group>
                      <Text size="xs">{graphData.stats.nodeTypes.projects}</Text>
                    </Group>
                    
                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconMap size="0.8rem" color="var(--mantine-color-purple-6)" />
                        <Text size="xs">Areas</Text>
                      </Group>
                      <Text size="xs">{graphData.stats.nodeTypes.areas}</Text>
                    </Group>
                    
                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconBookmark size="0.8rem" color="var(--mantine-color-green-6)" />
                        <Text size="xs">Resources</Text>
                      </Group>
                      <Text size="xs">{graphData.stats.nodeTypes.resources}</Text>
                    </Group>
                    
                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconNote size="0.8rem" color="var(--mantine-color-gray-6)" />
                        <Text size="xs">Notes</Text>
                      </Group>
                      <Text size="xs">{graphData.stats.nodeTypes.notes}</Text>
                    </Group>
                  </Stack>
                </Stack>
              </Card>
            )}

            {/* Selected Node Details */}
            {selectedNode && (
              <Card padding="md" radius="md" withBorder>
                <Stack gap="sm">
                  <Group gap="xs">
                    {getNodeTypeIcon(selectedNode.type)}
                    <Text fw={600} size="sm">Selected Node</Text>
                  </Group>
                  
                  <Text size="sm">{selectedNode.label}</Text>
                  <Badge size="sm" variant="light" color={selectedNode.color}>
                    {selectedNode.type}
                  </Badge>
                </Stack>
              </Card>
            )}
          </Stack>
        </Grid.Col>

        {/* Graph Visualization */}
        <Grid.Col span={{ base: 12, md: 9 }}>
          <Card padding="md" radius="md" withBorder style={{ height: '600px' }}>
            {graphData && graphData.nodes.length > 0 ? (
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                style={{
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer',
                }}
              />
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
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
