/**
 * Area Detail Page for ThinkSpace
 * 
 * This page displays comprehensive information about a specific area
 * including related projects, resources, notes, and area metadata.
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
  Grid,
  Divider,
  Anchor,
  Tooltip,
  ColorSwatch,
  Switch,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconDots,
  IconCalendar,
  IconUsers,
  IconBookmark,
  IconNotes,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconExternalLink,
  IconTarget,
  IconBriefcase,
  IconHeart,
  IconSchool,
  IconHealthRecognition,
  IconCoin,
  IconUser,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { formatDistanceToNow, format } from 'date-fns';
import { getParaColor } from '@/lib/theme';
import Link from 'next/link';

interface Area {
  id: string;
  title: string;
  description?: string;
  type: 'RESPONSIBILITY' | 'INTEREST' | 'LEARNING' | 'HEALTH' | 'FINANCE' | 'CAREER' | 'PERSONAL' | 'OTHER';
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  projects: Array<{
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    progress: number;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
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
  }>;
  _count: {
    projects: number;
    resources: number;
    notes: number;
  };
}

export default function AreaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const areaId = params.id as string;
  
  const [area, setArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  // Fetch area details
  const fetchArea = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/areas/${areaId}`);
      
      if (response.ok) {
        const data = await response.json();
        setArea(data.data.area);
        setError(null);
      } else if (response.status === 404) {
        setError('Area not found');
      } else {
        throw new Error('Failed to fetch area');
      }
    } catch (error) {
      console.error('Error fetching area:', error);
      setError('Failed to load area');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (areaId) {
      fetchArea();
    }
  }, [areaId]);

  // Delete area
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/areas/${areaId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Area deleted successfully',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
        router.push('/areas');
      } else {
        throw new Error('Failed to delete area');
      }
    } catch (error) {
      console.error('Error deleting area:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete area',
        color: 'red',
        icon: <IconAlertTriangle size="1rem" />,
      });
    }
    closeDeleteModal();
  };

  // Helper functions
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'RESPONSIBILITY': return <IconBriefcase size="1rem" />;
      case 'INTEREST': return <IconHeart size="1rem" />;
      case 'LEARNING': return <IconSchool size="1rem" />;
      case 'HEALTH': return <IconHealthRecognition size="1rem" />;
      case 'FINANCE': return <IconCoin size="1rem" />;
      case 'CAREER': return <IconTarget size="1rem" />;
      case 'PERSONAL': return <IconUser size="1rem" />;
      default: return <IconBookmark size="1rem" />;
    }
  };

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

  const getResourceTypeIcon = (type: string) => {
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
          <Loader size="lg" color={getParaColor('areas')} />
          <Text c="dimmed">Loading area...</Text>
        </Stack>
      </Center>
    );
  }

  if (error || !area) {
    return (
      <Stack gap="lg">
        <Group>
          <Button
            component={Link}
            href="/areas"
            variant="subtle"
            leftSection={<IconArrowLeft size="1rem" />}
            color={getParaColor('areas')}
          >
            Back to Areas
          </Button>
        </Group>
        
        <Alert
          icon={<IconAlertTriangle size="1rem" />}
          title="Error"
          color="red"
        >
          {error || 'Area not found'}
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
            href="/areas"
            variant="subtle"
            leftSection={<IconArrowLeft size="1rem" />}
            color={getParaColor('areas')}
          >
            Back to Areas
          </Button>
        </Group>
        
        <Group gap="sm">
          <Button
            component={Link}
            href={`/areas/${areaId}/edit`}
            leftSection={<IconEdit size="1rem" />}
            color={getParaColor('areas')}
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
                Delete Area
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {/* Area Header */}
      <Card padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap="xs" style={{ flex: 1 }}>
              <Group gap="xs">
                <ColorSwatch color={area.color} size={20} />
                <Badge size="sm" variant="light" leftSection={getTypeIcon(area.type)}>
                  {area.type}
                </Badge>
                {!area.isActive && (
                  <Badge size="sm" color="gray">
                    Inactive
                  </Badge>
                )}
              </Group>
              
              <Title order={1} c={getParaColor('areas')}>
                {area.title}
              </Title>
              
              {area.description && (
                <Text c="dimmed">
                  {area.description}
                </Text>
              )}
            </Stack>
          </Group>

          {/* Metadata */}
          <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
            <Group gap="xs">
              <IconClock size="1rem" color="var(--mantine-color-dimmed)" />
              <Stack gap={0}>
                <Text size="xs" c="dimmed">Created</Text>
                <Text size="sm">{formatDistanceToNow(new Date(area.createdAt))} ago</Text>
              </Stack>
            </Group>
            
            <Group gap="xs">
              <IconCalendar size="1rem" color="var(--mantine-color-dimmed)" />
              <Stack gap={0}>
                <Text size="xs" c="dimmed">Updated</Text>
                <Text size="sm">{formatDistanceToNow(new Date(area.updatedAt))} ago</Text>
              </Stack>
            </Group>

            <Group gap="xs">
              <IconUsers size="1rem" color="var(--mantine-color-dimmed)" />
              <Stack gap={0}>
                <Text size="xs" c="dimmed">Status</Text>
                <Text size="sm">{area.isActive ? 'Active' : 'Inactive'}</Text>
              </Stack>
            </Group>
          </SimpleGrid>
        </Stack>
      </Card>

      {/* Related Content */}
      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
        {/* Projects */}
        <Card padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600} c={getParaColor('projects')}>
                Related Projects ({area._count.projects})
              </Text>
              <Button
                component={Link}
                href="/projects"
                size="xs"
                variant="subtle"
                color={getParaColor('projects')}
              >
                View All
              </Button>
            </Group>

            {area.projects.length > 0 ? (
              <Stack gap="sm">
                {area.projects.slice(0, 3).map((project) => (
                  <Card key={project.id} padding="sm" radius="sm" withBorder>
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Anchor
                          component={Link}
                          href={`/projects/${project.id}`}
                          size="sm"
                          fw={500}
                          c="dark"
                        >
                          {project.title}
                        </Anchor>
                        <Group gap="xs">
                          <Badge size="xs" color={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                          <Badge size="xs" variant="outline" color={getPriorityColor(project.priority)}>
                            {project.priority}
                          </Badge>
                        </Group>
                      </Group>
                      {project.description && (
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {project.description}
                        </Text>
                      )}
                      <Group justify="space-between">
                        <Text size="xs" c="dimmed">
                          Progress: {project.progress}%
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatDistanceToNow(new Date(project.updatedAt))} ago
                        </Text>
                      </Group>
                    </Stack>
                  </Card>
                ))}
                {area._count.projects > 3 && (
                  <Text size="xs" c="dimmed" ta="center">
                    +{area._count.projects - 3} more projects
                  </Text>
                )}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed" ta="center">
                No related projects
              </Text>
            )}
          </Stack>
        </Card>

        {/* Resources */}
        <Card padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600} c={getParaColor('resources')}>
                Resources ({area._count.resources})
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

            {area.resources.length > 0 ? (
              <Stack gap="sm">
                {area.resources.slice(0, 3).map((resource) => (
                  <Card key={resource.id} padding="sm" radius="sm" withBorder>
                    <Group justify="space-between">
                      <Group gap="xs">
                        <div style={{ color: getParaColor('resources') }}>
                          {getResourceTypeIcon(resource.type)}
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
                {area._count.resources > 3 && (
                  <Text size="xs" c="dimmed" ta="center">
                    +{area._count.resources - 3} more resources
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
                Notes ({area._count.notes})
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

            {area.notes.length > 0 ? (
              <Stack gap="sm">
                {area.notes.slice(0, 3).map((note) => (
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
                        {formatDistanceToNow(new Date(note.createdAt))} ago
                      </Text>
                    </Stack>
                  </Card>
                ))}
                {area._count.notes > 3 && (
                  <Text size="xs" c="dimmed" ta="center">
                    +{area._count.notes - 3} more notes
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

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Area"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete <strong>{area.title}</strong>?
            This action cannot be undone.
          </Text>

          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDelete}>
              Delete Area
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
