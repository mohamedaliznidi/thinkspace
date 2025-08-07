/**
 * New Note Page for ThinkSpace
 * 
 * This page provides a form to create new notes with
 * rich text editing, categorization, and PARA methodology integration.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stack,
  Title,
  Card,
  TextInput,
  Select,
  Button,
  Group,
  Alert,
  TagsInput,
  Grid,
  Text,
  Switch,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconArrowLeft, IconCheck } from '@tabler/icons-react';
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

interface Resource {
  id: string;
  title: string;
  type: string;
}

interface NoteFormData {
  title: string;
  content: string;
  type: string;
  isPinned: boolean;
  projectId?: string;
  areaId?: string;
  resourceId?: string;
  tags: string[];
}

export default function NewNotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<NoteFormData>({
    initialValues: {
      title: '',
      content: '',
      type: 'FLEETING',
      isPinned: false,
      projectId: '',
      areaId: '',
      resourceId: '',
      tags: [],
    },
    validate: {
      title: (value) => {
        if (!value.trim()) return 'Title is required';
        if (value.length > 200) return 'Title must be less than 200 characters';
        return null;
      },
      content: (value) => {
        if (!value.trim()) return 'Content is required';
        return null;
      },
    },
  });

  // Fetch related data for selection
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [areasResponse, projectsResponse, resourcesResponse] = await Promise.all([
          fetch('/api/areas?limit=100&isActive=true'),
          fetch('/api/projects?limit=100&status=ACTIVE'),
          fetch('/api/resources?limit=100'),
        ]);

        if (areasResponse.ok) {
          const areasData = await areasResponse.json();
          setAreas(areasData.data.areas);
        }

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.data.projects);
        }

        if (resourcesResponse.ok) {
          const resourcesData = await resourcesResponse.json();
          setResources(resourcesData.data.resources);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (values: NoteFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          projectId: values.projectId || undefined,
          areaId: values.areaId || undefined,
          resourceId: values.resourceId || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        notifications.show({
          title: 'Note Created',
          message: 'Your note has been created successfully.',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
        router.push(`/notes/${data.data.note.id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create note');
      }
    } catch (error) {
      console.error('Create note error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create note');
      notifications.show({
        title: 'Error',
        message: 'Failed to create note. Please try again.',
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
          href="/notes"
          variant="subtle"
          leftSection={<IconArrowLeft size="1rem" />}
          color="gray"
        >
          Back to Notes
        </Button>
      </Group>

      <div>
        <Title order={1}>
          Create New Note
        </Title>
        <Text c="dimmed" size="sm">
          Capture your thoughts and insights
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
                  label="Note Title"
                  placeholder="Enter note title..."
                  required
                  {...form.getInputProps('title')}
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <Textarea
                  label="Content"
                  placeholder="Write your note content..."
                  rows={8}
                  required
                  {...form.getInputProps('content')}
                />
              </Grid.Col>
            </Grid>

            {/* Note Settings */}
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Note Type"
                  description="Choose the type of note"
                  data={[
                    { value: 'FLEETING', label: 'Fleeting - Quick thoughts' },
                    { value: 'LITERATURE', label: 'Literature - From sources' },
                    { value: 'PERMANENT', label: 'Permanent - Refined ideas' },
                    { value: 'PROJECT', label: 'Project - Project-specific' },
                    { value: 'MEETING', label: 'Meeting - Meeting notes' },
                  ]}
                  {...form.getInputProps('type')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Switch
                  label="Pin Note"
                  description="Pinned notes appear at the top"
                  {...form.getInputProps('isPinned', { type: 'checkbox' })}
                />
              </Grid.Col>
            </Grid>

            {/* Associations */}
            <Grid>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Select
                  label="Project"
                  placeholder="Link to a project..."
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
                  placeholder="Link to an area..."
                  data={areas.map(area => ({
                    value: area.id,
                    label: area.title,
                  }))}
                  searchable
                  clearable
                  {...form.getInputProps('areaId')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Select
                  label="Resource"
                  placeholder="Link to a resource..."
                  data={resources.map(resource => ({
                    value: resource.id,
                    label: resource.title,
                  }))}
                  searchable
                  clearable
                  {...form.getInputProps('resourceId')}
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
                href="/notes"
                variant="outline"
                color="gray"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                color="gray"
              >
                Create Note
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
