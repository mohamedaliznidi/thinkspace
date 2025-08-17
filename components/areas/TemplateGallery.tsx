/**
 * Template Gallery Component for ThinkSpace Areas
 * 
 * Displays available area templates with filtering, preview,
 * and customization options for creating new areas.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Stack,
  Group,
  Text,
  Card,
  Badge,
  Button,
  SimpleGrid,
  TextInput,
  Select,
  Modal,
  Tabs,
  Box,
  ActionIcon,
  Tooltip,
  Center,
  Loader,
  Alert,
} from '@mantine/core';
import {
  IconSearch,
  IconEye,
  IconSettings,
  IconPlus,
  IconTemplate,
  IconUser,
  IconBriefcase,
  IconCoin,
  IconHeart,
  IconCategory,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import type {
  AreaTemplate,
  TemplateFilters,
  TemplateCustomizations,
  TEMPLATE_CATEGORIES,
} from '@/types/area-template';

interface TemplateGalleryProps {
  onTemplateSelect: (template: AreaTemplate, customizations?: TemplateCustomizations) => void;
  loading?: boolean;
}

interface TemplateCardProps {
  template: AreaTemplate;
  onSelect: (template: AreaTemplate) => void;
  onPreview: (template: AreaTemplate) => void;
  onCustomize: (template: AreaTemplate) => void;
}

function TemplateCard({ template, onSelect, onPreview, onCustomize }: TemplateCardProps) {
  const getCategoryIcon = (areaType?: string) => {
    switch (areaType) {
      case 'HEALTH':
      case 'PERSONAL':
        return <IconUser size="1rem" />;
      case 'CAREER':
      case 'RESPONSIBILITY':
        return <IconBriefcase size="1rem" />;
      case 'FINANCE':
        return <IconCoin size="1rem" />;
      case 'INTEREST':
      case 'LEARNING':
        return <IconHeart size="1rem" />;
      default:
        return <IconCategory size="1rem" />;
    }
  };

  const getAreaTypeColor = (areaType?: string) => {
    switch (areaType) {
      case 'HEALTH': return 'green';
      case 'CAREER': return 'blue';
      case 'FINANCE': return 'yellow';
      case 'INTEREST': return 'pink';
      case 'LEARNING': return 'purple';
      case 'PERSONAL': return 'teal';
      case 'RESPONSIBILITY': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <Card padding="lg" radius="md" withBorder shadow="sm" h="100%">
      <Stack gap="md" h="100%">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Group gap="xs">
              {template.areaType && (
                <Badge
                  size="sm"
                  color={getAreaTypeColor(template.areaType)}
                  leftSection={getCategoryIcon(template.areaType)}
                  variant="light"
                >
                  {template.areaType}
                </Badge>
              )}
              {template.isPublic && (
                <Badge size="xs" color="blue" variant="outline">
                  Public
                </Badge>
              )}
            </Group>
            
            <Text fw={600} size="lg" lineClamp={2}>
              {template.name}
            </Text>
            
            {template.description && (
              <Text size="sm" c="dimmed" lineClamp={3}>
                {template.description}
              </Text>
            )}
          </Stack>
        </Group>

        {/* Template Stats */}
        <Group gap="md">
          <Group gap="xs">
            <Text size="xs" c="dimmed">Standards:</Text>
            <Badge size="xs" variant="light">
              {template.template.standards.length}
            </Badge>
          </Group>
          <Group gap="xs">
            <Text size="xs" c="dimmed">Sub-interests:</Text>
            <Badge size="xs" variant="light">
              {template.template.subInterests.length}
            </Badge>
          </Group>
        </Group>

        {/* Tags */}
        {template.tags.length > 0 && (
          <Group gap="xs">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} size="xs" color="gray" variant="outline">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Text size="xs" c="dimmed">
                +{template.tags.length - 3} more
              </Text>
            )}
          </Group>
        )}

        {/* Actions */}
        <Group justify="space-between" mt="auto">
          <Group gap="xs">
            <Tooltip label="Preview template">
              <ActionIcon
                variant="subtle"
                onClick={() => onPreview(template)}
              >
                <IconEye size="1rem" />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Customize template">
              <ActionIcon
                variant="subtle"
                onClick={() => onCustomize(template)}
              >
                <IconSettings size="1rem" />
              </ActionIcon>
            </Tooltip>
          </Group>
          
          <Button
            size="sm"
            onClick={() => onSelect(template)}
            leftSection={<IconPlus size="0.9rem" />}
          >
            Use Template
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}

