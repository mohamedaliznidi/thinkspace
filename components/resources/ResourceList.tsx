/**
 * Resource List Component
 *
 * Displays resources in list or table format with selection,
 * sorting, and action capabilities.
 */

'use client';

import React from 'react';
import {
  IconFile,
  IconLink,
  IconPhoto,
  IconVideo,
  IconVolume,
  IconBook,
  IconNews,
  IconSchool,
  IconBookmark,
  IconCopy,
  IconDots,
  IconEye,
  IconEdit,
  IconTrash,
  IconShare
} from '@tabler/icons-react';
import {
  Badge,
  Button,
  Checkbox,
  Card,
  Menu,
  ActionIcon,
  Group,
  Stack,
  Text,
  Table,
  Loader,
  Center
} from '@mantine/core';
import { formatDistanceToNow } from 'date-fns';
import type { EnhancedResource } from '@/types/resources';
import type { ResourceType } from '@prisma/client'

interface ResourceListProps {
  resources: EnhancedResource[];
  loading?: boolean;
  viewMode?: 'list' | 'table';
  selectedResources?: string[];
  onResourceSelect?: (resourceId: string, selected: boolean) => void;
  onResourceClick?: (resource: EnhancedResource) => void;
  onResourceEdit?: (resource: EnhancedResource) => void;
  onResourceDelete?: (resource: EnhancedResource) => void;
  onResourceShare?: (resource: EnhancedResource) => void;
}

const RESOURCE_ICONS: Record<ResourceType, any> = {
  DOCUMENT: IconFile,
  LINK: IconLink,
  IMAGE: IconPhoto,
  VIDEO: IconVideo,
  AUDIO: IconVolume,
  BOOK: IconBook,
  ARTICLE: IconNews,
  RESEARCH: IconSchool,
  REFERENCE: IconBookmark,
  TEMPLATE: IconCopy,
  OTHER: IconFile,
};

