/**
 * Projects Page for ThinkSpace
 * 
 * This page displays and manages projects in the PARA methodology
 * with grid/kanban views, filtering, and project operations.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Stack,
  Title,
  Group,
  Button,
  Card,
  Text,
  Badge,
  Progress,
  SimpleGrid,
  TextInput,
  Select,
  ActionIcon,
  Menu,
  Modal,
  Alert,
  Center,
  Loader,
  Pagination,
  Tabs,
  Grid,
  Anchor,
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconDots,
  IconEdit,
  IconTrash,
  IconArchive,
  IconTarget,
  IconCalendar,
  IconUser,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { formatDistanceToNow } from 'date-fns';
import { getParaColor } from '@/lib/theme';
import { ProjectKanban } from '@/components/projects/ProjectKanban';
import Link from 'next/link';
import type { ProjectWithCounts } from '@/types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectWithCounts | null>(null);

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
      });

      const response = await fetch(`/api/projects?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.data.projects);
        setTotalPages(data.data.pagination.totalPages);
        setError(null);
      } else {
        throw new Error('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [currentPage, searchQuery, statusFilter, priorityFilter]);

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        notifications.show({
          title: 'Project Deleted',
          message: 'Project has been successfully deleted.',
          color: 'green',
        });
        fetchProjects();
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete project. Please try again.',
        color: 'red',
      });
    } finally {
      closeDeleteModal();
      setProjectToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'blue';
      case 'COMPLETED': return 'green';
      case 'ON_HOLD': return 'yellow';
      case 'CANCELLED': return 'red';
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

  if (loading) {
    return (
      <Center h="50vh">
        <Stack gap="md" align="center">
          <Loader size="lg" color={getParaColor('projects')} />
          <Text size="sm" c="dimmed">Loading projects...</Text>
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

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={1} c={getParaColor('projects')}>
            Projects
          </Title>
          <Text c="dimmed" size="sm">
            Manage your projects with specific outcomes and deadlines
          </Text>
        </div>
        
        <Button
          component={Link}
          href="/projects/new"
          leftSection={<IconPlus size="1rem" />}
          color={getParaColor('projects')}
        >
          New Project
        </Button>
      </Group>

      {/* Filters and Search */}
      <Card padding="md" radius="md" withBorder>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <TextInput
              placeholder="Search projects..."
              leftSection={<IconSearch size="1rem" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 6, sm: 3, md: 2 }}>
            <Select
              placeholder="Status"
              data={[
                { value: '', label: 'All Status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'ON_HOLD', label: 'On Hold' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || '')}
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 6, sm: 3, md: 2 }}>
            <Select
              placeholder="Priority"
              data={[
                { value: '', label: 'All Priority' },
                { value: 'URGENT', label: 'Urgent' },
                { value: 'HIGH', label: 'High' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'LOW', label: 'Low' },
              ]}
              value={priorityFilter}
              onChange={(value) => setPriorityFilter(value || '')}
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Tabs value={viewMode} onChange={(value) => setViewMode(value as 'grid' | 'kanban')}>
              <Tabs.List>
                <Tabs.Tab value="grid">Grid View</Tabs.Tab>
                <Tabs.Tab value="kanban">Kanban View</Tabs.Tab>
              </Tabs.List>
            </Tabs>
          </Grid.Col>
        </Grid>
      </Card>

      {/* Projects Content */}
      {projects.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {projects.map((project) => (
              <Card key={project.id} padding="lg" radius="md" withBorder shadow="sm">
                <Stack gap="sm">
                  {/* Header */}
                  <Group justify="space-between" align="flex-start">
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Group gap="xs">
                        <Badge size="xs" color={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        <Badge size="xs" variant="outline" color={getPriorityColor(project.priority)}>
                          {project.priority}
                        </Badge>
                      </Group>
                      
                      <Anchor
                        component={Link}
                        href={`/projects/${project.id}`}
                        fw={600}
                        size="sm"
                        c="dark"
                        style={{ textDecoration: 'none' }}
                      >
                        <Text fw={600} size="sm" lineClamp={2}>
                          {project.title}
                        </Text>
                      </Anchor>
                      
                      {project.description && (
                        <Text size="xs" c="dimmed" lineClamp={3}>
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
                          onClick={() => {
                            setProjectToDelete(project);
                            openDeleteModal();
                          }}
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
                      <Progress value={project.progress} size="sm" radius="xl" color={getParaColor('projects')} />
                    </div>
                  )}

                  {/* Area */}
                  {project.area && (
                    <Badge size="sm" variant="light" color={project.area.color}>
                      {project.area.title}
                    </Badge>
                  )}

                  {/* Footer */}
                  <Group justify="space-between" align="center" mt="sm">
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">
                        {project._count.tasks} tasks • {project._count.notes} notes
                      </Text>
                    </Group>
                    
                    <Text size="xs" c="dimmed">
                      {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                    </Text>
                  </Group>
                </Stack>
              </Card>
            ))}
            </SimpleGrid>
          ) : (
            <ProjectKanban
              projects={projects}
              onProjectUpdate={async (projectId, updates) => {
                try {
                  const response = await fetch(`/api/projects/${projectId}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updates),
                  });

                  if (response.ok) {
                    fetchProjects();
                  }
                } catch (error) {
                  console.error('Error updating project:', error);
                }
              }}
              onProjectDelete={(project) => {
                setProjectToDelete(project);
                openDeleteModal();
              }}
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Group justify="center">
              <Pagination
                value={currentPage}
                onChange={setCurrentPage}
                total={totalPages}
                color={getParaColor('projects')}
              />
            </Group>
          )}
        </>
      ) : (
        <Card padding="xl" radius="md" withBorder>
          <Stack gap="md" align="center">
            <IconTarget size="3rem" color={getParaColor('projects')} />
            <Text size="lg" fw={500}>No projects found</Text>
            <Text size="sm" c="dimmed" ta="center">
              Start organizing your work by creating your first project
            </Text>
            <Button
              component={Link}
              href="/projects/new"
              leftSection={<IconPlus size="1rem" />}
              color={getParaColor('projects')}
            >
              Create Your First Project
            </Button>
          </Stack>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Project"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete "{projectToDelete?.title}"? This action cannot be undone.
          </Text>
          
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
