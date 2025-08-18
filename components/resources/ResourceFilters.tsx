/**
 * Resource Filters Component
 *
 * Advanced filtering interface for resources with
 * multiple filter types and quick filter presets.
 */

'use client';

import React, { useState } from 'react';
import {
  IconFilter,
  IconX,
  IconCheck,
  IconCalendar,
  IconTag,
  IconFolder,
  IconFile
} from '@tabler/icons-react';
import {
  Button,
  Badge,
  Checkbox,
  TextInput,
  Popover,
  Stack,
  Group,
  Text,
  ActionIcon,
  Paper,
  ScrollArea,
  Box
} from '@mantine/core';
import type { ResourceViewState } from '@/types/resources';

type ResourceType = 'DOCUMENT' | 'LINK' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'BOOK' | 'ARTICLE' | 'RESEARCH' | 'REFERENCE' | 'TEMPLATE' | 'OTHER';

interface ResourceFiltersProps {
  filters: ResourceViewState['filters'];
  onFiltersChange: (filters: ResourceViewState['filters']) => void;
  availableTags?: string[];
  availableFolders?: Array<{ id: string; name: string; color?: string }>;
}

const RESOURCE_TYPES: Array<{ value: ResourceType; label: string }> = [
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'LINK', label: 'Link' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'BOOK', label: 'Book' },
  { value: 'ARTICLE', label: 'Article' },
  { value: 'RESEARCH', label: 'Research' },
  { value: 'REFERENCE', label: 'Reference' },
  { value: 'TEMPLATE', label: 'Template' },
  { value: 'OTHER', label: 'Other' },
];

const QUICK_FILTERS = [
  { id: 'recent', label: 'Recent', icon: IconCalendar },
  { id: 'with-content', label: 'Has Content', icon: IconFile },
  { id: 'with-summary', label: 'Has Summary', icon: IconFile },
  { id: 'unorganized', label: 'Unorganized', icon: IconFolder },
];

