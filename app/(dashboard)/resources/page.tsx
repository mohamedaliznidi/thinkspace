/**
 * Resources Page for ThinkSpace
 * 
 * This page displays and manages resources in the PARA methodology
 * with file previews, import capabilities, and resource organization.
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
  Image,
  Anchor,
  Tooltip,
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconDots,
  IconEdit,
  IconTrash,
  IconBookmark,
  IconDownload,
  IconExternalLink,
  IconFile,
  IconFileText,
  IconPhoto,
  IconVideo,
  IconMusic,
  IconAlertTriangle,
  IconUpload,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { formatDistanceToNow } from 'date-fns';
import { getParaColor } from '@/lib/theme';
import Link from 'next/link';

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: 'DOCUMENT' | 'LINK' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'OTHER';
  url?: string;
  filePath?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
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
  _count: {
    notes: number;
  };
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);

  // Fetch resources
  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...(searchQuery && { search: searchQuery }),
        ...(typeFilter && { type: typeFilter }),
      });

      const response = await fetch(`/api/resources?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setResources(data.data.resources);
        setTotalPages(data.data.pagination.totalPages);
        setError(null);
      } else {
        throw new Error('Failed to fetch resources');
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [currentPage, searchQuery, typeFilter]);

  const handleDeleteResource = async () => {
    if (!resourceToDelete) return;

    try {
      const response = await fetch(`/api/resources/${resourceToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        notifications.show({
          title: 'Resource Deleted',
          message: 'Resource has been successfully deleted.',
          color: 'green',
        });
        fetchResources();
      } else {
        throw new Error('Failed to delete resource');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete resource. Please try again.',
        color: 'red',
      });
    } finally {
      closeDeleteModal();
      setResourceToDelete(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DOCUMENT': return <IconFileText size="1.2rem" />;
      case 'IMAGE': return <IconPhoto size="1.2rem" />;
      case 'VIDEO': return <IconVideo size="1.2rem" />;
      case 'AUDIO': return <IconMusic size="1.2rem" />;
      case 'LINK': return <IconExternalLink size="1.2rem" />;
      default: return <IconFile size="1.2rem" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <Center h="50vh">
        <Stack gap="md" align="center">
          <Loader size="lg" color={getParaColor('resources')} />
          <Text size="sm" c="dimmed">Loading resources...</Text>
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
          <Title order={1} c={getParaColor('resources')}>
            Resources
          </Title>
          <Text c="dimmed" size="sm">
            Your reference library for future use
          </Text>
        </div>
        
        <Group gap="sm">
          <Button
            component={Link}
            href="/resources/upload"
            leftSection={<IconUpload size="1rem" />}
            color={getParaColor('resources')}
            variant="outline"
          >
            Upload
          </Button>
          <Button
            component={Link}
            href="/resources/new"
            leftSection={<IconPlus size="1rem" />}
            color={getParaColor('resources')}
          >
            Add Resource
          </Button>
        </Group>
      </Group>

      {/* Filters and Search */}
      <Card padding="md" radius="md" withBorder>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 8, md: 6 }}>
            <TextInput
              placeholder="Search resources..."
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
                { value: 'DOCUMENT', label: 'Documents' },
                { value: 'LINK', label: 'Links' },
                { value: 'IMAGE', label: 'Images' },
                { value: 'VIDEO', label: 'Videos' },
                { value: 'AUDIO', label: 'Audio' },
                { value: 'OTHER', label: 'Other' },
              ]}
              value={typeFilter}
              onChange={(value) => setTypeFilter(value || '')}
            />
          </Grid.Col>
        </Grid>
      </Card>

      {/* Resources Grid */}
      {resources.length > 0 ? (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
            {resources.map((resource) => (
              <Card key={resource.id} padding="lg" radius="md" withBorder shadow="sm">
                <Stack gap="sm">
                  {/* Thumbnail/Icon */}
                  <Center h={120} style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-md)' }}>
                    {resource.type === 'IMAGE' && resource.url ? (
                      <Image
                        src={resource.url}
                        alt={resource.title}
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

                  {/* Header */}
                  <Group justify="space-between" align="flex-start">
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Group gap="xs">
                        <Badge size="xs" variant="light" color={getParaColor('resources')}>
                          {resource.type}
                        </Badge>
                        {resource.fileType && (
                          <Badge size="xs" variant="outline">
                            {resource.fileType.toUpperCase()}
                          </Badge>
                        )}
                      </Group>
                      
                      <Anchor
                        component={Link}
                        href={`/resources/${resource.id}`}
                        fw={600}
                        size="sm"
                        c="dark"
                        style={{ textDecoration: 'none' }}
                      >
                        <Text fw={600} size="sm" lineClamp={2}>
                          {resource.title}
                        </Text>
                      </Anchor>
                      
                      {resource.description && (
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {resource.description}
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
                        {resource.url && (
                          <Menu.Item
                            leftSection={<IconExternalLink size="0.9rem" />}
                            component="a"
                            href={resource.url}
                            target="_blank"
                          >
                            Open
                          </Menu.Item>
                        )}
                        <Menu.Item
                          leftSection={<IconEdit size="0.9rem" />}
                          component={Link}
                          href={`/resources/${resource.id}/edit`}
                        >
                          Edit
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          leftSection={<IconTrash size="0.9rem" />}
                          color="red"
                          onClick={() => {
                            setResourceToDelete(resource);
                            openDeleteModal();
                          }}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>

                  {/* File info */}
                  {resource.fileSize && (
                    <Text size="xs" c="dimmed">
                      {formatFileSize(resource.fileSize)}
                    </Text>
                  )}

                  {/* Associated project/area */}
                  {(resource.project || resource.area) && (
                    <Group gap="xs">
                      {resource.project && (
                        <Badge size="xs" variant="dot" color="blue">
                          {resource.project.title}
                        </Badge>
                      )}
                      {resource.area && (
                        <Badge size="xs" variant="dot" color={resource.area.color}>
                          {resource.area.title}
                        </Badge>
                      )}
                    </Group>
                  )}

                  {/* Footer */}
                  <Group justify="space-between" align="center" mt="sm">
                    <Text size="xs" c="dimmed">
                      {resource._count.notes} notes
                    </Text>
                    
                    <Text size="xs" c="dimmed">
                      {formatDistanceToNow(new Date(resource.updatedAt), { addSuffix: true })}
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
                color={getParaColor('resources')}
              />
            </Group>
          )}
        </>
      ) : (
        <Card padding="xl" radius="md" withBorder>
          <Stack gap="md" align="center">
            <IconBookmark size="3rem" color={getParaColor('resources')} />
            <Text size="lg" fw={500}>No resources found</Text>
            <Text size="sm" c="dimmed" ta="center">
              Build your reference library by adding resources for future use
            </Text>
            <Group gap="sm">
              <Button
                component={Link}
                href="/resources/upload"
                leftSection={<IconUpload size="1rem" />}
                color={getParaColor('resources')}
                variant="outline"
              >
                Upload Files
              </Button>
              <Button
                component={Link}
                href="/resources/new"
                leftSection={<IconPlus size="1rem" />}
                color={getParaColor('resources')}
              >
                Add Resource
              </Button>
            </Group>
          </Stack>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Resource"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete "{resourceToDelete?.title}"? This action cannot be undone.
          </Text>
          
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteResource}>
              Delete Resource
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
