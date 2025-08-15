/**
 * Areas Page for ThinkSpace
 * 
 * This page displays and manages areas of responsibility in the PARA methodology
 * with visual connections, area types, and management operations.
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
  ColorSwatch,
  Box,
  Anchor,
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconDots,
  IconEdit,
  IconTrash,
  IconMap,
  IconTarget,
  IconBookmark,
  IconNote,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { formatDistanceToNow } from 'date-fns';
import { getParaColor } from '@/lib/theme';
import Link from 'next/link';

interface Area {
  id: string;
  title: string;
  description?: string;
  color: string;
  type: 'RESPONSIBILITY' | 'INTEREST' | 'SKILL' | 'GOAL';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    projects: number;
    resources: number;
    notes: number;
  };
}

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('true');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);

  // Fetch areas
  const fetchAreas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...(searchQuery && { search: searchQuery }),
        ...(typeFilter && { type: typeFilter }),
        ...(activeFilter && { isActive: activeFilter }),
      });

      const response = await fetch(`/api/areas?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setAreas(data.data.areas);
        setTotalPages(data.data.pagination.totalPages);
        setError(null);
      } else {
        throw new Error('Failed to fetch areas');
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
      setError('Failed to load areas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, [currentPage, searchQuery, typeFilter, activeFilter]);

  const handleDeleteArea = async () => {
    if (!areaToDelete) return;

    try {
      const response = await fetch(`/api/areas/${areaToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        notifications.show({
          title: 'Area Deleted',
          message: 'Area has been successfully deleted.',
          color: 'green',
        });
        fetchAreas();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete area');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete area. Please try again.',
        color: 'red',
      });
    } finally {
      closeDeleteModal();
      setAreaToDelete(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'RESPONSIBILITY': return <IconMap size="1rem" />;
      case 'INTEREST': return <IconBookmark size="1rem" />;
      case 'SKILL': return <IconTarget size="1rem" />;
      case 'GOAL': return <IconNote size="1rem" />;
      default: return <IconMap size="1rem" />;
    }
  };

  if (loading) {
    return (
      <Center h="50vh">
        <Stack gap="md" align="center">
          <Loader size="lg" color={getParaColor('areas')} />
          <Text size="sm" c="dimmed">Loading areas...</Text>
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
          <Title order={1} c={getParaColor('areas')}>
            Areas
          </Title>
          <Text c="dimmed" size="sm">
            Manage your areas of responsibility and ongoing standards
          </Text>
        </div>
        
        <Button
          component={Link}
          href="/areas/new"
          leftSection={<IconPlus size="1rem" />}
          color={getParaColor('areas')}
        >
          New Area
        </Button>
      </Group>

      {/* Filters and Search */}
      <Card padding="md" radius="md" withBorder>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <TextInput
              placeholder="Search areas..."
              leftSection={<IconSearch size="1rem" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 6, sm: 3, md: 2 }}>
            <Select
              placeholder="Type"
              data={[
                { value: '', label: 'All Types' },
                { value: 'RESPONSIBILITY', label: 'Responsibility' },
                { value: 'INTEREST', label: 'Interest' },
                { value: 'SKILL', label: 'Skill' },
                { value: 'GOAL', label: 'Goal' },
              ]}
              value={typeFilter}
              onChange={(value) => setTypeFilter(value || '')}
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 6, sm: 3, md: 2 }}>
            <Select
              placeholder="Status"
              data={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
                { value: '', label: 'All' },
              ]}
              value={activeFilter}
              onChange={(value) => setActiveFilter(value || '')}
            />
          </Grid.Col>
        </Grid>
      </Card>

      {/* Areas Grid */}
      {areas.length > 0 ? (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {areas.map((area) => (
              <Card key={area.id} padding="lg" radius="md" withBorder shadow="sm">
                <Stack gap="sm">
                  {/* Header */}
                  <Group justify="space-between" align="flex-start">
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Group gap="xs">
                        <ColorSwatch color={area.color} size={16} />
                        <Badge size="xs" variant="light" leftSection={getTypeIcon(area.type)}>
                          {area.type}
                        </Badge>
                        {!area.isActive && (
                          <Badge size="xs" color="gray">
                            Inactive
                          </Badge>
                        )}
                      </Group>
                      
                      <Anchor
                        component={Link}
                        href={`/areas/${area.id}`}
                        fw={600}
                        size="sm"
                        c="dark"
                        style={{ textDecoration: 'none' }}
                      >
                        <Text fw={600} size="sm" lineClamp={2}>
                          {area.title}
                        </Text>
                      </Anchor>
                      
                      {area.description && (
                        <Text size="xs" c="dimmed" lineClamp={3}>
                          {area.description}
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
                          href={`/areas/${area.id}/edit`}
                        >
                          Edit
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          leftSection={<IconTrash size="0.9rem" />}
                          color="red"
                          onClick={() => {
                            setAreaToDelete(area);
                            openDeleteModal();
                          }}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>

                  {/* Stats */}
                  <Group gap="xs">
                    <Text size="xs" c="dimmed">
                      {area._count.projects} projects • {area._count.resources} resources • {area._count.notes} notes
                    </Text>
                  </Group>

                  {/* Footer */}
                  <Group justify="space-between" align="center" mt="sm">
                    <Text size="xs" c="dimmed">
                      Updated {formatDistanceToNow(new Date(area.updatedAt), { addSuffix: true })}
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
                color={getParaColor('areas')}
              />
            </Group>
          )}
        </>
      ) : (
        <Card padding="xl" radius="md" withBorder>
          <Stack gap="md" align="center">
            <IconMap size="3rem" color={getParaColor('areas')} />
            <Text size="lg" fw={500}>No areas found</Text>
            <Text size="sm" c="dimmed" ta="center">
              Create areas to organize your ongoing responsibilities and standards
            </Text>
            <Button
              component={Link}
              href="/areas/new"
              leftSection={<IconPlus size="1rem" />}
              color={getParaColor('areas')}
            >
              Create Your First Area
            </Button>
          </Stack>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Area"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete "{areaToDelete?.title}"? This action cannot be undone.
          </Text>
          
          {areaToDelete && areaToDelete._count.projects > 0 && (
            <Alert color="orange" icon={<IconAlertTriangle size="1rem" />}>
              This area has {areaToDelete._count.projects} active projects. Please move or complete them first.
            </Alert>
          )}
          
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button 
              color="red" 
              onClick={handleDeleteArea}
              disabled={areaToDelete ? areaToDelete._count.projects > 0 : false}
            >
              Delete Area
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
