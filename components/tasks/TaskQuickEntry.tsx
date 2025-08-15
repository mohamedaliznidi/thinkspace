/**
 * Task Quick Entry Component for ThinkSpace
 * 
 * This component provides a quick way to create tasks with
 * keyboard shortcuts and smart parsing of task details.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import {
  TextInput,
  Group,
  Button,
  ActionIcon,
  Tooltip,
  Badge,
  Stack,
  Text,
  Card,
  Collapse,
} from '@mantine/core';
import {
  IconPlus,
  IconX,
  IconCalendar,
  IconFlag,
  IconHash,
  IconKeyboard,
} from '@tabler/icons-react';
import { useHotkeys } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

interface TaskQuickEntryProps {
  projectId: string;
  onTaskCreate: (taskData: {
    title: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: string;
    tags?: string[];
  }) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  compact?: boolean;
}

interface ParsedTask {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  tags: string[];
}

export function TaskQuickEntry({
  projectId,
  onTaskCreate,
  placeholder = "Type a task... (e.g., 'Fix bug #urgent @frontend due:tomorrow')",
  autoFocus = false,
  onCancel,
  compact = false,
}: TaskQuickEntryProps) {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [parsedTask, setParsedTask] = useState<ParsedTask | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when component mounts
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Parse task input for special syntax
  const parseTaskInput = (text: string): ParsedTask => {
    let title = text;
    const tags: string[] = [];
    let priority: ParsedTask['priority'];
    let dueDate: string | undefined;
    let description: string | undefined;

    // Extract tags (#tag)
    const tagMatches = text.match(/#(\w+)/g);
    if (tagMatches) {
      tagMatches.forEach(match => {
        const tag = match.substring(1).toLowerCase();
        tags.push(tag);
        title = title.replace(match, '').trim();
      });
    }

    // Extract priority (@priority)
    const priorityMatch = text.match(/@(urgent|high|medium|low)/i);
    if (priorityMatch) {
      priority = priorityMatch[1].toUpperCase() as ParsedTask['priority'];
      title = title.replace(priorityMatch[0], '').trim();
    }

    // Extract due date (due:date)
    const dueDateMatch = text.match(/due:(\w+)/i);
    if (dueDateMatch) {
      const dateStr = dueDateMatch[1].toLowerCase();
      const now = new Date();
      
      switch (dateStr) {
        case 'today':
          dueDate = now.toISOString();
          break;
        case 'tomorrow':
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          dueDate = tomorrow.toISOString();
          break;
        case 'week':
          const nextWeek = new Date(now);
          nextWeek.setDate(nextWeek.getDate() + 7);
          dueDate = nextWeek.toISOString();
          break;
        default:
          // Try to parse as date
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            dueDate = parsedDate.toISOString();
          }
      }
      
      title = title.replace(dueDateMatch[0], '').trim();
    }

    // Extract description (desc:text or anything after |)
    const descMatch = text.match(/desc:(.+)/i) || text.match(/\|(.+)/);
    if (descMatch) {
      description = descMatch[1].trim();
      title = title.replace(descMatch[0], '').trim();
    }

    // Clean up title
    title = title.replace(/\s+/g, ' ').trim();

    return {
      title,
      description,
      priority,
      dueDate,
      tags,
    };
  };

  // Update parsed task when input changes
  useEffect(() => {
    if (input.trim()) {
      setParsedTask(parseTaskInput(input));
    } else {
      setParsedTask(null);
    }
  }, [input]);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    try {
      setIsSubmitting(true);
      const parsed = parseTaskInput(input);
      
      if (!parsed.title) {
        notifications.show({
          title: 'Error',
          message: 'Task title is required',
          color: 'red',
        });
        return;
      }

      await onTaskCreate(parsed);
      setInput('');
      setParsedTask(null);
      
      notifications.show({
        title: 'Success',
        message: 'Task created successfully',
        color: 'green',
      });

    } catch (error) {
      console.error('Error creating task:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to create task',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    } else if (event.key === 'Escape') {
      if (onCancel) {
        onCancel();
      } else {
        setInput('');
        setParsedTask(null);
      }
    }
  };

  // Keyboard shortcuts
  useHotkeys([
    ['mod+Enter', handleSubmit],
    ['Escape', () => {
      if (onCancel) {
        onCancel();
      } else {
        setInput('');
        setParsedTask(null);
      }
    }],
  ]);

  return (
    <Stack gap="sm">
      <Group gap="sm" align="flex-start">
        <TextInput
          ref={inputRef}
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          style={{ flex: 1 }}
          size={compact ? 'sm' : 'md'}
        />
        
        <Group gap="xs">
          <Tooltip label="Show syntax help">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => setShowHelp(!showHelp)}
            >
              <IconKeyboard size="1rem" />
            </ActionIcon>
          </Tooltip>
          
          <Button
            leftSection={<IconPlus size="1rem" />}
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!input.trim()}
            size={compact ? 'sm' : 'md'}
          >
            Add Task
          </Button>
          
          {onCancel && (
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={onCancel}
            >
              <IconX size="1rem" />
            </ActionIcon>
          )}
        </Group>
      </Group>

      {/* Parsed Task Preview */}
      {parsedTask && parsedTask.title && (
        <Card padding="sm" radius="sm" withBorder style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              {parsedTask.title}
            </Text>
            
            {parsedTask.description && (
              <Text size="xs" c="dimmed">
                {parsedTask.description}
              </Text>
            )}
            
            <Group gap="xs">
              {parsedTask.priority && (
                <Badge size="xs" color="orange" leftSection={<IconFlag size="0.75rem" />}>
                  {parsedTask.priority}
                </Badge>
              )}
              
              {parsedTask.dueDate && (
                <Badge size="xs" color="blue" leftSection={<IconCalendar size="0.75rem" />}>
                  Due: {new Date(parsedTask.dueDate).toLocaleDateString()}
                </Badge>
              )}
              
              {parsedTask.tags.map(tag => (
                <Badge key={tag} size="xs" color="gray" leftSection={<IconHash size="0.75rem" />}>
                  {tag}
                </Badge>
              ))}
            </Group>
          </Stack>
        </Card>
      )}

      {/* Syntax Help */}
      <Collapse in={showHelp}>
        <Card padding="sm" radius="sm" withBorder>
          <Stack gap="xs">
            <Text size="sm" fw={500}>Quick Entry Syntax:</Text>
            <Text size="xs" c="dimmed">
              • <strong>@priority</strong> - Set priority (@urgent, @high, @medium, @low)
            </Text>
            <Text size="xs" c="dimmed">
              • <strong>#tag</strong> - Add tags (#frontend, #bug, #feature)
            </Text>
            <Text size="xs" c="dimmed">
              • <strong>due:date</strong> - Set due date (due:today, due:tomorrow, due:week)
            </Text>
            <Text size="xs" c="dimmed">
              • <strong>| description</strong> - Add description after pipe
            </Text>
            <Text size="xs" c="dimmed">
              • <strong>Enter</strong> - Create task, <strong>Escape</strong> - Cancel
            </Text>
          </Stack>
        </Card>
      </Collapse>
    </Stack>
  );
}
