/**
 * Project Kanban Component for ThinkSpace
 * 
 * This component provides a kanban board view for projects
 * with drag-and-drop functionality and status management.
 */

'use client';

import { useState } from 'react';
import {
  Stack,
  Group,
  Card,
  Text,
  Badge,
  Progress,
  ActionIcon,
  Menu,
  Title,
  SimpleGrid,
  Box,
  ScrollArea,
} from '@mantine/core';
import {
  IconDots,
  IconEdit,
  IconTrash,
  IconArchive,
  IconCalendar,
} from '@tabler/icons-react';
import { getParaColor } from '@/lib/theme';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  progress?: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  area?: {
    id: string;
    title: string;
    color: string;
  };
  _count: {
    notes: number;
    resources: number;
    tasks: number;
  };
}

interface ProjectKanbanProps {
  projects: Project[];
  onProjectUpdate?: (projectId: string, updates: Partial<Project>) => void;
  onProjectDelete?: (project: Project) => void;
}

const statusColumns = [
  { key: 'ACTIVE', title: 'Active', color: 'blue' },
  { key: 'ON_HOLD', title: 'On Hold', color: 'yellow' },
  { key: 'COMPLETED', title: 'Completed', color: 'green' },
  { key: 'CANCELLED', title: 'Cancelled', color: 'red' },
];

export function ProjectKanban({ projects, onProjectUpdate, onProjectDelete }: ProjectKanbanProps) {
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
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

  const handleDragStart = (project: Project) => {
    setDraggedProject(project);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    
    if (draggedProject && draggedProject.status !== newStatus && onProjectUpdate) {
      onProjectUpdate(draggedProject.id, { status: newStatus as any });
    }
    
    setDraggedProject(null);
  };

  const getProjectsByStatus = (status: string) => {
    return projects.filter(project => project.status === status);
  };

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
      {statusColumns.map((column) => (
        <Box key={column.key}>
          <Card
            padding="md"
            radius="md"
            withBorder
            style={{ minHeight: '600px' }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.key)}
          >
            <Stack gap="md">
              {/* Column Header */}
              <Group justify="space-between">
                <Title order={4} c={column.color}>
                  {column.title}
                </Title>
                <Badge size="sm" color={column.color} variant="light">
                  {getProjectsByStatus(column.key).length}
                </Badge>
              </Group>

              {/* Project Cards */}
              <ScrollArea style={{ height: '520px' }}>
                <Stack gap="sm">
                  {getProjectsByStatus(column.key).map((project) => (
                    <Card
                      key={project.id}
                      padding="sm"
                      radius="md"
                      withBorder
                      shadow="sm"
                      style={{
                        cursor: 'grab',
                        transition: 'transform 0.2s ease',
                      }}
                      draggable
                      onDragStart={() => handleDragStart(project)}
                      onMouseDown={(e) => {
                        e.currentTarget.style.cursor = 'grabbing';
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.cursor = 'grab';
                      }}
                    >
                      <Stack gap="xs">
                        {/* Project Header */}
                        <Group justify="space-between" align="flex-start">
                          <Stack gap="xs" style={{ flex: 1 }}>
                            <Group gap="xs">
                              <Badge size="xs" variant="outline" color={getPriorityColor(project.priority)}>
                                {project.priority}
                              </Badge>
                            </Group>
                            
                            <Text fw={600} size="sm" lineClamp={2}>
                              {project.title}
                            </Text>
                            
                            {project.description && (
                              <Text size="xs" c="dimmed" lineClamp={2}>
                                {project.description}
                              </Text>
                            )}
                          </Stack>

                          <Menu shadow="md" width={200}>
                            <Menu.Target>
                              <ActionIcon variant="subtle" size="sm">
                                <IconDots size="1rem" />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item
                                leftSection={<IconEdit size="0.9rem" />}
                                component={Link}
                                href={`/projects/${project.id}/edit`}
                              >
                                Edit
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<IconArchive size="0.9rem" />}
                              >
                                Archive
                              </Menu.Item>
                              <Menu.Divider />
                              <Menu.Item
                                leftSection={<IconTrash size="0.9rem" />}
                                color="red"
                                onClick={() => onProjectDelete?.(project)}
                              >
                                Delete
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>

                        {/* Progress */}
                        {project.progress !== undefined && (
                          <div>
                            <Group justify="space-between" mb="xs">
                              <Text size="xs" c="dimmed">Progress</Text>
                              <Text size="xs" fw={500}>{project.progress}%</Text>
                            </Group>
                            <Progress 
                              value={project.progress} 
                              size="xs" 
                              radius="xl" 
                              color={getParaColor('projects')} 
                            />
                          </div>
                        )}

                        {/* Area */}
                        {project.area && (
                          <Badge size="xs" variant="light" color={project.area.color}>
                            {project.area.title}
                          </Badge>
                        )}

                        {/* Due Date */}
                        {project.dueDate && (
                          <Group gap="xs">
                            <IconCalendar size="0.8rem" color="var(--mantine-color-dimmed)" />
                            <Text size="xs" c="dimmed">
                              Due {formatTimeAgo(project.dueDate)}
                            </Text>
                          </Group>
                        )}

                        {/* Footer */}
                        <Group justify="space-between" align="center" mt="xs">
                          <Group gap="xs">
                            <Text size="xs" c="dimmed">
                              {project._count.tasks}t • {project._count.notes}n
                            </Text>
                          </Group>
                          
                          <Text size="xs" c="dimmed">
                            {formatTimeAgo(project.updatedAt)}
                          </Text>
                        </Group>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              </ScrollArea>
            </Stack>
          </Card>
        </Box>
      ))}
    </SimpleGrid>
  );
}
