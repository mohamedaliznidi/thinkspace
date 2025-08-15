/**
 * Project Analytics Component for ThinkSpace
 * 
 * This component provides comprehensive analytics and progress tracking
 * for projects including task completion, time tracking, and performance metrics.
 */

'use client';

import { useMemo } from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Progress,
  SimpleGrid,
  ThemeIcon,
  Badge,
  RingProgress,
  Center,
  Divider,
  Alert,
} from '@mantine/core';
import {
  IconTarget,
  IconClock,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertTriangle,
  IconCheck,
  IconFlag,
  IconCalendar,
  IconSubtask,
  IconActivity,
} from '@tabler/icons-react';
import { differenceInDays, format, isAfter, isBefore, parseISO } from 'date-fns';

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
}

interface Project {
  id: string;
  title: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  progress: number;
  createdAt: string;
  tasks?: Task[];
}

interface ProjectAnalyticsProps {
  project: Project;
  tasks: Task[];
}

export function ProjectAnalytics({ project, tasks }: ProjectAnalyticsProps) {
  
  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    const now = new Date();
    
    // Task status breakdown
    const tasksByStatus = {
      TODO: tasks.filter(t => t.status === 'TODO').length,
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      IN_REVIEW: tasks.filter(t => t.status === 'IN_REVIEW').length,
      BLOCKED: tasks.filter(t => t.status === 'BLOCKED').length,
      COMPLETED: tasks.filter(t => t.status === 'COMPLETED').length,
      CANCELLED: tasks.filter(t => t.status === 'CANCELLED').length,
    };

    // Priority breakdown
    const tasksByPriority = {
      LOW: tasks.filter(t => t.priority === 'LOW').length,
      MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
      HIGH: tasks.filter(t => t.priority === 'HIGH').length,
      URGENT: tasks.filter(t => t.priority === 'URGENT').length,
    };

    // Completion metrics
    const totalTasks = tasks.length;
    const completedTasks = tasksByStatus.COMPLETED;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Time tracking
    const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
    const totalActualHours = tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);
    const timeVariance = totalEstimatedHours > 0 ? 
      ((totalActualHours - totalEstimatedHours) / totalEstimatedHours) * 100 : 0;

    // Overdue tasks
    const overdueTasks = tasks.filter(task => 
      task.dueDate && 
      task.status !== 'COMPLETED' && 
      task.status !== 'CANCELLED' &&
      isAfter(now, parseISO(task.dueDate))
    );

    // Due soon tasks (next 7 days)
    const dueSoonTasks = tasks.filter(task => 
      task.dueDate && 
      task.status !== 'COMPLETED' && 
      task.status !== 'CANCELLED' &&
      isBefore(now, parseISO(task.dueDate)) &&
      differenceInDays(parseISO(task.dueDate), now) <= 7
    );

    // Blocked tasks
    const blockedTasks = tasks.filter(t => t.status === 'BLOCKED');

    // Project timeline
    const projectStartDate = project.startDate ? parseISO(project.startDate) : 
      tasks.length > 0 ? parseISO(tasks[0].createdAt) : parseISO(project.createdAt);
    const projectDueDate = project.dueDate ? parseISO(project.dueDate) : null;
    const projectDuration = projectDueDate ? differenceInDays(projectDueDate, projectStartDate) : null;
    const daysElapsed = differenceInDays(now, projectStartDate);
    const timeProgress = projectDuration ? Math.min((daysElapsed / projectDuration) * 100, 100) : 0;

    // Velocity (tasks completed per week)
    const completedTasksWithDates = tasks.filter(t => t.completedAt);
    const weeksElapsed = Math.max(1, Math.ceil(daysElapsed / 7));
    const velocity = completedTasksWithDates.length / weeksElapsed;

    // Health score (0-100)
    let healthScore = 100;
    if (overdueTasks.length > 0) healthScore -= overdueTasks.length * 10;
    if (blockedTasks.length > 0) healthScore -= blockedTasks.length * 15;
    if (timeVariance > 50) healthScore -= 20; // Over budget by 50%
    if (completionRate < timeProgress - 20) healthScore -= 25; // Behind schedule
    healthScore = Math.max(0, healthScore);

    return {
      tasksByStatus,
      tasksByPriority,
      totalTasks,
      completedTasks,
      completionRate,
      totalEstimatedHours,
      totalActualHours,
      timeVariance,
      overdueTasks,
      dueSoonTasks,
      blockedTasks,
      projectDuration,
      daysElapsed,
      timeProgress,
      velocity,
      healthScore,
    };
  }, [project, tasks]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    if (score >= 40) return 'orange';
    return 'red';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <Stack gap="md">
      {/* Project Health Overview */}
      <Card padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Text fw={600} size="lg">Project Health</Text>
          <Badge size="lg" color={getHealthColor(analytics.healthScore)}>
            {Math.round(analytics.healthScore)}% - {getHealthLabel(analytics.healthScore)}
          </Badge>
        </Group>

        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          <Card padding="sm" radius="sm" withBorder>
            <Stack gap="xs" align="center">
              <RingProgress
                size={60}
                thickness={6}
                sections={[{ value: analytics.completionRate, color: 'blue' }]}
                label={
                  <Center>
                    <Text size="xs" fw={700}>
                      {Math.round(analytics.completionRate)}%
                    </Text>
                  </Center>
                }
              />
              <Text size="xs" ta="center" c="dimmed">Task Completion</Text>
            </Stack>
          </Card>

          <Card padding="sm" radius="sm" withBorder>
            <Stack gap="xs" align="center">
              <ThemeIcon size="lg" variant="light" color="green">
                <IconTarget size="1.25rem" />
              </ThemeIcon>
              <Text fw={600} ta="center">{analytics.completedTasks}/{analytics.totalTasks}</Text>
              <Text size="xs" ta="center" c="dimmed">Tasks Done</Text>
            </Stack>
          </Card>

          <Card padding="sm" radius="sm" withBorder>
            <Stack gap="xs" align="center">
              <ThemeIcon size="lg" variant="light" color="blue">
                <IconClock size="1.25rem" />
              </ThemeIcon>
              <Text fw={600} ta="center">{analytics.totalActualHours}h</Text>
              <Text size="xs" ta="center" c="dimmed">Time Spent</Text>
            </Stack>
          </Card>

          <Card padding="sm" radius="sm" withBorder>
            <Stack gap="xs" align="center">
              <ThemeIcon 
                size="lg" 
                variant="light" 
                color={analytics.velocity >= 1 ? 'green' : 'orange'}
              >
                <IconActivity size="1.25rem" />
              </ThemeIcon>
              <Text fw={600} ta="center">{analytics.velocity.toFixed(1)}</Text>
              <Text size="xs" ta="center" c="dimmed">Tasks/Week</Text>
            </Stack>
          </Card>
        </SimpleGrid>
      </Card>

      {/* Progress Tracking */}
      <Card padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Text fw={600} size="lg">Progress Tracking</Text>

          {/* Task Completion Progress */}
          <div>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>Task Completion</Text>
              <Text size="sm" c="dimmed">
                {analytics.completedTasks} of {analytics.totalTasks} completed
              </Text>
            </Group>
            <Progress value={analytics.completionRate} size="lg" />
          </div>

          {/* Time Progress */}
          {analytics.projectDuration && (
            <div>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={500}>Time Progress</Text>
                <Text size="sm" c="dimmed">
                  {analytics.daysElapsed} of {analytics.projectDuration} days
                </Text>
              </Group>
              <Progress value={analytics.timeProgress} size="lg" color="orange" />
            </div>
          )}

          {/* Time Variance */}
          {analytics.totalEstimatedHours > 0 && (
            <Group justify="space-between">
              <Text size="sm">Time Variance</Text>
              <Group gap="xs">
                {analytics.timeVariance > 0 ? (
                  <IconTrendingUp size="1rem" color="var(--mantine-color-red-6)" />
                ) : (
                  <IconTrendingDown size="1rem" color="var(--mantine-color-green-6)" />
                )}
                <Text 
                  size="sm" 
                  c={analytics.timeVariance > 0 ? 'red' : 'green'}
                  fw={500}
                >
                  {analytics.timeVariance > 0 ? '+' : ''}{analytics.timeVariance.toFixed(1)}%
                </Text>
              </Group>
            </Group>
          )}
        </Stack>
      </Card>

      {/* Task Breakdown */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {/* Status Breakdown */}
        <Card padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Text fw={600}>Task Status</Text>
            
            <Stack gap="xs">
              {Object.entries(analytics.tasksByStatus).map(([status, count]) => {
                const percentage = analytics.totalTasks > 0 ? (count / analytics.totalTasks) * 100 : 0;
                const colors = {
                  TODO: 'gray',
                  IN_PROGRESS: 'blue',
                  IN_REVIEW: 'yellow',
                  BLOCKED: 'red',
                  COMPLETED: 'green',
                  CANCELLED: 'dark',
                };
                
                return (
                  <div key={status}>
                    <Group justify="space-between" mb={4}>
                      <Text size="sm">{status.replace('_', ' ')}</Text>
                      <Text size="sm" fw={500}>{count}</Text>
                    </Group>
                    <Progress value={percentage} color={colors[status as keyof typeof colors]} size="sm" />
                  </div>
                );
              })}
            </Stack>
          </Stack>
        </Card>

        {/* Priority Breakdown */}
        <Card padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Text fw={600}>Task Priority</Text>
            
            <Stack gap="xs">
              {Object.entries(analytics.tasksByPriority).map(([priority, count]) => {
                const percentage = analytics.totalTasks > 0 ? (count / analytics.totalTasks) * 100 : 0;
                const colors = {
                  LOW: 'green',
                  MEDIUM: 'yellow',
                  HIGH: 'orange',
                  URGENT: 'red',
                };
                
                return (
                  <div key={priority}>
                    <Group justify="space-between" mb={4}>
                      <Text size="sm">{priority}</Text>
                      <Text size="sm" fw={500}>{count}</Text>
                    </Group>
                    <Progress value={percentage} color={colors[priority as keyof typeof colors]} size="sm" />
                  </div>
                );
              })}
            </Stack>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Alerts and Warnings */}
      {(analytics.overdueTasks.length > 0 || analytics.blockedTasks.length > 0 || analytics.dueSoonTasks.length > 0) && (
        <Stack gap="sm">
          {analytics.overdueTasks.length > 0 && (
            <Alert
              icon={<IconAlertTriangle size="1rem" />}
              title="Overdue Tasks"
              color="red"
            >
              {analytics.overdueTasks.length} task{analytics.overdueTasks.length !== 1 ? 's are' : ' is'} overdue and need{analytics.overdueTasks.length === 1 ? 's' : ''} immediate attention.
            </Alert>
          )}

          {analytics.blockedTasks.length > 0 && (
            <Alert
              icon={<IconFlag size="1rem" />}
              title="Blocked Tasks"
              color="orange"
            >
              {analytics.blockedTasks.length} task{analytics.blockedTasks.length !== 1 ? 's are' : ' is'} blocked and may impact project timeline.
            </Alert>
          )}

          {analytics.dueSoonTasks.length > 0 && (
            <Alert
              icon={<IconCalendar size="1rem" />}
              title="Due Soon"
              color="yellow"
            >
              {analytics.dueSoonTasks.length} task{analytics.dueSoonTasks.length !== 1 ? 's are' : ' is'} due within the next 7 days.
            </Alert>
          )}
        </Stack>
      )}
    </Stack>
  );
}
