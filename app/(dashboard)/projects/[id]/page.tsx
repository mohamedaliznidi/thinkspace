/**
 * Project Detail Page for ThinkSpace
 * 
 * This page displays comprehensive information about a specific project
 * including related areas, resources, notes, and project metadata.
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Stack,
  Title,
  Group,
  Button,
  Card,
  Text,
  Badge,
  SimpleGrid,
  ActionIcon,
  Menu,
  Modal,
  Alert,
  Center,
  Loader,
  Progress,
  Anchor,
  Tabs,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconDots,
  IconCalendar,
  IconFlag,
  IconProgress,
  IconUsers,
  IconBookmark,
  IconNotes,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconExternalLink,
  IconPlus,
  IconList,
  IconLayoutKanban,
  IconSubtask,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { formatDistanceToNow, format } from 'date-fns';
import { getParaColor } from '@/lib/theme';
import { TaskList, TaskKanban, TaskForm } from '@/components/tasks';
import { GanttChart, Timeline, CriticalPath } from '@/components/planning';
import { ProjectAnalytics, TaskAnalytics, TimeTracker } from '@/components/analytics';
import { useTaskKeyboardShortcuts } from '@/hooks/useTaskKeyboardShortcuts';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId: string;
  parentTaskId?: string;
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  order: number;
  tags: string[];
  metadata?: Record<string, any>;
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

interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  progress: number;
  startDate?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  areas: Array<{
    id: string;
    title: string;
    color: string;
    description?: string;
  }>;
  resources: Array<{
    id: string;
    title: string;
    description?: string;
    type: string;
    createdAt: string;
  }>;
  notes: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    createdAt: string;
    updatedAt: string;
  }>;
  tasks?: Task[];
  _count: {
    notes: number;
    resources: number;
    tasks?: number;
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  // Task management state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'kanban'>('list');
  const [taskFormOpened, { open: openTaskForm, close: closeTaskForm }] = useDisclosure(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Tab and keyboard shortcuts state
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [focusedTask, setFocusedTask] = useState<Task | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);

  // Fetch project details
  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}`);
      
      if (response.ok) {
        const data = await response.json();
        setProject(data.data.project);
        setError(null);
      } else if (response.status === 404) {
        setError('Project not found');
      } else {
        throw new Error('Failed to fetch project');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  // Fetch project tasks
  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      const response = await fetch(`/api/tasks?projectId=${projectId}&limit=100`);

      if (response.ok) {
        const data = await response.json();
        setTasks(data.data.tasks || []);
        setTasksError(null);
      } else {
        throw new Error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasksError('Failed to load tasks');
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchTasks();
    }
  }, [projectId]);

  // Delete project
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Project deleted successfully',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
        router.push('/projects');
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete project',
        color: 'red',
        icon: <IconAlertTriangle size="1rem" />,
      });
    }
    closeDeleteModal();
  };

  // Task management functions
  const handleTaskCreate = async (taskData: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...taskData,
          projectId,
        }),
      });

      if (response.ok) {
        await fetchTasks();
        closeTaskForm();
        setEditingTask(null);
      } else {
        throw new Error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const handleTaskEdit = (task: any) => {
    // Convert task to form-compatible format
    const formTask: Task = {
      ...task,
      projectId: task.project?.id || projectId,
    };
    setEditingTask(formTask);
    openTaskForm();
  };

  const handleTaskUpdate = async (taskData: any) => {
    if (!editingTask) return;

    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        await fetchTasks();
        closeTaskForm();
        setEditingTask(null);
      } else {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const handleTaskDelete = async (task: any) => {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) return;

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTasks();
        notifications.show({
          title: 'Success',
          message: 'Task deleted successfully',
          color: 'green',
        });
      } else {
        throw new Error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete task',
        color: 'red',
      });
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await fetchTasks();
      } else {
        throw new Error('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update task status',
        color: 'red',
      });
    }
  };

  // Keyboard shortcuts integration
  useTaskKeyboardShortcuts({
    onTaskCreate: openTaskForm,
    onTaskEdit: (task) => {
      setEditingTask(task as Task);
      openTaskForm();
    },
    onTaskDelete: handleTaskDelete,
    onTaskStatusChange: handleTaskStatusChange,
    onBulkComplete: () => {
      if (selectedTasks.length > 0) {
        selectedTasks.forEach(task => {
          handleTaskStatusChange(task.id, 'COMPLETED');
        });
        setSelectedTasks([]);
      }
    },
    onBulkDelete: () => {
      if (selectedTasks.length > 0) {
        selectedTasks.forEach(task => {
          handleTaskDelete(task);
        });
        setSelectedTasks([]);
      }
    },
    onViewModeToggle: () => {
      setTaskViewMode(prev => prev === 'list' ? 'kanban' : 'list');
    },
    onFocusSearch: () => {
      // Focus search input if available
      const searchInput = document.querySelector('input[placeholder*="search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
    selectedTasks,
    focusedTask,
    enabled: activeTab === 'overview', // Only enable shortcuts on overview tab
  });

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'blue';
      case 'ACTIVE': return 'green';
      case 'ON_HOLD': return 'yellow';
      case 'COMPLETED': return 'teal';
      case 'CANCELLED': return 'red';
      case 'ARCHIVED': return 'gray';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'gray';
      case 'MEDIUM': return 'blue';
      case 'HIGH': return 'orange';
      case 'URGENT': return 'red';
      default: return 'gray';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DOCUMENT': return <IconNotes size="1rem" />;
      case 'LINK': return <IconExternalLink size="1rem" />;
      case 'IMAGE': return <IconBookmark size="1rem" />;
      default: return <IconBookmark size="1rem" />;
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  if (loading) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <Loader size="lg" color={getParaColor('projects')} />
          <Text c="dimmed">Loading project...</Text>
        </Stack>
      </Center>
    );
  }

  if (error || !project) {
    return (
      <Stack gap="lg">
        <Group>
          <Button
            component={Link}
            href="/projects"
            variant="subtle"
            leftSection={<IconArrowLeft size="1rem" />}
            color={getParaColor('projects')}
          >
            Back to Projects
          </Button>
        </Group>
        
        <Alert
          icon={<IconAlertTriangle size="1rem" />}
          title="Error"
          color="red"
        >
          {error || 'Project not found'}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Group>
          <Button
            component={Link}
            href="/projects"
            variant="subtle"
            leftSection={<IconArrowLeft size="1rem" />}
            color={getParaColor('projects')}
          >
            Back to Projects
          </Button>
        </Group>
        
        <Group gap="sm">
          <Button
            component={Link}
            href={`/projects/${projectId}/edit`}
            leftSection={<IconEdit size="1rem" />}
            color={getParaColor('projects')}
            variant="outline"
          >
            Edit
          </Button>
          
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="outline" color="gray">
                <IconDots size="1rem" />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconTrash size="1rem" />}
                color="red"
                onClick={openDeleteModal}
              >
                Delete Project
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {/* Project Header */}
      <Card padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap="xs" style={{ flex: 1 }}>
              <Group gap="xs">
                <Badge size="sm" color={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
                <Badge size="sm" variant="outline" color={getPriorityColor(project.priority)}>
                  {project.priority}
                </Badge>
              </Group>

              <Title order={1} c={getParaColor('projects')}>
                {project.title}
              </Title>

              {project.description && (
                <Text c="dimmed">
                  {project.description}
                </Text>
              )}
            </Stack>
          </Group>

          {/* Progress */}
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" fw={500}>Progress</Text>
              <Text size="sm" c="dimmed">{project.progress}%</Text>
            </Group>
            <Progress value={project.progress} color={getParaColor('projects')} />
          </Stack>
        </Stack>
      </Card>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value ?? 'overview')}>
        <Tabs.List>
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.Tab value="planning">Planning</Tabs.Tab>
          <Tabs.Tab value="analytics">Analytics</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <Stack gap="lg">
            {/* Project Metadata */}
            <Card padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Text fw={600} size="lg">Project Details</Text>

                {/* Metadata */}
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                  {project.startDate && (
                    <Group gap="xs">
                      <IconCalendar size="1rem" color="var(--mantine-color-dimmed)" />
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed">Start Date</Text>
                        <Text size="sm">{format(new Date(project.startDate), 'MMM d, yyyy')}</Text>
                      </Stack>
                    </Group>
                  )}

                  {project.dueDate && (
                    <Group gap="xs">
                      <IconFlag size="1rem" color="var(--mantine-color-dimmed)" />
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed">Due Date</Text>
                        <Text size="sm">{format(new Date(project.dueDate), 'MMM d, yyyy')}</Text>
                      </Stack>
                    </Group>
                  )}

                  <Group gap="xs">
                    <IconClock size="1rem" color="var(--mantine-color-dimmed)" />
                    <Stack gap={0}>
                      <Text size="xs" c="dimmed">Created</Text>
                      <Text size="sm">{formatDistanceToNow(new Date(project.createdAt))} ago</Text>
                    </Stack>
                  </Group>

                  <Group gap="xs">
                    <IconProgress size="1rem" color="var(--mantine-color-dimmed)" />
                    <Stack gap={0}>
                      <Text size="xs" c="dimmed">Updated</Text>
                      <Text size="sm">{formatDistanceToNow(new Date(project.updatedAt))} ago</Text>
                    </Stack>
                  </Group>
                </SimpleGrid>

                {/* Tags */}
                {project.tags && project.tags.length > 0 && (
                  <Group gap="xs">
                    <Text size="sm" fw={500}>Tags:</Text>
                    {project.tags.map((tag, index) => (
                      <Badge key={index} size="sm" variant="light" color={getParaColor('projects')}>
                        {tag}
                      </Badge>
                    ))}
                  </Group>
                )}
              </Stack>
            </Card>

            {/* Task Management Section */}
      <Card padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="sm">
              <IconSubtask size="1.25rem" color={getParaColor('projects')} />
              <Title order={3} c={getParaColor('projects')}>
                Tasks ({tasks?.length || 0})
              </Title>
            </Group>

            <Group gap="sm">
              <Button.Group>
                <Button
                  variant={taskViewMode === 'list' ? 'filled' : 'outline'}
                  size="sm"
                  leftSection={<IconList size="1rem" />}
                  onClick={() => setTaskViewMode('list')}
                >
                  List
                </Button>
                <Button
                  variant={taskViewMode === 'kanban' ? 'filled' : 'outline'}
                  size="sm"
                  leftSection={<IconLayoutKanban size="1rem" />}
                  onClick={() => setTaskViewMode('kanban')}
                >
                  Kanban
                </Button>
              </Button.Group>

              <Button
                leftSection={<IconPlus size="1rem" />}
                color={getParaColor('projects')}
                onClick={openTaskForm}
              >
                New Task
              </Button>
            </Group>
          </Group>

          {/* Task View */}
          {taskViewMode === 'list' ? (
            <TaskList
              tasks={tasks || []}
              loading={tasksLoading}
              error={tasksError || undefined}
              onTaskCreate={openTaskForm}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              onTaskStatusChange={handleTaskStatusChange}
              onTaskReorder={async (taskId, newOrder) => {
                // Handle task reordering
                try {
                  const response = await fetch(`/api/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ order: newOrder }),
                  });

                  if (response.ok) {
                    await fetchTasks();
                  }
                } catch (error) {
                  console.error('Error reordering task:', error);
                }
              }}
              onBulkStatusChange={async (taskIds, status) => {
                // Handle bulk status change
                for (const taskId of taskIds) {
                  await handleTaskStatusChange(taskId, status);
                }
                setSelectedTasks([]);
              }}
              onBulkDelete={async (taskIds) => {
                // Handle bulk delete
                for (const taskId of taskIds) {
                  const task = tasks?.find(t => t.id === taskId);
                  if (task) {
                    await handleTaskDelete(task);
                  }
                }
                setSelectedTasks([]);
              }}
              onTaskFocus={(task) => setFocusedTask(task as Task | null)}
              onTaskSelect={(tasks) => setSelectedTasks(tasks as Task[])}
              showProject={false}
              allowReorder={true}
              allowBulkActions={true}
            />
          ) : (
            <TaskKanban
              tasks={tasks || []}
              loading={tasksLoading}
              error={tasksError || undefined}
              onTaskCreate={(status) => {
                setEditingTask({
                  id: '',
                  title: '',
                  status: status || 'TODO',
                  priority: 'MEDIUM',
                  projectId: projectId,
                  order: 0,
                  tags: [],
                  project: { id: projectId, title: project?.title || '', status: project?.status || '' },
                  _count: { subtasks: 0, activities: 0 },
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                } as Task);
                openTaskForm();
              }}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              onTaskStatusChange={handleTaskStatusChange}
              onTaskFocus={(task) => setFocusedTask(task as Task | null)}
              showProject={false}
            />
          )}
        </Stack>
      </Card>

      {/* Related Content */}
      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
        {/* Areas */}
        <Card padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600} c={getParaColor('areas')}>
                Related Areas ({project.areas.length})
              </Text>
              <Button
                component={Link}
                href="/areas"
                size="xs"
                variant="subtle"
                color={getParaColor('areas')}
              >
                View All
              </Button>
            </Group>

            {project.areas.length > 0 ? (
              <Stack gap="sm">
                {project.areas.slice(0, 3).map((area) => (
                  <Card key={area.id} padding="sm" radius="sm" withBorder>
                    <Group justify="space-between">
                      <Group gap="xs">
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: area.color,
                          }}
                        />
                        <Stack gap={0}>
                          <Anchor
                            component={Link}
                            href={`/areas/${area.id}`}
                            size="sm"
                            fw={500}
                            c="dark"
                          >
                            {area.title}
                          </Anchor>
                          {area.description && (
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {area.description}
                            </Text>
                          )}
                        </Stack>
                      </Group>
                    </Group>
                  </Card>
                ))}
                {project.areas.length > 3 && (
                  <Text size="xs" c="dimmed" ta="center">
                    +{project.areas.length - 3} more areas
                  </Text>
                )}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed" ta="center">
                No related areas
              </Text>
            )}
          </Stack>
        </Card>

        {/* Resources */}
        <Card padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600} c={getParaColor('resources')}>
                Resources ({project._count.resources})
              </Text>
              <Button
                component={Link}
                href="/resources"
                size="xs"
                variant="subtle"
                color={getParaColor('resources')}
              >
                View All
              </Button>
            </Group>

            {project.resources.length > 0 ? (
              <Stack gap="sm">
                {project.resources.slice(0, 3).map((resource) => (
                  <Card key={resource.id} padding="sm" radius="sm" withBorder>
                    <Group justify="space-between">
                      <Group gap="xs">
                        <div style={{ color: getParaColor('resources') }}>
                          {getTypeIcon(resource.type)}
                        </div>
                        <Stack gap={0}>
                          <Anchor
                            component={Link}
                            href={`/resources/${resource.id}`}
                            size="sm"
                            fw={500}
                            c="dark"
                          >
                            {resource.title}
                          </Anchor>
                          {resource.description && (
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {resource.description}
                            </Text>
                          )}
                          <Text size="xs" c="dimmed">
                            {formatDistanceToNow(new Date(resource.createdAt))} ago
                          </Text>
                        </Stack>
                      </Group>
                    </Group>
                  </Card>
                ))}
                {project._count.resources > 3 && (
                  <Text size="xs" c="dimmed" ta="center">
                    +{project._count.resources - 3} more resources
                  </Text>
                )}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed" ta="center">
                No resources attached
              </Text>
            )}
          </Stack>
        </Card>

        {/* Notes */}
        <Card padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600} c="orange">
                Notes ({project._count.notes})
              </Text>
              <Button
                component={Link}
                href="/notes"
                size="xs"
                variant="subtle"
                color="orange"
              >
                View All
              </Button>
            </Group>

            {project.notes.length > 0 ? (
              <Stack gap="sm">
                {project.notes.slice(0, 3).map((note) => (
                  <Card key={note.id} padding="sm" radius="sm" withBorder>
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Anchor
                          component={Link}
                          href={`/notes/${note.id}`}
                          size="sm"
                          fw={500}
                          c="dark"
                        >
                          {note.title}
                        </Anchor>
                        <Badge size="xs" variant="light" color="orange">
                          {note.type}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {stripHtml(note.content)}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {formatDistanceToNow(new Date(note.updatedAt))} ago
                      </Text>
                    </Stack>
                  </Card>
                ))}
                {project._count.notes > 3 && (
                  <Text size="xs" c="dimmed" ta="center">
                    +{project._count.notes - 3} more notes
                  </Text>
                )}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed" ta="center">
                No notes created
              </Text>
            )}
          </Stack>
        </Card>
      </SimpleGrid>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="planning" pt="md">
          <Stack gap="lg">
            {/* Gantt Chart */}
            <Card padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Text fw={600} size="lg">Project Timeline</Text>
                <GanttChart
                  tasks={tasks || []}
                  startDate={project.startDate ? new Date(project.startDate) : undefined}
                  endDate={project.dueDate ? new Date(project.dueDate) : undefined}
                  onTaskClick={(task) => {
                    setEditingTask(task as Task);
                    openTaskForm();
                  }}
                  showDependencies={true}
                  showCriticalPath={true}
                />
              </Stack>
            </Card>

            {/* Timeline */}
            <Card padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Text fw={600} size="lg">Project Milestones</Text>
                <Timeline
                  tasks={tasks || []}
                  milestones={[]}
                  onTaskClick={(task) => {
                    setEditingTask(task as Task);
                    openTaskForm();
                  }}
                />
              </Stack>
            </Card>

            {/* Critical Path */}
            <Card padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Text fw={600} size="lg">Critical Path Analysis</Text>
                <CriticalPath
                  tasks={tasks || []}
                  projectStartDate={project.startDate ? new Date(project.startDate) : undefined}
                  projectEndDate={project.dueDate ? new Date(project.dueDate) : undefined}
                />
              </Stack>
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="analytics" pt="md">
          <Stack gap="lg">
            {/* Project Analytics */}
            <ProjectAnalytics
              project={project}
              tasks={tasks || []}
            />

            {/* Time Tracker */}
            {focusedTask && (
              <Card padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Text fw={600} size="lg">Time Tracking - {focusedTask.title}</Text>
                  <TimeTracker
                    task={focusedTask}
                    onTimeUpdate={async (hours) => {
                      // Update task with new time
                      await handleTaskUpdate({
                        ...focusedTask,
                        actualHours: hours,
                      });
                    }}
                  />
                </Stack>
              </Card>
            )}

            {/* Task Analytics */}
            {tasks && tasks.length > 0 && (
              <Card padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Text fw={600} size="lg">Task Analytics</Text>
                  <TaskAnalytics
                    task={tasks[0]} // Show analytics for first task as example
                    projectTasks={tasks}
                  />
                </Stack>
              </Card>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Task Form Modal */}
      <Modal
        opened={taskFormOpened}
        onClose={() => {
          closeTaskForm();
          setEditingTask(null);
        }}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        size="lg"
        centered
      >
        <TaskForm
          task={editingTask || undefined}
          projectId={projectId}
          projects={project ? [{ id: project.id, title: project.title, status: project.status }] : []}
          onSubmit={editingTask ? handleTaskUpdate : handleTaskCreate}
          onCancel={() => {
            closeTaskForm();
            setEditingTask(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Project"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete <strong>{project.title}</strong>?
            This action cannot be undone.
          </Text>

          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDelete}>
              Delete Project
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
