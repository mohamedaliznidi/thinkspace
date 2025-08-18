/**
 * Graph Analytics Dashboard for ThinkSpace
 * 
 * Comprehensive analytics dashboard with pattern recognition, insights,
 * and graph statistics using Mantine charts and components.
 */

'use client';

import React, { useMemo, useState } from 'react';
import {
  Stack,
  Group,
  Card,
  Text,
  Badge,
  SimpleGrid,
  Progress,
  RingProgress,
  Tabs,
  Alert,
  ActionIcon,
  Tooltip,
  ScrollArea,
  Table,
  UnstyledButton,
  Box,
  Center,
  Loader,
} from '@mantine/core';
import {
  AreaChart,
  BarChart,
  LineChart,
  DonutChart,
} from '@mantine/charts';
import {
  IconTrendingUp,
  IconNetwork,
  IconTarget,
  IconMap,
  IconBookmark,
  IconNote,
  IconAlertTriangle,
  IconBulb,
  IconRefresh,
  IconDownload,
  IconEye,
  IconChartDots,
  IconCircles,
  IconRoute,
} from '@tabler/icons-react';
import { format, subDays, startOfDay } from 'date-fns';
import type { GraphData, GraphAnalytics, GraphNode, GraphEdge } from '@/types/graph';

interface GraphAnalyticsDashboardProps {
  data: GraphData;
  analytics: GraphAnalytics | null;
  isLoading: boolean;
  onRefresh: () => void;
  onNodeFocus: (nodeId: string) => void;
  onExportAnalytics: () => void;
}

interface PatternInsight {
  id: string;
  type: 'knowledge_hub' | 'isolated_cluster' | 'orphaned_content' | 'trending_connection';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  nodeIds: string[];
  actionable: boolean;
}

// Pattern recognition component
function PatternRecognition({ 
  data, 
  analytics, 
  onNodeFocus 
}: { 
  data: GraphData; 
  analytics: GraphAnalytics | null; 
  onNodeFocus: (nodeId: string) => void;
}) {
  const insights = useMemo((): PatternInsight[] => {
    if (!analytics) return [];

    const patterns: PatternInsight[] = [];

    // Knowledge hubs (highly connected nodes)
    analytics.patterns.knowledgeHubs.forEach(hub => {
      if (hub.connections > 10) {
        patterns.push({
          id: `hub_${hub.nodeId}`,
          type: 'knowledge_hub',
          title: `Knowledge Hub: ${hub.label}`,
          description: `This ${hub.type} has ${hub.connections} connections and high influence (${hub.influence.toFixed(2)})`,
          severity: 'low',
          nodeIds: [hub.nodeId],
          actionable: true,
        });
      }
    });

    // Isolated clusters
    analytics.patterns.isolatedClusters.forEach(cluster => {
      if (cluster.externalConnections === 0 && cluster.nodeCount > 3) {
        patterns.push({
          id: `cluster_${cluster.clusterId}`,
          type: 'isolated_cluster',
          title: `Isolated Cluster`,
          description: `Found ${cluster.nodeCount} nodes with no external connections`,
          severity: 'medium',
          nodeIds: [], // Would need cluster node IDs
          actionable: true,
        });
      }
    });

    // Orphaned content
    analytics.patterns.orphanedNodes.forEach(orphan => {
      patterns.push({
        id: `orphan_${orphan.nodeId}`,
        type: 'orphaned_content',
        title: `Orphaned ${orphan.type}: ${orphan.label}`,
        description: `No connections found. Last activity: ${format(new Date(orphan.lastActivity), 'MMM dd, yyyy')}`,
        severity: 'high',
        nodeIds: [orphan.nodeId],
        actionable: true,
      });
    });

    return patterns;
  }, [analytics]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'knowledge_hub': return <IconTarget size="1rem" />;
      case 'isolated_cluster': return <IconCircles size="1rem" />;
      case 'orphaned_content': return <IconAlertTriangle size="1rem" />;
      case 'trending_connection': return <IconTrendingUp size="1rem" />;
      default: return <IconBulb size="1rem" />;
    }
  };

  return (
    <Card padding="md" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={600} size="sm">Pattern Recognition</Text>
          <Badge variant="light" color="blue">
            {insights.length} insights
          </Badge>
        </Group>

        <ScrollArea style={{ height: 300 }}>
          <Stack gap="sm">
            {insights.length === 0 ? (
              <Center py="xl">
                <Text size="sm" c="dimmed">No patterns detected</Text>
              </Center>
            ) : (
              insights.map(insight => (
                <Alert
                  key={insight.id}
                  icon={getPatternIcon(insight.type)}
                  color={getSeverityColor(insight.severity)}
                  variant="light"
                >
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Text fw={500} size="sm">{insight.title}</Text>
                      <Text size="xs" c="dimmed" mt={2}>
                        {insight.description}
                      </Text>
                    </div>
                    {insight.actionable && insight.nodeIds.length > 0 && (
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => onNodeFocus(insight.nodeIds[0])}
                      >
                        <IconEye size="0.8rem" />
                      </ActionIcon>
                    )}
                  </Group>
                </Alert>
              ))
            )}
          </Stack>
        </ScrollArea>
      </Stack>
    </Card>
  );
}

