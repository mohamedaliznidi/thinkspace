/**
 * Graph Navigation Components for ThinkSpace
 * 
 * Interactive navigation features including node selection, context menus,
 * breadcrumb navigation, and focus modes using Mantine components.
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Stack,
  Group,
  Button,
  Menu,
  ActionIcon,
  Breadcrumbs,
  Anchor,
  SegmentedControl,
  Modal,
  Text,
  Badge,
  Card,
  Drawer,
  ScrollArea,
  Divider,
  Tooltip,
  UnstyledButton,
  Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconTarget,
  IconMap,
  IconBookmark,
  IconNote,
  IconDots,
  IconEdit,
  IconTrash,
  IconLink,
  IconZoomIn,
  IconZoomOut,
  IconFocus,
  IconRoute,
  IconClock,
  IconSearch,
  IconX,
  IconChevronRight,
} from '@tabler/icons-react';
import type {
  GraphNode,
  GraphEdge,
  GraphFocusMode,
  GraphData
} from '@/types/graph';

interface GraphNavigationProps {
  data: GraphData;
  selectedNodes: string[];
  hoveredNode: string | null;
  focusMode: GraphFocusMode;
  onNodeSelect: (nodeIds: string[]) => void;
  onFocusModeChange: (mode: GraphFocusMode) => void;
  onNodeAction: (action: string, nodeId: string) => void;
  onZoomToNode: (nodeId: string) => void;
  onZoomToFit: () => void;
  onShowPath: (startId: string, endId: string) => void;
}

interface ContextMenuProps {
  node: GraphNode | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onAction: (action: string, nodeId: string) => void;
}

interface NodeDetailsProps {
  node: GraphNode | null;
  edges: GraphEdge[];
  onClose: () => void;
  onNavigate: (nodeId: string) => void;
}

// Context menu component
function GraphContextMenu({ node, position, onClose, onAction }: ContextMenuProps) {
  if (!node || !position) return null;

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'project': return <IconTarget size="1rem" />;
      case 'area': return <IconMap size="1rem" />;
      case 'resource': return <IconBookmark size="1rem" />;
      case 'note': return <IconNote size="1rem" />;
      default: return <IconDots size="1rem" />;
    }
  };

  return (
    <Menu
      opened={true}
      onClose={onClose}
      position="bottom-start"
      withArrow
      shadow="md"
      styles={{
        dropdown: {
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 1000,
        },
      }}
    >
      <Menu.Target>
        <div style={{ position: 'absolute', left: position.x, top: position.y }} />
      </Menu.Target>
      
      <Menu.Dropdown>
        <Menu.Label>
          <Group gap="xs">
            {getNodeIcon(node.type)}
            <Text size="sm" fw={500} truncate style={{ maxWidth: 200 }}>
              {node.label}
            </Text>
          </Group>
        </Menu.Label>
        
        <Menu.Item
          leftSection={<IconFocus size="1rem" />}
          onClick={() => onAction('focus', node.id)}
        >
          Focus on Node
        </Menu.Item>
        
        <Menu.Item
          leftSection={<IconZoomIn size="1rem" />}
          onClick={() => onAction('zoom', node.id)}
        >
          Zoom to Node
        </Menu.Item>
        
        <Menu.Item
          leftSection={<IconRoute size="1rem" />}
          onClick={() => onAction('path', node.id)}
        >
          Find Path To...
        </Menu.Item>
        
        <Menu.Divider />
        
        <Menu.Item
          leftSection={<IconEdit size="1rem" />}
          onClick={() => onAction('edit', node.id)}
        >
          Edit {node.type}
        </Menu.Item>
        
        <Menu.Item
          leftSection={<IconLink size="1rem" />}
          onClick={() => onAction('connect', node.id)}
        >
          Add Connection
        </Menu.Item>
        
        <Menu.Divider />
        
        <Menu.Item
          leftSection={<IconTrash size="1rem" />}
          color="red"
          onClick={() => onAction('delete', node.id)}
        >
          Delete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

// Node details drawer
function NodeDetailsDrawer({ node, edges, onClose, onNavigate }: NodeDetailsProps) {
  if (!node) return null;

  const connectedEdges = edges.filter(edge => {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
    return sourceId === node.id || targetId === node.id;
  });

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'project': return <IconTarget size="1rem" />;
      case 'area': return <IconMap size="1rem" />;
      case 'resource': return <IconBookmark size="1rem" />;
      case 'note': return <IconNote size="1rem" />;
      default: return <IconDots size="1rem" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'COMPLETED': return 'green';
      case 'IN_PROGRESS': return 'blue';
      case 'PLANNING': return 'yellow';
      case 'ON_HOLD': return 'orange';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Drawer
      opened={true}
      onClose={onClose}
      title={
        <Group gap="xs">
          {getNodeIcon(node.type)}
          <Text fw={600}>{node.label}</Text>
        </Group>
      }
      position="right"
      size="md"
    >
      <ScrollArea style={{ height: 'calc(100vh - 120px)' }}>
        <Stack gap="md">
          {/* Node Info */}
          <Card padding="md" radius="md" withBorder>
            <Stack gap="sm">
              <Group justify="space-between">
                <Badge variant="light" color={node.color}>
                  {node.type.toUpperCase()}
                </Badge>
                {node.status && (
                  <Badge color={getStatusColor(node.status)}>
                    {node.status}
                  </Badge>
                )}
              </Group>
              
              <Text size="sm" c="dimmed">
                Created: {new Date(node.createdAt).toLocaleDateString()}
              </Text>
              
              <Group gap="lg">
                <div>
                  <Text size="xs" c="dimmed">Connections</Text>
                  <Text fw={600}>{node.connectionCount}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Centrality</Text>
                  <Text fw={600}>{(node.centralityScore || 0).toFixed(2)}</Text>
                </div>
              </Group>
            </Stack>
          </Card>

          {/* Connections */}
          <div>
            <Text fw={600} mb="sm">
              Connections ({connectedEdges.length})
            </Text>
            
            <Stack gap="xs">
              {connectedEdges.map(edge => {
                const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
                const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
                const connectedNodeId = sourceId === node.id ? targetId : sourceId;
                
                return (
                  <UnstyledButton
                    key={edge.id}
                    onClick={() => onNavigate(connectedNodeId)}
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef',
                      width: '100%',
                    }}
                  >
                    <Group justify="space-between">
                      <Group gap="xs">
                        <Badge size="xs" variant="outline">
                          {edge.type.replace('_', ' ')}
                        </Badge>
                        <Text size="sm">{edge.label || connectedNodeId}</Text>
                      </Group>
                      <IconChevronRight size="1rem" color="var(--mantine-color-gray-5)" />
                    </Group>
                  </UnstyledButton>
                );
              })}
            </Stack>
          </div>
        </Stack>
      </ScrollArea>
    </Drawer>
  );
}

