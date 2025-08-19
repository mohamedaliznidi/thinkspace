/**
 * Universal Search Component for ThinkSpace
 * 
 * Provides comprehensive search across all PARA categories with advanced filtering,
 * real-time results, and enhanced user experience.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  TextInput,
  Paper,
  Stack,
  Group,
  Text,
  Badge,
  ActionIcon,
  Loader,
  Select,
  MultiSelect,
  Switch,
  Collapse,
  Button,
  Divider,
  Box,
  ScrollArea,
  Highlight,
  Avatar,
  Tooltip,
  Card,
  Grid,
} from '@mantine/core';
import {
  IconSearch,
  IconFilter,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconTarget,
  IconMap,
  IconBookmark,
  IconNote,
  IconClock,
  IconLink,
  IconTags,
  IconAdjustments,
} from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { getParaColor } from '@/lib/theme';

// Enhanced search result interface
interface SearchResult {
  id: string;
  title: string;
  description?: string;
  content?: string;
  type: 'project' | 'area' | 'resource' | 'note' | 'archive';
  category: string;
  href: string;
  similarity?: number;
  tags: string[];
  metadata?: any;
  relationships?: {
    projects: number;
    areas: number;
    resources: number;
    notes: number;
  };
  lastModified: string;
  status?: string;
  priority?: string;
  isArchived?: boolean;
}

interface SearchFilters {
  contentTypes: string[];
  tags: string[];
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  priority?: string;
  includeArchived: boolean;
  hasRelationships?: boolean;
}

interface UniversalSearchProps {
  placeholder?: string;
  onResultClick?: (result: SearchResult) => void;
  showFilters?: boolean;
  defaultFilters?: Partial<SearchFilters>;
  maxResults?: number;
}

export function UniversalSearch({
  placeholder = "Search across all your content...",
  onResultClick,
  showFilters = true,
  defaultFilters = {},
  maxResults = 50,
}: UniversalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchStats, setSearchStats] = useState<any>(null);

  // Search filters state
  const [filters, setFilters] = useState<SearchFilters>({
    contentTypes: ['projects', 'areas', 'resources', 'notes'],
    tags: [],
    includeArchived: false,
    ...defaultFilters,
  });

  // Search type state
  const [searchType, setSearchType] = useState<'hybrid' | 'text' | 'semantic'>('hybrid');

  // Available filter options
  const contentTypeOptions = [
    { value: 'projects', label: 'Projects' },
    { value: 'areas', label: 'Areas' },
    { value: 'resources', label: 'Resources' },
    { value: 'notes', label: 'Notes' },
  ];

  const statusOptions = [
    { value: 'PLANNING', label: 'Planning' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'ON_HOLD', label: 'On Hold' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'ARCHIVED', label: 'Archived' },
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
  ];

  // Perform search
  const performSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      setSearchStats(null);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: searchType,
        limit: maxResults.toString(),
        contentTypes: searchFilters.contentTypes.join(','),
        includeArchived: searchFilters.includeArchived.toString(),
        ...(searchFilters.tags.length > 0 && { tags: searchFilters.tags.join(',') }),
        ...(searchFilters.dateFrom && { dateFrom: searchFilters.dateFrom }),
        ...(searchFilters.dateTo && { dateTo: searchFilters.dateTo }),
        ...(searchFilters.status && { status: searchFilters.status }),
        ...(searchFilters.priority && { priority: searchFilters.priority }),
        ...(searchFilters.hasRelationships && { hasRelationships: 'true' }),
      });

      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.data.results || []);
        setSearchStats(data.data.stats || null);
      } else {
        console.error('Search failed:', response.statusText);
        setResults([]);
        setSearchStats(null);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setSearchStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [searchType, maxResults]);

  // Search when debounced query or filters change
  useEffect(() => {
    performSearch(debouncedQuery, filters);
  }, [debouncedQuery, filters, performSearch]);

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      router.push(result.href);
    }
  };

  // Get icon for content type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project': return <IconTarget size="1rem" />;
      case 'area': return <IconMap size="1rem" />;
      case 'resource': return <IconBookmark size="1rem" />;
      case 'note': return <IconNote size="1rem" />;
      default: return <IconSearch size="1rem" />;
    }
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'project': return getParaColor('projects');
      case 'area': return getParaColor('areas');
      case 'resource': return getParaColor('resources');
      case 'note': return getParaColor('notes');
      default: return 'gray';
    }
  };

  return (
    <Stack gap="md">
      {/* Search Input */}
      <TextInput
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        leftSection={<IconSearch size="1rem" />}
        rightSection={
          <Group gap="xs">
            {isLoading && <Loader size="sm" />}
            {showFilters && (
              <ActionIcon
                variant={showAdvancedFilters ? 'filled' : 'subtle'}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <IconFilter size="1rem" />
              </ActionIcon>
            )}
            {query && (
              <ActionIcon
                variant="subtle"
                onClick={() => setQuery('')}
              >
                <IconX size="1rem" />
              </ActionIcon>
            )}
          </Group>
        }
        size="md"
      />

      {/* Advanced Filters */}
      {showFilters && (
        <Collapse in={showAdvancedFilters}>
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={600} size="sm">Advanced Filters</Text>
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => setFilters({
                    contentTypes: ['projects', 'areas', 'resources', 'notes'],
                    tags: [],
                    includeArchived: false,
                  })}
                >
                  Reset
                </Button>
              </Group>

              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <MultiSelect
                    label="Content Types"
                    placeholder="Select content types..."
                    data={contentTypeOptions}
                    value={filters.contentTypes}
                    onChange={(value) => setFilters(prev => ({ ...prev, contentTypes: value }))}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label="Search Type"
                    value={searchType}
                    onChange={(value) => setSearchType(value as any)}
                    data={[
                      { value: 'hybrid', label: 'Hybrid (Text + Semantic)' },
                      { value: 'text', label: 'Text Search' },
                      { value: 'semantic', label: 'Semantic Search' },
                    ]}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label="Status"
                    placeholder="Filter by status..."
                    data={statusOptions}
                    value={filters.status}
                    onChange={(value) => setFilters(prev => ({ ...prev, status: value || undefined }))}
                    clearable
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label="Priority"
                    placeholder="Filter by priority..."
                    data={priorityOptions}
                    value={filters.priority}
                    onChange={(value) => setFilters(prev => ({ ...prev, priority: value || undefined }))}
                    clearable
                  />
                </Grid.Col>
              </Grid>

              <Group>
                <Switch
                  label="Include archived items"
                  checked={filters.includeArchived}
                  onChange={(event) => setFilters(prev => ({ 
                    ...prev, 
                    includeArchived: event.currentTarget.checked 
                  }))}
                />
                <Switch
                  label="Only items with relationships"
                  checked={filters.hasRelationships || false}
                  onChange={(event) => setFilters(prev => ({ 
                    ...prev, 
                    hasRelationships: event.currentTarget.checked || undefined
                  }))}
                />
              </Group>
            </Stack>
          </Paper>
        </Collapse>
      )}

      {/* Search Stats */}
      {searchStats && query && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Found {searchStats.total} results
            {searchStats.hasSemanticResults && searchStats.averageSimilarity > 0 && (
              <> • Avg similarity: {(searchStats.averageSimilarity * 100).toFixed(1)}%</>
            )}
          </Text>
          <Group gap="xs">
            {Object.entries(searchStats.byType).map(([type, count]) => (
              (count as number) > 0 && (
                <Badge
                  key={type}
                  size="sm"
                  variant="light"
                  color={getTypeColor(type)}
                  leftSection={getTypeIcon(type)}
                >
                  {count as number} 
                </Badge>
              )
            ))}
          </Group>
        </Group>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <ScrollArea.Autosize mah={600}>
          <Stack gap="xs">
            {results.map((result) => (
              <SearchResultCard
                key={`${result.type}-${result.id}`}
                result={result}
                query={query}
                onClick={() => handleResultClick(result)}
              />
            ))}
          </Stack>
        </ScrollArea.Autosize>
      )}

      {/* No Results */}
      {query && !isLoading && results.length === 0 && (
        <Paper p="xl" ta="center" c="dimmed">
          <IconSearch size="2rem" style={{ opacity: 0.5 }} />
          <Text mt="md">No results found for "{query}"</Text>
          <Text size="sm" mt="xs">
            Try adjusting your search terms or filters
          </Text>
        </Paper>
      )}
    </Stack>
  );
}

