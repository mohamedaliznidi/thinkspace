/**
 * Task Card Component for ThinkSpace
 * 
 * This component displays individual tasks with status, priority,
 * due dates, and action buttons. Supports drag-and-drop functionality.
 */

'use client';

import { useState } from 'react';
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  ActionIcon,
  Menu,
  Progress,
  Anchor,
} from '@mantine/core';
import {
  IconDots,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconClock,
  IconFlag,
  IconSubtask,
  IconLink,
  IconCheck,
  IconX,
  IconPlayerPause,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { formatDistanceToNow, format } from 'date-fns';
import { getParaColor } from '@/lib/theme';
import Link from 'next/link';
import type { TaskDisplay, TaskStatus } from '@/types';

interface TaskCardProps {
  task: TaskDisplay;
  onEdit?: (task: TaskDisplay) => void;
  onDelete?: (task: TaskDisplay) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onDragStart?: (task: TaskDisplay) => void;
  onDragEnd?: () => void;
  draggable?: boolean;
  compact?: boolean;
  showProject?: boolean;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onDragStart,
  onDragEnd,
  draggable = false,
  compact = false,
  showProject = true,
}: TaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'gray';
      case 'IN_PROGRESS': return 'blue';
      case 'IN_REVIEW': return 'yellow';
      case 'BLOCKED': return 'red';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'dark';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'yellow';
      case 'LOW': return 'green';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO': return IconClock;
      case 'IN_PROGRESS': return IconPlayerPlay;
      case 'IN_REVIEW': return IconPlayerPause;
      case 'BLOCKED': return IconX;
      case 'COMPLETED': return IconCheck;
      case 'CANCELLED': return IconX;
      default: return IconClock;
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
  const completedSubtasks = task.subtasks?.filter(st => st.status === 'COMPLETED').length || 0;
  const totalSubtasks = task._count.subtasks;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    if (onDragStart) {
      onDragStart(task);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (onDragEnd) {
      onDragEnd();
    }
  };

  const StatusIcon = getStatusIcon(task.status);

  return (
    <Card
      padding={compact ? "sm" : "md"}
      radius="md"
      withBorder
      shadow="sm"
      style={{
        cursor: draggable ? 'grab' : 'default',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s ease',
      }}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseDown={(e) => {
        if (draggable) {
          e.currentTarget.style.cursor = 'grabbing';
        }
      }}
      onMouseUp={(e) => {
        if (draggable) {
          e.currentTarget.style.cursor = 'grab';
        }
      }}
    >
      <Stack gap={compact ? "xs" : "sm"}>
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Group gap="xs" style={{ flex: 1 }}>
            <StatusIcon size="1rem" color={`var(--mantine-color-${getStatusColor(task.status)}-6)`} />
            <Text
              size={compact ? "sm" : "md"}
              fw={500}
              style={{
                textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none',
                opacity: task.status === 'COMPLETED' ? 0.7 : 1,
              }}
            >
              {task.title}
            </Text>
          </Group>

          <Group gap="xs">
            <Badge size="xs" color={getStatusColor(task.status)}>
              {task.status.replace('_', ' ')}
            </Badge>
            
            {(onEdit || onDelete || onStatusChange) && (
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <ActionIcon variant="subtle" color="gray" size="sm">
                    <IconDots size="1rem" />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {onStatusChange && (
                    <>
                      <Menu.Label>Change Status</Menu.Label>
                      {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'COMPLETED'].map((status) => (
                        <Menu.Item
                          key={status}
                          onClick={() => onStatusChange(task.id, status as TaskStatus)}
                          disabled={task.status === status}
                        >
                          {status.replace('_', ' ')}
                        </Menu.Item>
                      ))}
                      <Menu.Divider />
                    </>
                  )}
                  
                  {onEdit && (
                    <Menu.Item
                      leftSection={<IconEdit size="1rem" />}
                      onClick={() => onEdit(task)}
                    >
                      Edit Task
                    </Menu.Item>
                  )}
                  
                  {onDelete && (
                    <Menu.Item
                      leftSection={<IconTrash size="1rem" />}
                      color="red"
                      onClick={() => onDelete(task)}
                    >
                      Delete Task
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Group>

        {/* Description */}
        {task.description && !compact && (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {task.description}
          </Text>
        )}

        {/* Metadata */}
        <Group gap="xs" wrap="wrap">
          <Badge size="xs" variant="outline" color={getPriorityColor(task.priority)}>
            <IconFlag size="0.75rem" style={{ marginRight: 4 }} />
            {task.priority}
          </Badge>

          {task.dueDate && (
            <Badge 
              size="xs" 
              variant="outline" 
              color={isOverdue ? 'red' : 'blue'}
            >
              <IconCalendar size="0.75rem" style={{ marginRight: 4 }} />
              {format(new Date(task.dueDate), 'MMM d')}
            </Badge>
          )}

          {totalSubtasks > 0 && (
            <Badge size="xs" variant="outline" color="gray">
              <IconSubtask size="0.75rem" style={{ marginRight: 4 }} />
              {completedSubtasks}/{totalSubtasks}
            </Badge>
          )}

          {task.estimatedHours && (
            <Badge size="xs" variant="outline" color="gray">
              <IconClock size="0.75rem" style={{ marginRight: 4 }} />
              {task.estimatedHours}h
            </Badge>
          )}
        </Group>

        {/* Subtask Progress */}
        {totalSubtasks > 0 && !compact && (
          <div>
            <Group justify="space-between" mb={4}>
              <Text size="xs" c="dimmed">Subtasks</Text>
              <Text size="xs" c="dimmed">{Math.round(subtaskProgress)}%</Text>
            </Group>
            <Progress value={subtaskProgress} size="xs" />
          </div>
        )}

        {/* Project Link */}
        {showProject && (
          <Group gap="xs">
            <IconLink size="0.75rem" />
            <Anchor
              component={Link}
              href={`/projects/${task.project.id}`}
              size="xs"
              c={getParaColor('projects')}
            >
              {task.project.title}
            </Anchor>
          </Group>
        )}

        {/* Tags */}
        {task.tags.length > 0 && !compact && (
          <Group gap="xs">
            {task.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} size="xs" variant="light" color="gray">
                {tag}
              </Badge>
            ))}
            {task.tags.length > 3 && (
              <Text size="xs" c="dimmed">+{task.tags.length - 3} more</Text>
            )}
          </Group>
        )}
      </Stack>
    </Card>
  );
}
