/**
 * Template Card Component for ThinkSpace
 * 
 * This component displays individual project templates with
 * preview information, usage statistics, and action buttons.
 */

'use client';

import { useState } from 'react';
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Button,
  ActionIcon,
  Menu,
  Avatar,
  Tooltip,
  Progress,
} from '@mantine/core';
import {
  IconDots,
  IconEdit,
  IconTrash,
  IconEye,
  IconCopy,
  IconShare,
  IconUsers,
  IconTemplate,
  IconCalendar,
  IconSubtask,
  IconFlag,
  IconStar,
} from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';

interface ProjectTemplate {
  id: string;
  title: string;
  description?: string;
  category: string;
  isPublic: boolean;
  isOfficial: boolean;
  tags: string[];
  usageCount: number;
  user: {
    id: string;
    name?: string;
    email: string;
  };
  projectData: {
    title: string;
    description?: string;
    status: string;
    priority: string;
    tags?: string[];
  };
  taskData?: Array<{
    title: string;
    status: string;
    priority: string;
  }>;
  milestones?: Array<{
    title: string;
    dueDate: string;
  }>;
  _count: {
    projects: number;
    activities: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface TemplateCardProps {
  template: ProjectTemplate;
  onUse?: (template: ProjectTemplate) => void;
  onEdit?: (template: ProjectTemplate) => void;
  onDelete?: (template: ProjectTemplate) => void;
  onView?: (template: ProjectTemplate) => void;
  onShare?: (template: ProjectTemplate) => void;
  currentUserId?: string;
  compact?: boolean;
}

export function TemplateCard({
  template,
  onUse,
  onEdit,
  onDelete,
  onView,
  onShare,
  currentUserId,
  compact = false,
}: TemplateCardProps) {
  const [loading, setLoading] = useState(false);

  const isOwner = currentUserId === template.user.id;
  const taskCount = template.taskData?.length || 0;
  const milestoneCount = template.milestones?.length || 0;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SOFTWARE_DEVELOPMENT': return 'blue';
      case 'MARKETING': return 'pink';
      case 'DESIGN': return 'purple';
      case 'RESEARCH': return 'teal';
      case 'EVENT_PLANNING': return 'orange';
      case 'PRODUCT_LAUNCH': return 'red';
      case 'CONTENT_CREATION': return 'green';
      case 'BUSINESS_PLANNING': return 'indigo';
      case 'EDUCATION': return 'yellow';
      case 'PERSONAL': return 'gray';
      default: return 'gray';
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'yellow';
      case 'LOW': return 'green';
      default: return 'gray';
    }
  };

  const handleUse = async () => {
    if (!onUse) return;
    
    try {
      setLoading(true);
      await onUse(template);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      padding={compact ? "sm" : "md"}
      radius="md"
      withBorder
      shadow="sm"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack gap={compact ? "xs" : "sm"} style={{ flex: 1 }}>
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Group gap="xs" style={{ flex: 1 }}>
            <IconTemplate size="1.25rem" color={`var(--mantine-color-${getCategoryColor(template.category)}-6)`} />
            <div style={{ flex: 1 }}>
              <Text
                size={compact ? "sm" : "md"}
                fw={600}
                lineClamp={2}
                style={{ cursor: onView ? 'pointer' : 'default' }}
                onClick={() => onView?.(template)}
              >
                {template.title}
              </Text>
              {template.isOfficial && (
                <Group gap="xs" mt={2}>
                  <Badge size="xs" color="blue" leftSection={<IconStar size="0.75rem" />}>
                    Official
                  </Badge>
                </Group>
              )}
            </div>
          </Group>

          <Group gap="xs">
            {template.isPublic && (
              <Tooltip label="Public template">
                <IconUsers size="1rem" color="var(--mantine-color-blue-6)" />
              </Tooltip>
            )}
            
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" size="sm">
                  <IconDots size="1rem" />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {onView && (
                  <Menu.Item
                    leftSection={<IconEye size="1rem" />}
                    onClick={() => onView(template)}
                  >
                    View Details
                  </Menu.Item>
                )}
                
                {onUse && (
                  <Menu.Item
                    leftSection={<IconCopy size="1rem" />}
                    onClick={handleUse}
                  >
                    Use Template
                  </Menu.Item>
                )}
                
                {onShare && (
                  <Menu.Item
                    leftSection={<IconShare size="1rem" />}
                    onClick={() => onShare(template)}
                  >
                    Share Template
                  </Menu.Item>
                )}
                
                {isOwner && (
                  <>
                    <Menu.Divider />
                    {onEdit && (
                      <Menu.Item
                        leftSection={<IconEdit size="1rem" />}
                        onClick={() => onEdit(template)}
                      >
                        Edit Template
                      </Menu.Item>
                    )}
                    
                    {onDelete && (
                      <Menu.Item
                        leftSection={<IconTrash size="1rem" />}
                        color="red"
                        onClick={() => onDelete(template)}
                      >
                        Delete Template
                      </Menu.Item>
                    )}
                  </>
                )}
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        {/* Description */}
        {template.description && !compact && (
          <Text size="sm" c="dimmed" lineClamp={3}>
            {template.description}
          </Text>
        )}

        {/* Category and Priority */}
        <Group gap="xs" wrap="wrap">
          <Badge size="xs" color={getCategoryColor(template.category)}>
            {getCategoryLabel(template.category)}
          </Badge>
          
          <Badge size="xs" color={getPriorityColor(template.projectData.priority)}>
            <IconFlag size="0.75rem" style={{ marginRight: 4 }} />
            {template.projectData.priority}
          </Badge>

          {taskCount > 0 && (
            <Badge size="xs" variant="outline" color="blue">
              <IconSubtask size="0.75rem" style={{ marginRight: 4 }} />
              {taskCount} tasks
            </Badge>
          )}

          {milestoneCount > 0 && (
            <Badge size="xs" variant="outline" color="orange">
              <IconCalendar size="0.75rem" style={{ marginRight: 4 }} />
              {milestoneCount} milestones
            </Badge>
          )}
        </Group>

        {/* Tags */}
        {template.tags.length > 0 && !compact && (
          <Group gap="xs">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} size="xs" variant="light" color="gray">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Text size="xs" c="dimmed">+{template.tags.length - 3} more</Text>
            )}
          </Group>
        )}

        {/* Usage Statistics */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Avatar size="xs" name={template.user.name || template.user.email} />
            <Text size="xs" c="dimmed">
              {template.user.name || template.user.email.split('@')[0]}
            </Text>
          </Group>
          
          <Group gap="sm">
            <Tooltip label="Times used">
              <Group gap={4}>
                <IconCopy size="0.75rem" />
                <Text size="xs" c="dimmed">{template.usageCount}</Text>
              </Group>
            </Tooltip>
            
            <Tooltip label="Projects created">
              <Group gap={4}>
                <IconTemplate size="0.75rem" />
                <Text size="xs" c="dimmed">{template._count.projects}</Text>
              </Group>
            </Tooltip>
          </Group>
        </Group>

        {/* Created Date */}
        <Text size="xs" c="dimmed">
          Created {formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}
        </Text>

        {/* Action Button */}
        {onUse && (
          <Button
            fullWidth
            size={compact ? "xs" : "sm"}
            variant="light"
            color={getCategoryColor(template.category)}
            leftSection={<IconCopy size="1rem" />}
            onClick={handleUse}
            loading={loading}
            mt="auto"
          >
            Use Template
          </Button>
        )}
      </Stack>
    </Card>
  );
}