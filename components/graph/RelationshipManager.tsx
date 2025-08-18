/**
 * Relationship Management Components for ThinkSpace
 * 
 * Components for managing different relationship types, visualizing connection
 * strength, and providing relationship analytics.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Stack,
  Group,
  Card,
  Text,
  Badge,
  Button,
  Select,
  Slider,
  RangeSlider,
  Switch,
  Progress,
  RingProgress,
  SimpleGrid,
  ActionIcon,
  Tooltip,
  Modal,
  TextInput,
  Textarea,
  ColorInput,
  Divider,
  Alert,
  Table,
  ScrollArea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconLink,
  IconUnlink,
  IconAdjustments,
  IconEye,
  IconEyeOff,
  IconPlus,
  IconEdit,
  IconTrash,
  IconInfoCircle,
  IconTrendingUp,
  IconNetwork,
  IconFilter,
} from '@tabler/icons-react';
import type { 
  GraphEdge, 
  GraphNode, 
  RelationshipType, 
  GraphData 
} from '@/types/graph';

interface RelationshipManagerProps {
  data: GraphData;
  selectedNodes: string[];
  onUpdateRelationship: (edgeId: string, updates: Partial<GraphEdge>) => void;
  onCreateRelationship: (relationship: Omit<GraphEdge, 'id'>) => void;
  onDeleteRelationship: (edgeId: string) => void;
  onFilterChange: (filters: RelationshipFilters) => void;
}

interface RelationshipFilters {
  types: RelationshipType[];
  strengthRange: [number, number];
  showWeakConnections: boolean;
  showStrongConnections: boolean;
}

interface RelationshipFormData {
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  label: string;
  strength: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  properties: Record<string, any>;
}

// Relationship type configurations
const RELATIONSHIP_CONFIGS: Record<RelationshipType, {
  label: string;
  description: string;
  color: string;
  defaultStrength: number;
  icon: React.ReactNode;
}> = {
  direct_reference: {
    label: 'Direct Reference',
    description: 'Direct link or reference between items',
    color: '#228be6',
    defaultStrength: 1.0,
    icon: <IconLink size="1rem" />,
  },
  shared_tag: {
    label: 'Shared Tag',
    description: 'Items sharing common tags or categories',
    color: '#51cf66',
    defaultStrength: 0.7,
    icon: <IconNetwork size="1rem" />,
  },
  content_similarity: {
    label: 'Content Similarity',
    description: 'Similar content or semantic relationship',
    color: '#7950f2',
    defaultStrength: 0.8,
    icon: <IconTrendingUp size="1rem" />,
  },
  temporal_proximity: {
    label: 'Temporal Proximity',
    description: 'Created or modified around the same time',
    color: '#ff922b',
    defaultStrength: 0.5,
    icon: <IconInfoCircle size="1rem" />,
  },
  project_area: {
    label: 'Project-Area',
    description: 'Project belongs to area',
    color: '#e599f7',
    defaultStrength: 0.9,
    icon: <IconLink size="1rem" />,
  },
  resource_project: {
    label: 'Resource-Project',
    description: 'Resource used in project',
    color: '#74c0fc',
    defaultStrength: 0.8,
    icon: <IconLink size="1rem" />,
  },
  resource_area: {
    label: 'Resource-Area',
    description: 'Resource related to area',
    color: '#91a7ff',
    defaultStrength: 0.7,
    icon: <IconLink size="1rem" />,
  },
  note_project: {
    label: 'Note-Project',
    description: 'Note about project',
    color: '#ffd43b',
    defaultStrength: 0.6,
    icon: <IconLink size="1rem" />,
  },
  note_area: {
    label: 'Note-Area',
    description: 'Note about area',
    color: '#69db7c',
    defaultStrength: 0.5,
    icon: <IconLink size="1rem" />,
  },
  note_resource: {
    label: 'Note-Resource',
    description: 'Note about resource',
    color: '#ffa8a8',
    defaultStrength: 0.4,
    icon: <IconLink size="1rem" />,
  },
  custom: {
    label: 'Custom',
    description: 'User-defined relationship',
    color: '#868e96',
    defaultStrength: 0.6,
    icon: <IconAdjustments size="1rem" />,
  },
};

// Relationship analytics component
function RelationshipAnalytics({ data }: { data: GraphData }) {
  const analytics = useMemo(() => {
    const typeDistribution = new Map<RelationshipType, number>();
    const strengthDistribution = { weak: 0, medium: 0, strong: 0 };
    let totalStrength = 0;

    data.edges.forEach(edge => {
      // Type distribution
      typeDistribution.set(edge.type, (typeDistribution.get(edge.type) || 0) + 1);
      
      // Strength distribution
      if (edge.strength < 0.4) strengthDistribution.weak++;
      else if (edge.strength < 0.7) strengthDistribution.medium++;
      else strengthDistribution.strong++;
      
      totalStrength += edge.strength;
    });

    const avgStrength = data.edges.length > 0 ? totalStrength / data.edges.length : 0;

    return {
      typeDistribution: Array.from(typeDistribution.entries()).map(([type, count]) => ({
        type,
        count,
        percentage: (count / data.edges.length) * 100,
      })),
      strengthDistribution,
      avgStrength,
      totalConnections: data.edges.length,
    };
  }, [data.edges]);

  return (
    <Card padding="md" radius="md" withBorder>
      <Stack gap="md">
        <Text fw={600} size="sm">Relationship Analytics</Text>
        
        {/* Overview Stats */}
        <SimpleGrid cols={2}>
          <div>
            <Text size="xs" c="dimmed">Total Connections</Text>
            <Text fw={600} size="lg">{analytics.totalConnections}</Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">Avg Strength</Text>
            <Text fw={600} size="lg">{analytics.avgStrength.toFixed(2)}</Text>
          </div>
        </SimpleGrid>

        {/* Strength Distribution */}
        <div>
          <Text size="sm" fw={500} mb="xs">Connection Strength</Text>
          <RingProgress
            size={120}
            thickness={12}
            sections={[
              { value: (analytics.strengthDistribution.weak / analytics.totalConnections) * 100, color: 'red' },
              { value: (analytics.strengthDistribution.medium / analytics.totalConnections) * 100, color: 'yellow' },
              { value: (analytics.strengthDistribution.strong / analytics.totalConnections) * 100, color: 'green' },
            ]}
            label={
              <Text size="xs" ta="center">
                {analytics.totalConnections} total
              </Text>
            }
          />
          <Group justify="center" gap="xs" mt="xs">
            <Badge size="xs" color="red">Weak ({analytics.strengthDistribution.weak})</Badge>
            <Badge size="xs" color="yellow">Medium ({analytics.strengthDistribution.medium})</Badge>
            <Badge size="xs" color="green">Strong ({analytics.strengthDistribution.strong})</Badge>
          </Group>
        </div>

        {/* Type Distribution */}
        <div>
          <Text size="sm" fw={500} mb="xs">Relationship Types</Text>
          <Stack gap="xs">
            {analytics.typeDistribution.slice(0, 5).map(({ type, count, percentage }) => (
              <Group key={type} justify="space-between">
                <Group gap="xs">
                  {RELATIONSHIP_CONFIGS[type].icon}
                  <Text size="xs">{RELATIONSHIP_CONFIGS[type].label}</Text>
                </Group>
                <Group gap="xs">
                  <Text size="xs" c="dimmed">{count}</Text>
                  <Progress value={percentage} size="xs" style={{ width: 60 }} />
                </Group>
              </Group>
            ))}
          </Stack>
        </div>
      </Stack>
    </Card>
  );
}

