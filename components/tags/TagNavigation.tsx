/**
 * Tag Navigation Component for ThinkSpace
 * 
 * Provides tag-based navigation and filtering across all PARA categories
 * with visual tag clouds and smart filtering.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  Stack,
  Group,
  Text,
  Badge,
  Button,
  TextInput,
  Select,
  MultiSelect,
  ActionIcon,
  Tooltip,
  Loader,
  Alert,
  Collapse,
  Grid,
  Paper,
  ScrollArea,
  Divider,
} from '@mantine/core';
import {
  IconTags,
  IconSearch,
  IconFilter,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconTarget,
  IconMap,
  IconBookmark,
  IconNote,
  IconTrendingUp,
  IconHash,
} from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { getParaColor } from '@/lib/theme';

// Tag with analytics
interface TagWithAnalytics {
  tag: string;
  count: number;
  usage: {
    projects: number;
    areas: number;
    resources: number;
    notes: number;
  };
  trending: boolean;
}

interface TagNavigationProps {
  onTagSelect?: (tag: string) => void;
  onTagsFilter?: (tags: string[]) => void;
  selectedTags?: string[];
  showFilters?: boolean;
  compact?: boolean;
  maxTags?: number;
}

export function TagNavigation({
  onTagSelect,
  onTagsFilter,
  selectedTags = [],
  showFilters = true,
  compact = false,
  maxTags = 50,
}: TagNavigationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [tags, setTags] = useState<TagWithAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    contentTypes: ['projects', 'areas', 'resources', 'notes'],
    minUsage: 1,
    showTrending: false,
    sortBy: 'usage' as 'usage' | 'alphabetical' | 'trending',
  });

  // Load tags
  const loadTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'list',
        includeAnalytics: 'true',
        limit: maxTags.toString(),
        ...(debouncedSearch && { query: debouncedSearch }),
      });

      const response = await fetch(`/api/tags?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        let loadedTags = data.data.tags || [];

        // Apply filters
        loadedTags = loadedTags.filter((tag: TagWithAnalytics) => {
          // Min usage filter
          if (tag.count < filters.minUsage) return false;
          
          // Content type filter
          const hasUsageInSelectedTypes = filters.contentTypes.some(type => 
            (tag.usage as any)[type] > 0
          );
          if (!hasUsageInSelectedTypes) return false;
          
          // Trending filter
          if (filters.showTrending && !tag.trending) return false;
          
          return true;
        });

        // Apply sorting
        loadedTags.sort((a: TagWithAnalytics, b: TagWithAnalytics) => {
          switch (filters.sortBy) {
            case 'alphabetical':
              return a.tag.localeCompare(b.tag);
            case 'trending':
              if (a.trending && !b.trending) return -1;
              if (!a.trending && b.trending) return 1;
              return b.count - a.count;
            case 'usage':
            default:
              return b.count - a.count;
          }
        });

        setTags(loadedTags);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, filters, maxTags]);

  // Load tags when component mounts or filters change
  useEffect(() => {
    loadTags();
  }, [loadTags]);

  // Handle tag selection
  const handleTagClick = (tag: string) => {
    if (onTagSelect) {
      onTagSelect(tag);
    } else {
      // Navigate to search with tag filter
      const params = new URLSearchParams(searchParams);
      const currentTags = params.get('tags')?.split(',') || [];
      
      if (currentTags.includes(tag)) {
        // Remove tag
        const newTags = currentTags.filter(t => t !== tag);
        if (newTags.length > 0) {
          params.set('tags', newTags.join(','));
        } else {
          params.delete('tags');
        }
      } else {
        // Add tag
        const newTags = [...currentTags, tag];
        params.set('tags', newTags.join(','));
      }
      
      router.push(`/search?${params.toString()}`);
    }
  };

  // Handle multiple tag selection for filtering
  const handleTagsFilter = (tags: string[]) => {
    if (onTagsFilter) {
      onTagsFilter(tags);
    }
  };

  // Get tag size based on usage (for tag cloud effect)
  const getTagSize = (count: number, maxCount: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return 'lg';
    if (ratio > 0.5) return 'md';
    if (ratio > 0.2) return 'sm';
    return 'xs';
  };

  // Get tag color based on content type with most usage
  const getTagColor = (tag: TagWithAnalytics) => {
    const usage = tag.usage;
    const maxType = Object.entries(usage).reduce((a, b) => 
      usage[a[0] as keyof typeof usage] > usage[b[0] as keyof typeof usage] ? a : b
    )[0];
    
    switch (maxType) {
      case 'projects': return getParaColor('projects');
      case 'areas': return getParaColor('areas');
      case 'resources': return getParaColor('resources');
      case 'notes': return getParaColor('notes');
      default: return 'gray';
    }
  };

  // Get icon for content type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'projects': return <IconTarget size="0.8rem" />;
      case 'areas': return <IconMap size="0.8rem" />;
      case 'resources': return <IconBookmark size="0.8rem" />;
      case 'notes': return <IconNote size="0.8rem" />;
      default: return <IconHash size="0.8rem" />;
    }
  };

  const maxCount = Math.max(...tags.map(tag => tag.count), 1);
  const currentTags = searchParams.get('tags')?.split(',') || selectedTags;

  if (compact) {
    return (
      <Card withBorder p="md">
        <Group justify="space-between" mb="md">
          <Group>
            <IconTags size="1rem" />
            <Text fw={600} size="sm">Tags</Text>
          </Group>
          {isLoading && <Loader size="sm" />}
        </Group>
        
        <Group gap="xs">
          {tags.slice(0, 10).map((tag) => (
            <Badge
              key={tag.tag}
              variant={currentTags.includes(tag.tag) ? 'filled' : 'light'}
              color={getTagColor(tag)}
              style={{ cursor: 'pointer' }}
              onClick={() => handleTagClick(tag.tag)}
              size={getTagSize(tag.count, maxCount)}
            >
              {tag.tag}
            </Badge>
          ))}
          {tags.length > 10 && (
            <Text size="xs" c="dimmed">+{tags.length - 10} more</Text>
          )}
        </Group>
      </Card>
    );
  }

  return (
    <Card withBorder p="md">
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <IconTags size="1.2rem" />
            <Text fw={600}>Tag Navigation</Text>
            <Badge variant="light">{tags.length} tags</Badge>
          </Group>
          {isLoading && <Loader size="sm" />}
        </Group>

        {/* Search */}
        <TextInput
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          leftSection={<IconSearch size="1rem" />}
          rightSection={
            searchQuery && (
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={() => setSearchQuery('')}
              >
                <IconX size="0.8rem" />
              </ActionIcon>
            )
          }
        />

        {/* Filters */}
        {showFilters && (
          <>
            <Group justify="space-between">
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconFilter size="0.8rem" />}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                Filters
              </Button>
              <Group gap="xs">
                <Select
                  size="xs"
                  value={filters.sortBy}
                  onChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    sortBy: value as any || 'usage' 
                  }))}
                  data={[
                    { value: 'usage', label: 'By Usage' },
                    { value: 'alphabetical', label: 'A-Z' },
                    { value: 'trending', label: 'Trending' },
                  ]}
                />
              </Group>
            </Group>

            <Collapse in={showAdvancedFilters}>
              <Paper p="md" withBorder>
                <Stack gap="md">
                  <MultiSelect
                    label="Content Types"
                    data={[
                      { value: 'projects', label: 'Projects' },
                      { value: 'areas', label: 'Areas' },
                      { value: 'resources', label: 'Resources' },
                      { value: 'notes', label: 'Notes' },
                    ]}
                    value={filters.contentTypes}
                    onChange={(value) => setFilters(prev => ({ 
                      ...prev, 
                      contentTypes: value 
                    }))}
                  />
                  
                  <Group grow>
                    <Select
                      label="Min Usage"
                      value={filters.minUsage.toString()}
                      onChange={(value) => setFilters(prev => ({ 
                        ...prev, 
                        minUsage: parseInt(value || '1') 
                      }))}
                      data={[
                        { value: '1', label: '1+' },
                        { value: '2', label: '2+' },
                        { value: '5', label: '5+' },
                        { value: '10', label: '10+' },
                      ]}
                    />
                  </Group>
                </Stack>
              </Paper>
            </Collapse>
          </>
        )}

        {/* Tag Cloud */}
        <ScrollArea.Autosize mah={400}>
          {tags.length === 0 ? (
            <Alert color="blue">
              {searchQuery ? 'No tags found matching your search.' : 'No tags available.'}
            </Alert>
          ) : (
            <Group gap="xs">
              {tags.map((tag) => (
                <Tooltip
                  key={tag.tag}
                  label={
                    <Stack gap="xs">
                      <Text size="sm" fw={600}>{tag.tag}</Text>
                      <Text size="xs">Used {tag.count} times</Text>
                      <Group gap="xs">
                        {Object.entries(tag.usage).map(([type, count]) => (
                          count > 0 && (
                            <Group key={type} gap={2}>
                              {getTypeIcon(type)}
                              <Text size="xs">{count}</Text>
                            </Group>
                          )
                        ))}
                      </Group>
                    </Stack>
                  }
                >
                  <Badge
                    variant={currentTags.includes(tag.tag) ? 'filled' : 'light'}
                    color={getTagColor(tag)}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleTagClick(tag.tag)}
                    size={getTagSize(tag.count, maxCount)}
                    rightSection={
                      tag.trending ? <IconTrendingUp size="0.8rem" /> : undefined
                    }
                  >
                    {tag.tag}
                  </Badge>
                </Tooltip>
              ))}
            </Group>
          )}
        </ScrollArea.Autosize>

        {/* Selected Tags Summary */}
        {currentTags.length > 0 && (
          <>
            <Divider />
            <div>
              <Text size="sm" fw={600} mb="xs">Selected Tags ({currentTags.length})</Text>
              <Group gap="xs">
                {currentTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="filled"
                    rightSection={
                      <ActionIcon
                        size="xs"
                        variant="transparent"
                        onClick={() => handleTagClick(tag)}
                      >
                        <IconX size="0.6rem" />
                      </ActionIcon>
                    }
                  >
                    {tag}
                  </Badge>
                ))}
              </Group>
            </div>
          </>
        )}
      </Stack>
    </Card>
  );
}
