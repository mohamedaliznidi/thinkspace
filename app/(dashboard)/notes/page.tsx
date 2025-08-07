/**
 * Notes Page for ThinkSpace
 * 
 * This page displays and manages notes with rich text content,
 * categorization, and integration with PARA methodology components.
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
  Grid,
  Tooltip,
  Box,
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconDots,
  IconEdit,
  IconTrash,
  IconNote,
  IconPin,
  IconPinFilled,
  IconTag,
  IconCalendar,
  IconAlertTriangle,
  IconFileText,
  IconBulb,
  IconClipboard,
  IconQuestionMark,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Note {
  id: string;
  title: string;
  content: string;
  type: 'FLEETING' | 'LITERATURE' | 'PERMANENT' | 'PROJECT' | 'MEETING';
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    title: string;
    status: string;
  };
  area?: {
    id: string;
    title: string;
    color: string;
  };
  resource?: {
    id: string;
    title: string;
    type: string;
  };
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  // Fetch notes
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...(searchQuery && { search: searchQuery }),
        ...(typeFilter && { type: typeFilter }),
      });

      const response = await fetch(`/api/notes?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setNotes(data.data.notes);
        setTotalPages(data.data.pagination.totalPages);
        setError(null);
      } else {
        throw new Error('Failed to fetch notes');
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [currentPage, searchQuery, typeFilter]);

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      const response = await fetch(`/api/notes/${noteToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        notifications.show({
          title: 'Note Deleted',
          message: 'Note has been successfully deleted.',
          color: 'green',
        });
        fetchNotes();
      } else {
        throw new Error('Failed to delete note');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete note. Please try again.',
        color: 'red',
      });
    } finally {
      closeDeleteModal();
      setNoteToDelete(null);
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPinned: !note.isPinned,
        }),
      });

      if (response.ok) {
        fetchNotes();
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update note.',
        color: 'red',
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'FLEETING': return <IconBulb size="1rem" />;
      case 'LITERATURE': return <IconFileText size="1rem" />;
      case 'PERMANENT': return <IconNote size="1rem" />;
      case 'PROJECT': return <IconClipboard size="1rem" />;
      case 'MEETING': return <IconCalendar size="1rem" />;
      default: return <IconQuestionMark size="1rem" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'FLEETING': return 'yellow';
      case 'LITERATURE': return 'blue';
      case 'PERMANENT': return 'green';
      case 'PROJECT': return 'violet';
      case 'MEETING': return 'orange';
      default: return 'gray';
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').substring(0, 150);
  };

  if (loading) {
    return (
      <Center h="50vh">
        <Stack gap="md" align="center">
          <Loader size="lg" color="gray" />
          <Text size="sm" c="dimmed">Loading notes...</Text>
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
          <Title order={1}>
            Notes
          </Title>
          <Text c="dimmed" size="sm">
            Capture and organize your thoughts and insights
          </Text>
        </div>
        
        <Button
          component={Link}
          href="/notes/new"
          leftSection={<IconPlus size="1rem" />}
          color="gray"
        >
          New Note
        </Button>
      </Group>

      {/* Filters and Search */}
      <Card padding="md" radius="md" withBorder>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 8, md: 6 }}>
            <TextInput
              placeholder="Search notes..."
              leftSection={<IconSearch size="1rem" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 4, md: 3 }}>
            <Select
              placeholder="Type"
              data={[
                { value: '', label: 'All Types' },
                { value: 'FLEETING', label: 'Fleeting' },
                { value: 'LITERATURE', label: 'Literature' },
                { value: 'PERMANENT', label: 'Permanent' },
                { value: 'PROJECT', label: 'Project' },
                { value: 'MEETING', label: 'Meeting' },
              ]}
              value={typeFilter}
              onChange={(value) => setTypeFilter(value || '')}
            />
          </Grid.Col>
        </Grid>
      </Card>

      {/* Notes Grid */}
      {notes.length > 0 ? (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {notes.map((note) => (
              <Card key={note.id} padding="lg" radius="md" withBorder shadow="sm">
                <Stack gap="sm">
                  {/* Header */}
                  <Group justify="space-between" align="flex-start">
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Group gap="xs">
                        <Badge 
                          size="xs" 
                          variant="light" 
                          color={getTypeColor(note.type)}
                          leftSection={getTypeIcon(note.type)}
                        >
                          {note.type}
                        </Badge>
                        {note.isPinned && (
                          <Tooltip label="Pinned">
                            <IconPinFilled size="0.8rem" color="var(--mantine-color-yellow-6)" />
                          </Tooltip>
                        )}
                      </Group>
                      
                      <Text fw={600} size="sm" lineClamp={2}>
                        {note.title}
                      </Text>
                      
                      <Text size="xs" c="dimmed" lineClamp={4}>
                        {stripHtml(note.content)}
                      </Text>
                    </Stack>

                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" size="sm">
                          <IconDots size="1rem" />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={note.isPinned ? <IconPin size="0.9rem" /> : <IconPinFilled size="0.9rem" />}
                          onClick={() => handleTogglePin(note)}
                        >
                          {note.isPinned ? 'Unpin' : 'Pin'}
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconEdit size="0.9rem" />}
                          component={Link}
                          href={`/notes/${note.id}/edit`}
                        >
                          Edit
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          leftSection={<IconTrash size="0.9rem" />}
                          color="red"
                          onClick={() => {
                            setNoteToDelete(note);
                            openDeleteModal();
                          }}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>

                  {/* Tags */}
                  {note.tags.length > 0 && (
                    <Group gap="xs">
                      {note.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} size="xs" variant="dot" color="gray">
                          {tag}
                        </Badge>
                      ))}
                      {note.tags.length > 3 && (
                        <Text size="xs" c="dimmed">
                          +{note.tags.length - 3} more
                        </Text>
                      )}
                    </Group>
                  )}

                  {/* Associated items */}
                  {(note.project || note.area || note.resource) && (
                    <Group gap="xs">
                      {note.project && (
                        <Badge size="xs" variant="dot" color="blue">
                          {note.project.title}
                        </Badge>
                      )}
                      {note.area && (
                        <Badge size="xs" variant="dot" color={note.area.color}>
                          {note.area.title}
                        </Badge>
                      )}
                      {note.resource && (
                        <Badge size="xs" variant="dot" color="green">
                          {note.resource.title}
                        </Badge>
                      )}
                    </Group>
                  )}

                  {/* Footer */}
                  <Group justify="space-between" align="center" mt="sm">
                    <Text size="xs" c="dimmed">
                      {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                    </Text>
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Group justify="center">
              <Pagination
                value={currentPage}
                onChange={setCurrentPage}
                total={totalPages}
                color="gray"
              />
            </Group>
          )}
        </>
      ) : (
        <Card padding="xl" radius="md" withBorder>
          <Stack gap="md" align="center">
            <IconNote size="3rem" color="var(--mantine-color-gray-6)" />
            <Text size="lg" fw={500}>No notes found</Text>
            <Text size="sm" c="dimmed" ta="center">
              Start capturing your thoughts and insights with your first note
            </Text>
            <Button
              component={Link}
              href="/notes/new"
              leftSection={<IconPlus size="1rem" />}
              color="gray"
            >
              Create Your First Note
            </Button>
          </Stack>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Note"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete "{noteToDelete?.title}"? This action cannot be undone.
          </Text>
          
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteNote}>
              Delete Note
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
