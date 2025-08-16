/**
 * Critical Path Component for ThinkSpace
 * 
 * This component analyzes and displays the critical path of a project
 * based on task dependencies and durations.
 */

'use client';

import { useMemo } from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Badge,
  Alert,
  Timeline,
  ThemeIcon,
  Progress,
  Divider,
} from '@mantine/core';
import {
  IconRoute,
  IconAlertTriangle,
  IconClock,
  IconFlag,
  IconArrowRight,
  IconTarget,
} from '@tabler/icons-react';
import { differenceInDays, format } from 'date-fns';
import type { TaskPlanningData } from '@/types';

interface CriticalPathProps {
  tasks: TaskPlanningData[];
  projectStartDate?: Date;
  projectEndDate?: Date;
}

interface PathNode {
  task: TaskPlanningData;
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number;
  isCritical: boolean;
  duration: number;
}

export function CriticalPath({
  tasks,
  projectStartDate,
  projectEndDate,
}: CriticalPathProps) {
  
  // Calculate critical path using CPM (Critical Path Method)
  const criticalPathAnalysis = useMemo(() => {
    if (tasks.length === 0) return null;

    // Create a map of tasks for easy lookup
    const taskMap = new Map(tasks.map(task => [task.id, task]));
    
    // Calculate task durations (in days)
    const getTaskDuration = (task: TaskPlanningData): number => {
      if (task.startDate && task.dueDate) {
        return Math.max(1, differenceInDays(new Date(task.dueDate), new Date(task.startDate)));
      }
      // Estimate based on hours if available
      if (task.estimatedHours) {
        return Math.max(1, Math.ceil(task.estimatedHours / 8)); // 8 hours per day
      }
      return 1; // Default to 1 day
    };

    // Initialize nodes
    const nodes: Map<string, PathNode> = new Map();
    
    tasks.forEach(task => {
      nodes.set(task.id, {
        task,
        earliestStart: 0,
        earliestFinish: 0,
        latestStart: 0,
        latestFinish: 0,
        slack: 0,
        isCritical: false,
        duration: getTaskDuration(task),
      });
    });

    // Forward pass - calculate earliest start and finish times
    const calculateEarliestTimes = (taskId: string, visited: Set<string> = new Set()): number => {
      if (visited.has(taskId)) return 0; // Avoid cycles
      visited.add(taskId);

      const node = nodes.get(taskId);
      if (!node) return 0;

      const task = node.task;
      let maxPredecessorFinish = 0;

      // Check dependencies
      if (task.dependsOnTasks) {
        task.dependsOnTasks.forEach(dep => {
          const depFinish = calculateEarliestTimes(dep.id, new Set(visited));
          maxPredecessorFinish = Math.max(maxPredecessorFinish, depFinish);
        });
      }

      node.earliestStart = maxPredecessorFinish;
      node.earliestFinish = node.earliestStart + node.duration;

      return node.earliestFinish;
    };

    // Calculate earliest times for all tasks
    tasks.forEach(task => {
      calculateEarliestTimes(task.id);
    });

    // Find project duration (maximum earliest finish time)
    const projectDuration = Math.max(...Array.from(nodes.values()).map(node => node.earliestFinish));

    // Backward pass - calculate latest start and finish times
    const calculateLatestTimes = (taskId: string, visited: Set<string> = new Set()): number => {
      if (visited.has(taskId)) return projectDuration; // Avoid cycles
      visited.add(taskId);

      const node = nodes.get(taskId);
      if (!node) return projectDuration;

      const task = node.task;
      
      // Find tasks that depend on this task
      const successors = tasks.filter(t => 
        t.dependsOnTasks?.some(dep => dep.id === taskId)
      );

      if (successors.length === 0) {
        // This is an end task
        node.latestFinish = projectDuration;
      } else {
        let minSuccessorStart = projectDuration;
        successors.forEach(successor => {
          const successorStart = calculateLatestTimes(successor.id, new Set(visited));
          minSuccessorStart = Math.min(minSuccessorStart, successorStart);
        });
        node.latestFinish = minSuccessorStart;
      }

      node.latestStart = node.latestFinish - node.duration;
      return node.latestStart;
    };

    // Calculate latest times for all tasks
    tasks.forEach(task => {
      calculateLatestTimes(task.id);
    });

    // Calculate slack and identify critical tasks
    nodes.forEach(node => {
      node.slack = node.latestStart - node.earliestStart;
      node.isCritical = node.slack === 0;
    });

    // Find critical path
    const criticalTasks = Array.from(nodes.values())
      .filter(node => node.isCritical)
      .sort((a, b) => a.earliestStart - b.earliestStart);

    return {
      nodes: Array.from(nodes.values()),
      criticalTasks,
      projectDuration,
      totalSlack: Array.from(nodes.values()).reduce((sum, node) => sum + node.slack, 0),
    };
  }, [tasks]);

  if (!criticalPathAnalysis || criticalPathAnalysis.criticalTasks.length === 0) {
    return (
      <Card padding="lg" radius="md" withBorder>
        <Stack align="center" gap="md" py="xl">
          <ThemeIcon size="xl" variant="light" color="gray">
            <IconRoute size="1.5rem" />
          </ThemeIcon>
          <Text c="dimmed" ta="center">
            No critical path found. Add task dependencies to analyze the critical path.
          </Text>
        </Stack>
      </Card>
    );
  }

  const { criticalTasks, projectDuration, totalSlack } = criticalPathAnalysis;
  const completedCriticalTasks = criticalTasks.filter(node => node.task.status === 'COMPLETED').length;
  const criticalPathProgress = criticalTasks.length > 0 ? (completedCriticalTasks / criticalTasks.length) * 100 : 0;

  return (
    <Card padding="lg" radius="md" withBorder>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="sm">
            <ThemeIcon size="lg" variant="light" color="red">
              <IconRoute size="1.25rem" />
            </ThemeIcon>
            <div>
              <Text fw={600} size="lg">
                Critical Path Analysis
              </Text>
              <Text size="sm" c="dimmed">
                Tasks that directly impact project completion
              </Text>
            </div>
          </Group>
          
          <Badge size="lg" color="red" variant="light">
            {criticalTasks.length} critical tasks
          </Badge>
        </Group>

        {/* Project Summary */}
        <Group grow>
          <Card padding="sm" radius="sm" withBorder>
            <Stack gap="xs" align="center">
              <ThemeIcon size="sm" variant="light" color="blue">
                <IconClock size="1rem" />
              </ThemeIcon>
              <Text size="xs" c="dimmed" ta="center">Project Duration</Text>
              <Text fw={600}>{projectDuration} days</Text>
            </Stack>
          </Card>

          <Card padding="sm" radius="sm" withBorder>
            <Stack gap="xs" align="center">
              <ThemeIcon size="sm" variant="light" color="green">
                <IconTarget size="1rem" />
              </ThemeIcon>
              <Text size="xs" c="dimmed" ta="center">Progress</Text>
              <Text fw={600}>{Math.round(criticalPathProgress)}%</Text>
            </Stack>
          </Card>

          <Card padding="sm" radius="sm" withBorder>
            <Stack gap="xs" align="center">
              <ThemeIcon size="sm" variant="light" color="orange">
                <IconFlag size="1rem" />
              </ThemeIcon>
              <Text size="xs" c="dimmed" ta="center">Total Slack</Text>
              <Text fw={600}>{totalSlack} days</Text>
            </Stack>
          </Card>
        </Group>

        {/* Critical Path Progress */}
        <div>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>Critical Path Progress</Text>
            <Text size="sm" c="dimmed">
              {completedCriticalTasks} of {criticalTasks.length} completed
            </Text>
          </Group>
          <Progress value={criticalPathProgress} color="red" size="lg" />
        </div>

        <Divider />

        {/* Critical Path Timeline */}
        <div>
          <Text fw={500} mb="md">Critical Path Tasks</Text>
          
          {criticalTasks.length > 0 ? (
            <Timeline active={completedCriticalTasks} bulletSize={20} lineWidth={2}>
              {criticalTasks.map((node, index) => {
                const task = node.task;
                const isCompleted = task.status === 'COMPLETED';
                const isBlocked = task.status === 'BLOCKED';
                const isInProgress = task.status === 'IN_PROGRESS';

                return (
                  <Timeline.Item
                    key={task.id}
                    bullet={
                      <ThemeIcon
                        size={20}
                        radius="xl"
                        color={isCompleted ? 'green' : isBlocked ? 'red' : isInProgress ? 'blue' : 'gray'}
                        variant={isCompleted ? 'filled' : 'light'}
                      >
                        {isCompleted ? (
                          <IconTarget size="0.75rem" />
                        ) : isBlocked ? (
                          <IconAlertTriangle size="0.75rem" />
                        ) : (
                          <IconClock size="0.75rem" />
                        )}
                      </ThemeIcon>
                    }
                    title={
                      <Group gap="xs">
                        <Text size="sm" fw={500}>
                          {task.title}
                        </Text>
                        <Badge size="xs" color="red" variant="outline">
                          Critical
                        </Badge>
                        {task.priority === 'URGENT' && (
                          <Badge size="xs" color="red">
                            Urgent
                          </Badge>
                        )}
                      </Group>
                    }
                  >
                    <Stack gap="xs">
                      <Group gap="sm">
                        <Text size="xs" c="dimmed">
                          Duration: {node.duration} day{node.duration !== 1 ? 's' : ''}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Slack: {node.slack} day{node.slack !== 1 ? 's' : ''}
                        </Text>
                      </Group>
                      
                      {task.startDate && task.dueDate && (
                        <Text size="xs" c="dimmed">
                          {format(new Date(task.startDate), 'MMM d')} → {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </Text>
                      )}

                      {task.dependsOnTasks && task.dependsOnTasks.length > 0 && (
                        <Group gap="xs">
                          <Text size="xs" c="dimmed">Depends on:</Text>
                          {task.dependsOnTasks.slice(0, 2).map(dep => (
                            <Badge key={dep.id} size="xs" variant="outline" color="gray">
                              {dep.title}
                            </Badge>
                          ))}
                          {task.dependsOnTasks.length > 2 && (
                            <Text size="xs" c="dimmed">
                              +{task.dependsOnTasks.length - 2} more
                            </Text>
                          )}
                        </Group>
                      )}
                    </Stack>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          ) : (
            <Alert
              icon={<IconAlertTriangle size="1rem" />}
              title="No Critical Path"
              color="yellow"
            >
              Add task dependencies and dates to identify the critical path.
            </Alert>
          )}
        </div>

        {/* Recommendations */}
        {criticalTasks.some(node => node.task.status === 'BLOCKED') && (
          <Alert
            icon={<IconAlertTriangle size="1rem" />}
            title="Critical Path Blocked"
            color="red"
          >
            Some critical path tasks are blocked. Resolve these issues immediately to avoid project delays.
          </Alert>
        )}
      </Stack>
    </Card>
  );
}