// Relationship form component
function RelationshipForm({ 
  nodes, 
  initialData, 
  onSubmit, 
  onClose 
}: {
  nodes: GraphNode[];
  initialData?: Partial<RelationshipFormData>;
  onSubmit: (data: RelationshipFormData) => void;
  onClose: () => void;
}) {
  const form = useForm<RelationshipFormData>({
    initialValues: {
      sourceId: initialData?.sourceId || '',
      targetId: initialData?.targetId || '',
      type: initialData?.type || 'custom',
      label: initialData?.label || '',
      strength: initialData?.strength || 0.6,
      color: initialData?.color || '#868e96',
      style: initialData?.style || 'solid',
      properties: initialData?.properties || {},
    },
    validate: {
      sourceId: (value) => !value ? 'Source node is required' : null,
      targetId: (value) => !value ? 'Target node is required' : null,
      label: (value) => !value ? 'Label is required' : null,
    },
  });

  const handleSubmit = (values: RelationshipFormData) => {
    onSubmit(values);
    onClose();
  };

  const selectedType = form.values.type;
  const typeConfig = RELATIONSHIP_CONFIGS[selectedType];

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <SimpleGrid cols={2}>
          <Select
            label="Source Node"
            placeholder="Select source"
            data={nodes.map(node => ({ value: node.id, label: node.label }))}
            {...form.getInputProps('sourceId')}
          />
          <Select
            label="Target Node"
            placeholder="Select target"
            data={nodes.map(node => ({ value: node.id, label: node.label }))}
            {...form.getInputProps('targetId')}
          />
        </SimpleGrid>

        <Select
          label="Relationship Type"
          data={Object.entries(RELATIONSHIP_CONFIGS).map(([key, config]) => ({
            value: key,
            label: config.label,
          }))}
          {...form.getInputProps('type')}
        />

        {typeConfig && (
          <Alert icon={typeConfig.icon} color="blue" variant="light">
            {typeConfig.description}
          </Alert>
        )}

        <TextInput
          label="Label"
          placeholder="Relationship label"
          {...form.getInputProps('label')}
        />

        <div>
          <Text size="sm" fw={500} mb="xs">
            Strength: {form.values.strength.toFixed(2)}
          </Text>
          <Slider
            min={0}
            max={1}
            step={0.1}
            marks={[
              { value: 0.2, label: 'Weak' },
              { value: 0.5, label: 'Medium' },
              { value: 0.8, label: 'Strong' },
            ]}
            {...form.getInputProps('strength')}
          />
        </div>

        <SimpleGrid cols={2}>
          <ColorInput
            label="Color"
            {...form.getInputProps('color')}
          />
          <Select
            label="Style"
            data={[
              { value: 'solid', label: 'Solid' },
              { value: 'dashed', label: 'Dashed' },
              { value: 'dotted', label: 'Dotted' },
            ]}
            {...form.getInputProps('style')}
          />
        </SimpleGrid>

        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update' : 'Create'} Relationship
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

// Main relationship manager component
export function RelationshipManager({
  data,
  selectedNodes,
  onUpdateRelationship,
  onCreateRelationship,
  onDeleteRelationship,
  onFilterChange,
}: RelationshipManagerProps) {
  const [filters, setFilters] = useState<RelationshipFilters>({
    types: Object.keys(RELATIONSHIP_CONFIGS) as RelationshipType[],
    strengthRange: [0, 1],
    showWeakConnections: true,
    showStrongConnections: true,
  });

  const [formModalOpened, { open: openFormModal, close: closeFormModal }] = useDisclosure(false);
  const [editingRelationship, setEditingRelationship] = useState<GraphEdge | null>(null);

  // Filter edges based on current filters
  const filteredEdges = useMemo(() => {
    return data.edges.filter(edge => {
      if (!filters.types.includes(edge.type)) return false;
      if (edge.strength < filters.strengthRange[0] || edge.strength > filters.strengthRange[1]) return false;
      if (!filters.showWeakConnections && edge.strength < 0.4) return false;
      if (!filters.showStrongConnections && edge.strength > 0.7) return false;
      return true;
    });
  }, [data.edges, filters]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<RelationshipFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  }, [filters, onFilterChange]);

  // Handle relationship creation
  const handleCreateRelationship = useCallback((formData: RelationshipFormData) => {
    const newRelationship: Omit<GraphEdge, 'id'> = {
      source: formData.sourceId,
      target: formData.targetId,
      type: formData.type,
      label: formData.label,
      strength: formData.strength,
      color: formData.color,
      width: Math.max(1, formData.strength * 3),
      style: formData.style,
      createdAt: new Date().toISOString(),
      properties: formData.properties,
    };

    onCreateRelationship(newRelationship);
    
    notifications.show({
      title: 'Relationship Created',
      message: `Created ${formData.type} relationship between nodes`,
      color: 'green',
    });
  }, [onCreateRelationship]);

  // Handle relationship editing
  const handleEditRelationship = useCallback((edge: GraphEdge) => {
    setEditingRelationship(edge);
    openFormModal();
  }, [openFormModal]);

  const handleUpdateRelationship = useCallback((formData: RelationshipFormData) => {
    if (!editingRelationship) return;

    const updates: Partial<GraphEdge> = {
      type: formData.type,
      label: formData.label,
      strength: formData.strength,
      color: formData.color,
      width: Math.max(1, formData.strength * 3),
      style: formData.style,
      properties: formData.properties,
    };

    onUpdateRelationship(editingRelationship.id, updates);
    setEditingRelationship(null);
    
    notifications.show({
      title: 'Relationship Updated',
      message: 'Relationship has been updated successfully',
      color: 'blue',
    });
  }, [editingRelationship, onUpdateRelationship]);

  // Handle relationship deletion
  const handleDeleteRelationship = useCallback((edgeId: string) => {
    onDeleteRelationship(edgeId);
    
    notifications.show({
      title: 'Relationship Deleted',
      message: 'Relationship has been removed',
      color: 'red',
    });
  }, [onDeleteRelationship]);

  return (
    <Stack gap="md">
      {/* Analytics */}
      <RelationshipAnalytics data={data} />

      {/* Controls */}
      <Card padding="md" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600} size="sm">Relationship Controls</Text>
            <Button
              leftSection={<IconPlus size="1rem" />}
              size="xs"
              onClick={openFormModal}
              disabled={selectedNodes.length < 2}
            >
              Add Relationship
            </Button>
          </Group>

          {/* Filters */}
          <div>
            <Text size="sm" fw={500} mb="xs">Strength Range</Text>
            <RangeSlider
              min={0}
              max={1}
              step={0.1}
              value={filters.strengthRange}
              onChange={(value: [number, number]) => {
              handleFilterChange({ strengthRange: value });
              }}
              marks={[
              { value: 0, label: '0' },
              { value: 0.5, label: '0.5' },
              { value: 1, label: '1' },
              ]}
            />
          </div>

          <Group>
            <Switch
              label="Weak connections"
              checked={filters.showWeakConnections}
              onChange={(e) => handleFilterChange({ showWeakConnections: e.currentTarget.checked })}
            />
            <Switch
              label="Strong connections"
              checked={filters.showStrongConnections}
              onChange={(e) => handleFilterChange({ showStrongConnections: e.currentTarget.checked })}
            />
          </Group>
        </Stack>
      </Card>

      {/* Relationship List */}
      <Card padding="md" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600} size="sm">
              Relationships ({filteredEdges.length})
            </Text>
          </Group>

          <ScrollArea style={{ height: 300 }}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Label</Table.Th>
                  <Table.Th>Strength</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredEdges.map(edge => (
                  <Table.Tr key={edge.id}>
                    <Table.Td>
                      <Badge size="xs" color={RELATIONSHIP_CONFIGS[edge.type].color}>
                        {RELATIONSHIP_CONFIGS[edge.type].label}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" truncate style={{ maxWidth: 150 }}>
                        {edge.label}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Progress value={edge.strength * 100} size="sm" style={{ width: 60 }} />
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => handleEditRelationship(edge)}
                        >
                          <IconEdit size="0.8rem" />
                        </ActionIcon>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={() => handleDeleteRelationship(edge.id)}
                        >
                          <IconTrash size="0.8rem" />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Stack>
      </Card>

      {/* Relationship Form Modal */}
      <Modal
        opened={formModalOpened}
        onClose={() => {
          closeFormModal();
          setEditingRelationship(null);
        }}
        title={editingRelationship ? 'Edit Relationship' : 'Create Relationship'}
        size="lg"
      >
        <RelationshipForm
          nodes={data.nodes}
          initialData={editingRelationship ? {
            sourceId: typeof editingRelationship.source === 'string' 
              ? editingRelationship.source 
              : editingRelationship.source.id,
            targetId: typeof editingRelationship.target === 'string' 
              ? editingRelationship.target 
              : editingRelationship.target.id,
            type: editingRelationship.type,
            label: editingRelationship.label || '',
            strength: editingRelationship.strength,
            color: editingRelationship.color,
            style: editingRelationship.style || 'solid',
            properties: editingRelationship.properties || {},
          } : {
            sourceId: selectedNodes[0] || '',
            targetId: selectedNodes[1] || '',
          }}
          onSubmit={editingRelationship ? handleUpdateRelationship : handleCreateRelationship}
          onClose={() => {
            closeFormModal();
            setEditingRelationship(null);
          }}
        />
      </Modal>
    </Stack>
  );
}
