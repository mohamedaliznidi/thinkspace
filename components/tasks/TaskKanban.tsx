/**
 * Task Kanban Component for ThinkSpace
 * 
 * This component displays tasks in a kanban board format with
 * drag-and-drop functionality for status changes.
 */

'use client';

import { useState } from 'react';
import {
  Stack,
  Group,
  Card,
  Text,
  Badge,
  Title,
  SimpleGrid,
  Box,
  ScrollArea,
  Center,
  Button,
  Alert,
  useMantineColorScheme,
} from '@mantine/core';
import {
  IconPlus,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { TaskCard } from './TaskCard';

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
  project: {
    id: string;
    title: string;
    status: string;
  };
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
  _count: {
    subtasks: number;
    activities: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface TaskKanbanProps {
  tasks: Task[];
  loading?: boolean;
  error?: string;
  onTaskCreate?: (status?: Task['status']) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  onTaskStatusChange?: (taskId: string, status: Task['status']) => void;
  onTaskFocus?: (task: Task | null) => void;
  showProject?: boolean;
}

interface StatusColumn {
  key: Task['status'];
  title: string;
  color: string;
  description: string;
}

export function TaskKanban({
  tasks,
  loading = false,
  error,
  onTaskCreate,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  onTaskFocus,
  showProject = true,
}: TaskKanbanProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const { colorScheme } = useMantineColorScheme();

  // Function to get column-specific drop zone background color with opacity
  const getDropZoneBackgroundColor = (columnColor: string) => {
    const isDark = colorScheme === 'dark';

    switch (columnColor) {
      case 'gray':
        return isDark ? 'var(--mantine-color-gray-8)' : 'var(--mantine-color-gray-1)';
      case 'blue':
        return isDark ? 'var(--mantine-color-blue-9)' : 'var(--mantine-color-blue-0)';
      case 'yellow':
        return isDark ? 'var(--mantine-color-yellow-9)' : 'var(--mantine-color-yellow-0)';
      case 'red':
        return isDark ? 'var(--mantine-color-red-9)' : 'var(--mantine-color-red-0)';
      case 'green':
        return isDark ? 'var(--mantine-color-green-9)' : 'var(--mantine-color-green-0)';
      default:
        return isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)';
    }
  };

  const statusColumns: StatusColumn[] = [
    {
      key: 'TODO',
      title: 'To Do',
      color: 'gray',
      description: 'Tasks ready to be started',
    },
    {
      key: 'IN_PROGRESS',
      title: 'In Progress',
      color: 'blue',
      description: 'Tasks currently being worked on',
    },
    {
      key: 'IN_REVIEW',
      title: 'In Review',
      color: 'yellow',
      description: 'Tasks waiting for review',
    },
    {
      key: 'BLOCKED',
      title: 'Blocked',
      color: 'red',
      description: 'Tasks that cannot proceed',
    },
    {
      key: 'COMPLETED',
      title: 'Completed',
      color: 'green',
      description: 'Finished tasks',
    },
  ];

  const getTasksByStatus = (status: Task['status']) => {
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => a.order - b.order);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    
    if (draggedTask && draggedTask.status !== newStatus && onTaskStatusChange) {
      onTaskStatusChange(draggedTask.id, newStatus);
    }
    
    setDraggedTask(null);
  };

  if (error) {
    return (
      <Alert
        icon={<IconAlertTriangle size="1rem" />}
        title="Error loading tasks"
        color="red"
      >
        {error}
      </Alert>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing="md">
      {statusColumns.map((column) => {
        const columnTasks = getTasksByStatus(column.key);
        
        return (
          <Box key={column.key}>
            <Card
              padding="md"
              radius="md"
              withBorder
              style={{
                minHeight: '600px',
                backgroundColor: draggedTask?.status !== column.key
                  ? colorScheme === 'dark'
                    ? 'var(--mantine-color-dark-6)'
                    : 'var(--mantine-color-gray-0)'
                  : getDropZoneBackgroundColor(column.color),
                opacity: draggedTask && draggedTask.status !== column.key ? 0.9 : 1,
                transition: 'all 0.2s ease',
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.key)}
            >
              <Stack gap="md" style={{ height: '100%' }}>
                {/* Column Header */}
                <Group justify="space-between" align="flex-start">
                  <Stack gap="xs">
                    <Group gap="xs">
                      <Title order={4} c={column.color}>
                        {column.title}
                      </Title>
                      <Badge size="sm" color={column.color} variant="light">
                        {columnTasks.length}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {column.description}
                    </Text>
                  </Stack>

                  {onTaskCreate && (
                    <Button
                      size="xs"
                      variant="subtle"
                      color={column.color}
                      leftSection={<IconPlus size="0.875rem" />}
                      onClick={() => onTaskCreate(column.key)}
                    >
                      Add
                    </Button>
                  )}
                </Group>

                {/* Task Cards */}
                <ScrollArea style={{ flex: 1, height: '520px' }}>
                  <Stack gap="sm">
                    {columnTasks.length === 0 ? (
                      <Center py="xl">
                        <Stack align="center" gap="xs">
                          <Text size="sm" c="dimmed">
                            No {column.title.toLowerCase()} tasks
                          </Text>
                          {onTaskCreate && (
                            <Button
                              size="xs"
                              variant="outline"
                              color={column.color}
                              leftSection={<IconPlus size="0.875rem" />}
                              onClick={() => onTaskCreate(column.key)}
                            >
                              Add Task
                            </Button>
                          )}
                        </Stack>
                      </Center>
                    ) : (
                      columnTasks.map((task) => (
                        <div
                          key={task.id}
                          style={{
                            opacity: draggedTask?.id === task.id ? 0.5 : 1,
                            transition: 'opacity 0.2s ease',
                            cursor: 'pointer',
                          }}
                          onClick={() => onTaskFocus && onTaskFocus(task)}
                        >
                          <TaskCard
                            task={task}
                            onEdit={onTaskEdit}
                            onDelete={onTaskDelete}
                            onStatusChange={onTaskStatusChange}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            draggable
                            compact
                            showProject={showProject}
                          />
                        </div>
                      ))
                    )}
                  </Stack>
                </ScrollArea>

                {/* Column Footer */}
                <Group justify="space-between" pt="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                  <Text size="xs" c="dimmed">
                    {columnTasks.length} task{columnTasks.length !== 1 ? 's' : ''}
                  </Text>
                  
                  {column.key === 'COMPLETED' && columnTasks.length > 0 && (
                    <Text size="xs" c="green">
                      {columnTasks.filter(t => t.completedAt).length} done today
                    </Text>
                  )}
                  
                  {column.key === 'BLOCKED' && columnTasks.length > 0 && (
                    <Text size="xs" c="red">
                      Needs attention
                    </Text>
                  )}
                </Group>
              </Stack>
            </Card>
          </Box>
        );
      })}
    </SimpleGrid>
  );
}
