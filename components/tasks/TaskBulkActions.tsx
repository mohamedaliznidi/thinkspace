/**
 * Task Bulk Actions Component for ThinkSpace
 * 
 * This component provides bulk operations for selected tasks
 * including status changes, priority updates, and deletion.
 */

'use client';

import { useState } from 'react';
import {
  Group,
  Button,
  Text,
  ActionIcon,
  Menu,
  Modal,
  Stack,
  Alert,
  Badge,
  Divider,
} from '@mantine/core';
import {
  IconCheck,
  IconTrash,
  IconDots,
  IconFlag,
  IconX,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  tags: string[];
}

interface TaskBulkActionsProps {
  selectedTasks: Task[];
  onBulkStatusChange: (taskIds: string[], status: Task['status']) => Promise<void>;
  onBulkPriorityChange: (taskIds: string[], priority: Task['priority']) => Promise<void>;
  onBulkDelete: (taskIds: string[]) => Promise<void>;
  onClearSelection: () => void;
}

export function TaskBulkActions({
  selectedTasks,
  onBulkStatusChange,
  onBulkPriorityChange,
  onBulkDelete,
  onClearSelection,
}: TaskBulkActionsProps) {
  const [loading, setLoading] = useState(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  if (selectedTasks.length === 0) {
    return null;
  }

  const handleBulkAction = async (
    action: () => Promise<void>,
    successMessage: string,
    errorMessage: string
  ) => {
    try {
      setLoading(true);
      await action();
      notifications.show({
        title: 'Success',
        message: successMessage,
        color: 'green',
      });
    } catch (error) {
      console.error('Bulk action error:', error);
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: Task['status']) => {
    const taskIds = selectedTasks.map(task => task.id);
    handleBulkAction(
      () => onBulkStatusChange(taskIds, status),
      `Updated ${selectedTasks.length} task${selectedTasks.length !== 1 ? 's' : ''} to ${status.replace('_', ' ').toLowerCase()}`,
      'Failed to update task status'
    );
  };

  const handlePriorityChange = (priority: Task['priority']) => {
    const taskIds = selectedTasks.map(task => task.id);
    handleBulkAction(
      () => onBulkPriorityChange(taskIds, priority),
      `Updated ${selectedTasks.length} task${selectedTasks.length !== 1 ? 's' : ''} to ${priority.toLowerCase()} priority`,
      'Failed to update task priority'
    );
  };

  const handleDelete = () => {
    const taskIds = selectedTasks.map(task => task.id);
    handleBulkAction(
      () => onBulkDelete(taskIds),
      `Deleted ${selectedTasks.length} task${selectedTasks.length !== 1 ? 's' : ''}`,
      'Failed to delete tasks'
    );
    closeDeleteModal();
    onClearSelection();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'gray';
      case 'IN_PROGRESS': return 'blue';
      case 'IN_REVIEW': return 'yellow';
      case 'BLOCKED': return 'red';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'dark';
      default: return 'gray';
    }
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

  // Get unique statuses and priorities from selected tasks
  const uniqueStatuses = [...new Set(selectedTasks.map(task => task.status))];
  const uniquePriorities = [...new Set(selectedTasks.map(task => task.priority))];

  return (
    <>
      <Group
        gap="sm"
        p="sm"
        style={{
          backgroundColor: 'var(--mantine-color-blue-0)',
          borderRadius: 'var(--mantine-radius-md)',
          border: '1px solid var(--mantine-color-blue-3)',
        }}
      >
        <Group gap="xs">
          <Text size="sm" fw={500}>
            {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
          </Text>
          
          {/* Show current status/priority if all selected tasks have the same */}
          {uniqueStatuses.length === 1 && (
            <Badge size="xs" color={getStatusColor(uniqueStatuses[0])}>
              {uniqueStatuses[0].replace('_', ' ')}
            </Badge>
          )}
          
          {uniquePriorities.length === 1 && (
            <Badge size="xs" color={getPriorityColor(uniquePriorities[0])}>
              {uniquePriorities[0]}
            </Badge>
          )}
        </Group>

        <Divider orientation="vertical" />

        {/* Quick Actions */}
        <Group gap="xs">
          <Button
            size="xs"
            variant="outline"
            leftSection={<IconCheck size="0.875rem" />}
            onClick={() => handleStatusChange('COMPLETED')}
            loading={loading}
          >
            Complete
          </Button>

          <Button
            size="xs"
            variant="outline"
            color="blue"
            leftSection={<IconFlag size="0.875rem" />}
            onClick={() => handleStatusChange('IN_PROGRESS')}
            loading={loading}
          >
            Start
          </Button>

          <Button
            size="xs"
            variant="outline"
            color="red"
            leftSection={<IconTrash size="0.875rem" />}
            onClick={openDeleteModal}
            loading={loading}
          >
            Delete
          </Button>
        </Group>

        <Divider orientation="vertical" />

        {/* More Actions Menu */}
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="outline" size="sm">
              <IconDots size="1rem" />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Change Status</Menu.Label>
            {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'COMPLETED', 'CANCELLED'].map((status) => (
              <Menu.Item
                key={status}
                onClick={() => handleStatusChange(status as Task['status'])}
                disabled={uniqueStatuses.length === 1 && uniqueStatuses[0] === status}
              >
                {status.replace('_', ' ')}
              </Menu.Item>
            ))}
            
            <Menu.Divider />
            <Menu.Label>Change Priority</Menu.Label>
            {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((priority) => (
              <Menu.Item
                key={priority}
                onClick={() => handlePriorityChange(priority as Task['priority'])}
                disabled={uniquePriorities.length === 1 && uniquePriorities[0] === priority}
                leftSection={<IconFlag size="0.875rem" />}
              >
                {priority}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>

        <Divider orientation="vertical" />

        {/* Clear Selection */}
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={onClearSelection}
          size="sm"
        >
          <IconX size="1rem" />
        </ActionIcon>
      </Group>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Tasks"
        centered
      >
        <Stack gap="md">
          <Alert
            icon={<IconAlertTriangle size="1rem" />}
            color="red"
            title="Confirm Deletion"
          >
            Are you sure you want to delete {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}?
            This action cannot be undone.
          </Alert>

          {/* Show task titles */}
          <Stack gap="xs">
            <Text size="sm" fw={500}>Tasks to be deleted:</Text>
            {selectedTasks.slice(0, 5).map(task => (
              <Text key={task.id} size="sm" c="dimmed">
                • {task.title}
              </Text>
            ))}
            {selectedTasks.length > 5 && (
              <Text size="sm" c="dimmed">
                ... and {selectedTasks.length - 5} more
              </Text>
            )}
          </Stack>

          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDelete} loading={loading}>
              Delete {selectedTasks.length} Task{selectedTasks.length !== 1 ? 's' : ''}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
