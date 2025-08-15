/**
 * Resource Detail Page for ThinkSpace
 * 
 * This page displays comprehensive information about a specific resource
 * including related projects, areas, notes, and resource metadata.
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
  Image,
  ColorSwatch,
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
  IconFile,
  IconFileText,
  IconPhoto,
  IconVideo,
  IconMusic,
  IconDownload,
  IconLink,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { formatDistanceToNow, format } from 'date-fns';
import { getParaColor } from '@/lib/theme';
import Link from 'next/link';

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: 'DOCUMENT' | 'LINK' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'BOOK' | 'ARTICLE' | 'RESEARCH' | 'REFERENCE' | 'TEMPLATE' | 'OTHER';
  sourceUrl?: string;
  filePath?: string;
  contentExtract?: string;
  tags: string[];
  metadata?: any;
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
  areas: Array<{
    id: string;
    title: string;
    description?: string;
    color: string;
    type: string;
    isActive: boolean;
    createdAt: string;
  }>;
  notes: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  _count: {
    projects: number;
    areas: number;
    notes: number;
  };
}

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const resourceId = params.id as string;
  
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  // Fetch resource details
  const fetchResource = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/resources/${resourceId}`);
      
      if (response.ok) {
        const data = await response.json();
        setResource(data.data.resource);
        setError(null);
      } else if (response.status === 404) {
        setError('Resource not found');
      } else {
        throw new Error('Failed to fetch resource');
      }
    } catch (error) {
      console.error('Error fetching resource:', error);
      setError('Failed to load resource');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resourceId) {
      fetchResource();
    }
  }, [resourceId]);

  // Delete resource
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Resource deleted successfully',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
        router.push('/resources');
      } else {
        throw new Error('Failed to delete resource');
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete resource',
        color: 'red',
        icon: <IconAlertTriangle size="1rem" />,
      });
    }
    closeDeleteModal();
  };

  // Helper functions
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DOCUMENT': return <IconFileText size="2rem" />;
      case 'LINK': return <IconLink size="2rem" />;
      case 'IMAGE': return <IconPhoto size="2rem" />;
      case 'VIDEO': return <IconVideo size="2rem" />;
      case 'AUDIO': return <IconMusic size="2rem" />;
      case 'BOOK': return <IconBookmark size="2rem" />;
      case 'ARTICLE': return <IconNotes size="2rem" />;
      case 'RESEARCH': return <IconFile size="2rem" />;
      case 'REFERENCE': return <IconBookmark size="2rem" />;
      case 'TEMPLATE': return <IconFile size="2rem" />;
      default: return <IconFile size="2rem" />;
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

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  if (loading) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <Loader size="lg" color={getParaColor('resources')} />
          <Text c="dimmed">Loading resource...</Text>
        </Stack>
      </Center>
    );
  }

  if (error || !resource) {
    return (
      <Stack gap="lg">
        <Group>
          <Button
            component={Link}
            href="/resources"
            variant="subtle"
            leftSection={<IconArrowLeft size="1rem" />}
            color={getParaColor('resources')}
          >
            Back to Resources
          </Button>
        </Group>
        
        <Alert
          icon={<IconAlertTriangle size="1rem" />}
          title="Error"
          color="red"
        >
          {error || 'Resource not found'}
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
            href="/resources"
            variant="subtle"
            leftSection={<IconArrowLeft size="1rem" />}
            color={getParaColor('resources')}
          >
            Back to Resources
          </Button>
        </Group>
        
        <Group gap="sm">
          <Button
            component={Link}
            href={`/resources/${resourceId}/edit`}
            leftSection={<IconEdit size="1rem" />}
            color={getParaColor('resources')}
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
                Delete Resource
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {/* Resource Header */}
      <Card padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group align="flex-start" gap="md">
            {/* Resource Preview/Icon */}
            <Center
              w={120}
              h={120}
              style={{
                backgroundColor: 'var(--mantine-color-gray-0)',
                borderRadius: 'var(--mantine-radius-md)',
                flexShrink: 0,
              }}
            >
              {resource.type === 'IMAGE' && resource.sourceUrl ? (
                <Image
                  src={resource.sourceUrl}
                  alt={resource.title}
                  w={120}
                  h={120}
                  fit="cover"
                  radius="md"
                />
              ) : (
                <div style={{ color: getParaColor('resources') }}>
                  {getTypeIcon(resource.type)}
                </div>
              )}
            </Center>

            {/* Resource Info */}
            <Stack gap="xs" style={{ flex: 1 }}>
              <Group gap="xs">
                <Badge size="sm" variant="light" color={getParaColor('resources')}>
                  {resource.type}
                </Badge>
              </Group>
              
              <Title order={1} c={getParaColor('resources')}>
                {resource.title}
              </Title>
              
              {resource.description && (
                <Text c="dimmed">
                  {resource.description}
                </Text>
              )}

              {/* Source URL */}
              {resource.sourceUrl && (
                <Group gap="xs">
                  <IconExternalLink size="1rem" color="var(--mantine-color-dimmed)" />
                  <Anchor href={resource.sourceUrl} target="_blank" size="sm">
                    {resource.sourceUrl}
                  </Anchor>
                </Group>
              )}
            </Stack>
          </Group>

          {/* Content Extract */}
          {resource.contentExtract && (
            <Card padding="md" radius="sm" withBorder>
              <Stack gap="xs">
                <Text size="sm" fw={500}>Content Extract</Text>
                <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                  {resource.contentExtract}
                </Text>
              </Stack>
            </Card>
          )}

          {/* Metadata */}
          <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
            <Group gap="xs">
              <IconClock size="1rem" color="var(--mantine-color-dimmed)" />
              <Stack gap={0}>
                <Text size="xs" c="dimmed">Created</Text>
                <Text size="sm">{formatDistanceToNow(new Date(resource.createdAt))} ago</Text>
              </Stack>
            </Group>

            <Group gap="xs">
              <IconCalendar size="1rem" color="var(--mantine-color-dimmed)" />
              <Stack gap={0}>
                <Text size="xs" c="dimmed">Updated</Text>
                <Text size="sm">{formatDistanceToNow(new Date(resource.updatedAt))} ago</Text>
              </Stack>
            </Group>

            <Group gap="xs">
              <IconBookmark size="1rem" color="var(--mantine-color-dimmed)" />
              <Stack gap={0}>
                <Text size="xs" c="dimmed">Type</Text>
                <Text size="sm">{resource.type}</Text>
              </Stack>
            </Group>
          </SimpleGrid>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <Group gap="xs">
              <Text size="sm" fw={500}>Tags:</Text>
              {resource.tags.map((tag, index) => (
                <Badge key={index} size="sm" variant="light" color={getParaColor('resources')}>
                  {tag}
                </Badge>
              ))}
            </Group>
          )}
        </Stack>
      </Card>

      {/* Related Content */}
      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
        {/* Projects */}
        <Card padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600} c={getParaColor('projects')}>
                Related Projects ({resource._count.projects})
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

            {resource.projects.length > 0 ? (
              <Stack gap="sm">
                {resource.projects.slice(0, 3).map((project) => (
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
                {resource._count.projects > 3 && (
                  <Text size="xs" c="dimmed" ta="center">
                    +{resource._count.projects - 3} more projects
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

        {/* Areas */}
        <Card padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600} c={getParaColor('areas')}>
                Related Areas ({resource._count.areas})
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

            {resource.areas.length > 0 ? (
              <Stack gap="sm">
                {resource.areas.slice(0, 3).map((area) => (
                  <Card key={area.id} padding="sm" radius="sm" withBorder>
                    <Group justify="space-between">
                      <Group gap="xs">
                        <ColorSwatch color={area.color} size={12} />
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
                          <Text size="xs" c="dimmed">
                            {formatDistanceToNow(new Date(area.createdAt))} ago
                          </Text>
                        </Stack>
                      </Group>
                      <Badge size="xs" variant="light">
                        {area.type}
                      </Badge>
                    </Group>
                  </Card>
                ))}
                {resource._count.areas > 3 && (
                  <Text size="xs" c="dimmed" ta="center">
                    +{resource._count.areas - 3} more areas
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

        {/* Notes */}
        <Card padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600} c="orange">
                Notes ({resource._count.notes})
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

            {resource.notes.length > 0 ? (
              <Stack gap="sm">
                {resource.notes.slice(0, 3).map((note) => (
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
                        <Group gap="xs">
                          <Badge size="xs" variant="light" color="orange">
                            {note.type}
                          </Badge>
                          {note.isPinned && (
                            <Badge size="xs" color="yellow">
                              Pinned
                            </Badge>
                          )}
                        </Group>
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
                {resource._count.notes > 3 && (
                  <Text size="xs" c="dimmed" ta="center">
                    +{resource._count.notes - 3} more notes
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
        title="Delete Resource"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete <strong>{resource.title}</strong>?
            This action cannot be undone.
          </Text>

          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDelete}>
              Delete Resource
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
