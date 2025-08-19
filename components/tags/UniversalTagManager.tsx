/**
 * Universal Tag Manager Component for ThinkSpace
 * 
 * Provides comprehensive tag management across all PARA categories with
 * tag suggestions, analytics, and consistent tagging features.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  Button,
  TextInput,
  TagsInput,
  Badge,
  Card,
  ActionIcon,
  Tooltip,
  Loader,
  Alert,
  Tabs,
  Grid,
  Progress,
  ScrollArea,
  Divider,
  Autocomplete,
} from '@mantine/core';
import {
  IconTags,
  IconPlus,
  IconTrash,
  IconEdit,
  IconTrendingUp,
  IconSearch,
  IconBulb,
  IconChartBar,
  IconTarget,
  IconMap,
  IconBookmark,
  IconNote,
  IconX,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useDebouncedValue } from '@mantine/hooks';
import { getParaColor } from '@/lib/theme';

// Tag analytics interface
interface TagAnalytics {
  tag: string;
  count: number;
  usage: {
    projects: number;
    areas: number;
    resources: number;
    notes: number;
  };
  recentUsage: number;
  trending: boolean;
  relatedTags: string[];
}

// Tag suggestion interface
interface TagSuggestion {
  tag: string;
  confidence: number;
  source: 'content' | 'similar_items' | 'user_history' | 'popular';
  reason: string;
}

interface UniversalTagManagerProps {
  itemType?: 'project' | 'area' | 'resource' | 'note';
  itemId?: string;
  itemTitle?: string;
  currentTags?: string[];
  itemContent?: string;
  opened: boolean;
  onClose: () => void;
  onTagsUpdated?: (tags: string[]) => void;
  mode?: 'manage' | 'analytics' | 'suggestions';
}

export function UniversalTagManager({
  itemType,
  itemId,
  itemTitle,
  currentTags = [],
  itemContent = '',
  opened,
  onClose,
  onTagsUpdated,
  mode = 'manage',
}: UniversalTagManagerProps) {
  const [tags, setTags] = useState<string[]>(currentTags);
  const [allTags, setAllTags] = useState<TagAnalytics[]>([]);
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const [analytics, setAnalytics] = useState<any>(null);

  // Load all tags
  const loadTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'list',
        includeAnalytics: 'true',
        limit: '100',
        ...(debouncedSearch && { query: debouncedSearch }),
      });

      const response = await fetch(`/api/tags?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setAllTags(data.data.tags || []);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  // Load tag suggestions
  const loadSuggestions = useCallback(async () => {
    if (!itemContent && tags.length === 0) return;

    try {
      const params = new URLSearchParams({
        action: 'suggestions',
        content: itemContent,
        existingTags: tags.join(','),
        limit: '10',
      });

      const response = await fetch(`/api/tags?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.data.suggestions || []);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  }, [itemContent, tags]);

  // Load analytics
  const loadAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/tags?action=analytics&limit=50');
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data.analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }, []);

  // Load data when component mounts or search changes
  useEffect(() => {
    if (opened) {
      loadTags();
      loadSuggestions();
      if (mode === 'analytics') {
        loadAnalytics();
      }
    }
  }, [opened, loadTags, loadSuggestions, loadAnalytics, mode]);

  // Update tags when currentTags prop changes
  useEffect(() => {
    setTags(currentTags);
  }, [currentTags]);

  // Save tags
  const handleSaveTags = async () => {
    if (!itemType || !itemId) {
      onTagsUpdated?.(tags);
      onClose();
      return;
    }

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          itemType,
          itemId,
          tags,
        }),
      });

      if (response.ok) {
        notifications.show({
          title: 'Tags Updated',
          message: 'Successfully updated tags',
          color: 'green',
        });
        
        onTagsUpdated?.(tags);
        onClose();
      } else {
        const errorData = await response.json();
        notifications.show({
          title: 'Error',
          message: errorData.error || 'Failed to update tags',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Error saving tags:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update tags',
        color: 'red',
      });
    }
  };

  // Add suggested tag
  const handleAddSuggestion = (suggestion: TagSuggestion) => {
    if (!tags.includes(suggestion.tag)) {
      setTags(prev => [...prev, suggestion.tag]);
      setSuggestions(prev => prev.filter(s => s.tag !== suggestion.tag));
    }
  };

  // Get icon for content type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'projects': return <IconTarget size="1rem" />;
      case 'areas': return <IconMap size="1rem" />;
      case 'resources': return <IconBookmark size="1rem" />;
      case 'notes': return <IconNote size="1rem" />;
      default: return <IconTags size="1rem" />;
    }
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'projects': return getParaColor('projects');
      case 'areas': return getParaColor('areas');
      case 'resources': return getParaColor('resources');
      case 'notes': return getParaColor('notes');
      default: return 'gray';
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconTags size="1.2rem" />
          <Text fw={600}>
            {mode === 'analytics' ? 'Tag Analytics' : 
             mode === 'suggestions' ? 'Tag Suggestions' : 
             `Manage Tags${itemTitle ? ` for "${itemTitle}"` : ''}`}
          </Text>
        </Group>
      }
      size="xl"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Tabs defaultValue={mode} variant="outline">
        <Tabs.List>
          <Tabs.Tab value="manage" leftSection={<IconEdit size="1rem" />}>
            Manage Tags
          </Tabs.Tab>
          <Tabs.Tab value="suggestions" leftSection={<IconBulb size="1rem" />}>
            Suggestions
          </Tabs.Tab>
          <Tabs.Tab value="analytics" leftSection={<IconChartBar size="1rem" />}>
            Analytics
          </Tabs.Tab>
        </Tabs.List>

        {/* Manage Tags Tab */}
        <Tabs.Panel value="manage" pt="md">
          <Stack gap="md">
            {/* Current Tags */}
            <div>
              <Text fw={600} mb="xs">Current Tags</Text>
              <TagsInput
                value={tags}
                onChange={setTags}
                placeholder="Add tags..."
                data={allTags.map(tag => tag.tag)}
              />
            </div>

            {/* Search Existing Tags */}
            <div>
              <Text fw={600} mb="xs">Browse Existing Tags</Text>
              <TextInput
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                leftSection={<IconSearch size="1rem" />}
                rightSection={isLoading ? <Loader size="sm" /> : null}
              />
            </div>

            {/* Tag List */}
            <ScrollArea.Autosize mah={300}>
              <Stack gap="xs">
                {allTags.map((tag) => (
                  <Card key={tag.tag} withBorder p="sm">
                    <Group justify="space-between">
                      <Group>
                        <Text fw={500}>{tag.tag}</Text>
                        <Badge size="sm" variant="light">
                          {tag.count} uses
                        </Badge>
                        {tag.trending && (
                          <Badge size="sm" color="orange" leftSection={<IconTrendingUp size="0.8rem" />}>
                            Trending
                          </Badge>
                        )}
                      </Group>
                      
                      <Group gap="xs">
                        {/* Usage breakdown */}
                        {Object.entries(tag.usage).map(([type, count]) => (
                          count > 0 && (
                            <Tooltip key={type} label={`${count} ${type}`}>
                              <Badge
                                size="xs"
                                variant="outline"
                                color={getTypeColor(type)}
                                leftSection={getTypeIcon(type)}
                              >
                                {count}
                              </Badge>
                            </Tooltip>
                          )
                        ))}
                        
                        <Button
                          size="xs"
                          variant={tags.includes(tag.tag) ? "filled" : "light"}
                          onClick={() => {
                            if (tags.includes(tag.tag)) {
                              setTags(prev => prev.filter(t => t !== tag.tag));
                            } else {
                              setTags(prev => [...prev, tag.tag]);
                            }
                          }}
                        >
                          {tags.includes(tag.tag) ? 'Remove' : 'Add'}
                        </Button>
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </ScrollArea.Autosize>

            {/* Save Button */}
            <Group justify="flex-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSaveTags}>
                Save Tags
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>

        {/* Suggestions Tab */}
        <Tabs.Panel value="suggestions" pt="md">
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              AI-powered tag suggestions based on content analysis and usage patterns
            </Text>

            {suggestions.length === 0 ? (
              <Alert color="blue">
                No tag suggestions available. Try adding some content or existing tags.
              </Alert>
            ) : (
              <Stack gap="xs">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.tag} withBorder p="sm">
                    <Group justify="space-between">
                      <Group>
                        <Text fw={500}>{suggestion.tag}</Text>
                        <Badge size="sm" variant="light">
                          {(suggestion.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                        <Badge size="xs" variant="outline">
                          {suggestion.source}
                        </Badge>
                      </Group>
                      
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconPlus size="0.8rem" />}
                        onClick={() => handleAddSuggestion(suggestion)}
                        disabled={tags.includes(suggestion.tag)}
                      >
                        Add
                      </Button>
                    </Group>
                    <Text size="xs" c="dimmed" mt="xs">
                      {suggestion.reason}
                    </Text>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </Tabs.Panel>

        {/* Analytics Tab */}
        <Tabs.Panel value="analytics" pt="md">
          <Stack gap="md">
            {analytics ? (
              <>
                {/* Overview Stats */}
                <Grid>
                  <Grid.Col span={3}>
                    <Card withBorder p="md" ta="center">
                      <Text fw={600} size="xl">{analytics.totalTags}</Text>
                      <Text size="sm" c="dimmed">Total Tags</Text>
                    </Card>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Card withBorder p="md" ta="center">
                      <Text fw={600} size="xl">{analytics.totalUsage}</Text>
                      <Text size="sm" c="dimmed">Total Usage</Text>
                    </Card>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Card withBorder p="md" ta="center">
                      <Text fw={600} size="xl">{analytics.averageTagsPerItem.toFixed(1)}</Text>
                      <Text size="sm" c="dimmed">Avg per Item</Text>
                    </Card>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Card withBorder p="md" ta="center">
                      <Text fw={600} size="xl">{analytics.trendingTags.length}</Text>
                      <Text size="sm" c="dimmed">Trending</Text>
                    </Card>
                  </Grid.Col>
                </Grid>

                {/* Distribution by Content Type */}
                <Card withBorder p="md">
                  <Text fw={600} mb="md">Usage Distribution</Text>
                  <Stack gap="xs">
                    {Object.entries(analytics.distribution).map(([type, count]) => (
                      <Group key={type} justify="space-between">
                        <Group>
                          {getTypeIcon(type)}
                          <Text tt="capitalize">{type}</Text>
                        </Group>
                        <Group gap="xs">
                          <Progress
                            value={(count as number) / analytics.totalUsage * 100}
                            w={100}
                            color={getTypeColor(type)}
                          />
                          <Text size="sm">{count as number}</Text>
                        </Group>
                      </Group>
                    ))}
                  </Stack>
                </Card>

                {/* Most Used Tags */}
                <Card withBorder p="md">
                  <Text fw={600} mb="md">Most Used Tags</Text>
                  <Stack gap="xs">
                    {analytics.mostUsedTags.slice(0, 10).map((tag: TagAnalytics) => (
                      <Group key={tag.tag} justify="space-between">
                        <Text>{tag.tag}</Text>
                        <Badge variant="light">{tag.count} uses</Badge>
                      </Group>
                    ))}
                  </Stack>
                </Card>
              </>
            ) : (
              <Group>
                <Loader size="sm" />
                <Text>Loading analytics...</Text>
              </Group>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
