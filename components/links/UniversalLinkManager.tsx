/**
 * Universal Link Manager Component for ThinkSpace
 * 
 * Provides comprehensive linking capabilities between any items across all PARA categories
 * with bidirectional relationships and visual relationship management.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  Button,
  Select,
  TextInput,
  Textarea,
  Slider,
  Switch,
  Badge,
  Card,
  ActionIcon,
  Tooltip,
  Loader,
  Alert,
  Divider,
  ScrollArea,
  Grid,
  Avatar,
} from '@mantine/core';
import {
  IconLink,
  IconUnlink,
  IconEdit,
  IconTrash,
  IconTarget,
  IconMap,
  IconBookmark,
  IconNote,
  IconArrowRight,
  IconArrowsLeftRight,
  IconInfoCircle,
  IconPlus,
  IconSearch,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getParaColor } from '@/lib/theme';

// Link interface
interface Link {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  linkType: string;
  strength: number;
  description?: string;
  metadata?: any;
  bidirectional: boolean;
  createdAt: string;
  updatedAt: string;
  sourceItem?: any;
  targetItem?: any;
}

// Link creation data
interface LinkFormData {
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  linkType: string;
  strength: number;
  description: string;
  bidirectional: boolean;
}

interface UniversalLinkManagerProps {
  itemType: 'project' | 'area' | 'resource' | 'note';
  itemId: string;
  itemTitle: string;
  opened: boolean;
  onClose: () => void;
  onLinksUpdated?: () => void;
}

export function UniversalLinkManager({
  itemType,
  itemId,
  itemTitle,
  opened,
  onClose,
  onLinksUpdated,
}: UniversalLinkManagerProps) {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  // Form state
  const [formData, setFormData] = useState<LinkFormData>({
    sourceType: itemType,
    sourceId: itemId,
    targetType: 'project',
    targetId: '',
    linkType: 'RELATED',
    strength: 0.5,
    description: '',
    bidirectional: true,
  });

  // Available options
  const linkTypes = [
    { value: 'RELATED', label: 'Related to' },
    { value: 'DEPENDS_ON', label: 'Depends on' },
    { value: 'BLOCKS', label: 'Blocks' },
    { value: 'REFERENCES', label: 'References' },
    { value: 'CONTAINS', label: 'Contains' },
    { value: 'PART_OF', label: 'Part of' },
    { value: 'SIMILAR_TO', label: 'Similar to' },
    { value: 'CUSTOM', label: 'Custom' },
  ];

  const contentTypes = [
    { value: 'project', label: 'Project' },
    { value: 'area', label: 'Area' },
    { value: 'resource', label: 'Resource' },
    { value: 'note', label: 'Note' },
  ];

  // Load links for the current item
  const loadLinks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/links?itemType=${itemType}&itemId=${itemId}&includeItems=true`
      );
      
      if (response.ok) {
        const data = await response.json();
        setLinks(data.data.links || []);
      } else {
        console.error('Failed to load links');
      }
    } catch (error) {
      console.error('Error loading links:', error);
    } finally {
      setIsLoading(false);
    }
  }, [itemType, itemId]);

  // Load links when component mounts or item changes
  useEffect(() => {
    if (opened) {
      loadLinks();
    }
  }, [opened, loadLinks]);

  // Create a new link
  const handleCreateLink = async () => {
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        notifications.show({
          title: 'Link Created',
          message: 'Successfully created link between items',
          color: 'green',
        });
        
        setShowCreateForm(false);
        setFormData({
          sourceType: itemType,
          sourceId: itemId,
          targetType: 'project',
          targetId: '',
          linkType: 'RELATED',
          strength: 0.5,
          description: '',
          bidirectional: true,
        });
        
        await loadLinks();
        onLinksUpdated?.();
      } else {
        const errorData = await response.json();
        notifications.show({
          title: 'Error',
          message: errorData.error || 'Failed to create link',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Error creating link:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to create link',
        color: 'red',
      });
    }
  };

  // Delete a link
  const handleDeleteLink = async (linkId: string) => {
    try {
      const response = await fetch(`/api/links?linkId=${linkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        notifications.show({
          title: 'Link Deleted',
          message: 'Successfully deleted link',
          color: 'green',
        });
        
        await loadLinks();
        onLinksUpdated?.();
      } else {
        notifications.show({
          title: 'Error',
          message: 'Failed to delete link',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete link',
        color: 'red',
      });
    }
  };

  // Get icon for content type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project': return <IconTarget size="1rem" />;
      case 'area': return <IconMap size="1rem" />;
      case 'resource': return <IconBookmark size="1rem" />;
      case 'note': return <IconNote size="1rem" />;
      default: return <IconLink size="1rem" />;
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

  // Get link type description
  const getLinkTypeDescription = (linkType: string) => {
    const type = linkTypes.find(t => t.value === linkType);
    return type?.label || linkType;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconLink size="1.2rem" />
          <Text fw={600}>Manage Links for "{itemTitle}"</Text>
        </Group>
      }
      size="xl"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        {/* Current Item Info */}
        <Card withBorder p="md" bg="gray.0">
          <Group>
            <Badge
              size="lg"
              variant="light"
              color={getTypeColor(itemType)}
              leftSection={getTypeIcon(itemType)}
            >
              {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
            </Badge>
            <Text fw={600}>{itemTitle}</Text>
          </Group>
        </Card>

        {/* Create New Link Button */}
        <Button
          leftSection={<IconPlus size="1rem" />}
          onClick={() => setShowCreateForm(true)}
          variant="light"
        >
          Create New Link
        </Button>

        {/* Create Link Form */}
        {showCreateForm && (
          <Card withBorder p="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={600}>Create New Link</Text>
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </Group>

              <Grid>
                <Grid.Col span={6}>
                  <Select
                    label="Target Type"
                    data={contentTypes}
                    value={formData.targetType}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      targetType: value || 'project',
                      targetId: '' 
                    }))}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Target ID"
                    placeholder="Enter target item ID..."
                    value={formData.targetId}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      targetId: e.currentTarget.value 
                    }))}
                  />
                </Grid.Col>
              </Grid>

              <Select
                label="Link Type"
                data={linkTypes}
                value={formData.linkType}
                onChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  linkType: value || 'RELATED' 
                }))}
              />

              <div>
                <Text size="sm" fw={500} mb="xs">
                  Link Strength: {(formData.strength * 100).toFixed(0)}%
                </Text>
                <Slider
                  value={formData.strength}
                  onChange={(value) => setFormData(prev => ({ ...prev, strength: value }))}
                  min={0}
                  max={1}
                  step={0.1}
                  marks={[
                    { value: 0, label: 'Weak' },
                    { value: 0.5, label: 'Medium' },
                    { value: 1, label: 'Strong' },
                  ]}
                />
              </div>

              <Textarea
                label="Description (Optional)"
                placeholder="Describe the relationship..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  description: e.currentTarget.value 
                }))}
                rows={3}
              />

              <Switch
                label="Bidirectional Link"
                description="Create a link in both directions"
                checked={formData.bidirectional}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  bidirectional: e.currentTarget.checked 
                }))}
              />

              <Group justify="flex-end">
                <Button
                  onClick={handleCreateLink}
                  disabled={!formData.targetId}
                >
                  Create Link
                </Button>
              </Group>
            </Stack>
          </Card>
        )}

        {/* Existing Links */}
        <div>
          <Group justify="space-between" mb="md">
            <Text fw={600}>Existing Links ({links.length})</Text>
            {isLoading && <Loader size="sm" />}
          </Group>

          {links.length === 0 && !isLoading ? (
            <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
              No links found. Create your first link to connect this item with others.
            </Alert>
          ) : (
            <Stack gap="xs">
              {links.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  currentItemId={itemId}
                  onDelete={() => handleDeleteLink(link.id)}
                  getTypeIcon={getTypeIcon}
                  getTypeColor={getTypeColor}
                  getLinkTypeDescription={getLinkTypeDescription}
                />
              ))}
            </Stack>
          )}
        </div>
      </Stack>
    </Modal>
  );
}

