/**
 * Universal Search Page for ThinkSpace
 * 
 * Dedicated search interface with advanced filtering and comprehensive results
 * across all PARA categories.
 */

'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Paper,
  Group,
  Badge,
  Button,
  Tabs,
  Grid,
  Card,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconSearch,
  IconTarget,
  IconMap,
  IconBookmark,
  IconNote,
  IconFilter,
  IconDownload,
  IconShare,
  IconBookmarks,
} from '@tabler/icons-react';
import { UniversalSearch } from '@/components/search/UniversalSearch';
import { LazyContainer } from '@/components/common/LazyLoader';
import { getParaColor } from '@/lib/theme';

export default function SearchPage() {
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'project management',
    'learning resources',
    'health goals',
    'meeting notes',
  ]);

  // Handle saving a search
  const handleSaveSearch = (query: string, filters: any) => {
    const newSavedSearch = {
      id: Date.now().toString(),
      query,
      filters,
      createdAt: new Date().toISOString(),
      name: `Search: ${query}`,
    };
    setSavedSearches(prev => [newSavedSearch, ...prev]);
  };

  // Quick search suggestions
  const quickSearches = [
    {
      label: 'Active Projects',
      query: '',
      filters: { contentTypes: ['projects'], status: 'IN_PROGRESS' },
      icon: <IconTarget size="1rem" />,
      color: getParaColor('projects'),
    },
    {
      label: 'Learning Areas',
      query: 'learning',
      filters: { contentTypes: ['areas'], includeArchived: false },
      icon: <IconMap size="1rem" />,
      color: getParaColor('areas'),
    },
    {
      label: 'Recent Resources',
      query: '',
      filters: { contentTypes: ['resources'], dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      icon: <IconBookmark size="1rem" />,
      color: getParaColor('resources'),
    },
    {
      label: 'Pinned Notes',
      query: '',
      filters: { contentTypes: ['notes'] },
      icon: <IconNote size="1rem" />,
      color: getParaColor('notes'),
    },
  ];

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Group justify="space-between" mb="md">
            <div>
              <Title order={1} size="h2" mb="xs">
                Universal Search
              </Title>
              <Text c="dimmed" size="lg">
                Search across all your projects, areas, resources, and notes
              </Text>
            </div>
            <Group>
              <Tooltip label="Export search results">
                <ActionIcon variant="light" size="lg">
                  <IconDownload size="1.2rem" />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Share search">
                <ActionIcon variant="light" size="lg">
                  <IconShare size="1.2rem" />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          {/* Search Statistics */}
          <Grid mb="xl">
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Card withBorder p="md" ta="center">
                <IconTarget size="2rem" color={getParaColor('projects')} />
                <Text fw={600} size="lg" mt="xs">Projects</Text>
                <Text size="sm" c="dimmed">Active initiatives</Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Card withBorder p="md" ta="center">
                <IconMap size="2rem" color={getParaColor('areas')} />
                <Text fw={600} size="lg" mt="xs">Areas</Text>
                <Text size="sm" c="dimmed">Ongoing responsibilities</Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Card withBorder p="md" ta="center">
                <IconBookmark size="2rem" color={getParaColor('resources')} />
                <Text fw={600} size="lg" mt="xs">Resources</Text>
                <Text size="sm" c="dimmed">Reference materials</Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Card withBorder p="md" ta="center">
                <IconNote size="2rem" color={getParaColor('notes')} />
                <Text fw={600} size="lg" mt="xs">Notes</Text>
                <Text size="sm" c="dimmed">Knowledge items</Text>
              </Card>
            </Grid.Col>
          </Grid>
        </div>

        {/* Main Search Interface */}
        <LazyContainer>
          <Paper p="xl" withBorder radius="md">
            <UniversalSearch
              placeholder="Search across all your content..."
              showFilters={true}
              maxResults={100}
            />
          </Paper>
        </LazyContainer>

        {/* Quick Searches and Saved Searches */}
        <Tabs defaultValue="quick" variant="outline">
          <Tabs.List>
            <Tabs.Tab value="quick" leftSection={<IconFilter size="1rem" />}>
              Quick Searches
            </Tabs.Tab>
            <Tabs.Tab value="saved" leftSection={<IconBookmarks size="1rem" />}>
              Saved Searches ({savedSearches.length})
            </Tabs.Tab>
            <Tabs.Tab value="recent" leftSection={<IconSearch size="1rem" />}>
              Recent Searches
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="quick" pt="md">
            <Grid>
              {quickSearches.map((search, index) => (
                <Grid.Col key={index} span={{ base: 12, sm: 6, md: 3 }}>
                  <Card
                    withBorder
                    p="md"
                    style={{ cursor: 'pointer' }}
                    className="hover:shadow-md transition-shadow"
                  >
                    <Group mb="md">
                      <div style={{ color: search.color }}>
                        {search.icon}
                      </div>
                      <Text fw={600} size="sm">
                        {search.label}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed" mb="md">
                      {search.query || 'Filtered search'}
                    </Text>
                    <Group gap="xs">
                      {search.filters.contentTypes?.map((type: string) => (
                        <Badge key={type} size="xs" variant="light">
                          {type}
                        </Badge>
                      ))}
                      {search.filters.status && (
                        <Badge size="xs" variant="outline">
                          {search.filters.status}
                        </Badge>
                      )}
                    </Group>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="saved" pt="md">
            {savedSearches.length === 0 ? (
              <Paper p="xl" ta="center" c="dimmed">
                <IconBookmarks size="2rem" style={{ opacity: 0.5 }} />
                <Text mt="md">No saved searches yet</Text>
                <Text size="sm" mt="xs">
                  Save your frequently used searches for quick access
                </Text>
              </Paper>
            ) : (
              <Stack gap="md">
                {savedSearches.map((search) => (
                  <Card key={search.id} withBorder p="md">
                    <Group justify="space-between">
                      <div>
                        <Text fw={600}>{search.name}</Text>
                        <Text size="sm" c="dimmed">
                          Query: "{search.query}" • {new Date(search.createdAt).toLocaleDateString()}
                        </Text>
                      </div>
                      <Group gap="xs">
                        <Button size="xs" variant="light">
                          Run Search
                        </Button>
                        <ActionIcon size="sm" variant="subtle" color="red">
                          <IconFilter size="0.8rem" />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="recent" pt="md">
            <Stack gap="md">
              {recentSearches.map((query, index) => (
                <Card key={index} withBorder p="md">
                  <Group justify="space-between">
                    <Group>
                      <IconSearch size="1rem" color="gray" />
                      <Text>{query}</Text>
                    </Group>
                    <Button size="xs" variant="light">
                      Search Again
                    </Button>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Tabs.Panel>
        </Tabs>

        {/* Search Tips */}
        <Paper p="md" withBorder radius="md" bg="gray.0">
          <Title order={4} mb="md">Search Tips</Title>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm">
                  <strong>Semantic Search:</strong> Use natural language to find conceptually related content
                </Text>
                <Text size="sm">
                  <strong>Text Search:</strong> Search for exact words and phrases in titles and content
                </Text>
                <Text size="sm">
                  <strong>Hybrid Search:</strong> Combines both semantic and text search for best results
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm">
                  <strong>Filters:</strong> Use content type, status, and date filters to narrow results
                </Text>
                <Text size="sm">
                  <strong>Tags:</strong> Search by tags to find related content across categories
                </Text>
                <Text size="sm">
                  <strong>Relationships:</strong> Filter for items with connections to other content
                </Text>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>
      </Stack>
    </Container>
  );
}