// Main navigation component
export function GraphNavigation({
  data,
  selectedNodes,
  focusMode,
  onNodeSelect,
  onFocusModeChange,
  onNodeAction,
  onZoomToNode,
  onZoomToFit,
  onShowPath,
}: GraphNavigationProps) {
  const [contextMenu, setContextMenu] = useState<{
    node: GraphNode | null;
    position: { x: number; y: number } | null;
  }>({ node: null, position: null });
  
  const [selectedNodeForDetails, setSelectedNodeForDetails] = useState<GraphNode | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; label: string }>>([]);
  const [pathModalOpened, { open: openPathModal, close: closePathModal }] = useDisclosure(false);
  const [pathStart, setPathStart] = useState<string>('');
  const [pathEnd, setPathEnd] = useState<string>('');

  // Handle context menu (placeholder for future implementation)
  // const handleContextMenu = useCallback((node: GraphNode, event: GraphInteractionEvent) => {
  //   if (event.position) {
  //     setContextMenu({
  //       node,
  //       position: event.position,
  //     });
  //   }
  // }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu({ node: null, position: null });
  }, []);

  // Handle node actions
  const handleNodeAction = useCallback((action: string, nodeId: string) => {
    closeContextMenu();
    
    switch (action) {
      case 'focus':
        onNodeSelect([nodeId]);
        onFocusModeChange('node_neighborhood');
        break;
      case 'zoom':
        onZoomToNode(nodeId);
        break;
      case 'path':
        setPathStart(nodeId);
        openPathModal();
        break;
      case 'details':
        const node = data.nodes.find(n => n.id === nodeId);
        setSelectedNodeForDetails(node || null);
        break;
      default:
        onNodeAction(action, nodeId);
    }
  }, [onNodeSelect, onFocusModeChange, onZoomToNode, onNodeAction, data.nodes, openPathModal]);

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = useCallback((nodeId: string) => {
    onNodeSelect([nodeId]);
    onZoomToNode(nodeId);
    
    // Update breadcrumbs
    const clickedIndex = breadcrumbs.findIndex(b => b.id === nodeId);
    if (clickedIndex >= 0) {
      setBreadcrumbs(breadcrumbs.slice(0, clickedIndex + 1));
    }
  }, [breadcrumbs, onNodeSelect, onZoomToNode]);

  // Update breadcrumbs when selection changes
  useEffect(() => {
    if (selectedNodes.length === 1) {
      const nodeId = selectedNodes[0];
      const node = data.nodes.find(n => n.id === nodeId);
      
      if (node && !breadcrumbs.some(b => b.id === nodeId)) {
        setBreadcrumbs(prev => [...prev, { id: nodeId, label: node.label }]);
      }
    }
  }, [selectedNodes, data.nodes, breadcrumbs]);

  // Handle path finding
  const handleShowPath = useCallback(() => {
    if (pathStart && pathEnd) {
      onShowPath(pathStart, pathEnd);
      closePathModal();
      setPathStart('');
      setPathEnd('');
    }
  }, [pathStart, pathEnd, onShowPath, closePathModal]);

  return (
    <>
      {/* Focus Mode Controls */}
      <Card padding="md" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600} size="sm">Focus Mode</Text>
            <Group gap="xs">
              <Tooltip label="Zoom to Fit">
                <ActionIcon variant="outline" onClick={onZoomToFit}>
                  <IconZoomOut size="1rem" />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
          
          <SegmentedControl
            value={focusMode}
            onChange={(value) => onFocusModeChange(value as GraphFocusMode)}
            data={[
              { label: 'Overview', value: 'overview' },
              { label: 'Neighborhood', value: 'node_neighborhood' },
              { label: 'Clusters', value: 'cluster_view' },
              { label: 'Time', value: 'time_filtered' },
            ]}
            size="sm"
          />
        </Stack>
      </Card>

      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 0 && (
        <Card padding="md" radius="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={600} size="sm">Navigation Path</Text>
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => setBreadcrumbs([])}
              >
                <IconX size="0.8rem" />
              </ActionIcon>
            </Group>
            
            <Breadcrumbs>
              {breadcrumbs.map((crumb) => (
                <Anchor
                  key={crumb.id}
                  onClick={() => handleBreadcrumbClick(crumb.id)}
                  size="sm"
                >
                  {crumb.label}
                </Anchor>
              ))}
            </Breadcrumbs>
          </Stack>
        </Card>
      )}

      {/* Selected Node Info */}
      {selectedNodes.length > 0 && (
        <Card padding="md" radius="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={600} size="sm">
                Selected ({selectedNodes.length})
              </Text>
              <Button
                variant="light"
                size="xs"
                onClick={() => {
                  const node = data.nodes.find(n => n.id === selectedNodes[0]);
                  setSelectedNodeForDetails(node || null);
                }}
                disabled={selectedNodes.length !== 1}
              >
                View Details
              </Button>
            </Group>
            
            <Stack gap="xs">
              {selectedNodes.slice(0, 3).map(nodeId => {
                const node = data.nodes.find(n => n.id === nodeId);
                if (!node) return null;
                
                return (
                  <Group key={nodeId} gap="xs">
                    <Badge size="xs" variant="light" color={node.color}>
                      {node.type}
                    </Badge>
                    <Text size="sm" truncate style={{ flex: 1 }}>
                      {node.label}
                    </Text>
                  </Group>
                );
              })}
              
              {selectedNodes.length > 3 && (
                <Text size="xs" c="dimmed">
                  +{selectedNodes.length - 3} more
                </Text>
              )}
            </Stack>
          </Stack>
        </Card>
      )}

      {/* Context Menu */}
      <GraphContextMenu
        node={contextMenu.node}
        position={contextMenu.position}
        onClose={closeContextMenu}
        onAction={handleNodeAction}
      />

      {/* Node Details Drawer */}
      {selectedNodeForDetails && (
        <NodeDetailsDrawer
          node={selectedNodeForDetails}
          edges={data.edges}
          onClose={() => setSelectedNodeForDetails(null)}
          onNavigate={(nodeId) => {
            setSelectedNodeForDetails(null);
            onNodeSelect([nodeId]);
            onZoomToNode(nodeId);
          }}
        />
      )}

      {/* Path Finding Modal */}
      <Modal
        opened={pathModalOpened}
        onClose={closePathModal}
        title="Find Path Between Nodes"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Find the shortest path between two nodes in the graph.
          </Text>
          
          {/* Path selection would go here - simplified for now */}
          <Group grow>
            <Button onClick={handleShowPath} disabled={!pathStart || !pathEnd}>
              Find Path
            </Button>
            <Button variant="outline" onClick={closePathModal}>
              Cancel
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
