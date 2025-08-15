/**
 * Task List Component for ThinkSpace
 * 
 * This component displays tasks in a list format with filtering,
 * sorting, and drag-and-drop reordering capabilities.
 */

'use client';

import { useState, useMemo } from 'react';
import {
  Stack,
  Group,
  TextInput,
  Select,
  Button,
  Text,
  Center,
  Loader,
  Alert,
  Checkbox,
  Menu,
  Divider,
} from '@mantine/core';
import {
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconCheck,
  IconTrash,
  IconPlus,
} from '@tabler/icons-react';
import { TaskCard } from './TaskCard';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  order: number;
  tags: string[];
  project: {
    id: string;
    title: string;
    status: string;
  };
  parentTask?: {
    id: string;
    title: string;
  };
  subtasks?: {
    id: string;
    title: string;
    status: string;
    completedAt?: string;
  }[];
  _count: {
    subtasks: number;
    activities: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  error?: string;
  onTaskCreate?: () => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  onTaskStatusChange?: (taskId: string, status: Task['status']) => void;
  onTaskReorder?: (taskId: string, newOrder: number) => void;
  onBulkStatusChange?: (taskIds: string[], status: Task['status']) => void;
  onBulkDelete?: (taskIds: string[]) => void;
  onTaskFocus?: (task: Task | null) => void;
  onTaskSelect?: (tasks: Task[]) => void;
  showProject?: boolean;
  allowReorder?: boolean;
  allowBulkActions?: boolean;
}

type SortField = 'title' | 'status' | 'priority' | 'dueDate' | 'createdAt' | 'order';
type SortDirection = 'asc' | 'desc';

