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
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconArrowLeft, IconCheck } from '@tabler/icons-react';
import { getParaColor } from '@/lib/theme';
import Link from 'next/link';

interface AreaFormData {
  title: string;
  description: string;
  color: string;
  type: string;
  isActive: boolean;
  tags: string[];
}

export default function NewAreaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AreaFormData>({
    initialValues: {
      title: '',
      description: '',
      color: getParaColor('areas'),
      type: 'RESPONSIBILITY',
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

      {/* Form */}
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
                    { value: 'SKILL', label: 'Skill' },
                    { value: 'GOAL', label: 'Goal' },
                  ]}
                  {...form.getInputProps('type')}
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
    </Stack>
  );
}
