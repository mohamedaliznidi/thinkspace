/**
 * New Project Page for ThinkSpace
 * 
 * This page provides a form to create new projects with
 * validation, area selection, and PARA methodology integration.
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
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconArrowLeft, IconCheck } from '@tabler/icons-react';
import { getParaColor } from '@/lib/theme';
import Link from 'next/link';

interface Area {
  id: string;
  title: string;
  color: string;
}

interface ProjectFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  areaId: string;
  tags: string[];
}

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProjectFormData>({
    initialValues: {
      title: '',
      description: '',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      dueDate: null,
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
    },
  });

  // Fetch areas for selection
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await fetch('/api/areas?limit=100&isActive=true');
        if (response.ok) {
          const data = await response.json();
          setAreas(data.data.areas);
        }
      } catch (error) {
        console.error('Failed to fetch areas:', error);
      }
    };

    fetchAreas();
  }, []);

  const handleSubmit = async (values: ProjectFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          areaId: values.areaId || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        notifications.show({
          title: 'Project Created',
          message: 'Your project has been created successfully.',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
        router.push(`/projects/${data.data.project.id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Create project error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create project');
      notifications.show({
        title: 'Error',
        message: 'Failed to create project. Please try again.',
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
          href="/projects"
          variant="subtle"
          leftSection={<IconArrowLeft size="1rem" />}
          color="gray"
        >
          Back to Projects
        </Button>
      </Group>

      <div>
        <Title order={1} c={getParaColor('projects')}>
          Create New Project
        </Title>
        <Text c="dimmed" size="sm">
          Projects have specific outcomes and deadlines
        </Text>
      </div>

      {error && (
        <Alert color="red" title="Error" icon={<IconAlertTriangle size="1rem" />}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <Card padding="lg" radius="md" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {/* Basic Information */}
            <Grid>
              <Grid.Col span={12}>
                <TextInput
                  label="Project Title"
                  placeholder="Enter project title..."
                  required
                  {...form.getInputProps('title')}
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <Textarea
                  label="Description"
                  placeholder="Describe your project..."
                  rows={4}
                  {...form.getInputProps('description')}
                />
              </Grid.Col>
            </Grid>

            {/* Project Settings */}
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Status"
                  data={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'ON_HOLD', label: 'On Hold' },
                    { value: 'COMPLETED', label: 'Completed' },
                  ]}
                  {...form.getInputProps('status')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Priority"
                  data={[
                    { value: 'LOW', label: 'Low' },
                    { value: 'MEDIUM', label: 'Medium' },
                    { value: 'HIGH', label: 'High' },
                    { value: 'URGENT', label: 'Urgent' },
                  ]}
                  {...form.getInputProps('priority')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <DateInput
                  clearable
                  valueFormat="DD/MM/YYYY"
                  label="Due Date"
                  placeholder="Select due date..."
                  {...form.getInputProps('dueDate')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
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
                href="/projects"
                variant="outline"
                color="gray"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                color={getParaColor('projects')}
              >
                Create Project
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
