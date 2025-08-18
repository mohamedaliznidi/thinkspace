/**
 * Resource Manager Component
 *
 * Main component for comprehensive resource management including
 * folder views, summary editing, and reference visualization.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconFolder,
  IconFile,
  IconSearch,
  IconPlus,
  IconColumns,
  IconGrid3x3,
  IconList,
  IconFilter,
  IconArrowsSort
} from '@tabler/icons-react';
import {
  Button,
  TextInput,
  Card,
  Badge,
  Group,
  Stack,
  Text,
  ActionIcon,
  SegmentedControl,
  Select,
  Paper,
  Flex,
  Box
} from '@mantine/core';
// import { ResourceFolderTree } from './ResourceFolderTree';
import { ResourceList } from './ResourceList';
// import { ResourceGrid } from './ResourceGrid';
import { ResourceSearch } from './ResourceSearch';
import { ResourceFilters } from './ResourceFilters';
// import { ResourceImportDialog } from './ResourceImportDialog';
// import { ResourceAnalyticsDashboard } from './ResourceAnalyticsDashboard';
import type { 
  EnhancedResource, 
  ResourceFolder, 
  ResourceViewState,
  ResourceSearchRequest 
} from '@/types/resources';

interface ResourceManagerProps {
  initialResources?: EnhancedResource[];
  initialFolders?: ResourceFolder[];
  currentFolderId?: string;
}

export function ResourceManager({ 
  initialResources = [], 
  initialFolders = [],
  currentFolderId 
}: ResourceManagerProps) {
  const router = useRouter();
  
  // State management
  const [resources, setResources] = useState<EnhancedResource[]>(initialResources);
  const [folders, setFolders] = useState<ResourceFolder[]>(initialFolders);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // View state
  const [viewState, setViewState] = useState<ResourceViewState>({
    viewMode: 'list',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    filters: {
      types: [],
      folders: [],
      tags: [],
      hasContent: false,
      hasSummary: false,
    },
    selectedResources: [],
    searchQuery: '',
    currentFolder: currentFolderId,
  });

  // Dialog states
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Load resources and folders
  useEffect(() => {
    loadResources();
    loadFolders();
  }, [viewState.currentFolder, viewState.filters, viewState.sortBy, viewState.sortOrder]);

  const loadResources = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchRequest: ResourceSearchRequest = {
        query: viewState.searchQuery || undefined,
        type: viewState.filters.types.length > 0 ? viewState.filters.types[0] : undefined,
        folderId: viewState.currentFolder,
        tags: viewState.filters.tags.length > 0 ? viewState.filters.tags : undefined,
        hasContent: viewState.filters.hasContent || undefined,
        hasSummary: viewState.filters.hasSummary || undefined,
        sortBy: viewState.sortBy,
        sortOrder: viewState.sortOrder,
        limit: 50,
      };

      const response = await fetch('/api/resources/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchType: 'hybrid',
          ...searchRequest,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load resources');
      }

      const data = await response.json();
      setResources(data.data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const response = await fetch('/api/resources/folders?tree=true');
      if (!response.ok) {
        throw new Error('Failed to load folders');
      }

      const data = await response.json();
      setFolders(data.data.folders || []);
    } catch (err) {
      console.error('Failed to load folders:', err);
    }
  };

  const handleSearch = (query: string) => {
    setViewState(prev => ({ ...prev, searchQuery: query }));
  };

  const handleFilterChange = (filters: ResourceViewState['filters']) => {
    setViewState(prev => ({ ...prev, filters }));
  };

  const handleViewModeChange = (viewMode: ResourceViewState['viewMode']) => {
    setViewState(prev => ({ ...prev, viewMode }));
  };

  const handleSortChange = (sortBy: ResourceViewState['sortBy'], sortOrder: ResourceViewState['sortOrder']) => {
    setViewState(prev => ({ ...prev, sortBy, sortOrder }));
  };

  const handleFolderSelect = (folderId: string | null) => {
    setViewState(prev => ({ ...prev, currentFolder: folderId || undefined }));
  };

  const handleResourceSelect = (resourceId: string, selected: boolean) => {
    setViewState(prev => ({
      ...prev,
      selectedResources: selected
        ? [...prev.selectedResources, resourceId]
        : prev.selectedResources.filter(id => id !== resourceId)
    }));
  };

  const handleBulkAction = async (action: string) => {
    if (viewState.selectedResources.length === 0) return;

    try {
      setLoading(true);
      
      // Handle different bulk actions
      switch (action) {
        case 'move':
          // Would open folder selection dialog
          break;
        case 'tag':
          // Would open tag editing dialog
          break;
        case 'delete':
          // Would show confirmation dialog
          break;
        case 'summarize':
          // Would trigger bulk summarization
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk action failed');
    } finally {
      setLoading(false);
    }
  };

  const renderResourceView = () => {
    const commonProps = {
      resources,
      loading,
      selectedResources: viewState.selectedResources,
      onResourceSelect: handleResourceSelect,
      onResourceClick: (resource: EnhancedResource) => {
        router.push(`/resources/${resource.id}`);
      },
    };

    switch (viewState.viewMode) {
      case 'grid':
        // return <ResourceGrid {...commonProps} />;
        return <div className="text-center py-8 text-gray-500">Grid view coming soon</div>;
      case 'table':
        return <ResourceList {...commonProps} viewMode="table" />;
      case 'list':
      default:
        return <ResourceList {...commonProps} viewMode="list" />;
    }
  };

  return (
    <Flex h="100vh" bg="gray.0">
      {/* Sidebar - Folder Tree */}
      <Paper w={280} shadow="sm" style={{ borderRadius: 0 }}>
        <Stack h="100%" gap={0}>
          <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <Text size="lg" fw={600}>Resources</Text>
          </Box>

          <Box flex={1} style={{ overflowY: 'auto' }}>
            <Box p="md">
              <Text size="sm" c="dimmed">
                Folder tree coming soon
              </Text>
            </Box>
          </Box>

          <Box p="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            <Button
              onClick={() => setShowAnalytics(true)}
              variant="outline"
              size="sm"
              fullWidth
            >
              View Analytics
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Main Content */}
      <Stack flex={1} gap={0}>
        {/* Header */}
        <Paper p="md" shadow="sm" style={{ borderRadius: 0 }}>
          <Group justify="space-between" mb="md">
            <Group gap="md">
              <Text size="xl" fw={700}>
                {viewState.currentFolder ? 'Folder Resources' : 'All Resources'}
              </Text>
              <Badge variant="light">
                {resources.length} resource{resources.length !== 1 ? 's' : ''}
              </Badge>
            </Group>

            <Button
              onClick={() => setShowImportDialog(true)}
              leftSection={<IconPlus size={16} />}
            >
              Add Resource
            </Button>
          </Group>

          {/* Search and Filters */}
          <Group gap="md" wrap="wrap">
            <Box flex={1} style={{ minWidth: 300 }}>
              <ResourceSearch
                query={viewState.searchQuery}
                onSearch={handleSearch}
                placeholder="Search resources..."
              />
            </Box>

            <ResourceFilters
              filters={viewState.filters}
              onFiltersChange={handleFilterChange}
            />

            {/* View Mode Toggle */}
            <SegmentedControl
              value={viewState.viewMode}
              onChange={(value) => handleViewModeChange(value as ResourceViewState['viewMode'])}
              data={[
                { label: <IconList size={16} />, value: 'list' },
                { label: <IconGrid3x3 size={16} />, value: 'grid' },
                { label: <IconColumns size={16} />, value: 'table' },
              ]}
            />

            {/* Sort Options */}
            <Select
              value={`${viewState.sortBy}-${viewState.sortOrder}`}
              onChange={(value) => {
                if (value) {
                  const [sortBy, sortOrder] = value.split('-') as [ResourceViewState['sortBy'], ResourceViewState['sortOrder']];
                  handleSortChange(sortBy, sortOrder);
                }
              }}
              data={[
                { value: 'updatedAt-desc', label: 'Recently Updated' },
                { value: 'createdAt-desc', label: 'Recently Created' },
                { value: 'title-asc', label: 'Title A-Z' },
                { value: 'title-desc', label: 'Title Z-A' },
                { value: 'type-asc', label: 'Type' },
              ]}
              w={180}
            />
          </Group>

          {/* Bulk Actions */}
          {viewState.selectedResources.length > 0 && (
            <Card mt="md" bg="blue.0" withBorder>
              <Group justify="space-between">
                <Text size="sm" c="blue.8">
                  {viewState.selectedResources.length} resource{viewState.selectedResources.length !== 1 ? 's' : ''} selected
                </Text>
                <Group gap="xs">
                  <Button size="xs" variant="outline" onClick={() => handleBulkAction('move')}>
                    Move
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => handleBulkAction('tag')}>
                    Tag
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => handleBulkAction('summarize')}>
                    Summarize
                  </Button>
                  <Button size="xs" color="red" onClick={() => handleBulkAction('delete')}>
                    Delete
                  </Button>
                </Group>
              </Group>
            </Card>
          )}
        </Paper>

        {/* Content Area */}
        <Box flex={1} p="md" style={{ overflowY: 'auto' }}>
          {error && (
            <Card mb="md" bg="red.0" withBorder>
              <Text c="red.8">{error}</Text>
            </Card>
          )}

          {renderResourceView()}
        </Box>
      </Stack>

      {/* Dialogs */}
      {/* <ResourceImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImportComplete={() => {
          setShowImportDialog(false);
          loadResources();
        }}
        currentFolderId={viewState.currentFolder}
      />

      <ResourceAnalyticsDashboard
        open={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      /> */}
    </Flex>
  );
}
