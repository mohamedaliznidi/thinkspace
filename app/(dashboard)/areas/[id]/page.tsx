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
  Tabs,
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
  IconMap,
  IconChartBar,
  IconSettings,
  IconPlus,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { formatDistanceToNow, format } from 'date-fns';
import { getParaColor } from '@/lib/theme';
import Link from 'next/link';
import AreaHealthIndicator from '@/components/areas/AreaHealthIndicator';
import SubInterestTree from '@/components/areas/SubInterestTree';
import QuickNoteInput from '@/components/areas/QuickNoteInput';
import type { SubInterestWithBasic } from '@/types/sub-interest';

interface Area {
  id: string;
  title: string;
  description?: string;
  type: 'RESPONSIBILITY' | 'INTEREST' | 'LEARNING' | 'HEALTH' | 'FINANCE' | 'CAREER' | 'PERSONAL' | 'OTHER';
  color: string;
  isActive: boolean;
  responsibilityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reviewFrequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'BIANNUALLY' | 'ANNUALLY' | 'CUSTOM';
  healthScore?: number;
  lastReviewedAt?: string;
  nextReviewDate?: string;
  standards?: any[];
  criteria?: any;
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
  subInterests?: Array<{
    id: string;
    title: string;
    description?: string;
    level: number;
    parentId?: string;
    createdAt: string;
    _count: {
      children: number;
      projects: number;
      resources: number;
      notes_rel: number;
    };
  }>;
  areaReviews?: Array<{
    id: string;
    reviewDate: string;
    reviewType: string;
    healthScore?: number;
    notes?: string;
  }>;
  _count: {
    projects: number;
    resources: number;
    notes: number;
    subInterests?: number;
    areaReviews?: number;
  };
}

export default function AreaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const areaId = params.id as string;
  
  const [area, setArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [subInterests, setSubInterests] = useState<SubInterestWithBasic[]>([]);
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

  // Fetch sub-interests
  const fetchSubInterests = async () => {
    try {
      const response = await fetch(`/api/areas/${areaId}/sub-interests`);
      if (response.ok) {
        const data = await response.json();
        setSubInterests(data.data.subInterests);
      }
    } catch (error) {
      console.error('Error fetching sub-interests:', error);
    }
  };

  useEffect(() => {
    if (areaId) {
      fetchArea();
      fetchSubInterests();
    }
  }, [areaId]);

  // Sub-interest handlers
  const handleSubInterestEdit = (subInterest: SubInterestWithBasic) => {
    // Navigate to edit sub-interest (would need to implement this page)
    console.log('Edit sub-interest:', subInterest);
  };

  const handleSubInterestDelete = async (subInterest: SubInterestWithBasic) => {
    try {
      const response = await fetch(`/api/areas/${areaId}/sub-interests/${subInterest.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Sub-interest deleted successfully',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
        fetchSubInterests(); // Refresh the list
      } else {
        throw new Error('Failed to delete sub-interest');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete sub-interest',
        color: 'red',
        icon: <IconAlertTriangle size="1rem" />,
      });
    }
  };

  const handleAddSubInterest = (parentId?: string) => {
    // Navigate to create sub-interest (would need to implement this)
    console.log('Add sub-interest with parent:', parentId);
  };

  const handleNoteCreated = (note: any) => {
    // Refresh area data to update note count
    fetchArea();
  };

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

          {/* Health Indicator and Metadata */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <AreaHealthIndicator
                healthScore={area.healthScore}
                lastReviewDate={area.lastReviewedAt ? new Date(area.lastReviewedAt) : undefined}
                nextReviewDate={area.nextReviewDate ? new Date(area.nextReviewDate) : undefined}
                isReviewOverdue={area.nextReviewDate ? new Date(area.nextReviewDate) < new Date() : false}
                responsibilityLevel={area.responsibilityLevel}
                size="lg"
                showDetails={true}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <SimpleGrid cols={2} spacing="md">
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
              </SimpleGrid>
            </Grid.Col>
          </Grid>
        </Stack>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'overview')}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconTarget size="0.8rem" />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="sub-interests" leftSection={<IconMap size="0.8rem" />}>
            Sub-Interests ({subInterests.length})
          </Tabs.Tab>
          <Tabs.Tab value="analytics" leftSection={<IconChartBar size="0.8rem" />}>
            Analytics
          </Tabs.Tab>
          <Tabs.Tab value="settings" leftSection={<IconSettings size="0.8rem" />}>
            Settings
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <Stack gap="lg">
            {/* Quick Note Input */}
            <QuickNoteInput
              areaId={area.id}
              onNoteCreated={handleNoteCreated}
              placeholder="Quick note or observation about this area..."
            />

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
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="sub-interests" pt="md">
          <SubInterestTree
            areaId={area.id}
            subInterests={subInterests}
            onEdit={handleSubInterestEdit}
            onDelete={handleSubInterestDelete}
            onAddChild={handleAddSubInterest}
            showCounts={true}
            showActions={true}
          />
        </Tabs.Panel>

        <Tabs.Panel value="analytics" pt="md">
          <Card padding="xl" withBorder>
            <Stack gap="md" align="center">
              <IconChartBar size="3rem" color="var(--mantine-color-gray-5)" />
              <Text size="lg" fw={500}>Analytics Coming Soon</Text>
              <Text size="sm" c="dimmed" ta="center">
                Detailed analytics and insights for this area will be available here
              </Text>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="settings" pt="md">
          <Card padding="xl" withBorder>
            <Stack gap="md" align="center">
              <IconSettings size="3rem" color="var(--mantine-color-gray-5)" />
              <Text size="lg" fw={500}>Settings Coming Soon</Text>
              <Text size="sm" c="dimmed" ta="center">
                Area settings and configuration options will be available here
              </Text>
            </Stack>
          </Card>
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
