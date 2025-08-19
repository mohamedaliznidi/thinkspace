/**
 * Performance Dashboard Component for ThinkSpace
 * 
 * Displays comprehensive performance metrics, optimization suggestions,
 * and system health indicators.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Badge,
  Button,
  Progress,
  Alert,
  Tabs,
  Grid,
  ActionIcon,
  Tooltip,
  RingProgress,
  Table,
  ScrollArea,
  Divider,
  Modal,
  Code,
} from '@mantine/core';
import {
  IconDashboard,
  IconChartLine,
  IconBulb,
  IconSettings,
  IconRefresh,
  IconDownload,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconDatabase,
  IconSearch,
  IconPhoto,
  IconCpu,
  IconDatabaseCog,
} from '@tabler/icons-react';
import { usePerformanceMonitoring, performanceMonitor } from '@/lib/performance';
import { cache } from '@/lib/cache';
import { preloader } from '@/components/common/LazyLoader';

interface PerformanceDashboardProps {
  showAdvanced?: boolean;
}

export function PerformanceDashboard({ showAdvanced = false }: PerformanceDashboardProps) {
  const performanceSummary = usePerformanceMonitoring();
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [preloadStats, setPreloadStats] = useState<any>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportData, setExportData] = useState('');

  // Load cache and preload statistics
  useEffect(() => {
    const updateStats = () => {
      setCacheStats(cache.getStats());
      setPreloadStats(preloader.getCacheStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle export
  const handleExport = () => {
    const data = performanceMonitor.exportMetrics();
    setExportData(data);
    setShowExportModal(true);
  };

  // Handle cache clear
  const handleClearCache = async () => {
    await cache.clear();
    preloader.clearCache();
    setCacheStats(cache.getStats());
    setPreloadStats(preloader.getCacheStats());
  };

  // Get performance score
  const getPerformanceScore = () => {
    if (!performanceSummary) return 0;

    const { averages } = performanceSummary;
    let score = 100;

    // Deduct points for slow performance
    if (averages.api > 2000) score -= 20;
    else if (averages.api > 1000) score -= 10;

    if (averages.render > 100) score -= 15;
    else if (averages.render > 50) score -= 8;

    if (averages.search > 1000) score -= 15;
    else if (averages.search > 500) score -= 8;

    return Math.max(0, score);
  };

  const performanceScore = getPerformanceScore();

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'yellow';
    if (score >= 50) return 'orange';
    return 'red';
  };

  return (
    <>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <IconDashboard size="1.5rem" />
            <div>
              <Text fw={600} size="lg">Performance Dashboard</Text>
              <Text size="sm" c="dimmed">Monitor and optimize system performance</Text>
            </div>
          </Group>
          
          <Group>
            <Tooltip label="Export metrics">
              <ActionIcon variant="light" onClick={handleExport}>
                <IconDownload size="1rem" />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Clear cache">
              <ActionIcon variant="light" color="orange" onClick={handleClearCache}>
                <IconRefresh size="1rem" />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* Performance Score */}
        <Card withBorder p="md">
          <Group justify="space-between">
            <div>
              <Text fw={600} mb="xs">Overall Performance Score</Text>
              <Text size="sm" c="dimmed">
                Based on API response time, render performance, and search speed
              </Text>
            </div>
            
            <RingProgress
              size={120}
              thickness={12}
              sections={[{ value: performanceScore, color: getScoreColor(performanceScore) }]}
              label={
                <Text ta="center" fw={700} size="lg">
                  {performanceScore}
                </Text>
              }
            />
          </Group>
        </Card>

        {/* Performance Metrics Tabs */}
        <Tabs defaultValue="overview" variant="outline">
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<IconChartLine size="1rem" />}>
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="cache" leftSection={<IconDatabase size="1rem" />}>
              Cache
            </Tabs.Tab>
            <Tabs.Tab value="suggestions" leftSection={<IconBulb size="1rem" />}>
              Suggestions
            </Tabs.Tab>
            {showAdvanced && (
              <Tabs.Tab value="advanced" leftSection={<IconSettings size="1rem" />}>
                Advanced
              </Tabs.Tab>
            )}
          </Tabs.List>

          {/* Overview Tab */}
          <Tabs.Panel value="overview" pt="md">
            <Grid>
              {/* API Performance */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder p="md">
                  <Group justify="space-between" mb="md">
                    <Group>
                      <IconClock size="1.2rem" color="blue" />
                      <Text fw={600}>API Performance</Text>
                    </Group>
                    <Badge
                      color={performanceSummary?.averages?.api ? (performanceSummary.averages.api > 2000 ? 'red' : 'green') : 'gray'}
                      variant="light"
                    >
                      {performanceSummary?.averages?.api ? `${Math.round(performanceSummary.averages.api)}ms` : 'N/A'}
                    </Badge>
                  </Group>

                  <Progress
                    value={Math.min(100, (performanceSummary?.averages?.api || 0) / 30)}
                    color={performanceSummary?.averages?.api ? (performanceSummary.averages.api > 2000 ? 'red' : 'green') : 'gray'}
                    size="lg"
                  />
                  
                  <Text size="xs" c="dimmed" mt="xs">
                    Target: &lt; 2000ms
                  </Text>
                </Card>
              </Grid.Col>

              {/* Render Performance */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder p="md">
                  <Group justify="space-between" mb="md">
                    <Group>
                      <IconCpu size="1.2rem" color="orange" />
                      <Text fw={600}>Render Performance</Text>
                    </Group>
                    <Badge
                      color={performanceSummary?.averages?.render ? (performanceSummary.averages.render > 100 ? 'red' : 'green') : 'gray'}
                      variant="light"
                    >
                      {performanceSummary?.averages?.render ? `${Math.round(performanceSummary.averages.render)}ms` : 'N/A'}
                    </Badge>
                  </Group>

                  <Progress
                    value={Math.min(100, (performanceSummary?.averages?.render || 0) / 2)}
                    color={performanceSummary?.averages?.render ? (performanceSummary.averages.render > 100 ? 'red' : 'green') : 'gray'}
                    size="lg"
                  />
                  
                  <Text size="xs" c="dimmed" mt="xs">
                    Target: &lt; 100ms
                  </Text>
                </Card>
              </Grid.Col>

              {/* Search Performance */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder p="md">
                  <Group justify="space-between" mb="md">
                    <Group>
                      <IconSearch size="1.2rem" color="purple" />
                      <Text fw={600}>Search Performance</Text>
                    </Group>
                    <Badge
                      color={performanceSummary?.averages?.search ? (performanceSummary.averages.search > 1000 ? 'red' : 'green') : 'gray'}
                      variant="light"
                    >
                      {performanceSummary?.averages?.search ? `${Math.round(performanceSummary.averages.search)}ms` : 'N/A'}
                    </Badge>
                  </Group>

                  <Progress
                    value={Math.min(100, (performanceSummary?.averages?.search || 0) / 20)}
                    color={performanceSummary?.averages?.search ? (performanceSummary.averages.search > 1000 ? 'red' : 'green') : 'gray'}
                    size="lg"
                  />
                  
                  <Text size="xs" c="dimmed" mt="xs">
                    Target: &lt; 1000ms
                  </Text>
                </Card>
              </Grid.Col>

              {/* Memory Usage */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder p="md">
                  <Group justify="space-between" mb="md">
                    <Group>
                      <IconDatabaseCog size="1.2rem" color="teal" />
                      <Text fw={600}>Memory Usage</Text>
                    </Group>
                    <Badge variant="light">
                      {cacheStats ? `${Math.round(cacheStats.totalSize / 1024 / 1024)}MB` : 'N/A'}
                    </Badge>
                  </Group>
                  
                  <Progress
                    value={cacheStats ? (cacheStats.totalSize / 1024 / 1024 / 100) * 100 : 0}
                    color="teal"
                    size="lg"
                  />
                  
                  <Text size="xs" c="dimmed" mt="xs">
                    Cache size in memory
                  </Text>
                </Card>
              </Grid.Col>
            </Grid>

            {/* Recent Violations */}
            {performanceSummary?.violations && performanceSummary.violations.length > 0 && (
              <Card withBorder p="md" mt="md">
                <Text fw={600} mb="md">Recent Performance Issues</Text>
                <Stack gap="xs">
                  {performanceSummary.violations.slice(0, 5).map((violation: any, index: number) => (
                    <Alert key={index} color="orange" variant="light">
                      <Group justify="space-between">
                        <Text size="sm">
                          {violation.name}: {Math.round(violation.value)}ms
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(violation.timestamp).toLocaleTimeString()}
                        </Text>
                      </Group>
                    </Alert>
                  ))}
                </Stack>
              </Card>
            )}
          </Tabs.Panel>

          {/* Cache Tab */}
          <Tabs.Panel value="cache" pt="md">
            <Grid>
              {/* Cache Statistics */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder p="md">
                  <Text fw={600} mb="md">Cache Statistics</Text>
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text size="sm">Memory Hits</Text>
                      <Badge variant="light" color="green">
                        {cacheStats?.memoryHits || 0}
                      </Badge>
                    </Group>
                    
                    <Group justify="space-between">
                      <Text size="sm">Memory Misses</Text>
                      <Badge variant="light" color="red">
                        {cacheStats?.memoryMisses || 0}
                      </Badge>
                    </Group>
                    
                    <Group justify="space-between">
                      <Text size="sm">Hit Rate</Text>
                      <Badge variant="light">
                        {cacheStats ? 
                          `${Math.round((cacheStats.memoryHits / (cacheStats.memoryHits + cacheStats.memoryMisses)) * 100)}%` : 
                          'N/A'
                        }
                      </Badge>
                    </Group>
                    
                    <Group justify="space-between">
                      <Text size="sm">Total Entries</Text>
                      <Badge variant="light">
                        {cacheStats?.entryCount || 0}
                      </Badge>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>

              {/* Preload Statistics */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder p="md">
                  <Text fw={600} mb="md">Preload Statistics</Text>
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text size="sm">Components Cached</Text>
                      <Badge variant="light" color="blue">
                        {preloadStats?.componentsCached || 0}
                      </Badge>
                    </Group>
                    
                    <Group justify="space-between">
                      <Text size="sm">Components Preloading</Text>
                      <Badge variant="light" color="orange">
                        {preloadStats?.componentsPreloading || 0}
                      </Badge>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>

            <Card withBorder p="md" mt="md">
              <Group justify="space-between" mb="md">
                <Text fw={600}>Cache Management</Text>
                <Button
                  variant="outline"
                  color="orange"
                  size="sm"
                  onClick={handleClearCache}
                >
                  Clear All Caches
                </Button>
              </Group>
              
              <Text size="sm" c="dimmed">
                Clearing caches will remove all cached data and components, which may temporarily slow down the application until caches are rebuilt.
              </Text>
            </Card>
          </Tabs.Panel>

          {/* Suggestions Tab */}
          <Tabs.Panel value="suggestions" pt="md">
            {performanceSummary?.suggestions && performanceSummary.suggestions.length > 0 ? (
              <Stack gap="md">
                {performanceSummary.suggestions.map((suggestion: any) => (
                  <Card key={suggestion.id} withBorder p="md">
                    <Group justify="space-between" mb="md">
                      <Group>
                        <IconBulb size="1.2rem" color="orange" />
                        <div>
                          <Text fw={600}>{suggestion.title}</Text>
                          <Badge size="sm" color={
                            suggestion.priority === 'critical' ? 'red' :
                            suggestion.priority === 'high' ? 'orange' :
                            suggestion.priority === 'medium' ? 'yellow' : 'blue'
                          }>
                            {suggestion.priority}
                          </Badge>
                        </div>
                      </Group>
                    </Group>
                    
                    <Text size="sm" mb="md">{suggestion.description}</Text>
                    
                    <Grid>
                      <Grid.Col span={6}>
                        <Text size="xs" fw={500} c="dimmed">Impact</Text>
                        <Text size="sm">{suggestion.impact}</Text>
                      </Grid.Col>
                      
                      <Grid.Col span={6}>
                        <Text size="xs" fw={500} c="dimmed">Estimated Improvement</Text>
                        <Text size="sm">{suggestion.estimatedImprovement}</Text>
                      </Grid.Col>
                    </Grid>
                    
                    <Divider my="md" />
                    
                    <Text size="xs" fw={500} c="dimmed" mb="xs">Implementation</Text>
                    <Text size="sm">{suggestion.implementation}</Text>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Card withBorder p="xl" ta="center">
                <IconCheck size="3rem" color="green" style={{ opacity: 0.5 }} />
                <Text fw={600} mt="md">No Optimization Suggestions</Text>
                <Text size="sm" c="dimmed" mt="xs">
                  Your application is performing well! Keep monitoring for potential improvements.
                </Text>
              </Card>
            )}
          </Tabs.Panel>

          {/* Advanced Tab */}
          {showAdvanced && (
            <Tabs.Panel value="advanced" pt="md">
              <Stack gap="md">
                <Card withBorder p="md">
                  <Text fw={600} mb="md">Performance Thresholds</Text>
                  <Text size="sm" c="dimmed" mb="md">
                    Configure performance thresholds for monitoring and alerts.
                  </Text>
                  
                  <Grid>
                    <Grid.Col span={6}>
                      <Text size="sm" fw={500}>API Response Time</Text>
                      <Text size="xs" c="dimmed">2000ms</Text>
                    </Grid.Col>
                    
                    <Grid.Col span={6}>
                      <Text size="sm" fw={500}>Render Time</Text>
                      <Text size="xs" c="dimmed">100ms</Text>
                    </Grid.Col>
                    
                    <Grid.Col span={6}>
                      <Text size="sm" fw={500}>Search Time</Text>
                      <Text size="xs" c="dimmed">1000ms</Text>
                    </Grid.Col>
                    
                    <Grid.Col span={6}>
                      <Text size="sm" fw={500}>Cache Hit Rate</Text>
                      <Text size="xs" c="dimmed">80%</Text>
                    </Grid.Col>
                  </Grid>
                </Card>

                <Card withBorder p="md">
                  <Text fw={600} mb="md">Debug Information</Text>
                  <Text size="sm" c="dimmed" mb="md">
                    Advanced debugging and monitoring information.
                  </Text>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => console.log('Performance data:', performanceSummary)}
                  >
                    Log Performance Data
                  </Button>
                </Card>
              </Stack>
            </Tabs.Panel>
          )}
        </Tabs>
      </Stack>

      {/* Export Modal */}
      <Modal
        opened={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Performance Data"
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Copy the performance data below or download it as a JSON file.
          </Text>
          
          <ScrollArea.Autosize>
            <Code block>{exportData}</Code>
          </ScrollArea.Autosize>
          
          <Group justify="flex-end">
            <Button
              variant="outline"
              onClick={() => {
                const blob = new Blob([exportData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download JSON
            </Button>
            
            <Button onClick={() => setShowExportModal(false)}>
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