// Link Card Component
interface LinkCardProps {
  link: Link;
  currentItemId: string;
  onDelete: () => void;
  getTypeIcon: (type: string) => React.ReactNode;
  getTypeColor: (type: string) => string;
  getLinkTypeDescription: (linkType: string) => string;
}

function LinkCard({ 
  link, 
  currentItemId, 
  onDelete, 
  getTypeIcon, 
  getTypeColor, 
  getLinkTypeDescription 
}: LinkCardProps) {
  // Determine which item is the "other" item (not the current one)
  const isSource = link.sourceId === currentItemId;
  const otherItem = isSource ? link.targetItem : link.sourceItem;
  const otherType = isSource ? link.targetType : link.sourceType;
  const direction = isSource ? 'to' : 'from';

  return (
    <Card withBorder p="md">
      <Group justify="space-between">
        <Group>
          <Badge
            size="sm"
            variant="light"
            color={getTypeColor(otherType)}
            leftSection={getTypeIcon(otherType)}
          >
            {otherType}
          </Badge>
          
          <Group gap="xs">
            <Text fw={500}>{otherItem?.title || 'Unknown Item'}</Text>
            <Text size="sm" c="dimmed">
              {direction}
            </Text>
            <Badge size="xs" variant="outline">
              {getLinkTypeDescription(link.linkType)}
            </Badge>
          </Group>

          {link.bidirectional && (
            <Tooltip label="Bidirectional link">
              <IconArrowsLeftRight size="1rem" color="gray" />
            </Tooltip>
          )}
        </Group>

        <Group gap="xs">
          <Badge size="xs" variant="light">
            {(link.strength * 100).toFixed(0)}%
          </Badge>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="red"
            onClick={onDelete}
          >
            <IconTrash size="0.8rem" />
          </ActionIcon>
        </Group>
      </Group>

      {link.description && (
        <Text size="sm" c="dimmed" mt="xs">
          {link.description}
        </Text>
      )}
    </Card>
  );
}