export function ResourceFilters({
  filters,
  onFiltersChange,
  availableTags = [],
  availableFolders = [],
}: ResourceFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = 
    filters.types.length +
    filters.folders.length +
    filters.tags.length +
    (filters.hasContent ? 1 : 0) +
    (filters.hasSummary ? 1 : 0) +
    (filters.dateRange ? 1 : 0);

  const handleTypeToggle = (type: ResourceType, checked: boolean) => {
    const newTypes = checked
      ? [...filters.types, type]
      : filters.types.filter(t => t !== type);
    
    onFiltersChange({
      ...filters,
      types: newTypes,
    });
  };

  const handleFolderToggle = (folderId: string, checked: boolean) => {
    const newFolders = checked
      ? [...filters.folders, folderId]
      : filters.folders.filter(f => f !== folderId);
    
    onFiltersChange({
      ...filters,
      folders: newFolders,
    });
  };

  const handleTagToggle = (tag: string, checked: boolean) => {
    const newTags = checked
      ? [...filters.tags, tag]
      : filters.tags.filter(t => t !== tag);
    
    onFiltersChange({
      ...filters,
      tags: newTags,
    });
  };

  const handleQuickFilter = (filterId: string) => {
    switch (filterId) {
      case 'recent':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        onFiltersChange({
          ...filters,
          dateRange: {
            from: oneWeekAgo,
            to: new Date(),
          },
        });
        break;
      
      case 'with-content':
        onFiltersChange({
          ...filters,
          hasContent: !filters.hasContent,
        });
        break;
      
      case 'with-summary':
        onFiltersChange({
          ...filters,
          hasSummary: !filters.hasSummary,
        });
        break;
      
      case 'unorganized':
        // Filter for resources not in any folder
        onFiltersChange({
          ...filters,
          folders: filters.folders.includes('root') 
            ? filters.folders.filter(f => f !== 'root')
            : [...filters.folders, 'root'],
        });
        break;
    }
  };

  const clearAllFilters = () => {
    onFiltersChange({
      types: [],
      folders: [],
      tags: [],
      hasContent: false,
      hasSummary: false,
      dateRange: undefined,
    });
  };

  const clearFilter = (filterType: string, value?: string) => {
    switch (filterType) {
      case 'type':
        onFiltersChange({
          ...filters,
          types: value ? filters.types.filter(t => t !== value) : [],
        });
        break;
      
      case 'folder':
        onFiltersChange({
          ...filters,
          folders: value ? filters.folders.filter(f => f !== value) : [],
        });
        break;
      
      case 'tag':
        onFiltersChange({
          ...filters,
          tags: value ? filters.tags.filter(t => t !== value) : [],
        });
        break;
      
      case 'hasContent':
        onFiltersChange({
          ...filters,
          hasContent: false,
        });
        break;
      
      case 'hasSummary':
        onFiltersChange({
          ...filters,
          hasSummary: false,
        });
        break;
      
      case 'dateRange':
        onFiltersChange({
          ...filters,
          dateRange: undefined,
        });
        break;
    }
  };

  return (
    <Group gap="sm">
      {/* Quick Filters */}
      <Group gap="xs">
        {QUICK_FILTERS.map((quickFilter) => {
          const IconComponent = quickFilter.icon;
          const isActive =
            (quickFilter.id === 'with-content' && filters.hasContent) ||
            (quickFilter.id === 'with-summary' && filters.hasSummary) ||
            (quickFilter.id === 'unorganized' && filters.folders.includes('root')) ||
            (quickFilter.id === 'recent' && filters.dateRange);

          return (
            <Button
              key={quickFilter.id}
              variant={isActive ? 'filled' : 'outline'}
              size="xs"
              onClick={() => handleQuickFilter(quickFilter.id)}
              leftSection={<IconComponent size={14} />}
            >
              {quickFilter.label}
            </Button>
          );
        })}
      </Group>

      {/* Advanced Filters */}
      <Popover
        opened={showFilters}
        onClose={() => setShowFilters(false)}
        position="bottom-end"
        width={320}
        shadow="md"
      >
        <Popover.Target>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setShowFilters(!showFilters)}
            leftSection={<IconFilter size={14} />}
            rightSection={
              activeFilterCount > 0 ? (
                <Badge size="xs" variant="filled">
                  {activeFilterCount}
                </Badge>
              ) : null
            }
          >
            Filters
          </Button>
        </Popover.Target>

        <Popover.Dropdown>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={500}>Filters</Text>
              {activeFilterCount > 0 && (
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={clearAllFilters}
                >
                  Clear All
                </Button>
              )}
            </Group>

            {/* Resource Types */}
            <Stack gap="xs">
              <Text size="sm" fw={500}>Resource Types</Text>
              <Group gap="xs">
                {RESOURCE_TYPES.map((type) => (
                  <Checkbox
                    key={type.value}
                    label={type.label}
                    size="sm"
                    checked={filters.types.includes(type.value)}
                    onChange={(event) =>
                      handleTypeToggle(type.value, event.currentTarget.checked)
                    }
                  />
                ))}
              </Group>
            </Stack>

            {/* Folders */}
            {availableFolders.length > 0 && (
              <Stack gap="xs">
                <Text size="sm" fw={500}>Folders</Text>
                <ScrollArea h={120}>
                  <Stack gap="xs">
                    {availableFolders.map((folder) => (
                      <Checkbox
                        key={folder.id}
                        label={
                          <Group gap="xs">
                            <Box
                              w={12}
                              h={12}
                              style={{
                                backgroundColor: folder.color || '#6366f1',
                                borderRadius: 2
                              }}
                            />
                            <Text size="sm">{folder.name}</Text>
                          </Group>
                        }
                        size="sm"
                        checked={filters.folders.includes(folder.id)}
                        onChange={(event) =>
                          handleFolderToggle(folder.id, event.currentTarget.checked)
                        }
                      />
                    ))}
                  </Stack>
                </ScrollArea>
              </Stack>
            )}

            {/* Tags */}
            {availableTags.length > 0 && (
              <Stack gap="xs">
                <Text size="sm" fw={500}>Tags</Text>
                <ScrollArea h={120}>
                  <Stack gap="xs">
                    {availableTags.slice(0, 20).map((tag) => (
                      <Checkbox
                        key={tag}
                        label={tag}
                        size="sm"
                        checked={filters.tags.includes(tag)}
                        onChange={(event) =>
                          handleTagToggle(tag, event.currentTarget.checked)
                        }
                      />
                    ))}
                  </Stack>
                </ScrollArea>
              </Stack>
            )}

            {/* Content Filters */}
            <Stack gap="xs">
              <Text size="sm" fw={500}>Content</Text>
              <Stack gap="xs">
                <Checkbox
                  label="Has extracted content"
                  size="sm"
                  checked={filters.hasContent}
                  onChange={(event) =>
                    onFiltersChange({
                      ...filters,
                      hasContent: event.currentTarget.checked,
                    })
                  }
                />

                <Checkbox
                  label="Has AI summary"
                  size="sm"
                  checked={filters.hasSummary}
                  onChange={(event) =>
                    onFiltersChange({
                      ...filters,
                      hasSummary: event.currentTarget.checked,
                    })
                  }
                />
              </Stack>
            </Stack>
          </Stack>
        </Popover.Dropdown>
      </Popover>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <Group gap="xs" wrap="wrap">
          {filters.types.map((type) => (
            <Badge
              key={type}
              variant="light"
              size="sm"
              rightSection={
                <ActionIcon
                  size="xs"
                  variant="transparent"
                  onClick={() => clearFilter('type', type)}
                >
                  <IconX size={10} />
                </ActionIcon>
              }
            >
              {type}
            </Badge>
          ))}

          {filters.tags.map((tag) => (
            <Badge
              key={tag}
              variant="light"
              size="sm"
              rightSection={
                <ActionIcon
                  size="xs"
                  variant="transparent"
                  onClick={() => clearFilter('tag', tag)}
                >
                  <IconX size={10} />
                </ActionIcon>
              }
            >
              #{tag}
            </Badge>
          ))}

          {filters.hasContent && (
            <Badge
              variant="light"
              size="sm"
              rightSection={
                <ActionIcon
                  size="xs"
                  variant="transparent"
                  onClick={() => clearFilter('hasContent')}
                >
                  <IconX size={10} />
                </ActionIcon>
              }
            >
              Has Content
            </Badge>
          )}

          {filters.hasSummary && (
            <Badge
              variant="light"
              size="sm"
              rightSection={
                <ActionIcon
                  size="xs"
                  variant="transparent"
                  onClick={() => clearFilter('hasSummary')}
                >
                  <IconX size={10} />
                </ActionIcon>
              }
            >
              Has Summary
            </Badge>
          )}
        </Group>
      )}
    </Group>
  );
}
