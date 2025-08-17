/**
 * New Area Page for ThinkSpace
 * 
 * This page provides a form to create new areas of responsibility
 * with validation, color selection, and type categorization.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stack,
  Title,
  Card,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Alert,
  TagsInput,
  Grid,
  Text,
  ColorInput,
  Switch,
  Tabs,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconArrowLeft, IconCheck, IconTemplate, IconEdit } from '@tabler/icons-react';
import { getParaColor } from '@/lib/theme';
import Link from 'next/link';
import TemplateGallery from '@/components/areas/TemplateGallery';
import type { AreaTemplate, TemplateCustomizations } from '@/types/area-template';

interface AreaFormData {
  title: string;
  description: string;
  color: string;
  type: string;
  responsibilityLevel: string;
  reviewFrequency: string;
  isActive: boolean;
  tags: string[];
}

export default function NewAreaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('custom');
  const [selectedTemplate, setSelectedTemplate] = useState<AreaTemplate | null>(null);

  const form = useForm<AreaFormData>({
    initialValues: {
      title: '',
      description: '',
      color: getParaColor('areas'),
      type: 'RESPONSIBILITY',
      responsibilityLevel: 'MEDIUM',
      reviewFrequency: 'MONTHLY',
      isActive: true,
      tags: [],
    },
    validate: {
      title: (value) => {
        if (!value.trim()) return 'Title is required';
        if (value.length > 200) return 'Title must be less than 200 characters';
        return null;
      },
      description: (value) => {
        if (value && value.length > 1000) return 'Description must be less than 1000 characters';
        return null;
      },
      color: (value) => {
        if (!/^#[0-9A-F]{6}$/i.test(value)) return 'Invalid color format';
        return null;
      },
    },
  });

  const handleTemplateSelect = (template: AreaTemplate, customizations?: TemplateCustomizations) => {
    setSelectedTemplate(template);
    // Pre-fill form with template data
    form.setValues({
      title: customizations?.area?.title || template.template.area.title,
      description: customizations?.area?.description || template.template.area.description || '',
      color: customizations?.area?.color || template.template.area.color || getParaColor('areas'),
      type: customizations?.area?.type || template.template.area.type,
      responsibilityLevel: customizations?.area?.responsibilityLevel || template.template.area.responsibilityLevel,
      reviewFrequency: customizations?.area?.reviewFrequency || template.template.area.reviewFrequency,
      isActive: true,
      tags: customizations?.area?.tags || template.template.area.tags || [],
    });
    setActiveTab('custom');
  };

  const handleSubmit = async (values: AreaFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const data = await response.json();
        notifications.show({
          title: 'Area Created',
          message: 'Your area has been created successfully.',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
        router.push(`/areas/${data.data.area.id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create area');
      }
    } catch (error) {
      console.error('Create area error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create area');
      notifications.show({
        title: 'Error',
        message: 'Failed to create area. Please try again.',
        color: 'red',
        icon: <IconAlertTriangle size="1rem" />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group>
        <Button
          component={Link}
          href="/areas"
          variant="subtle"
          leftSection={<IconArrowLeft size="1rem" />}
          color="gray"
        >
          Back to Areas
        </Button>
      </Group>

      <div>
        <Title order={1} c={getParaColor('areas')}>
          Create New Area
        </Title>
        <Text c="dimmed" size="sm">
          Areas represent ongoing responsibilities and standards to maintain
        </Text>
      </div>

      {error && (
        <Alert color="red" title="Error" icon={<IconAlertTriangle size="1rem" />}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'custom')}>
        <Tabs.List>
          <Tabs.Tab value="templates" leftSection={<IconTemplate size="0.8rem" />}>
            Use Template
          </Tabs.Tab>
          <Tabs.Tab value="custom" leftSection={<IconEdit size="0.8rem" />}>
            Custom Area
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="templates" pt="md">
          <TemplateGallery
            onTemplateSelect={handleTemplateSelect}
          />
        </Tabs.Panel>

        <Tabs.Panel value="custom" pt="md">
          {selectedTemplate && (
            <Alert color="blue" mb="md">
              Creating area from template: <strong>{selectedTemplate.name}</strong>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setSelectedTemplate(null)}
                ml="sm"
              >
                Clear Template
              </Button>
            </Alert>
          )}

          <Card padding="lg" radius="md" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {/* Basic Information */}
            <Grid>
              <Grid.Col span={12}>
                <TextInput
                  label="Area Title"
                  placeholder="Enter area title..."
                  required
                  {...form.getInputProps('title')}
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <Textarea
                  label="Description"
                  placeholder="Describe this area of responsibility..."
                  rows={4}
                  {...form.getInputProps('description')}
                />
              </Grid.Col>
            </Grid>

            {/* Area Settings */}
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Type"
                  description="What kind of area is this?"
                  data={[
                    { value: 'RESPONSIBILITY', label: 'Responsibility' },
                    { value: 'INTEREST', label: 'Interest' },
                    { value: 'LEARNING', label: 'Learning' },
                    { value: 'HEALTH', label: 'Health' },
                    { value: 'FINANCE', label: 'Finance' },
                    { value: 'CAREER', label: 'Career' },
                    { value: 'PERSONAL', label: 'Personal' },
                    { value: 'OTHER', label: 'Other' },
                  ]}
                  {...form.getInputProps('type')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Priority Level"
                  placeholder="Select priority level"
                  required
                  data={[
                    { value: 'LOW', label: 'Low Priority' },
                    { value: 'MEDIUM', label: 'Medium Priority' },
                    { value: 'HIGH', label: 'High Priority' },
                  ]}
                  {...form.getInputProps('responsibilityLevel')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Review Frequency"
                  placeholder="Select review frequency"
                  required
                  data={[
                    { value: 'WEEKLY', label: 'Weekly' },
                    { value: 'BIWEEKLY', label: 'Bi-weekly' },
                    { value: 'MONTHLY', label: 'Monthly' },
                    { value: 'QUARTERLY', label: 'Quarterly' },
                    { value: 'BIANNUALLY', label: 'Bi-annually' },
                    { value: 'ANNUALLY', label: 'Annually' },
                    { value: 'CUSTOM', label: 'Custom' },
                  ]}
                  {...form.getInputProps('reviewFrequency')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <ColorInput
                  label="Color"
                  description="Choose a color to identify this area"
                  placeholder="Pick a color"
                  {...form.getInputProps('color')}
                />
              </Grid.Col>
            </Grid>

            {/* Status */}
            <Switch
              label="Active Area"
              description="Active areas appear in navigation and project selection"
              {...form.getInputProps('isActive', { type: 'checkbox' })}
            />

            {/* Tags */}
            <TagsInput
              label="Tags"
              placeholder="Add tags..."
              {...form.getInputProps('tags')}
            />

            {/* Actions */}
            <Group justify="flex-end" gap="sm" mt="lg">
              <Button
                component={Link}
                href="/areas"
                variant="outline"
                color="gray"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                color={getParaColor('areas')}
              >
                Create Area
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
