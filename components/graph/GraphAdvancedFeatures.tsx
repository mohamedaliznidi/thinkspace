/**
 * Advanced Graph Features for ThinkSpace
 * 
 * Advanced functionality including visual search, export capabilities,
 * shareable views, and keyboard shortcuts integration.
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Stack,
  Group,
  Card,
  Text,
  TextInput,
  Button,
  ActionIcon,
  Modal,
  Select,
  Switch,
  ColorInput,
  NumberInput,
  Tabs,
  Badge,
  Kbd,
  Alert,
  CopyButton,
  Tooltip,
  Code,
  ScrollArea,
  Divider,
  Checkbox,
} from '@mantine/core';
import { Spotlight, spotlight } from '@mantine/spotlight';
import { useDebouncedValue, useHotkeys, useClipboard } from '@mantine/hooks';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconSearch,
  IconDownload,
  IconShare,
  IconKeyboard,
  IconFilter,
  IconHighlight,
  IconCopy,
  IconCheck,
  IconX,
  IconPhoto,
  IconFileText,
  IconDatabase,
  IconLink,
  IconSettings,
  IconZoomIn,
  IconZoomOut,
  IconRefresh,
  IconFocus,
  IconRoute,
} from '@tabler/icons-react';
import type { 
  GraphData, 
  GraphNode, 
  GraphEdge, 
  GraphSearchResult, 
  GraphExportOptions,
  GraphVisualizationConfig 
} from '@/types/graph';

interface GraphAdvancedFeaturesProps {
  data: GraphData;
  config: GraphVisualizationConfig;
  onSearch: (query: string) => Promise<GraphSearchResult>;
  onExport: (options: GraphExportOptions) => Promise<void>;
  onConfigChange: (config: Partial<GraphVisualizationConfig>) => void;
  onNodeHighlight: (nodeIds: string[]) => void;
  onEdgeHighlight: (edgeIds: string[]) => void;
  onZoomToFit: () => void;
  onZoomToNode: (nodeId: string) => void;
  onRefresh: () => void;
}

// Visual search component
function VisualSearch({ 
  data, 
  onSearch, 
  onNodeHighlight, 
  onEdgeHighlight 
}: {
  data: GraphData;
  onSearch: (query: string) => Promise<GraphSearchResult>;
  onNodeHighlight: (nodeIds: string[]) => void;
  onEdgeHighlight: (edgeIds: string[]) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GraphSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedQuery] = useDebouncedValue(searchQuery, 300);

  // Perform search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      onNodeHighlight([]);
      onEdgeHighlight([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await onSearch(query);
      setSearchResults(results);
      
      // Highlight search results
      onNodeHighlight(results.nodes.map(n => n.id));
      onEdgeHighlight(results.edges.map(e => e.id));
    } catch (error) {
      notifications.show({
        title: 'Search Error',
        message: 'Failed to perform search',
        color: 'red',
      });
    } finally {
      setIsSearching(false);
    }
  }, [onSearch, onNodeHighlight, onEdgeHighlight]);

  // Search when debounced query changes
  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  // Spotlight actions for quick search
  const spotlightActions = useMemo(() => [
    ...data.nodes.map(node => ({
      id: node.id,
      label: node.label,
      description: `${node.type} • ${node.connectionCount} connections`,
      onClick: () => {
        setSearchQuery(node.label);
        onNodeHighlight([node.id]);
      },
      leftSection: getNodeIcon(node.type),
    })),
  ], [data.nodes, onNodeHighlight]);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'project': return '🎯';
      case 'area': return '🗺️';
      case 'resource': return '📚';
      case 'note': return '📝';
      default: return '🔗';
    }
  };

  return (
    <Card padding="md" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={600} size="sm">Visual Search</Text>
          <Badge variant="light" color="blue">
            {searchResults?.totalResults || 0} results
          </Badge>
        </Group>

        <TextInput
          placeholder="Search nodes, connections, or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          leftSection={<IconSearch size="1rem" />}
          rightSection={
            isSearching ? (
              <div>Searching...</div>
            ) : searchQuery ? (
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={() => setSearchQuery('')}
              >
                <IconX size="0.8rem" />
              </ActionIcon>
            ) : null
          }
        />

        {searchResults && (
          <div>
            <Text size="sm" c="dimmed" mb="xs">
              Found {searchResults.totalResults} results
            </Text>
            
            {searchResults.paths && searchResults.paths.length > 0 && (
              <Alert icon={<IconRoute size="1rem" />} color="blue" variant="light">
                Found {searchResults.paths.length} connection paths
              </Alert>
            )}
          </div>
        )}

        <Group gap="xs">
          <Kbd size="xs">Ctrl</Kbd>
          <Text size="xs" c="dimmed">+</Text>
          <Kbd size="xs">K</Kbd>
          <Text size="xs" c="dimmed">for quick search</Text>
        </Group>
      </Stack>

      <Spotlight
        actions={spotlightActions}
        searchProps={{
          leftSection: <IconSearch size="1rem" />,
          placeholder: 'Search knowledge graph...',
        }}
        highlightQuery
        maxHeight={400}
        limit={10}
      />
    </Card>
  );
}

// Export functionality component
function ExportManager({ 
  data, 
  onExport 
}: {
  data: GraphData;
  onExport: (options: GraphExportOptions) => Promise<void>;
}) {
  const [exportModalOpened, { open: openExportModal, close: closeExportModal }] = useDisclosure(false);
  const [exportOptions, setExportOptions] = useState<GraphExportOptions>({
    format: 'png',
    includeMetadata: true,
    resolution: 1920,
    backgroundColor: '#ffffff',
    nodeLabels: true,
    edgeLabels: false,
  });

  const handleExport = useCallback(async () => {
    try {
      await onExport(exportOptions);
      closeExportModal();
      notifications.show({
        title: 'Export Successful',
        message: `Graph exported as ${exportOptions.format.toUpperCase()}`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Export Failed',
        message: 'Failed to export graph',
        color: 'red',
      });
    }
  }, [exportOptions, onExport, closeExportModal]);

  return (
    <>
      <Card padding="md" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600} size="sm">Export Graph</Text>
            <Button
              leftSection={<IconDownload size="1rem" />}
              size="xs"
              onClick={openExportModal}
            >
              Export
            </Button>
          </Group>

          <Text size="xs" c="dimmed">
            Export your graph as image, data, or shareable format
          </Text>
        </Stack>
      </Card>

      <Modal
        opened={exportModalOpened}
        onClose={closeExportModal}
        title="Export Graph"
        size="md"
      >
        <Stack gap="md">
          <Select
            label="Format"
            value={exportOptions.format}
            onChange={(value) => setExportOptions(prev => ({ 
              ...prev, 
              format: value as GraphExportOptions['format'] 
            }))}
            data={[
              { value: 'png', label: 'PNG Image' },
              { value: 'svg', label: 'SVG Vector' },
              { value: 'json', label: 'JSON Data' },
              { value: 'csv', label: 'CSV Table' },
            ]}
          />

          {(exportOptions.format === 'png' || exportOptions.format === 'svg') && (
            <>
              <NumberInput
                label="Resolution (width)"
                value={exportOptions.resolution}
                onChange={(value) => setExportOptions(prev => ({
                  ...prev,
                  resolution: typeof value === 'number' ? value : 1920
                }))}
                min={800}
                max={4000}
                step={100}
              />

              <ColorInput
                label="Background Color"
                value={exportOptions.backgroundColor}
                onChange={(value) => setExportOptions(prev => ({ 
                  ...prev, 
                  backgroundColor: value 
                }))}
              />

              <Group grow>
                <Switch
                  label="Include node labels"
                  checked={exportOptions.nodeLabels}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    nodeLabels: e.currentTarget.checked 
                  }))}
                />
                <Switch
                  label="Include edge labels"
                  checked={exportOptions.edgeLabels}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    edgeLabels: e.currentTarget.checked 
                  }))}
                />
              </Group>
            </>
          )}

          <Switch
            label="Include metadata"
            description="Include creation dates, statistics, and other metadata"
            checked={exportOptions.includeMetadata}
            onChange={(e) => setExportOptions(prev => ({ 
              ...prev, 
              includeMetadata: e.currentTarget.checked 
            }))}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeExportModal}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              Export {exportOptions.format.toUpperCase()}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

// Shareable views component
function ShareableViews({ data }: { data: GraphData }) {
  const clipboard = useClipboard({ timeout: 2000 });
  const [shareModalOpened, { open: openShareModal, close: closeShareModal }] = useDisclosure(false);
  const [shareConfig, setShareConfig] = useState({
    includeFilters: true,
    includeSelection: false,
    publicAccess: false,
    expiresIn: '7d',
  });

  const generateShareUrl = useCallback(() => {
    const params = new URLSearchParams();
    
    if (shareConfig.includeFilters) {
      params.append('filters', 'true');
    }
    
    if (shareConfig.includeSelection) {
      params.append('selection', 'true');
    }
    
    params.append('expires', shareConfig.expiresIn);
    
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?${params.toString()}`;
  }, [shareConfig]);

  const handleShare = useCallback(() => {
    const shareUrl = generateShareUrl();
    clipboard.copy(shareUrl);
    
    notifications.show({
      title: 'Share URL Copied',
      message: 'The shareable link has been copied to your clipboard',
      color: 'green',
    });
  }, [generateShareUrl, clipboard]);

  return (
    <>
      <Card padding="md" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600} size="sm">Share Graph</Text>
            <Button
              leftSection={<IconShare size="1rem" />}
              size="xs"
              onClick={openShareModal}
            >
              Share
            </Button>
          </Group>

          <Text size="xs" c="dimmed">
            Create shareable links to your graph views
          </Text>
        </Stack>
      </Card>

      <Modal
        opened={shareModalOpened}
        onClose={closeShareModal}
        title="Share Graph View"
        size="md"
      >
        <Stack gap="md">
          <Alert icon={<IconLink size="1rem" />} color="blue" variant="light">
            Create a shareable link to this graph view
          </Alert>

          <Stack gap="sm">
            <Checkbox
              label="Include current filters"
              checked={shareConfig.includeFilters}
              onChange={(e) => setShareConfig(prev => ({ 
                ...prev, 
                includeFilters: e.currentTarget.checked 
              }))}
            />
            
            <Checkbox
              label="Include selected nodes"
              checked={shareConfig.includeSelection}
              onChange={(e) => setShareConfig(prev => ({ 
                ...prev, 
                includeSelection: e.currentTarget.checked 
              }))}
            />
            
            <Checkbox
              label="Allow public access"
              description="Anyone with the link can view (read-only)"
              checked={shareConfig.publicAccess}
              onChange={(e) => setShareConfig(prev => ({ 
                ...prev, 
                publicAccess: e.currentTarget.checked 
              }))}
            />
          </Stack>

          <Select
            label="Link expires in"
            value={shareConfig.expiresIn}
            onChange={(value) => setShareConfig(prev => ({ 
              ...prev, 
              expiresIn: value || '7d' 
            }))}
            data={[
              { value: '1h', label: '1 hour' },
              { value: '1d', label: '1 day' },
              { value: '7d', label: '7 days' },
              { value: '30d', label: '30 days' },
              { value: 'never', label: 'Never' },
            ]}
          />

          <Code block>
            {generateShareUrl()}
          </Code>

          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeShareModal}>
              Cancel
            </Button>
            <CopyButton value={generateShareUrl()}>
              {({ copied, copy }) => (
                <Button
                  leftSection={copied ? <IconCheck size="1rem" /> : <IconCopy size="1rem" />}
                  color={copied ? 'green' : 'blue'}
                  onClick={copy}
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              )}
            </CopyButton>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

// Keyboard shortcuts component
function KeyboardShortcuts({ 
  onZoomToFit, 
  onRefresh, 
  onZoomIn, 
  onZoomOut 
}: {
  onZoomToFit: () => void;
  onRefresh: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  const [shortcutsModalOpened, { open: openShortcutsModal, close: closeShortcutsModal }] = useDisclosure(false);

  // Register keyboard shortcuts
  useHotkeys([
    ['ctrl+K', () => spotlight.open()],
    ['ctrl+R', onRefresh],
    ['ctrl+0', onZoomToFit],
    ['ctrl+=', onZoomIn],
    ['ctrl+-', onZoomOut],
    ['?', openShortcutsModal],
  ]);

  const shortcuts = [
    { keys: ['Ctrl', 'K'], description: 'Open search' },
    { keys: ['Ctrl', 'R'], description: 'Refresh graph' },
    { keys: ['Ctrl', '0'], description: 'Zoom to fit' },
    { keys: ['Ctrl', '+'], description: 'Zoom in' },
    { keys: ['Ctrl', '-'], description: 'Zoom out' },
    { keys: ['?'], description: 'Show shortcuts' },
    { keys: ['Esc'], description: 'Clear selection' },
    { keys: ['Space'], description: 'Pan mode' },
  ];

  return (
    <>
      <Card padding="md" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600} size="sm">Keyboard Shortcuts</Text>
            <ActionIcon
              variant="outline"
              size="sm"
              onClick={openShortcutsModal}
            >
              <IconKeyboard size="1rem" />
            </ActionIcon>
          </Group>

          <Group gap="xs">
            <Kbd size="xs">?</Kbd>
            <Text size="xs" c="dimmed">to see all shortcuts</Text>
          </Group>
        </Stack>
      </Card>

      <Modal
        opened={shortcutsModalOpened}
        onClose={closeShortcutsModal}
        title="Keyboard Shortcuts"
        size="md"
      >
        <ScrollArea style={{ height: 300 }}>
          <Stack gap="sm">
            {shortcuts.map((shortcut, index) => (
              <Group key={index} justify="space-between">
                <Text size="sm">{shortcut.description}</Text>
                <Group gap="xs">
                  {shortcut.keys.map((key, keyIndex) => (
                    <React.Fragment key={keyIndex}>
                      <Kbd size="xs">{key}</Kbd>
                      {keyIndex < shortcut.keys.length - 1 && (
                        <Text size="xs" c="dimmed">+</Text>
                      )}
                    </React.Fragment>
                  ))}
                </Group>
              </Group>
            ))}
          </Stack>
        </ScrollArea>
      </Modal>
    </>
  );
}

// Main advanced features component
export function GraphAdvancedFeatures({
  data,
  config,
  onSearch,
  onExport,
  onConfigChange,
  onNodeHighlight,
  onEdgeHighlight,
  onZoomToFit,
  onZoomToNode,
  onRefresh,
}: GraphAdvancedFeaturesProps) {
  return (
    <Stack gap="md">
      <VisualSearch
        data={data}
        onSearch={onSearch}
        onNodeHighlight={onNodeHighlight}
        onEdgeHighlight={onEdgeHighlight}
      />

      <ExportManager
        data={data}
        onExport={onExport}
      />

      <ShareableViews data={data} />

      <KeyboardShortcuts
        onZoomToFit={onZoomToFit}
        onRefresh={onRefresh}
        onZoomIn={() => {/* Zoom in logic */}}
        onZoomOut={() => {/* Zoom out logic */}}
      />
    </Stack>
  );
}