export function ResourceList({
  resources,
  loading = false,
  viewMode = 'list',
  selectedResources = [],
  onResourceSelect,
  onResourceClick,
  onResourceEdit,
  onResourceDelete,
  onResourceShare,
}: ResourceListProps) {
  const getResourceIcon = (type: ResourceType) => {
    const IconComponent = RESOURCE_ICONS[type] || IconFile;
    return <IconComponent size={20} />;
  };

  const getResourceTypeColor = (type: ResourceType): string => {
    const colors: Record<ResourceType, string> = {
      DOCUMENT: 'blue',
      LINK: 'green',
      IMAGE: 'purple',
      VIDEO: 'red',
      AUDIO: 'yellow',
      BOOK: 'indigo',
      ARTICLE: 'cyan',
      RESEARCH: 'orange',
      REFERENCE: 'pink',
      TEMPLATE: 'gray',
      OTHER: 'gray',
    };
    return colors[type] || colors.OTHER;
  };

  const handleResourceSelect = (resourceId: string, checked: boolean) => {
    onResourceSelect?.(resourceId, checked);
  };

  const renderResourceActions = (resource: EnhancedResource) => (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <ActionIcon variant="subtle" size="sm">
          <IconDots size={16} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconEye size={14} />}
          onClick={() => onResourceClick?.(resource)}
        >
          View
        </Menu.Item>
        <Menu.Item
          leftSection={<IconEdit size={14} />}
          onClick={() => onResourceEdit?.(resource)}
        >
          Edit
        </Menu.Item>
        <Menu.Item
          leftSection={<IconShare size={14} />}
          onClick={() => onResourceShare?.(resource)}
        >
          Share
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          leftSection={<IconTrash size={14} />}
          onClick={() => onResourceDelete?.(resource)}
          color="red"
        >
          Delete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );

  if (loading) {
    return (
      <Center h={200}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (resources.length === 0) {
    return (
      <Center h={200}>
        <Stack align="center" gap="md">
          <IconFile size={48} color="gray" />
          <Stack align="center" gap="xs">
            <Text size="lg" fw={500}>No resources found</Text>
            <Text size="sm" c="dimmed">Try adjusting your search or filters.</Text>
          </Stack>
        </Stack>
      </Center>
    );
  }

  if (viewMode === 'table') {
    return (
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={50}>
              <Checkbox />
            </Table.Th>
            <Table.Th>Resource</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Tags</Table.Th>
            <Table.Th>Updated</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {resources.map((resource) => (
            <Table.Tr key={resource.id}>
              <Table.Td>
                <Checkbox
                  checked={selectedResources.includes(resource.id)}
                  onChange={(event) =>
                    handleResourceSelect(resource.id, event.currentTarget.checked)
                  }
                />
              </Table.Td>
              <Table.Td>
                <Group gap="sm">
                  {getResourceIcon(resource.type)}
                  <Stack gap={2}>
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() => onResourceClick?.(resource)}
                      p={0}
                      style={{ fontWeight: 500 }}
                    >
                      {resource.title}
                    </Button>
                    {resource.description && (
                      <Text size="sm" c="dimmed" lineClamp={1}>
                        {resource.description}
                      </Text>
                    )}
                  </Stack>
                </Group>
              </Table.Td>
              <Table.Td>
                <Badge color={getResourceTypeColor(resource.type)} variant="light">
                  {resource.type}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  {resource.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} size="xs" variant="outline">
                      {tag}
                    </Badge>
                  ))}
                  {resource.tags.length > 3 && (
                    <Badge size="xs" variant="outline">
                      +{resource.tags.length - 3}
                    </Badge>
                  )}
                </Group>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {formatDistanceToNow(new Date(resource.updatedAt), { addSuffix: true })}
                </Text>
              </Table.Td>
              <Table.Td>
                {renderResourceActions(resource)}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    );
  }

  // List view
  return (
    <Stack gap="md">
      {resources.map((resource) => (
        <Card key={resource.id} shadow="sm" padding="md" withBorder>
          <Group align="flex-start" justify="space-between">
            <Group align="flex-start" gap="md" style={{ flex: 1 }}>
              <Checkbox
                checked={selectedResources.includes(resource.id)}
                onChange={(event) =>
                  handleResourceSelect(resource.id, event.currentTarget.checked)
                }
              />

              {getResourceIcon(resource.type)}

              <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
                <Button
                  variant="subtle"
                  size="md"
                  onClick={() => onResourceClick?.(resource)}
                  p={0}
                  style={{ fontWeight: 500, justifyContent: 'flex-start' }}
                >
                  {resource.title}
                </Button>

                {resource.description && (
                  <Text c="dimmed" lineClamp={2}>
                    {resource.description}
                  </Text>
                )}

                <Group gap="md" wrap="wrap">
                  <Badge color={getResourceTypeColor(resource.type)} variant="light">
                    {resource.type}
                  </Badge>

                  <Text size="sm" c="dimmed">
                    Updated {formatDistanceToNow(new Date(resource.updatedAt), { addSuffix: true })}
                  </Text>

                  {resource._count && (
                    <>
                      {resource._count.summaries > 0 && (
                        <Text size="sm" c="dimmed">
                          {resource._count.summaries} summary
                        </Text>
                      )}
                      {resource._count.references > 0 && (
                        <Text size="sm" c="dimmed">
                          {resource._count.references} reference
                        </Text>
                      )}
                    </>
                  )}
                </Group>

                {resource.tags.length > 0 && (
                  <Group gap="xs" wrap="wrap">
                    {resource.tags.slice(0, 5).map((tag) => (
                      <Badge key={tag} size="xs" variant="outline">
                        {tag}
                      </Badge>
                    ))}
                    {resource.tags.length > 5 && (
                      <Badge size="xs" variant="outline">
                        +{resource.tags.length - 5} more
                      </Badge>
                    )}
                  </Group>
                )}
              </Stack>
            </Group>

            {renderResourceActions(resource)}
          </Group>
        </Card>
      ))}
    </Stack>
  );
}
