/**
 * SubInterest Tree Component for ThinkSpace Areas
 * 
 * Displays hierarchical sub-interests in an expandable tree structure
 * with content counts, quick actions, and drag-and-drop support.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Group,
  Text,
  ActionIcon,
  Badge,
  Collapse,
  Menu,
  Card,
  Stack,
  Button,
  Tooltip,
  UnstyledButton,
  rem,
} from '@mantine/core';
import {
  IconChevronRight,
  IconChevronDown,
  IconPlus,
  IconEdit,
  IconTrash,
  IconDots,
  IconNotes,
  IconBookmark,
  IconBriefcase,
  IconLink,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import type { SubInterestWithBasic, SubInterestTreeNode } from '@/types/sub-interest';
import { buildSubInterestTree } from '@/lib/sub-interests';

interface SubInterestTreeProps {
  areaId: string;
  subInterests: SubInterestWithBasic[];
  onEdit?: (subInterest: SubInterestWithBasic) => void;
  onDelete?: (subInterest: SubInterestWithBasic) => void;
  onAddChild?: (parentId: string) => void;
  onSelect?: (subInterest: SubInterestWithBasic) => void;
  selectedId?: string;
  maxDepth?: number;
  showCounts?: boolean;
  showActions?: boolean;
}

interface TreeNodeProps {
  node: SubInterestTreeNode;
  depth: number;
  maxDepth: number;
  showCounts: boolean;
  showActions: boolean;
  selectedId?: string;
  onToggle: (nodeId: string) => void;
  onEdit?: (subInterest: SubInterestWithBasic) => void;
  onDelete?: (subInterest: SubInterestWithBasic) => void;
  onAddChild?: (parentId: string) => void;
  onSelect?: (subInterest: SubInterestWithBasic) => void;
}

function TreeNode({
  node,
  depth,
  maxDepth,
  showCounts,
  showActions,
  selectedId,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
  onSelect,
}: TreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;
  const canExpand = hasChildren && depth < maxDepth;

  const handleToggle = useCallback(() => {
    if (canExpand) {
      onToggle(node.id);
    }
  }, [canExpand, node.id, onToggle]);

  const getBasic = () => {
    // Omit children and expanded, and convert description null to undefined
    const { children, expanded, ...rest } = node;
    return {
      ...rest,
      description: node.description === null ? null : node.description,
    };
  };

  const handleSelect = useCallback(() => {
    onSelect?.(getBasic());
  }, [node, onSelect]);

  const handleEdit = useCallback(() => {
    onEdit?.(getBasic());
  }, [node, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete?.(getBasic());
  }, [node, onDelete]);

  const handleAddChild = useCallback(() => {
    onAddChild?.(node.id);
  }, [node.id, onAddChild]);

  const indentSize = depth * 20;

  return (
    <Box>
      <UnstyledButton
        onClick={handleSelect}
        style={{
          width: '100%',
          padding: rem(8),
          paddingLeft: rem(indentSize + 8),
          borderRadius: rem(4),
          backgroundColor: isSelected ? 'var(--mantine-color-blue-light)' : 'transparent',
          border: isSelected ? '1px solid var(--mantine-color-blue-filled)' : '1px solid transparent',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <Group gap="xs" wrap="nowrap">
          {/* Expand/Collapse Button */}
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            disabled={!canExpand}
            style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
          >
            {node.expanded ? (
              <IconChevronDown size="0.8rem" />
            ) : (
              <IconChevronRight size="0.8rem" />
            )}
          </ActionIcon>

          {/* Sub-Interest Title */}
          <Text
            size="sm"
            fw={500}
            style={{ flex: 1 }}
            lineClamp={1}
          >
            {node.title}
          </Text>

          {/* Content Counts */}
          {showCounts && (
            <Group gap="xs">
              {node._count.projects > 0 && (
                <Tooltip label={`${node._count.projects} projects`}>
                  <Badge
                    size="xs"
                    variant="light"
                    color="blue"
                    leftSection={<IconBriefcase size="0.6rem" />}
                  >
                    {node._count.projects}
                  </Badge>
                </Tooltip>
              )}
              {node._count.resources > 0 && (
                <Tooltip label={`${node._count.resources} resources`}>
                  <Badge
                    size="xs"
                    variant="light"
                    color="green"
                    leftSection={<IconBookmark size="0.6rem" />}
                  >
                    {node._count.resources}
                  </Badge>
                </Tooltip>
              )}
              {node._count.notes_rel > 0 && (
                <Tooltip label={`${node._count.notes_rel} notes`}>
                  <Badge
                    size="xs"
                    variant="light"
                    color="orange"
                    leftSection={<IconNotes size="0.6rem" />}
                  >
                    {node._count.notes_rel}
                  </Badge>
                </Tooltip>
              )}
              {node._count.relatedSubInterests > 0 && (
                <Tooltip label={`${node._count.relatedSubInterests} connections`}>
                  <Badge
                    size="xs"
                    variant="light"
                    color="grape"
                    leftSection={<IconLink size="0.6rem" />}
                  >
                    {node._count.relatedSubInterests}
                  </Badge>
                </Tooltip>
              )}
            </Group>
          )}

          {/* Actions Menu */}
          {showActions && (
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconDots size="0.8rem" />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconPlus size="0.9rem" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddChild();
                  }}
                >
                  Add Sub-Interest
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconEdit size="0.9rem" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                >
                  Edit
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconTrash size="0.9rem" />}
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </UnstyledButton>

      {/* Children */}
      {hasChildren && (
        <Collapse in={node.expanded ?? false}>
          <Box>
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                maxDepth={maxDepth}
                showCounts={showCounts}
                showActions={showActions}
                selectedId={selectedId}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
                onSelect={onSelect}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

export default function SubInterestTree({
  areaId,
  subInterests,
  onEdit,
  onDelete,
  onAddChild,
  onSelect,
  selectedId,
  maxDepth = 10,
  showCounts = true,
  showActions = true,
}: SubInterestTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build tree structure
  const tree = buildSubInterestTree(subInterests);

  // Update tree nodes with expanded state
  const updateTreeExpansion = (nodes: SubInterestTreeNode[]): SubInterestTreeNode[] => {
    return nodes.map(node => ({
      ...node,
      expanded: expandedNodes.has(node.id),
      children: updateTreeExpansion(node.children),
    }));
  };

  const treeWithExpansion = updateTreeExpansion(tree);

  const handleToggle = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    const allNodeIds = new Set<string>();
    const collectNodeIds = (nodes: SubInterestTreeNode[]) => {
      nodes.forEach(node => {
        if (node.children.length > 0) {
          allNodeIds.add(node.id);
          collectNodeIds(node.children);
        }
      });
    };
    collectNodeIds(tree);
    setExpandedNodes(allNodeIds);
  }, [tree]);

  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  if (subInterests.length === 0) {
    return (
      <Card padding="xl" radius="md" withBorder>
        <Stack gap="md" align="center">
          <IconBookmark size="3rem" color="var(--mantine-color-gray-5)" />
          <Text size="lg" fw={500}>No sub-interests yet</Text>
          <Text size="sm" c="dimmed" ta="center">
            Create sub-interests to organize and structure this area's content
          </Text>
          {onAddChild && (
            <Button
              leftSection={<IconPlus size="1rem" />}
              onClick={() => onAddChild('')}
            >
              Add First Sub-Interest
            </Button>
          )}
        </Stack>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      {/* Tree Controls */}
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {subInterests.length} sub-interest{subInterests.length !== 1 ? 's' : ''}
        </Text>
        <Group gap="xs">
          <Button
            variant="subtle"
            size="xs"
            onClick={handleExpandAll}
          >
            Expand All
          </Button>
          <Button
            variant="subtle"
            size="xs"
            onClick={handleCollapseAll}
          >
            Collapse All
          </Button>
          {onAddChild && (
            <Button
              size="xs"
              leftSection={<IconPlus size="0.8rem" />}
              onClick={() => onAddChild('')}
            >
              Add Root
            </Button>
          )}
        </Group>
      </Group>

      {/* Tree */}
      <Card withBorder>
        <Stack gap={0}>
          {treeWithExpansion.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              maxDepth={maxDepth}
              showCounts={showCounts}
              showActions={showActions}
              selectedId={selectedId}
              onToggle={handleToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onSelect={onSelect}
            />
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}
