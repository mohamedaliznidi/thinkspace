/**
 * Timeline Component for ThinkSpace
 * 
 * This component provides a vertical timeline view for project
 * milestones, task deadlines, and important events.
 */

'use client';

import { useMemo } from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Badge,
  Timeline as MantineTimeline,
  ThemeIcon,
  Anchor,
  Tooltip,
} from '@mantine/core';
import {
  IconCalendar,
  IconFlag,
  IconCheck,
  IconClock,
  IconAlertTriangle,
  IconTarget,
  IconSubtask,
} from '@tabler/icons-react';
import { format, isToday, isTomorrow, isYesterday, isPast, isFuture } from 'date-fns';
import type { TaskStatus, TaskPriority } from '@/types';

interface TaskForTimeline {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
}

interface Milestone {
  id: string;
  title: string;
  description?: string;
  date: string;
  completed: boolean;
  color?: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: 'task' | 'milestone' | 'deadline' | 'meeting';
  status?: string;
  priority?: string;
  color?: string;
}

interface TimelineProps {
  tasks?: TaskForTimeline[];
  milestones?: Milestone[];
  events?: Event[];
  onTaskClick?: (task: TaskForTimeline) => void;
  onMilestoneClick?: (milestone: Milestone) => void;
  onEventClick?: (event: Event) => void;
  showPastEvents?: boolean;
  maxItems?: number;
}

export function Timeline({
  tasks = [],
  milestones = [],
  events = [],
  onTaskClick,
  onMilestoneClick,
  onEventClick,
  showPastEvents = true,
  maxItems = 20,
}: TimelineProps) {
  
  // Combine and sort all timeline items
  const timelineItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      description?: string;
      date: Date;
      type: 'task' | 'milestone' | 'event';
      status?: string;
      priority?: string;
      color?: string;
      data: TaskForTimeline | Milestone | Event;
    }> = [];

    // Add tasks with due dates
    tasks.forEach(task => {
      if (task.dueDate) {
        items.push({
          id: task.id,
          title: task.title,
          date: new Date(task.dueDate),
          type: 'task',
          status: task.status,
          priority: task.priority,
          data: task,
        });
      }
    });

    // Add milestones
    milestones.forEach(milestone => {
      items.push({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        date: new Date(milestone.date),
        type: 'milestone',
        status: milestone.completed ? 'completed' : 'pending',
        color: milestone.color,
        data: milestone,
      });
    });

    // Add events
    events.forEach(event => {
      items.push({
        id: event.id,
        title: event.title,
        description: event.description,
        date: new Date(event.date),
        type: 'event',
        status: event.status,
        priority: event.priority,
        color: event.color,
        data: event,
      });
    });

    // Filter past events if needed
    const filteredItems = showPastEvents 
      ? items 
      : items.filter(item => !isPast(item.date) || isToday(item.date));

    // Sort by date
    return filteredItems
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, maxItems);
  }, [tasks, milestones, events, showPastEvents, maxItems]);

  const getItemIcon = (item: typeof timelineItems[0]) => {
    switch (item.type) {
      case 'task':
        if (item.status === 'COMPLETED') return IconCheck;
        if (item.status === 'BLOCKED') return IconAlertTriangle;
        if (item.priority === 'URGENT') return IconFlag;
        return IconSubtask;
      case 'milestone':
        return item.status === 'completed' ? IconTarget : IconFlag;
      case 'event':
        return IconCalendar;
      default:
        return IconClock;
    }
  };

  const getItemColor = (item: typeof timelineItems[0]) => {
    if (item.color) return item.color;
    
    switch (item.type) {
      case 'task':
        if (item.status === 'COMPLETED') return 'green';
        if (item.status === 'BLOCKED') return 'red';
        if (item.priority === 'URGENT') return 'red';
        if (item.priority === 'HIGH') return 'orange';
        return 'blue';
      case 'milestone':
        return item.status === 'completed' ? 'green' : 'orange';
      case 'event':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  const handleItemClick = (item: typeof timelineItems[0]) => {
    switch (item.type) {
      case 'task':
        onTaskClick?.(item.data as TaskForTimeline);
        break;
      case 'milestone':
        onMilestoneClick?.(item.data as Milestone);
        break;
      case 'event':
        onEventClick?.(item.data as Event);
        break;
    }
  };

  if (timelineItems.length === 0) {
    return (
      <Card padding="lg" radius="md" withBorder>
        <Stack align="center" gap="md" py="xl">
          <ThemeIcon size="xl" variant="light" color="gray">
            <IconCalendar size="1.5rem" />
          </ThemeIcon>
          <Text c="dimmed" ta="center">
            No upcoming events or deadlines
          </Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Card padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={600} size="lg">
            Project Timeline
          </Text>
          <Badge size="sm" variant="light">
            {timelineItems.length} items
          </Badge>
        </Group>

        <MantineTimeline active={timelineItems.length} bulletSize={24} lineWidth={2}>
          {timelineItems.map((item) => {
            const Icon = getItemIcon(item);
            const color = getItemColor(item);
            const isOverdue = item.type === 'task' && 
              item.status !== 'COMPLETED' && 
              isPast(item.date) && 
              !isToday(item.date);

            return (
              <MantineTimeline.Item
                key={item.id}
                bullet={
                  <ThemeIcon
                    size={24}
                    radius="xl"
                    color={isOverdue ? 'red' : color}
                    variant={item.status === 'COMPLETED' || item.status === 'completed' ? 'filled' : 'light'}
                  >
                    <Icon size="0.875rem" />
                  </ThemeIcon>
                }
                title={
                  <Group gap="xs" align="flex-start">
                    <Anchor
                      size="sm"
                      fw={500}
                      onClick={() => handleItemClick(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      {item.title}
                    </Anchor>
                    
                    {item.type === 'task' && item.priority && (
                      <Badge size="xs" color={item.priority === 'URGENT' ? 'red' : 'orange'}>
                        {item.priority}
                      </Badge>
                    )}
                    
                    {item.status && (
                      <Badge 
                        size="xs" 
                        color={
                          item.status === 'COMPLETED' || item.status === 'completed' 
                            ? 'green' 
                            : item.status === 'BLOCKED' 
                            ? 'red' 
                            : 'blue'
                        }
                      >
                        {item.status.replace('_', ' ')}
                      </Badge>
                    )}
                    
                    {isOverdue && (
                      <Tooltip label="Overdue">
                        <Badge size="xs" color="red">
                          Overdue
                        </Badge>
                      </Tooltip>
                    )}
                  </Group>
                }
              >
                <Stack gap="xs">
                  {item.description && (
                    <Text size="sm" c="dimmed">
                      {item.description}
                    </Text>
                  )}
                  
                  <Group gap="xs">
                    <Text size="xs" c="dimmed">
                      {getDateLabel(item.date)}
                    </Text>
                    
                    {!isToday(item.date) && !isYesterday(item.date) && !isTomorrow(item.date) && (
                      <Text size="xs" c="dimmed">
                        • {format(item.date, 'EEEE')}
                      </Text>
                    )}
                    
                    {isFuture(item.date) && !isTomorrow(item.date) && (
                      <Text size="xs" c="dimmed">
                        • {format(item.date, 'h:mm a')}
                      </Text>
                    )}
                  </Group>
                </Stack>
              </MantineTimeline.Item>
            );
          })}
        </MantineTimeline>

        {timelineItems.length >= maxItems && (
          <Text size="xs" c="dimmed" ta="center">
            Showing first {maxItems} items
          </Text>
        )}
      </Stack>
    </Card>
  );
}
