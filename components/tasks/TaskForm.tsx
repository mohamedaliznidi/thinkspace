/**
 * Task Form Component for ThinkSpace
 * 
 * This component provides a form for creating and editing tasks
 * with validation, project selection, and advanced options.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Stack,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  NumberInput,
  TagsInput,
  Collapse,
  Alert,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconChevronDown,
  IconChevronUp,
  IconCalendar,
  IconClock,
  IconFlag,
} from '@tabler/icons-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId: string;
  parentTaskId?: string;
  dueDate?: Date;
  startDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  order: number;
  tags: string[];
  metadata?: Record<string, any>;
}

interface Project {
  id: string;
  title: string;
  status: string;
}

interface TaskFormProps {
  task?: Task;
  projectId?: string;
  parentTaskId?: string;
  projects: Project[];
  availableParentTasks?: { id: string; title: string }[];
  onSubmit: (data: Partial<Task>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function TaskForm({
  task,
  projectId,
  parentTaskId,
  projects,
  availableParentTasks = [],
  onSubmit,
  onCancel,
  loading = false,
}: TaskFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'TODO',
      priority: task?.priority || 'MEDIUM',
      projectId: task?.projectId || projectId || '',
      parentTaskId: task?.parentTaskId || parentTaskId || '',
      dueDate: task?.dueDate ? new Date(task.dueDate) : null,
      startDate: task?.startDate ? new Date(task.startDate) : null,
      estimatedHours: task?.estimatedHours || null,
      actualHours: task?.actualHours || null,
      tags: task?.tags || [],
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
      projectId: (value) => !value ? 'Project is required' : null,
      estimatedHours: (value) => {
        if (value !== null && value <= 0) return 'Estimated hours must be positive';
        return null;
      },
      actualHours: (value) => {
        if (value !== null && value <= 0) return 'Actual hours must be positive';
        return null;
      },
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    console.log("🚀 ~ handleSubmit ~ values.dueDate ? new Date(values.dueDate.toISOString()) : undefined:", values.dueDate ? new Date(values.dueDate.toString()) : undefined)
    try {
      setSubmitting(true);

      const submitData: Partial<Task> = {
        title: values.title.trim(),
        description: values.description?.trim() || undefined,
        status: values.status as Task['status'],
        priority: values.priority as Task['priority'],
        projectId: values.projectId,
        parentTaskId: values.parentTaskId || undefined,
        dueDate: values.dueDate ? new Date(values.dueDate.toString()) : undefined,
        startDate: values.startDate ? new Date(values.startDate.toString()) : undefined,
        estimatedHours: values.estimatedHours || undefined,
        actualHours: values.actualHours || undefined,
        tags: values.tags,
      };

      await onSubmit(submitData);

      notifications.show({
        title: 'Success',
        message: task ? 'Task updated successfully' : 'Task created successfully',
        color: 'green',
      });

    } catch (error) {
      console.error('Task form error:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'An error occurred',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions = [
    { value: 'TODO', label: 'To Do' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'IN_REVIEW', label: 'In Review' },
    { value: 'BLOCKED', label: 'Blocked' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
  ];

  const projectOptions = projects.map(project => ({
    value: project.id,
    label: project.title,
  }));

  const parentTaskOptions = availableParentTasks.map(parentTask => ({
    value: parentTask.id,
    label: parentTask.title,
  }));

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        {/* Basic Information */}
        <TextInput
          label="Title"
          placeholder="Enter task title"
          required
          {...form.getInputProps('title')}
        />

        <Textarea
          label="Description"
          placeholder="Enter task description (optional)"
          minRows={3}
          maxRows={6}
          {...form.getInputProps('description')}
        />

        <Group grow>
          <Select
            label="Status"
            data={statusOptions}
            required
            {...form.getInputProps('status')}
          />

          <Select
            label="Priority"
            data={priorityOptions}
            required
            leftSection={<IconFlag size="1rem" />}
            {...form.getInputProps('priority')}
          />
        </Group>

        <Group grow>
          <Select
            label="Project"
            placeholder="Select project"
            data={projectOptions}
            required
            searchable
            {...form.getInputProps('projectId')}
          />

          {parentTaskOptions.length > 0 && (
            <Select
              label="Parent Task"
              placeholder="Select parent task (optional)"
              data={parentTaskOptions}
              clearable
              searchable
              {...form.getInputProps('parentTaskId')}
            />
          )}
        </Group>

        {/* Advanced Options */}
        <Button
          variant="subtle"
          size="sm"
          leftSection={showAdvanced ? <IconChevronUp size="1rem" /> : <IconChevronDown size="1rem" />}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          Advanced Options
        </Button>

        <Collapse in={showAdvanced}>
          <Stack gap="md">
            <Group grow>
              <DateTimePicker
                label="Start Date"
                clearable
                valueFormat="DD/MM/YYYY HH:mm:ss "
                placeholder="Select start date"
                leftSection={<IconCalendar size="1rem" />}
                {...form.getInputProps('startDate')}
              />

              <DateTimePicker
                label="Due Date"
                clearable
                valueFormat="DD/MM/YYYY HH:mm:ss "
                placeholder="Select due date"
                leftSection={<IconCalendar size="1rem" />}
                {...form.getInputProps('dueDate')}
              />
            </Group>

            <Group grow>
              <NumberInput
                label="Estimated Hours"
                placeholder="Enter estimated hours"
                min={0}
                step={0.5}
                leftSection={<IconClock size="1rem" />}
                {...form.getInputProps('estimatedHours')}
              />

              {task && (
                <NumberInput
                  label="Actual Hours"
                  placeholder="Enter actual hours"
                  min={0}
                  step={0.5}
                  leftSection={<IconClock size="1rem" />}
                  {...form.getInputProps('actualHours')}
                />
              )}
            </Group>

            <TagsInput
              label="Tags"
              placeholder="Add tags"
              {...form.getInputProps('tags')}
            />
          </Stack>
        </Collapse>

        {/* Validation Warnings */}
        {form.values.dueDate && form.values.startDate &&
          form.values.dueDate <= form.values.startDate && (
            <Alert
              icon={<IconAlertTriangle size="1rem" />}
              title="Date Warning"
              color="yellow"
            >
              Due date should be after start date
            </Alert>
          )}

        {/* Form Actions */}
        <Group justify="flex-end" mt="md">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={submitting || loading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            loading={submitting || loading}
            disabled={!form.isValid()}
          >
            {task ? 'Update Task' : 'Create Task'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
