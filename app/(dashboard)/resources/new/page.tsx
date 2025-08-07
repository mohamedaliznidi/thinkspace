/**
 * New Resource Page for ThinkSpace
 * 
 * This page provides a form to create new resources
 * with validation, type selection, and PARA methodology integration.
 */

'use client';

import { useState, useEffect } from 'react';
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
  Tabs,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconArrowLeft, IconCheck, IconLink, IconUpload } from '@tabler/icons-react';
import { getParaColor } from '@/lib/theme';
import Link from 'next/link';

interface Area {
  id: string;
  title: string;
  color: string;
}

interface Project {
  id: string;
  title: string;
  status: string;
}

interface ResourceFormData {
  title: string;
  description: string;
  type: string;
  url?: string;
  projectId?: string;
  areaId?: string;
  tags: string[];
}

export default function NewResourcePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resourceType, setResourceType] = useState<'link' | 'upload'>('link');

  const form = useForm<ResourceFormData>({
    initialValues: {
      title: '',
      description: '',
      type: 'LINK',
      url: '',
      projectId: '',
      areaId: '',
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
      url: (value) => {
        if (resourceType === 'link' && value && !/^https?:\/\/.+/.test(value)) {
          return 'Please enter a valid URL';
        }
        return null;
      },
    },
  });

  // Fetch areas and projects for selection
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [areasResponse, projectsResponse] = await Promise.all([
          fetch('/api/areas?limit=100&isActive=true'),
          fetch('/api/projects?limit=100&status=ACTIVE'),
        ]);

        if (areasResponse.ok) {
          const areasData = await areasResponse.json();
          setAreas(areasData.data.areas);
        }

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.data.projects);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (values: ResourceFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          projectId: values.projectId || undefined,
          areaId: values.areaId || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        notifications.show({
          title: 'Resource Created',
          message: 'Your resource has been created successfully.',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
        router.push(`/resources/${data.data.resource.id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create resource');
      }
    } catch (error) {
      console.error('Create resource error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create resource');
      notifications.show({
        title: 'Error',
        message: 'Failed to create resource. Please try again.',
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
          href="/resources"
          variant="subtle"
          leftSection={<IconArrowLeft size="1rem" />}
          color="gray"
        >
          Back to Resources
        </Button>
      </Group>

      <div>
        <Title order={1} c={getParaColor('resources')}>
          Add New Resource
        </Title>
        <Text c="dimmed" size="sm">
          Resources are materials for future reference
        </Text>
      </div>

      {error && (
        <Alert color="red" title="Error" icon={<IconAlertTriangle size="1rem" />}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <Card padding="lg" radius="md" withBorder>
        <Tabs value={resourceType} onChange={(value) => setResourceType(value as 'link' | 'upload')}>
          <Tabs.List>
            <Tabs.Tab value="link" leftSection={<IconLink size="0.8rem" />}>
              Add Link
            </Tabs.Tab>
            <Tabs.Tab value="upload" leftSection={<IconUpload size="0.8rem" />}>
              Upload File
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="link" pt="md">
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                {/* Basic Information */}
                <Grid>
                  <Grid.Col span={12}>
                    <TextInput
                      label="Resource Title"
                      placeholder="Enter resource title..."
                      required
                      {...form.getInputProps('title')}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <TextInput
                      label="URL"
                      placeholder="https://example.com"
                      required
                      {...form.getInputProps('url')}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Textarea
                      label="Description"
                      placeholder="Describe this resource..."
                      rows={4}
                      {...form.getInputProps('description')}
                    />
                  </Grid.Col>
                </Grid>

                {/* Resource Settings */}
                <Grid>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <Select
                      label="Type"
                      data={[
                        { value: 'LINK', label: 'Link' },
                        { value: 'DOCUMENT', label: 'Document' },
                        { value: 'VIDEO', label: 'Video' },
                        { value: 'AUDIO', label: 'Audio' },
                        { value: 'OTHER', label: 'Other' },
                      ]}
                      {...form.getInputProps('type')}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <Select
                      label="Project"
                      placeholder="Select a project..."
                      data={projects.map(project => ({
                        value: project.id,
                        label: project.title,
                      }))}
                      searchable
                      clearable
                      {...form.getInputProps('projectId')}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <Select
                      label="Area"
                      placeholder="Select an area..."
                      data={areas.map(area => ({
                        value: area.id,
                        label: area.title,
                      }))}
                      searchable
                      clearable
                      {...form.getInputProps('areaId')}
                    />
                  </Grid.Col>
                </Grid>

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
                    href="/resources"
                    variant="outline"
                    color="gray"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    color={getParaColor('resources')}
                  >
                    Add Resource
                  </Button>
                </Group>
              </Stack>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="upload" pt="md">
            <Stack gap="md" align="center" py="xl">
              <IconUpload size="3rem" color="var(--mantine-color-gray-5)" />
              <Text size="lg" fw={500}>File Upload</Text>
              <Text size="sm" c="dimmed" ta="center">
                File upload functionality will be implemented in the next phase.
                For now, please use the "Add Link" option.
              </Text>
              <Button
                variant="outline"
                onClick={() => setResourceType('link')}
              >
                Switch to Add Link
              </Button>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Card>
    </Stack>
  );
}
