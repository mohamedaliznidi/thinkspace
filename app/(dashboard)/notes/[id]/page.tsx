/**
 * Note Detail Page for ThinkSpace
 * 
 * This page displays comprehensive information about a specific note
 * including related projects, areas, resources, and note metadata.
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
  IconPinFilled,
  IconPin,
  IconFileText,
  IconBulb,
  IconUsers as IconMeeting,
  IconBubble,
  IconChecklist,
  IconSearch,
  IconTemplate,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { formatDistanceToNow, format } from 'date-fns';
import { getParaColor } from '@/lib/theme';
import Link from 'next/link';

interface Note {
  id: string;
  title: string;
  content: string;
  type: 'QUICK' | 'MEETING' | 'IDEA' | 'REFLECTION' | 'SUMMARY' | 'RESEARCH' | 'TEMPLATE' | 'OTHER';
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  projects: Array<{
    id: string;
    title: string;
    status: string;
    description?: string;
  }>;
  areas: Array<{
    id: string;
    title: string;
    color: string;
    description?: string;
  }>;
  resources: Array<{
    id: string;
    title: string;
    type: string;
    description?: string;
  }>;
}

export default function NoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;
  
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  // Fetch note details
  const fetchNote = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notes/${noteId}`);
      
      if (response.ok) {
        const data = await response.json();
        setNote(data.data.note);
        setError(null);
      } else if (response.status === 404) {
        setError('Note not found');
      } else {
        throw new Error('Failed to fetch note');
      }
    } catch (error) {
      console.error('Error fetching note:', error);
      setError('Failed to load note');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (noteId) {
      fetchNote();
    }
  }, [noteId]);

  // Delete note
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Note deleted successfully',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
        router.push('/notes');
      } else {
        throw new Error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete note',
        color: 'red',
        icon: <IconAlertTriangle size="1rem" />,
      });
    }
    closeDeleteModal();
  };

  // Toggle pin status
  const handleTogglePin = async () => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPinned: !note?.isPinned,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNote(data.data.note);
        notifications.show({
          title: 'Success',
          message: `Note ${note?.isPinned ? 'unpinned' : 'pinned'} successfully`,
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
      } else {
        throw new Error('Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update note',
        color: 'red',
        icon: <IconAlertTriangle size="1rem" />,
      });
    }
  };

  // Helper functions
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'QUICK': return <IconNotes size="1rem" />;
      case 'MEETING': return <IconMeeting size="1rem" />;
      case 'IDEA': return <IconBulb size="1rem" />;
      case 'REFLECTION': return <IconBubble size="1rem" />;
      case 'SUMMARY': return <IconChecklist size="1rem" />;
      case 'RESEARCH': return <IconSearch size="1rem" />;
      case 'TEMPLATE': return <IconTemplate size="1rem" />;
      default: return <IconFileText size="1rem" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'QUICK': return 'blue';
      case 'MEETING': return 'green';
      case 'IDEA': return 'yellow';
      case 'REFLECTION': return 'purple';
      case 'SUMMARY': return 'teal';
      case 'RESEARCH': return 'indigo';
      case 'TEMPLATE': return 'orange';
      default: return 'gray';
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

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'DOCUMENT': return <IconFileText size="1rem" />;
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
          <Loader size="lg" color="orange" />
          <Text c="dimmed">Loading note...</Text>
        </Stack>
      </Center>
    );
  }

  if (error || !note) {
    return (
      <Stack gap="lg">
        <Group>
          <Button
            component={Link}
            href="/notes"
            variant="subtle"
            leftSection={<IconArrowLeft size="1rem" />}
            color="orange"
          >
            Back to Notes
          </Button>
        </Group>
        
        <Alert
          icon={<IconAlertTriangle size="1rem" />}
          title="Error"
          color="red"
        >
          {error || 'Note not found'}
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
            href="/notes"
            variant="subtle"
            leftSection={<IconArrowLeft size="1rem" />}
            color="orange"
          >
            Back to Notes
          </Button>
        </Group>
        
        <Group gap="sm">
          <Tooltip label={note.isPinned ? 'Unpin note' : 'Pin note'}>
            <ActionIcon
              variant="outline"
              color={note.isPinned ? 'yellow' : 'gray'}
              onClick={handleTogglePin}
            >
              {note.isPinned ? <IconPinFilled size="1rem" /> : <IconPin size="1rem" />}
            </ActionIcon>
          </Tooltip>
          
          <Button
            component={Link}
            href={`/notes/${noteId}/edit`}
            leftSection={<IconEdit size="1rem" />}
            color="orange"
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
                Delete Note
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {/* Note Header */}
      <Card padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap="xs" style={{ flex: 1 }}>
              <Group gap="xs">
                <Badge
                  size="sm"
                  variant="light"
                  color={getTypeColor(note.type)}
                  leftSection={getTypeIcon(note.type)}
                >
                  {note.type}
                </Badge>
                {note.isPinned && (
                  <Tooltip label="Pinned">
                    <IconPinFilled size="1rem" color="var(--mantine-color-yellow-6)" />
                  </Tooltip>
                )}
              </Group>

              <Title order={1} c="orange">
                {note.title}
              </Title>
            </Stack>
          </Group>

          {/* Metadata */}
          <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
            <Group gap="xs">
              <IconClock size="1rem" color="var(--mantine-color-dimmed)" />
              <Stack gap={0}>
                <Text size="xs" c="dimmed">Created</Text>
                <Text size="sm">{formatDistanceToNow(new Date(note.createdAt))} ago</Text>
              </Stack>
            </Group>

            <Group gap="xs">
              <IconCalendar size="1rem" color="var(--mantine-color-dimmed)" />
              <Stack gap={0}>
                <Text size="xs" c="dimmed">Updated</Text>
                <Text size="sm">{formatDistanceToNow(new Date(note.updatedAt))} ago</Text>
              </Stack>
            </Group>

            <Group gap="xs">
              <IconNotes size="1rem" color="var(--mantine-color-dimmed)" />
              <Stack gap={0}>
                <Text size="xs" c="dimmed">Type</Text>
                <Text size="sm">{note.type}</Text>
              </Stack>
            </Group>
          </SimpleGrid>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <Group gap="xs">
              <Text size="sm" fw={500}>Tags:</Text>
              {note.tags.map((tag, index) => (
                <Badge key={index} size="sm" variant="light" color="orange">
                  {tag}
                </Badge>
              ))}
            </Group>
          )}
        </Stack>
      </Card>

      {/* Note Content */}
      <Card padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Text fw={600} size="lg">Content</Text>
          <Divider />
          <div
            style={{
              minHeight: '200px',
              lineHeight: 1.6,
            }}
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
        </Stack>
      </Card>

      {/* Related Content */}
      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
        {/* Projects */}
        <Card padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600} c={getParaColor('projects')}>
                Related Projects ({note.projects.length})
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

            {note.projects.length > 0 ? (
              <Stack gap="sm">
                {note.projects.slice(0, 3).map((project) => (
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
                        <Badge size="xs" color={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </Group>
                      {project.description && (
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {project.description}
                        </Text>
                      )}
                    </Stack>
                  </Card>
                ))}
                {note.projects.length > 3 && (
                  <Text size="xs" c="dimmed" ta="center">
                    +{note.projects.length - 3} more projects
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
                Related Areas ({note.areas.length})
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

            {note.areas.length > 0 ? (
              <Stack gap="sm">
                {note.areas.slice(0, 3).map((area) => (
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
                        </Stack>
                      </Group>
                    </Group>
                  </Card>
                ))}
                {note.areas.length > 3 && (
                  <Text size="xs" c="dimmed" ta="center">
                    +{note.areas.length - 3} more areas
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
                Related Resources ({note.resources.length})
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

            {note.resources.length > 0 ? (
              <Stack gap="sm">
                {note.resources.slice(0, 3).map((resource) => (
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
                        </Stack>
                      </Group>
                      <Badge size="xs" variant="light" color={getParaColor('resources')}>
                        {resource.type}
                      </Badge>
                    </Group>
                  </Card>
                ))}
                {note.resources.length > 3 && (
                  <Text size="xs" c="dimmed" ta="center">
                    +{note.resources.length - 3} more resources
                  </Text>
                )}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed" ta="center">
                No related resources
              </Text>
            )}
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Note"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete <strong>{note.title}</strong>?
            This action cannot be undone.
          </Text>

          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDelete}>
              Delete Note
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