export default function TemplateGallery({ onTemplateSelect, loading = false }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<AreaTemplate[]>([]);
  const [filters, setFilters] = useState<TemplateFilters>({
    search: '',
    areaTypes: [],
    tags: [],
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<AreaTemplate | null>(null);
  const [previewOpened, { open: openPreview, close: closePreview }] = useDisclosure(false);
  const [customizeOpened, { open: openCustomize, close: closeCustomize }] = useDisclosure(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    setFetchLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.areaTypes && filters.areaTypes.length > 0) {
        params.append('areaType', filters.areaTypes[0]); // API supports single type for now
      }

      const response = await fetch(`/api/areas/templates?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data.templates);
      } else {
        throw new Error('Failed to fetch templates');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load templates. Please try again.',
        color: 'red',
      });
    } finally {
      setFetchLoading(false);
    }
  }, [filters]);

  // Initialize templates
  useState(() => {
    fetchTemplates();
  });

  const handleTemplateSelect = useCallback((template: AreaTemplate) => {
    onTemplateSelect(template);
  }, [onTemplateSelect]);

  const handleTemplatePreview = useCallback((template: AreaTemplate) => {
    setSelectedTemplate(template);
    openPreview();
  }, [openPreview]);

  const handleTemplateCustomize = useCallback((template: AreaTemplate) => {
    setSelectedTemplate(template);
    openCustomize();
  }, [openCustomize]);

  const filteredTemplates = templates.filter(template => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        template.name.toLowerCase().includes(searchLower) ||
        template.description?.toLowerCase().includes(searchLower) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    if (filters.areaTypes && filters.areaTypes.length > 0) {
      if (!template.areaType || !filters.areaTypes.includes(template.areaType)) {
        return false;
      }
    }

    return true;
  });

  if (loading || fetchLoading) {
    return (
      <Center h="50vh">
        <Stack gap="md" align="center">
          <Loader size="lg" />
          <Text size="sm" c="dimmed">Loading templates...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Stack gap="xs">
          <Text size="xl" fw={600}>Area Templates</Text>
          <Text size="sm" c="dimmed">
            Choose from predefined templates to quickly set up new areas
          </Text>
        </Stack>
      </Group>

      {/* Filters */}
      <Group gap="md">
        <TextInput
          placeholder="Search templates..."
          leftSection={<IconSearch size="1rem" />}
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          style={{ flex: 1 }}
        />
        
        <Select
          placeholder="Area Type"
          data={[
            { value: '', label: 'All Types' },
            { value: 'HEALTH', label: 'Health' },
            { value: 'CAREER', label: 'Career' },
            { value: 'FINANCE', label: 'Finance' },
            { value: 'INTEREST', label: 'Interest' },
            { value: 'LEARNING', label: 'Learning' },
            { value: 'PERSONAL', label: 'Personal' },
            { value: 'RESPONSIBILITY', label: 'Responsibility' },
            { value: 'OTHER', label: 'Other' },
          ]}
          value={filters.areaTypes?.[0] || ''}
          onChange={(value) => setFilters(prev => ({ 
            ...prev, 
            areaTypes: value ? [value as any] : [] 
          }))}
          clearable
        />
      </Group>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={handleTemplateSelect}
              onPreview={handleTemplatePreview}
              onCustomize={handleTemplateCustomize}
            />
          ))}
        </SimpleGrid>
      ) : (
        <Card padding="xl" radius="md" withBorder>
          <Stack gap="md" align="center">
            <IconTemplate size="3rem" color="var(--mantine-color-gray-5)" />
            <Text size="lg" fw={500}>No templates found</Text>
            <Text size="sm" c="dimmed" ta="center">
              {filters.search || filters.areaTypes?.length 
                ? 'Try adjusting your search criteria'
                : 'No templates are available at the moment'
              }
            </Text>
          </Stack>
        </Card>
      )}

      {/* Template Preview Modal */}
      <Modal
        opened={previewOpened}
        onClose={closePreview}
        title={selectedTemplate?.name}
        size="lg"
      >
        {selectedTemplate && (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              {selectedTemplate.description}
            </Text>
            
            <Tabs defaultValue="overview">
              <Tabs.List>
                <Tabs.Tab value="overview">Overview</Tabs.Tab>
                <Tabs.Tab value="standards">Standards</Tabs.Tab>
                <Tabs.Tab value="structure">Structure</Tabs.Tab>
              </Tabs.List>
              
              <Tabs.Panel value="overview" pt="md">
                <Stack gap="sm">
                  <Group>
                    <Text size="sm" fw={500}>Area Type:</Text>
                    <Badge color="blue">{selectedTemplate.areaType}</Badge>
                  </Group>
                  <Group>
                    <Text size="sm" fw={500}>Priority:</Text>
                    <Badge color="orange">{selectedTemplate.template.area.responsibilityLevel}</Badge>
                  </Group>
                  <Group>
                    <Text size="sm" fw={500}>Review Frequency:</Text>
                    <Badge color="green">{selectedTemplate.template.area.reviewFrequency}</Badge>
                  </Group>
                </Stack>
              </Tabs.Panel>
              
              <Tabs.Panel value="standards" pt="md">
                <Stack gap="sm">
                  {selectedTemplate.template.standards.map((standard, index) => (
                    <Card key={index} padding="sm" withBorder>
                      <Text size="sm" fw={500}>{standard.title}</Text>
                      <Text size="xs" c="dimmed">{standard.description}</Text>
                      <Badge size="xs" mt="xs">{standard.criteria.length} criteria</Badge>
                    </Card>
                  ))}
                </Stack>
              </Tabs.Panel>
              
              <Tabs.Panel value="structure" pt="md">
                <Stack gap="sm">
                  <Text size="sm" fw={500}>Sub-interests ({selectedTemplate.template.subInterests.length})</Text>
                  {selectedTemplate.template.subInterests.map((subInterest, index) => (
                    <Box key={index} pl={subInterest.level * 20}>
                      <Text size="sm">{subInterest.title}</Text>
                    </Box>
                  ))}
                </Stack>
              </Tabs.Panel>
            </Tabs>
            
            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={closePreview}>
                Close
              </Button>
              <Button onClick={() => {
                closePreview();
                handleTemplateSelect(selectedTemplate);
              }}>
                Use Template
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
