/**
 * Archive Page for ThinkSpace
 * 
 * This page displays archived items (completed/cancelled projects and inactive areas)
 * with filtering, restoration capabilities, and bulk operations.
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
  Checkbox,
  Tabs,
} from '@mantine/core';
import {
  IconSearch,
  IconDots,
  IconRestore,
  IconTrash,
  IconArchive,
  IconTarget,
  IconMap,
  IconAlertTriangle,
  IconCheck,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { getParaColor } from '@/lib/theme';

interface ArchivedProject {
  id: string;
  title: string;
  description?: string;
  status: 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  completedAt?: string;
  archivedAt: string;
  area?: {
    id: string;
    title: string;
    color: string;
  };
}

interface ArchivedArea {
  id: string;
  title: string;
  description?: string;
  type: 'RESPONSIBILITY' | 'INTEREST' | 'SKILL' | 'GOAL';
  color: string;
  archivedAt: string;
  _count: {
    projects: number;
  };
}

export default function ArchivePage() {
  const [projects, setProjects] = useState<ArchivedProject[]>([]);
  const [areas, setAreas] = useState<ArchivedArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>('projects');
  const [restoreModalOpened, { open: openRestoreModal, close: closeRestoreModal }] = useDisclosure(false);
  const [itemToRestore, setItemToRestore] = useState<any>(null);

  // Fetch archived items
  const fetchArchivedItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter && { status: statusFilter }),
      });

      const [projectsResponse, areasResponse] = await Promise.all([
        fetch(`/api/projects?${params}&status=COMPLETED,CANCELLED`),
        fetch(`/api/areas?${params}&isActive=false`),
      ]);

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.data.projects);
      }

      if (areasResponse.ok) {
        const areasData = await areasResponse.json();
        setAreas(areasData.data.areas);
      }

      setError(null);
    } catch (error) {
      console.error('Error fetching archived items:', error);
      setError('Failed to load archived items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedItems();
  }, [currentPage, searchQuery, statusFilter]);

  const handleRestore = async () => {
    if (!itemToRestore) return;

    try {
      const isProject = 'status' in itemToRestore;
      const endpoint = isProject ? `/api/projects/${itemToRestore.id}` : `/api/areas/${itemToRestore.id}`;
      const updateData = isProject 
        ? { status: 'ACTIVE' }
        : { isActive: true };

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        notifications.show({
          title: 'Item Restored',
          message: `${itemToRestore.title} has been restored successfully.`,
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
        fetchArchivedItems();
      } else {
        throw new Error('Failed to restore item');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to restore item. Please try again.',
        color: 'red',
        icon: <IconAlertTriangle size="1rem" />,
      });
    } finally {
      closeRestoreModal();
      setItemToRestore(null);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedItems.size === 0) return;

    try {
      const promises = Array.from(selectedItems).map(async (itemId) => {
        const isProject = projects.some(p => p.id === itemId);
        const endpoint = isProject ? `/api/projects/${itemId}` : `/api/areas/${itemId}`;
        const updateData = isProject ? { status: 'ACTIVE' } : { isActive: true };

        return fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
      });

      await Promise.all(promises);

      notifications.show({
        title: 'Items Restored',
        message: `${selectedItems.size} items have been restored successfully.`,
        color: 'green',
        icon: <IconCheck size="1rem" />,
      });

      setSelectedItems(new Set());
      fetchArchivedItems();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to restore some items. Please try again.',
        color: 'red',
        icon: <IconAlertTriangle size="1rem" />,
      });
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInDays = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 1) return 'today';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    return `${Math.floor(diffInDays / 30)}mo ago`;
  };

  if (loading) {
    return (
      <Center h="50vh">
        <Stack gap="md" align="center">
          <Loader size="lg" color="gray" />
          <Text size="sm" c="dimmed">Loading archived items...</Text>
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
          <Title order={1} c="gray">
            Archive
          </Title>
          <Text c="dimmed" size="sm">
            Completed projects and inactive areas
          </Text>
        </div>
        
        {selectedItems.size > 0 && (
          <Group gap="sm">
            <Button
              variant="outline"
              leftSection={<IconRestore size="1rem" />}
              onClick={handleBulkRestore}
            >
              Restore Selected ({selectedItems.size})
            </Button>
          </Group>
        )}
      </Group>

      {/* Filters and Search */}
      <Card padding="md" radius="md" withBorder>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <TextInput
              placeholder="Search archived items..."
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
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || '')}
            />
          </Grid.Col>
        </Grid>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'projects')}>
        <Tabs.List>
          <Tabs.Tab value="projects" leftSection={<IconTarget size="0.8rem" />}>
            Projects ({projects.length})
          </Tabs.Tab>
          <Tabs.Tab value="areas" leftSection={<IconMap size="0.8rem" />}>
            Areas ({areas.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="projects" pt="md">
          {projects.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {projects.map((project) => (
                <Card key={project.id} padding="lg" radius="md" withBorder shadow="sm">
                  <Stack gap="sm">
                    <Group justify="space-between" align="flex-start">
                      <Checkbox
                        checked={selectedItems.has(project.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedItems);
                          if (e.currentTarget.checked) {
                            newSelected.add(project.id);
                          } else {
                            newSelected.delete(project.id);
                          }
                          setSelectedItems(newSelected);
                        }}
                      />

                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" size="sm">
                            <IconDots size="1rem" />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconRestore size="0.9rem" />}
                            onClick={() => {
                              setItemToRestore(project);
                              openRestoreModal();
                            }}
                          >
                            Restore
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            leftSection={<IconTrash size="0.9rem" />}
                            color="red"
                          >
                            Delete Permanently
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>

                    <Stack gap="xs">
                      <Group gap="xs">
                        <Badge size="xs" color={project.status === 'COMPLETED' ? 'green' : 'red'}>
                          {project.status}
                        </Badge>
                      </Group>
                      
                      <Text fw={600} size="sm" lineClamp={2}>
                        {project.title}
                      </Text>
                      
                      {project.description && (
                        <Text size="xs" c="dimmed" lineClamp={3}>
                          {project.description}
                        </Text>
                      )}
                    </Stack>

                    {project.area && (
                      <Badge size="sm" variant="light" color={project.area.color}>
                        {project.area.title}
                      </Badge>
                    )}

                    <Text size="xs" c="dimmed">
                      Archived {formatTimeAgo(project.archivedAt)}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          ) : (
            <Card padding="xl" radius="md" withBorder>
              <Stack gap="md" align="center">
                <IconTarget size="3rem" color="var(--mantine-color-gray-5)" />
                <Text size="lg" fw={500}>No archived projects</Text>
                <Text size="sm" c="dimmed" ta="center">
                  Completed and cancelled projects will appear here
                </Text>
              </Stack>
            </Card>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="areas" pt="md">
          {areas.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {areas.map((area) => (
                <Card key={area.id} padding="lg" radius="md" withBorder shadow="sm">
                  <Stack gap="sm">
                    <Group justify="space-between" align="flex-start">
                      <Checkbox
                        checked={selectedItems.has(area.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedItems);
                          if (e.currentTarget.checked) {
                            newSelected.add(area.id);
                          } else {
                            newSelected.delete(area.id);
                          }
                          setSelectedItems(newSelected);
                        }}
                      />

                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" size="sm">
                            <IconDots size="1rem" />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconRestore size="0.9rem" />}
                            onClick={() => {
                              setItemToRestore(area);
                              openRestoreModal();
                            }}
                          >
                            Restore
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            leftSection={<IconTrash size="0.9rem" />}
                            color="red"
                          >
                            Delete Permanently
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>

                    <Stack gap="xs">
                      <Group gap="xs">
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: area.color,
                          }}
                        />
                        <Badge size="xs" variant="light">
                          {area.type}
                        </Badge>
                      </Group>
                      
                      <Text fw={600} size="sm" lineClamp={2}>
                        {area.title}
                      </Text>
                      
                      {area.description && (
                        <Text size="xs" c="dimmed" lineClamp={3}>
                          {area.description}
                        </Text>
                      )}
                    </Stack>

                    <Text size="xs" c="dimmed">
                      {area._count.projects} projects • Archived {formatTimeAgo(area.archivedAt)}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          ) : (
            <Card padding="xl" radius="md" withBorder>
              <Stack gap="md" align="center">
                <IconMap size="3rem" color="var(--mantine-color-gray-5)" />
                <Text size="lg" fw={500}>No archived areas</Text>
                <Text size="sm" c="dimmed" ta="center">
                  Inactive areas will appear here
                </Text>
              </Stack>
            </Card>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Restore Confirmation Modal */}
      <Modal
        opened={restoreModalOpened}
        onClose={closeRestoreModal}
        title="Restore Item"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to restore "{itemToRestore?.title}"? This will make it active again.
          </Text>
          
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeRestoreModal}>
              Cancel
            </Button>
            <Button color="blue" onClick={handleRestore}>
              Restore Item
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
