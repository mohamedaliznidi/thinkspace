/**
 * Maintenance Dashboard Component for ThinkSpace Areas
 * 
 * Displays maintenance alerts, scheduled tasks, and automated
 * monitoring for area health and review scheduling.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Stack,
  Group,
  Text,
  Card,
  Badge,
  Button,
  SimpleGrid,
  Alert,
  ActionIcon,
  Menu,
  Progress,
  Tooltip,
  Center,
  Loader,
  Divider,
  Box,
  ThemeIcon,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconClock,
  IconActivity,
  IconTarget,
  IconRefresh,
  IconSettings,
  IconCalendar,
  IconTrendingDown,
  IconAlertCircle,
  IconInfoCircle,
  IconCheck,
  IconX,
  IconDots,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { formatDistanceToNow } from 'date-fns';

interface MaintenanceAlert {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  areaId: string;
  areaTitle: string;
  areaColor?: string;
  areaType: string;
  daysOverdue?: number;
  daysUntilDue?: number;
  healthScore?: number;
  daysSinceActivity?: number;
}

interface MaintenanceData {
  overview: {
    totalAreas: number;
    areasNeedingAttention: number;
    reviewsOverdue: number;
    reviewsDueSoon: number;
    inactiveAreas: number;
    lowHealthAreas: number;
  };
  alerts: {
    critical: MaintenanceAlert[];
    warning: MaintenanceAlert[];
    info: MaintenanceAlert[];
  };
  recommendations: string[];
  scheduledMaintenance: Array<{
    type: string;
    areaId: string;
    areaTitle: string;
    scheduledDate: string;
    priority: string;
  }>;
}

interface MaintenanceDashboardProps {
  onAreaClick?: (areaId: string) => void;
  onScheduleReview?: (areaId: string) => void;
  refreshInterval?: number; // milliseconds
}

export default function MaintenanceDashboard({
  onAreaClick,
  onScheduleReview,
  refreshInterval = 300000, // 5 minutes
}: MaintenanceDashboardProps) {
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchMaintenanceData = useCallback(async () => {
    try {
      const response = await fetch('/api/areas/maintenance');
      if (response.ok) {
        const data = await response.json();
        setMaintenanceData(data.data.maintenance);
        setLastRefresh(new Date());
      } else {
        throw new Error('Failed to fetch maintenance data');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load maintenance data',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    fetchMaintenanceData();
    
    const interval = setInterval(fetchMaintenanceData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMaintenanceData, refreshInterval]);

  const handleQuickAction = useCallback(async (action: string, areaId: string) => {
    try {
      let endpoint = '';
      let body = {};

      switch (action) {
        case 'schedule_review':
          endpoint = '/api/areas/maintenance/schedule';
          body = {
            areaIds: [areaId],
            taskType: 'SCHEDULE_REVIEW',
            scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
          };
          break;
        case 'reset_health':
          endpoint = '/api/areas/maintenance/schedule';
          body = {
            areaIds: [areaId],
            taskType: 'RESET_HEALTH_SCORE',
          };
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Maintenance action completed',
          color: 'green',
        });
        fetchMaintenanceData(); // Refresh data
      } else {
        throw new Error('Failed to perform maintenance action');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to perform maintenance action',
        color: 'red',
      });
    }
  }, [fetchMaintenanceData]);

  const getAlertIcon = (type: string, severity: string) => {
    const iconProps = { size: '1rem' };
    
    switch (type) {
      case 'REVIEW_OVERDUE':
        return <IconAlertTriangle {...iconProps} color="red" />;
      case 'REVIEW_DUE_SOON':
        return <IconClock {...iconProps} color="orange" />;
      case 'LOW_HEALTH':
        return <IconTrendingDown {...iconProps} color="red" />;
      case 'INACTIVE_AREA':
        return <IconActivity {...iconProps} color="gray" />;
      case 'EMPTY_AREA':
        return <IconInfoCircle {...iconProps} color="blue" />;
      case 'NO_ACTIVE_PROJECTS':
        return <IconTarget {...iconProps} color="yellow" />;
      default:
        return <IconAlertCircle {...iconProps} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'warning': return 'orange';
      case 'info': return 'blue';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <Center h="50vh">
        <Stack gap="md" align="center">
          <Loader size="lg" />
          <Text size="sm" c="dimmed">Loading maintenance data...</Text>
        </Stack>
      </Center>
    );
  }

  if (!maintenanceData) {
    return (
      <Alert color="red" icon={<IconAlertTriangle size="1rem" />}>
        Failed to load maintenance data. Please try refreshing the page.
      </Alert>
    );
  }

  const { overview, alerts, recommendations, scheduledMaintenance } = maintenanceData;
  const totalAlerts = alerts.critical.length + alerts.warning.length + alerts.info.length;

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Stack gap="xs">
          <Text size="xl" fw={600}>Area Maintenance</Text>
          <Text size="sm" c="dimmed">
            Last updated: {formatDistanceToNow(lastRefresh, { addSuffix: true })}
          </Text>
        </Stack>
        
        <Button
          variant="subtle"
          leftSection={<IconRefresh size="1rem" />}
          onClick={fetchMaintenanceData}
          loading={loading}
        >
          Refresh
        </Button>
      </Group>

      {/* Overview Cards */}
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md">
        <Card padding="md" withBorder>
          <Stack gap="xs" align="center">
            <Text size="xs" c="dimmed" ta="center">Total Areas</Text>
            <Text size="xl" fw={700}>{overview.totalAreas}</Text>
          </Stack>
        </Card>
        
        <Card padding="md" withBorder>
          <Stack gap="xs" align="center">
            <Text size="xs" c="dimmed" ta="center">Need Attention</Text>
            <Text size="xl" fw={700} c={overview.areasNeedingAttention > 0 ? 'red' : 'green'}>
              {overview.areasNeedingAttention}
            </Text>
          </Stack>
        </Card>
        
        <Card padding="md" withBorder>
          <Stack gap="xs" align="center">
            <Text size="xs" c="dimmed" ta="center">Reviews Overdue</Text>
            <Text size="xl" fw={700} c={overview.reviewsOverdue > 0 ? 'red' : 'green'}>
              {overview.reviewsOverdue}
            </Text>
          </Stack>
        </Card>
        
        <Card padding="md" withBorder>
          <Stack gap="xs" align="center">
            <Text size="xs" c="dimmed" ta="center">Due Soon</Text>
            <Text size="xl" fw={700} c={overview.reviewsDueSoon > 0 ? 'orange' : 'green'}>
              {overview.reviewsDueSoon}
            </Text>
          </Stack>
        </Card>
        
        <Card padding="md" withBorder>
          <Stack gap="xs" align="center">
            <Text size="xs" c="dimmed" ta="center">Low Health</Text>
            <Text size="xl" fw={700} c={overview.lowHealthAreas > 0 ? 'red' : 'green'}>
              {overview.lowHealthAreas}
            </Text>
          </Stack>
        </Card>
        
        <Card padding="md" withBorder>
          <Stack gap="xs" align="center">
            <Text size="xs" c="dimmed" ta="center">Inactive</Text>
            <Text size="xl" fw={700} c={overview.inactiveAreas > 0 ? 'orange' : 'green'}>
              {overview.inactiveAreas}
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Alerts Section */}
      {totalAlerts > 0 && (
        <Card padding="lg" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="lg" fw={600}>Active Alerts</Text>
              <Badge color="red">{totalAlerts}</Badge>
            </Group>
            
            <Stack gap="sm">
              {/* Critical Alerts */}
              {alerts.critical.map((alert, index) => (
                <Alert
                  key={`critical-${index}`}
                  color="red"
                  icon={getAlertIcon(alert.type, alert.severity)}
                >
                  <Group justify="space-between">
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Group gap="xs">
                        <Text size="sm" fw={500}>{alert.areaTitle}</Text>
                        <Badge size="xs" color="gray">{alert.areaType}</Badge>
                      </Group>
                      <Text size="sm">{alert.message}</Text>
                    </Stack>
                    
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={() => onAreaClick?.(alert.areaId)}
                      >
                        View
                      </Button>
                      
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" size="sm">
                            <IconDots size="0.8rem" />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconCalendar size="0.9rem" />}
                            onClick={() => handleQuickAction('schedule_review', alert.areaId)}
                          >
                            Schedule Review
                          </Menu.Item>
                          {alert.type === 'LOW_HEALTH' && (
                            <Menu.Item
                              leftSection={<IconRefresh size="0.9rem" />}
                              onClick={() => handleQuickAction('reset_health', alert.areaId)}
                            >
                              Reset Health Score
                            </Menu.Item>
                          )}
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Group>
                </Alert>
              ))}
              
              {/* Warning Alerts */}
              {alerts.warning.map((alert, index) => (
                <Alert
                  key={`warning-${index}`}
                  color="orange"
                  icon={getAlertIcon(alert.type, alert.severity)}
                >
                  <Group justify="space-between">
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Group gap="xs">
                        <Text size="sm" fw={500}>{alert.areaTitle}</Text>
                        <Badge size="xs" color="gray">{alert.areaType}</Badge>
                      </Group>
                      <Text size="sm">{alert.message}</Text>
                    </Stack>
                    
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => onAreaClick?.(alert.areaId)}
                    >
                      View
                    </Button>
                  </Group>
                </Alert>
              ))}
            </Stack>
          </Stack>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card padding="lg" withBorder>
          <Stack gap="md">
            <Text size="lg" fw={600}>Recommendations</Text>
            <Stack gap="sm">
              {recommendations.map((recommendation, index) => (
                <Group key={index} gap="sm">
                  <ThemeIcon size="sm" color="blue" variant="light">
                    <IconInfoCircle size="0.8rem" />
                  </ThemeIcon>
                  <Text size="sm">{recommendation}</Text>
                </Group>
              ))}
            </Stack>
          </Stack>
        </Card>
      )}

      {/* Scheduled Maintenance */}
      {scheduledMaintenance.length > 0 && (
        <Card padding="lg" withBorder>
          <Stack gap="md">
            <Text size="lg" fw={600}>Scheduled Maintenance</Text>
            <Stack gap="sm">
              {scheduledMaintenance.map((task, index) => (
                <Group key={index} justify="space-between">
                  <Group gap="sm">
                    <ThemeIcon size="sm" color="green" variant="light">
                      <IconCalendar size="0.8rem" />
                    </ThemeIcon>
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>{task.areaTitle}</Text>
                      <Text size="xs" c="dimmed">
                        {task.type.replace('_', ' ').toLowerCase()} - {formatDistanceToNow(new Date(task.scheduledDate), { addSuffix: true })}
                      </Text>
                    </Stack>
                  </Group>
                  
                  <Badge size="sm" color={task.priority === 'HIGH' ? 'red' : task.priority === 'MEDIUM' ? 'orange' : 'green'}>
                    {task.priority}
                  </Badge>
                </Group>
              ))}
            </Stack>
          </Stack>
        </Card>
      )}

      {/* No Issues State */}
      {totalAlerts === 0 && recommendations.length === 0 && scheduledMaintenance.length === 0 && (
        <Card padding="xl" withBorder>
          <Stack gap="md" align="center">
            <ThemeIcon size="xl" color="green" variant="light">
              <IconCheck size="2rem" />
            </ThemeIcon>
            <Text size="lg" fw={500}>All Areas Healthy</Text>
            <Text size="sm" c="dimmed" ta="center">
              No maintenance issues detected. All areas are up to date and functioning well.
            </Text>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