// Network statistics component
function NetworkStatistics({ data, analytics }: { data: GraphData; analytics: GraphAnalytics | null }) {
  const stats = useMemo(() => {
    if (!analytics) return null;

    const nodeTypeData = [
      { name: 'Projects', value: analytics.overview.totalNodes > 0 ? data.stats.nodeDistribution.projects : 0, color: '#228be6' },
      { name: 'Areas', value: analytics.overview.totalNodes > 0 ? data.stats.nodeDistribution.areas : 0, color: '#7950f2' },
      { name: 'Resources', value: analytics.overview.totalNodes > 0 ? data.stats.nodeDistribution.resources : 0, color: '#51cf66' },
      { name: 'Notes', value: analytics.overview.totalNodes > 0 ? data.stats.nodeDistribution.notes : 0, color: '#868e96' },
    ];

    const connectionData = data.edges.reduce((acc, edge) => {
      const month = format(new Date(edge.createdAt), 'MMM yyyy');
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const connectionGrowthData = Object.entries(connectionData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([month, count]) => ({ month, connections: count }));

    return {
      nodeTypeData,
      connectionGrowthData,
      density: analytics.overview.density,
      avgConnections: analytics.overview.avgConnectionsPerNode,
    };
  }, [data, analytics]);

  if (!stats) return <Loader size="sm" />;

  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
      {/* Node Distribution */}
      <Card padding="md" radius="md" withBorder>
        <Stack gap="md">
          <Text fw={600} size="sm">Node Distribution</Text>
          <DonutChart
            data={stats.nodeTypeData}
            size={160}
            thickness={30}
            withLabelsLine
            withLabels
          />
        </Stack>
      </Card>

      {/* Connection Growth */}
      <Card padding="md" radius="md" withBorder>
        <Stack gap="md">
          <Text fw={600} size="sm">Connection Growth</Text>
          {stats.connectionGrowthData.length > 0 ? (
            <AreaChart
              h={160}
              data={stats.connectionGrowthData}
              dataKey="month"
              series={[{ name: 'connections', color: 'blue.6' }]}
              curveType="linear"
            />
          ) : (
            <Center h={160}>
              <Text size="sm" c="dimmed">No connection data</Text>
            </Center>
          )}
        </Stack>
      </Card>

      {/* Network Metrics */}
      <Card padding="md" radius="md" withBorder>
        <Stack gap="md">
          <Text fw={600} size="sm">Network Metrics</Text>
          <SimpleGrid cols={2}>
            <div>
              <Text size="xs" c="dimmed">Density</Text>
              <Text fw={600} size="lg">{(stats.density * 100).toFixed(1)}%</Text>
              <Progress value={stats.density * 100} size="xs" mt={4} />
            </div>
            <div>
              <Text size="xs" c="dimmed">Avg Connections</Text>
              <Text fw={600} size="lg">{stats.avgConnections.toFixed(1)}</Text>
            </div>
          </SimpleGrid>
        </Stack>
      </Card>

      {/* Top Connected Nodes */}
      <Card padding="md" radius="md" withBorder>
        <Stack gap="md">
          <Text fw={600} size="sm">Most Connected</Text>
          <ScrollArea style={{ height: 120 }}>
            <Stack gap="xs">
              {analytics?.patterns.knowledgeHubs.slice(0, 5).map(hub => (
                <Group key={hub.nodeId} justify="space-between">
                  <Group gap="xs">
                    <Badge size="xs" variant="light">
                      {hub.type}
                    </Badge>
                    <Text size="sm" truncate style={{ maxWidth: 120 }}>
                      {hub.label}
                    </Text>
                  </Group>
                  <Text size="sm" fw={500}>
                    {hub.connections}
                  </Text>
                </Group>
              ))}
            </Stack>
          </ScrollArea>
        </Stack>
      </Card>
    </SimpleGrid>
  );
}

// Trends analysis component
function TrendsAnalysis({ analytics }: { analytics: GraphAnalytics | null }) {
  if (!analytics) return <Loader size="sm" />;

  const trendData = analytics.trends.activityHotspots.map(hotspot => ({
    period: hotspot.period,
    nodes: hotspot.nodeCount,
    connections: hotspot.edgeCount,
  }));

  return (
    <Card padding="md" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={600} size="sm">Activity Trends</Text>
          <Group gap="xs">
            <Badge variant="light" color="green">
              {analytics.trends.growthRate > 0 ? '+' : ''}{(analytics.trends.growthRate * 100).toFixed(1)}%
            </Badge>
            <Text size="xs" c="dimmed">growth</Text>
          </Group>
        </Group>

        {trendData.length > 0 ? (
          <BarChart
            h={200}
            data={trendData}
            dataKey="period"
            series={[
              { name: 'nodes', color: 'blue.6' },
              { name: 'connections', color: 'teal.6' },
            ]}
          />
        ) : (
          <Center h={200}>
            <Text size="sm" c="dimmed">No trend data available</Text>
          </Center>
        )}

        <SimpleGrid cols={2}>
          <div>
            <Text size="xs" c="dimmed">Node Growth</Text>
            <Text fw={600}>{(analytics.trends.growthRate * 100).toFixed(1)}%</Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">Connection Growth</Text>
            <Text fw={600}>{(analytics.trends.connectionGrowth * 100).toFixed(1)}%</Text>
          </div>
        </SimpleGrid>
      </Stack>
    </Card>
  );
}

// Main dashboard component
export function GraphAnalyticsDashboard({
  data,
  analytics,
  isLoading,
  onRefresh,
  onNodeFocus,
  onExportAnalytics,
}: GraphAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<string | null>('overview');

  if (isLoading) {
    return (
      <Center h={400}>
        <Stack gap="md" align="center">
          <Loader size="lg" color="blue" />
          <Text size="sm" c="dimmed">Analyzing graph data...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Text fw={600} size="lg">Graph Analytics</Text>
          <Text size="sm" c="dimmed">
            Insights and patterns from your knowledge graph
          </Text>
        </div>
        <Group gap="sm">
          <Tooltip label="Refresh Analytics">
            <ActionIcon variant="outline" onClick={onRefresh}>
              <IconRefresh size="1rem" />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Export Analytics">
            <ActionIcon variant="outline" onClick={onExportAnalytics}>
              <IconDownload size="1rem" />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* Overview Stats */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
        <Card padding="md" radius="md" withBorder>
          <Group gap="xs">
            <IconNetwork size="1.2rem" color="var(--mantine-color-blue-6)" />
            <div>
              <Text size="xs" c="dimmed">Total Nodes</Text>
              <Text fw={600} size="lg">{analytics?.overview.totalNodes || 0}</Text>
            </div>
          </Group>
        </Card>

        <Card padding="md" radius="md" withBorder>
          <Group gap="xs">
            <IconRoute size="1.2rem" color="var(--mantine-color-teal-6)" />
            <div>
              <Text size="xs" c="dimmed">Connections</Text>
              <Text fw={600} size="lg">{analytics?.overview.totalEdges || 0}</Text>
            </div>
          </Group>
        </Card>

        <Card padding="md" radius="md" withBorder>
          <Group gap="xs">
            <IconChartDots size="1.2rem" color="var(--mantine-color-violet-6)" />
            <div>
              <Text size="xs" c="dimmed">Density</Text>
              <Text fw={600} size="lg">
                {analytics ? (analytics.overview.density * 100).toFixed(1) : 0}%
              </Text>
            </div>
          </Group>
        </Card>

        <Card padding="md" radius="md" withBorder>
          <Group gap="xs">
            <IconTrendingUp size="1.2rem" color="var(--mantine-color-green-6)" />
            <div>
              <Text size="xs" c="dimmed">Avg Connections</Text>
              <Text fw={600} size="lg">
                {analytics?.overview.avgConnectionsPerNode.toFixed(1) || 0}
              </Text>
            </div>
          </Group>
        </Card>
      </SimpleGrid>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconChartDots size="0.8rem" />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="patterns" leftSection={<IconBulb size="0.8rem" />}>
            Patterns
          </Tabs.Tab>
          <Tabs.Tab value="trends" leftSection={<IconTrendingUp size="0.8rem" />}>
            Trends
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <NetworkStatistics data={data} analytics={analytics} />
        </Tabs.Panel>

        <Tabs.Panel value="patterns" pt="md">
          <PatternRecognition 
            data={data} 
            analytics={analytics} 
            onNodeFocus={onNodeFocus} 
          />
        </Tabs.Panel>

        <Tabs.Panel value="trends" pt="md">
          <TrendsAnalysis analytics={analytics} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
