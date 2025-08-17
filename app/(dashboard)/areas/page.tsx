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
  ActionIcon,
  Menu,
  Modal,
  Alert,
  Center,
  Loader,
  Pagination,
  ColorSwatch,
  Anchor,
  Tabs,
} from '@mantine/core';
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconMap,
  IconTarget,
  IconBookmark,
  IconNote,
  IconAlertTriangle,
  IconSettings,
  IconTemplate,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { formatDistanceToNow } from 'date-fns';
import { getParaColor } from '@/lib/theme';
import Link from 'next/link';
import AreaSearchFilter from '@/components/areas/AreaSearchFilter';
import AreaHealthIndicator from '@/components/areas/AreaHealthIndicator';
import MaintenanceDashboard from '@/components/areas/MaintenanceDashboard';
// Define AreaFilters interface locally since it's not in area-analytics
interface AreaFilters {
  search: string;
  types: string[];
  responsibilityLevels: string[];
  reviewFrequencies: string[];
  healthScoreRange: [number, number];
  isActive: boolean | null;
  hasRecentActivity: boolean | null;
  isReviewOverdue: boolean | null;
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface Area {
  id: string;
  title: string;
  description?: string;
  color: string;
  type: 'RESPONSIBILITY' | 'INTEREST' | 'LEARNING' | 'HEALTH' | 'FINANCE' | 'CAREER' | 'PERSONAL' | 'OTHER';
  responsibilityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reviewFrequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'BIANNUALLY' | 'ANNUALLY' | 'CUSTOM';
  healthScore?: number;
  lastReviewedAt?: string;
  nextReviewDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    projects: number;
    resources: number;
    notes: number;
    subInterests?: number;
  };
}

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('areas');
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);

  // Filters state
  const [filters, setFilters] = useState<AreaFilters>({
    search: '',
    types: [],
    responsibilityLevels: [],
    reviewFrequencies: [],
    healthScoreRange: [0, 1],
    isActive: null,
    hasRecentActivity: null,
    isReviewOverdue: null,
    tags: [],
    sortBy: 'title',
    sortOrder: 'asc',
  });

  // Fetch areas
  const fetchAreas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...(filters.search && { search: filters.search }),
        ...(filters.types.length > 0 && { type: filters.types[0] }),
        ...(filters.isActive !== null && { isActive: filters.isActive.toString() }),
        ...(filters.responsibilityLevels.length > 0 && { responsibilityLevel: filters.responsibilityLevels[0] }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
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
  }, [currentPage, filters]);

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
      case 'LEARNING': return <IconTarget size="1rem" />;
      case 'HEALTH': return <IconNote size="1rem" />;
      case 'FINANCE': return <IconNote size="1rem" />;
      case 'CAREER': return <IconNote size="1rem" />;
      case 'PERSONAL': return <IconNote size="1rem" />;
      case 'OTHER': return <IconMap size="1rem" />;
      default: return <IconMap size="1rem" />;
    }
  };

  const handleAreaClick = (areaId: string) => {
    window.location.href = `/areas/${areaId}`;
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

        <Group gap="sm">
          <Button
            component={Link}
            href="/areas/templates"
            leftSection={<IconTemplate size="1rem" />}
            variant="outline"
            color={getParaColor('areas')}
          >
            Templates
          </Button>
          <Button
            component={Link}
            href="/areas/new"
            leftSection={<IconPlus size="1rem" />}
            color={getParaColor('areas')}
          >
            New Area
          </Button>
        </Group>
      </Group>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'areas')}>
        <Tabs.List>
          <Tabs.Tab value="areas" leftSection={<IconMap size="0.8rem" />}>
            Areas
          </Tabs.Tab>
          <Tabs.Tab value="maintenance" leftSection={<IconSettings size="0.8rem" />}>
            Maintenance
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="areas" pt="md">
          <Stack gap="lg">
            {/* Search and Filters */}
            <AreaSearchFilter
              filters={filters}
              onFiltersChange={setFilters}
              showAdvanced={true}
              compact={false}
            />

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

                  {/* Health Indicator */}
                  <AreaHealthIndicator
                    healthScore={area.healthScore}
                    lastReviewDate={area.lastReviewedAt ? new Date(area.lastReviewedAt) : undefined}
                    nextReviewDate={area.nextReviewDate ? new Date(area.nextReviewDate) : undefined}
                    isReviewOverdue={area.nextReviewDate ? new Date(area.nextReviewDate) < new Date() : false}
                    responsibilityLevel={area.responsibilityLevel}
                    size="sm"
                    showDetails={false}
                  />

                  {/* Stats */}
                  <Group gap="xs">
                    <Text size="xs" c="dimmed">
                      {area._count.projects} projects • {area._count.resources} resources • {area._count.notes} notes
                      {area._count.subInterests !== undefined && ` • ${area._count.subInterests} sub-interests`}
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
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="maintenance" pt="md">
          <MaintenanceDashboard
            onAreaClick={handleAreaClick}
            onScheduleReview={(areaId) => {
              // Handle review scheduling
              window.location.href = `/areas/${areaId}?tab=reviews`;
            }}
          />
        </Tabs.Panel>
      </Tabs>

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