// Search Result Card Component
interface SearchResultCardProps {
  result: SearchResult;
  query: string;
  onClick: () => void;
}

function SearchResultCard({ result, query, onClick }: SearchResultCardProps) {
  const typeColor = getTypeColor(result.type);
  const typeIcon = getTypeIcon(result.type);

  return (
    <Card
      p="md"
      withBorder
      style={{ cursor: 'pointer' }}
      onClick={onClick}
      className="hover:shadow-md transition-shadow"
    >
      <Stack gap="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <Badge
              size="sm"
              variant="light"
              color={typeColor}
              leftSection={typeIcon}
            >
              {result.category}
            </Badge>
            {result.similarity && (
              <Badge size="sm" variant="outline">
                {(result.similarity * 100).toFixed(0)}% match
              </Badge>
            )}
          </Group>
          <Text size="xs" c="dimmed">
            {new Date(result.lastModified).toLocaleDateString()}
          </Text>
        </Group>

        <Box>
          <Text fw={600} size="sm" lineClamp={1}>
            <Highlight highlight={query}>{result.title}</Highlight>
          </Text>
          {result.description && (
            <Text size="sm" c="dimmed" lineClamp={2} mt="xs">
              <Highlight highlight={query}>{result.description}</Highlight>
            </Text>
          )}
          {result.content && (
            <Text size="xs" c="dimmed" lineClamp={1} mt="xs">
              <Highlight highlight={query}>{result.content}</Highlight>
            </Text>
          )}
        </Box>

        {(result.tags.length > 0 || result.relationships) && (
          <Group justify="space-between" mt="xs">
            <Group gap="xs">
              {result.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} size="xs" variant="outline">
                  {tag}
                </Badge>
              ))}
              {result.tags.length > 3 && (
                <Text size="xs" c="dimmed">+{result.tags.length - 3} more</Text>
              )}
            </Group>
            
            {result.relationships && (
              <Group gap="xs">
                {Object.entries(result.relationships).map(([type, count]) => (
                  count > 0 && (
                    <Tooltip key={type} label={`${count} ${type}`}>
                      <Group gap={2}>
                        {getTypeIcon(type)}
                        <Text size="xs" c="dimmed">{count}</Text>
                      </Group>
                    </Tooltip>
                  )
                ))}
              </Group>
            )}
          </Group>
        )}
      </Stack>
    </Card>
  );
}

// Helper function to get type icon
function getTypeIcon(type: string) {
  switch (type) {
    case 'project':
    case 'projects':
      return <IconTarget size="0.8rem" />;
    case 'area':
    case 'areas':
      return <IconMap size="0.8rem" />;
    case 'resource':
    case 'resources':
      return <IconBookmark size="0.8rem" />;
    case 'note':
    case 'notes':
      return <IconNote size="0.8rem" />;
    default:
      return <IconSearch size="0.8rem" />;
  }
}

// Helper function to get type color
function getTypeColor(type: string) {
  switch (type) {
    case 'project':
    case 'projects':
      return getParaColor('projects');
    case 'area':
    case 'areas':
      return getParaColor('areas');
    case 'resource':
    case 'resources':
      return getParaColor('resources');
    case 'note':
    case 'notes':
      return getParaColor('notes');
    default:
      return 'gray';
  }
}
