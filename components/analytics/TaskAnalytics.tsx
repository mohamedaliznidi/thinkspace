/**
 * Task Analytics Component for ThinkSpace
 * 
 * This component provides detailed analytics for individual tasks
 * including time tracking, completion metrics, and performance insights.
 */

'use client';

import { useMemo } from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Progress,
  Badge,
  ThemeIcon,
  SimpleGrid,
  Timeline,
  Alert,
  Tooltip,
} from '@mantine/core';
import {
  IconClock,
  IconTarget,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertTriangle,
  IconCheck,
  IconCalendar,
  IconFlag,
  IconActivity,
  IconSubtask,
} from '@tabler/icons-react';
import { 
  differenceInDays, 
  differenceInHours, 
  format, 
  isAfter, 
  isBefore, 
  parseISO,
  formatDistanceToNow 
} from 'date-fns';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  order: number;
  tags: string[];
  parentTask?: {
    id: string;
    title: string;
  };
  subtasks?: {
    id: string;
    title: string;
    status: string;
    completedAt?: string;
  }[];
  dependsOnTasks?: {
    id: string;
    title: string;
    completedAt?: string;
  }[];
  _count: {
    subtasks: number;
    activities: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface TaskAnalyticsProps {
  task: Task;
  projectTasks?: Task[];
}

export function TaskAnalytics({ task, projectTasks = [] }: TaskAnalyticsProps) {
  
  // Calculate task analytics
  const analytics = useMemo(() => {
    const now = new Date();
    
    // Time tracking
    const estimatedHours = task.estimatedHours || 0;
    const actualHours = task.actualHours || 0;
    const timeVariance = estimatedHours > 0 ? 
      ((actualHours - estimatedHours) / estimatedHours) * 100 : 0;
    
    // Timeline analysis
    const createdDate = parseISO(task.createdAt);
    const startDate = task.startDate ? parseISO(task.startDate) : createdDate;
    const dueDate = task.dueDate ? parseISO(task.dueDate) : null;
    const completedDate = task.completedAt ? parseISO(task.completedAt) : null;
    
    // Duration calculations
    const totalDuration = dueDate ? differenceInDays(dueDate, startDate) : null;
    const timeElapsed = differenceInDays(now, startDate);
    const timeRemaining = dueDate ? differenceInDays(dueDate, now) : null;
    const timeProgress = totalDuration ? Math.min((timeElapsed / totalDuration) * 100, 100) : 0;
    
    // Status analysis
    const isOverdue = dueDate && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && isAfter(now, dueDate);
    const isDueSoon = dueDate && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && 
      isBefore(now, dueDate) && differenceInDays(dueDate, now) <= 3;
    const isBlocked = task.status === 'BLOCKED';
    
    // Completion analysis
    const completedSubtasks = task.subtasks?.filter(st => st.status === 'COMPLETED').length || 0;
    const totalSubtasks = task._count.subtasks;
    const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
    
    // Dependencies analysis
    const totalDependencies = task.dependsOnTasks?.length || 0;
    const completedDependencies = task.dependsOnTasks?.filter(dep => dep.completedAt).length || 0;
    const dependencyProgress = totalDependencies > 0 ? (completedDependencies / totalDependencies) * 100 : 100;
    const canStart = dependencyProgress === 100;
    
    // Performance metrics
    const actualDuration = completedDate ? differenceInDays(completedDate, startDate) : timeElapsed;
    const estimatedDuration = totalDuration || 1;
    const durationVariance = ((actualDuration - estimatedDuration) / estimatedDuration) * 100;
    
    // Task complexity score (0-100)
    let complexityScore = 10; // Base score
    if (totalSubtasks > 0) complexityScore += totalSubtasks * 5;
    if (totalDependencies > 0) complexityScore += totalDependencies * 10;
    if (task.priority === 'HIGH') complexityScore += 15;
    if (task.priority === 'URGENT') complexityScore += 25;
    if (estimatedHours > 8) complexityScore += 20;
    complexityScore = Math.min(100, complexityScore);
    
    return {
      estimatedHours,
      actualHours,
      timeVariance,
      totalDuration,
      timeElapsed,
      timeRemaining,
      timeProgress,
      isOverdue,
      isDueSoon,
      isBlocked,
      completedSubtasks,
      totalSubtasks,
      subtaskProgress,
      totalDependencies,
      completedDependencies,
      dependencyProgress,
      canStart,
      actualDuration,
      durationVariance,
      complexityScore,
      createdDate,
      startDate,
      dueDate,
      completedDate,
    };
  }, [task]);

  const getComplexityColor = (score: number) => {
    if (score >= 80) return 'red';
    if (score >= 60) return 'orange';
    if (score >= 40) return 'yellow';
    return 'green';
  };

  const getComplexityLabel = (score: number) => {
    if (score >= 80) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  return (
    <Stack gap="md">
      {/* Task Overview */}
      <Card padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600} size="lg">Task Analytics</Text>
            <Badge size="lg" color={getComplexityColor(analytics.complexityScore)}>
              {getComplexityLabel(analytics.complexityScore)} Complexity
            </Badge>
          </Group>

          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <Card padding="sm" radius="sm" withBorder>
              <Stack gap="xs" align="center">
                <ThemeIcon size="lg" variant="light" color="blue">
                  <IconClock size="1.25rem" />
                </ThemeIcon>
                <Text fw={600} ta="center">
                  {analytics.actualHours || 0}h
                </Text>
                <Text size="xs" ta="center" c="dimmed">Time Spent</Text>
              </Stack>
            </Card>

            <Card padding="sm" radius="sm" withBorder>
              <Stack gap="xs" align="center">
                <ThemeIcon size="lg" variant="light" color="green">
                  <IconTarget size="1.25rem" />
                </ThemeIcon>
                <Text fw={600} ta="center">
                  {analytics.estimatedHours || 0}h
                </Text>
                <Text size="xs" ta="center" c="dimmed">Estimated</Text>
              </Stack>
            </Card>

            <Card padding="sm" radius="sm" withBorder>
              <Stack gap="xs" align="center">
                <ThemeIcon size="lg" variant="light" color="orange">
                  <IconSubtask size="1.25rem" />
                </ThemeIcon>
                <Text fw={600} ta="center">
                  {analytics.completedSubtasks}/{analytics.totalSubtasks}
                </Text>
                <Text size="xs" ta="center" c="dimmed">Subtasks</Text>
              </Stack>
            </Card>

            <Card padding="sm" radius="sm" withBorder>
              <Stack gap="xs" align="center">
                <ThemeIcon size="lg" variant="light" color="purple">
                  <IconActivity size="1.25rem" />
                </ThemeIcon>
                <Text fw={600} ta="center">
                  {task._count.activities}
                </Text>
                <Text size="xs" ta="center" c="dimmed">Activities</Text>
              </Stack>
            </Card>
          </SimpleGrid>
        </Stack>
      </Card>

      {/* Progress Tracking */}
      <Card padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Text fw={600} size="lg">Progress Tracking</Text>

          {/* Time Progress */}
          {analytics.totalDuration && (
            <div>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={500}>Time Progress</Text>
                <Text size="sm" c="dimmed">
                  {analytics.timeElapsed} of {analytics.totalDuration} days
                </Text>
              </Group>
              <Progress value={analytics.timeProgress} size="lg" color="blue" />
            </div>
          )}

          {/* Subtask Progress */}
          {analytics.totalSubtasks > 0 && (
            <div>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={500}>Subtask Progress</Text>
                <Text size="sm" c="dimmed">
                  {analytics.completedSubtasks} of {analytics.totalSubtasks} completed
                </Text>
              </Group>
              <Progress value={analytics.subtaskProgress} size="lg" color="green" />
            </div>
          )}

          {/* Dependency Progress */}
          {analytics.totalDependencies > 0 && (
            <div>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={500}>Dependencies</Text>
                <Text size="sm" c="dimmed">
                  {analytics.completedDependencies} of {analytics.totalDependencies} completed
                </Text>
              </Group>
              <Progress value={analytics.dependencyProgress} size="lg" color="orange" />
            </div>
          )}

          {/* Time Variance */}
          {analytics.estimatedHours > 0 && analytics.actualHours > 0 && (
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

      {/* Timeline */}
      <Card padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Text fw={600} size="lg">Task Timeline</Text>
          
          <Timeline active={task.status === 'COMPLETED' ? 4 : 
            task.status === 'IN_PROGRESS' ? 2 : 1} bulletSize={20} lineWidth={2}>
            
            <Timeline.Item
              bullet={<IconCalendar size="0.75rem" />}
              title="Task Created"
            >
              <Text size="sm" c="dimmed">
                {format(analytics.createdDate, 'MMM d, yyyy h:mm a')}
              </Text>
              <Text size="xs" c="dimmed">
                {formatDistanceToNow(analytics.createdDate, { addSuffix: true })}
              </Text>
            </Timeline.Item>

            {task.startDate && (
              <Timeline.Item
                bullet={<IconFlag size="0.75rem" />}
                title="Started"
              >
                <Text size="sm" c="dimmed">
                  {format(analytics.startDate, 'MMM d, yyyy h:mm a')}
                </Text>
              </Timeline.Item>
            )}

            {task.status === 'IN_PROGRESS' && (
              <Timeline.Item
                bullet={<IconActivity size="0.75rem" />}
                title="In Progress"
                color="blue"
              >
                <Text size="sm" c="dimmed">
                  Currently being worked on
                </Text>
              </Timeline.Item>
            )}

            {task.completedAt && (
              <Timeline.Item
                bullet={<IconCheck size="0.75rem" />}
                title="Completed"
                color="green"
              >
                <Text size="sm" c="dimmed">
                  {format(analytics.completedDate!, 'MMM d, yyyy h:mm a')}
                </Text>
                <Text size="xs" c="dimmed">
                  Took {analytics.actualDuration} day{analytics.actualDuration !== 1 ? 's' : ''}
                </Text>
              </Timeline.Item>
            )}

            {analytics.dueDate && task.status !== 'COMPLETED' && (
              <Timeline.Item
                bullet={<IconTarget size="0.75rem" />}
                title="Due Date"
                color={analytics.isOverdue ? 'red' : analytics.isDueSoon ? 'orange' : 'gray'}
              >
                <Text size="sm" c="dimmed">
                  {format(analytics.dueDate, 'MMM d, yyyy h:mm a')}
                </Text>
                {analytics.timeRemaining !== null && (
                  <Text size="xs" c={analytics.isOverdue ? 'red' : 'dimmed'}>
                    {analytics.isOverdue ? 'Overdue by' : 'Due in'} {Math.abs(analytics.timeRemaining)} day{Math.abs(analytics.timeRemaining) !== 1 ? 's' : ''}
                  </Text>
                )}
              </Timeline.Item>
            )}
          </Timeline>
        </Stack>
      </Card>

      {/* Alerts */}
      {(analytics.isOverdue || analytics.isBlocked || !analytics.canStart) && (
        <Stack gap="sm">
          {analytics.isOverdue && (
            <Alert
              icon={<IconAlertTriangle size="1rem" />}
              title="Task Overdue"
              color="red"
            >
              This task is {Math.abs(analytics.timeRemaining!)} day{Math.abs(analytics.timeRemaining!) !== 1 ? 's' : ''} overdue and needs immediate attention.
            </Alert>
          )}

          {analytics.isBlocked && (
            <Alert
              icon={<IconFlag size="1rem" />}
              title="Task Blocked"
              color="orange"
            >
              This task is currently blocked and cannot proceed until the blocker is resolved.
            </Alert>
          )}

          {!analytics.canStart && analytics.totalDependencies > 0 && (
            <Alert
              icon={<IconClock size="1rem" />}
              title="Waiting for Dependencies"
              color="yellow"
            >
              This task cannot start until {analytics.totalDependencies - analytics.completedDependencies} dependent task{analytics.totalDependencies - analytics.completedDependencies !== 1 ? 's are' : ' is'} completed.
            </Alert>
          )}
        </Stack>
      )}
    </Stack>
  );
}