export function TaskList({
  tasks,
  loading = false,
  error,
  onTaskCreate,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  onTaskReorder,
  onBulkStatusChange,
  onBulkDelete,
  onTaskFocus,
  onTaskSelect,
  showProject = true,
  allowReorder = false,
  allowBulkActions = false,
}: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = !statusFilter || task.status === statusFilter;
      const matchesPriority = !priorityFilter || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'priority':
          const priorityOrder = { 'LOW': 0, 'MEDIUM': 1, 'HIGH': 2, 'URGENT': 3 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'order':
        default:
          aValue = a.order;
          bValue = b.order;
          break;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tasks, searchQuery, statusFilter, priorityFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleTaskSelect = (taskId: string, selected: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (selected) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);

    // Call the callback with the selected tasks
    if (onTaskSelect) {
      const selectedTaskObjects = tasks.filter(task => newSelected.has(task.id));
      onTaskSelect(selectedTaskObjects);
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedTasks(new Set(filteredAndSortedTasks.map(task => task.id)));
    } else {
      setSelectedTasks(new Set());
    }
  };

  const handleBulkAction = (action: 'complete' | 'delete') => {
    const taskIds = Array.from(selectedTasks);
    if (taskIds.length === 0) return;

    if (action === 'complete' && onBulkStatusChange) {
      onBulkStatusChange(taskIds, 'COMPLETED');
    } else if (action === 'delete' && onBulkDelete) {
      onBulkDelete(taskIds);
    }

    setSelectedTasks(new Set());
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDrop = (targetTask: Task) => {
    if (draggedTask && draggedTask.id !== targetTask.id && onTaskReorder) {
      onTaskReorder(draggedTask.id, targetTask.order);
    }
  };

  if (loading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Error loading tasks">
        {error}
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      {/* Header with filters and actions */}
      <Group justify="space-between">
        <Group gap="md">
          <TextInput
            placeholder="Search tasks..."
            leftSection={<IconSearch size="1rem" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ minWidth: 250 }}
          />

          <Select
            placeholder="Filter by status"
            data={[
              { value: '', label: 'All Statuses' },
              { value: 'TODO', label: 'To Do' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'IN_REVIEW', label: 'In Review' },
              { value: 'BLOCKED', label: 'Blocked' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value || '')}
            clearable
          />

          <Select
            placeholder="Filter by priority"
            data={[
              { value: '', label: 'All Priorities' },
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'URGENT', label: 'Urgent' },
            ]}
            value={priorityFilter}
            onChange={(value) => setPriorityFilter(value || '')}
            clearable
          />
        </Group>

        <Group gap="sm">
          {/* Sort Options */}
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button
                variant="outline"
                leftSection={sortDirection === 'asc' ? <IconSortAscending size="1rem" /> : <IconSortDescending size="1rem" />}
              >
                Sort
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Sort by</Menu.Label>
              {[
                { value: 'order', label: 'Order' },
                { value: 'title', label: 'Title' },
                { value: 'status', label: 'Status' },
                { value: 'priority', label: 'Priority' },
                { value: 'dueDate', label: 'Due Date' },
                { value: 'createdAt', label: 'Created' },
              ].map((option) => (
                <Menu.Item
                  key={option.value}
                  onClick={() => handleSort(option.value as SortField)}
                >
                  {option.label}
                  {sortField === option.value && (
                    sortDirection === 'asc' ? ' ↑' : ' ↓'
                  )}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {/* Bulk Actions */}
      {allowBulkActions && selectedTasks.size > 0 && (
        <Group gap="sm" p="sm" style={{ backgroundColor: 'var(--mantine-color-blue-0)', borderRadius: 'var(--mantine-radius-md)' }}>
          <Text size="sm" fw={500}>
            {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
          </Text>
          
          <Button
            size="xs"
            variant="outline"
            leftSection={<IconCheck size="0.875rem" />}
            onClick={() => handleBulkAction('complete')}
          >
            Mark Complete
          </Button>
          
          <Button
            size="xs"
            variant="outline"
            color="red"
            leftSection={<IconTrash size="0.875rem" />}
            onClick={() => handleBulkAction('delete')}
          >
            Delete
          </Button>
          
          <Button
            size="xs"
            variant="subtle"
            onClick={() => setSelectedTasks(new Set())}
          >
            Clear Selection
          </Button>
        </Group>
      )}

      {/* Task List */}
      {filteredAndSortedTasks.length === 0 ? (
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Text size="lg" c="dimmed">No tasks found</Text>
            {onTaskCreate && (
              <Button
                variant="outline"
                leftSection={<IconPlus size="1rem" />}
                onClick={onTaskCreate}
              >
                Create your first task
              </Button>
            )}
          </Stack>
        </Center>
      ) : (
        <Stack gap="sm">
          {/* Select All */}
          {allowBulkActions && (
            <>
              <Group gap="sm">
                <Checkbox
                  checked={selectedTasks.size === filteredAndSortedTasks.length}
                  indeterminate={selectedTasks.size > 0 && selectedTasks.size < filteredAndSortedTasks.length}
                  onChange={(e) => handleSelectAll(e.currentTarget.checked)}
                />
                <Text size="sm" c="dimmed">
                  Select all ({filteredAndSortedTasks.length} tasks)
                </Text>
              </Group>
              <Divider />
            </>
          )}

          {/* Tasks */}
          {filteredAndSortedTasks.map((task) => (
            <Group key={task.id} gap="sm" align="flex-start">
              {allowBulkActions && (
                <Checkbox
                  checked={selectedTasks.has(task.id)}
                  onChange={(e) => handleTaskSelect(task.id, e.currentTarget.checked)}
                  mt="md"
                />
              )}
              
              <div
                style={{ flex: 1 }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(task)}
              >
                <div
                  onClick={() => onTaskFocus && onTaskFocus(task)}
                  style={{ cursor: 'pointer' }}
                >
                  <TaskCard
                    task={task}
                    onEdit={onTaskEdit}
                    onDelete={onTaskDelete}
                    onStatusChange={onTaskStatusChange}
                    onDragStart={allowReorder ? handleDragStart : undefined}
                    onDragEnd={allowReorder ? handleDragEnd : undefined}
                    draggable={allowReorder}
                    showProject={showProject}
                  />
                </div>
              </div>
            </Group>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
