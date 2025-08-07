/**
 * Dashboard Page for ThinkSpace
 *
 * This page provides the main dashboard with overview statistics,
 * recent activity, quick actions, and PARA methodology insights.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  Text,
  Title,
  Group,
  Stack,
  Badge,
  Progress,
  ActionIcon,
  SimpleGrid,
  Paper,
  Center,
  Loader,
  Alert,
  Button,
} from '@mantine/core';
import {
  IconTarget,
  IconMap,
  IconBookmark,
  IconArchive,
  IconMessageCircle,
  IconNetwork,
  IconNote,
  IconTrendingUp,
  IconClock,
  IconPlus,
  IconArrowRight,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useUser } from '@/contexts/UserContext';
import { getParaColor } from '@/lib/theme';
import Link from 'next/link';

interface DashboardStats {
  projects: {
    total: number;
    active: number;
    completed: number;
    overdue: number;
  };
  areas: {
    total: number;
    active: number;
  };
  resources: {
    total: number;
    recent: number;
  };
  notes: {
    total: number;
    recent: number;
  };
  chats: {
    total: number;
    active: number;
  };
  connections: number;
}

interface RecentActivity {
  id: string;
  type: 'project' | 'area' | 'resource' | 'note' | 'chat';
  title: string;
  description?: string;
  action: string;
  timestamp: Date;
  href: string;
}

export default function DashboardPage() {
  const { user, isLoading: userLoading } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch stats
        const statsResponse = await fetch('/api/dashboard/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.stats);
        }

        // Fetch recent activity
        const activityResponse = await fetch('/api/dashboard/activity');
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setRecentActivity(activityData.activity);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    if (!userLoading) {
      fetchDashboardData();
    }
  }, [userLoading]);

  if (userLoading || isLoading) {
    return (
      <Center h="50vh">
        <Stack gap="md" align="center">
          <Loader size="lg" />
          <Text size="sm" c="dimmed">Loading dashboard...</Text>
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

  const getCompletionRate = () => {
    if (!stats) return 0;
    const total = stats.projects.total;
    const completed = stats.projects.completed;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <Stack gap="xl">
      {/* Welcome Header */}
      <div>
        <Title order={1} mb="xs">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋
        </Title>
        <Text c="dimmed" size="lg">
          Here's what's happening in your knowledge space today.
        </Text>
      </div>

      {/* Stats Overview */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <Card padding="lg" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text size="sm" c="dimmed" fw={500}>Projects</Text>
            <IconTarget size="1.2rem" color={getParaColor('projects')} />
          </Group>
          <Text size="xl" fw={700} c={getParaColor('projects')}>
            {stats?.projects.active || 0}
          </Text>
          <Text size="xs" c="dimmed">
            {stats?.projects.total || 0} total • {stats?.projects.overdue || 0} overdue
          </Text>
        </Card>

        <Card padding="lg" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text size="sm" c="dimmed" fw={500}>Areas</Text>
            <IconMap size="1.2rem" color={getParaColor('areas')} />
          </Group>
          <Text size="xl" fw={700} c={getParaColor('areas')}>
            {stats?.areas.active || 0}
          </Text>
          <Text size="xs" c="dimmed">
            {stats?.areas.total || 0} total areas
          </Text>
        </Card>

        <Card padding="lg" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text size="sm" c="dimmed" fw={500}>Resources</Text>
            <IconBookmark size="1.2rem" color={getParaColor('resources')} />
          </Group>
          <Text size="xl" fw={700} c={getParaColor('resources')}>
            {stats?.resources.total || 0}
          </Text>
          <Text size="xs" c="dimmed">
            {stats?.resources.recent || 0} added this week
          </Text>
        </Card>

        <Card padding="lg" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text size="sm" c="dimmed" fw={500}>Connections</Text>
            <IconNetwork size="1.2rem" color="var(--mantine-color-violet-6)" />
          </Group>
          <Text size="xl" fw={700} c="violet">
            {stats?.connections || 0}
          </Text>
          <Text size="xs" c="dimmed">
            Knowledge graph links
          </Text>
        </Card>
      </SimpleGrid>

      {/* Quick Actions */}
      <Paper p="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={3}>Quick Actions</Title>
        </Group>
        
        <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="md">
          <Button
            component={Link}
            href="/projects/new"
            color={getParaColor('projects')}
            variant="light"
            leftSection={<IconPlus size="1rem" />}
            fullWidth
          >
            New Project
          </Button>

          <Button
            component={Link}
            href="/areas/new"
            color={getParaColor('areas')}
            variant="light"
            leftSection={<IconPlus size="1rem" />}
            fullWidth
          >
            New Area
          </Button>

          <Button
            component={Link}
            href="/resources/upload"
            color={getParaColor('resources')}
            variant="light"
            leftSection={<IconPlus size="1rem" />}
            fullWidth
          >
            Upload Resource
          </Button>

          <Button
            component={Link}
            href="/notes/new"
            variant="light"
            leftSection={<IconPlus size="1rem" />}
            fullWidth
          >
            New Note
          </Button>

          <Button
            component={Link}
            href="/chat/new"
            variant="light"
            leftSection={<IconPlus size="1rem" />}
            fullWidth
          >
            Start Chat
          </Button>
        </SimpleGrid>
      </Paper>

      {/* Progress Overview */}
      {stats && stats.projects.total > 0 && (
        <Paper p="lg" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={3}>Progress Overview</Title>
            <Badge variant="light" color="blue">
              {getCompletionRate()}% Complete
            </Badge>
          </Group>
          
          <Progress
            value={getCompletionRate()}
            size="lg"
            radius="xl"
            color="blue"
            mb="md"
          />
          
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Group>
              <Text size="sm" c="dimmed">Active:</Text>
              <Text size="sm" fw={500}>{stats.projects.active}</Text>
            </Group>
            <Group>
              <Text size="sm" c="dimmed">Completed:</Text>
              <Text size="sm" fw={500}>{stats.projects.completed}</Text>
            </Group>
            <Group>
              <Text size="sm" c="dimmed">Overdue:</Text>
              <Text size="sm" fw={500} c="red">{stats.projects.overdue}</Text>
            </Group>
          </SimpleGrid>
        </Paper>
      )}

      {/* Recent Activity */}
      <Paper p="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={3}>Recent Activity</Title>
          <ActionIcon
            component={Link}
            href="/activity"
            variant="subtle"
            size="sm"
          >
            <IconArrowRight size="1rem" />
          </ActionIcon>
        </Group>
        
        {recentActivity.length > 0 ? (
          <Stack gap="sm">
            {recentActivity.slice(0, 5).map((activity) => (
              <Group key={activity.id} justify="space-between" p="sm" style={{ borderRadius: 'var(--mantine-radius-sm)', backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <Group gap="sm">
                  <Badge size="xs" variant="dot" color={getParaColor(activity.type === 'chat' ? 'projects' : activity.type as any)}>
                    {activity.type}
                  </Badge>
                  <Text size="sm" fw={500} lineClamp={1}>
                    {activity.action}
                  </Text>
                  <Text size="sm" lineClamp={1}>
                    {activity.title}
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </Text>
              </Group>
            ))}
          </Stack>
        ) : (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            No recent activity. Start by creating your first project!
          </Text>
        )}
      </Paper>
    </Stack>
  );
}
