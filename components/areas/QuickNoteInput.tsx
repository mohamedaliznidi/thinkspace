/**
 * Quick Note Input Component for ThinkSpace Areas
 * 
 * Inline note-taking interface for quick capture of thoughts,
 * observations, and insights within areas and sub-interests.
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Box,
  Textarea,
  Group,
  Button,
  ActionIcon,
  Select,
  Tooltip,
  Paper,
  Text,
  Badge,
  Collapse,
  Stack,
} from '@mantine/core';
import {
  IconPlus,
  IconCheck,
  IconX,
  IconNotes,
  IconBulb,
  IconTarget,
  IconUsers,
  IconFileText,
  IconSearch,
  IconTemplate,
  IconDots,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { NoteType } from '@prisma/client';

interface QuickNoteInputProps {
  areaId: string;
  subInterestId?: string;
  placeholder?: string;
  onNoteCreated?: (note: any) => void;
  showTypeSelector?: boolean;
  compact?: boolean;
  autoFocus?: boolean;
}

interface QuickNote {
  content: string;
  type: NoteType;
  tags: string[];
}

const noteTypes = [
  { value: 'QUICK' as NoteType, label: 'Quick Note', icon: IconNotes, color: 'blue' },
  { value: 'MEETING' as NoteType, label: 'Meeting', icon: IconUsers, color: 'green' },
  { value: 'IDEA' as NoteType, label: 'Idea', icon: IconBulb, color: 'yellow' },
  { value: 'REFLECTION' as NoteType, label: 'Reflection', icon: IconTarget, color: 'purple' },
  { value: 'SUMMARY' as NoteType, label: 'Summary', icon: IconFileText, color: 'orange' },
  { value: 'RESEARCH' as NoteType, label: 'Research', icon: IconSearch, color: 'teal' },
  { value: 'TEMPLATE' as NoteType, label: 'Template', icon: IconTemplate, color: 'indigo' },
  { value: 'OTHER' as NoteType, label: 'Other', icon: IconDots, color: 'gray' },
];

export default function QuickNoteInput({
  areaId,
  subInterestId,
  placeholder = "Quick note or observation...",
  onNoteCreated,
  showTypeSelector = true,
  compact = false,
  autoFocus = false,
}: QuickNoteInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [note, setNote] = useState<QuickNote>({
    content: '',
    type: 'QUICK' as NoteType,
    tags: [],
  });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }, []);

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
    setNote({ content: '', type: 'QUICK' as NoteType, tags: [] });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!note.content.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please enter some content for the note',
        color: 'red',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: note.content.slice(0, 50) + (note.content.length > 50 ? '...' : ''),
          content: note.content,
          type: note.type,
          tags: note.tags,
          areaIds: [areaId],
          subInterestIds: subInterestId ? [subInterestId] : [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        notifications.show({
          title: 'Note Created',
          message: 'Your note has been saved successfully',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });

        // Reset form
        setNote({ content: '', type: 'QUICK' as NoteType, tags: [] });
        setIsExpanded(false);
        
        // Notify parent component
        onNoteCreated?.(data.data.note);
      } else {
        throw new Error('Failed to create note');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create note. Please try again.',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [note, areaId, subInterestId, onNoteCreated]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSubmit();
    } else if (event.key === 'Escape') {
      handleCollapse();
    }
  }, [handleSubmit, handleCollapse]);

  const selectedNoteType = noteTypes.find(type => type.value === note.type);

  if (compact && !isExpanded) {
    return (
      <Paper
        p="xs"
        withBorder
        style={{
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onClick={handleExpand}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Group gap="xs">
          <IconPlus size="1rem" color="var(--mantine-color-gray-6)" />
          <Text size="sm" c="dimmed">
            {placeholder}
          </Text>
        </Group>
      </Paper>
    );
  }

  return (
    <Box>
      {!isExpanded ? (
        <Paper
          p="md"
          withBorder
          style={{
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={handleExpand}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Group gap="sm">
            <IconPlus size="1.2rem" color="var(--mantine-color-blue-6)" />
            <Text size="sm" c="dimmed">
              {placeholder}
            </Text>
          </Group>
        </Paper>
      ) : (
        <Paper p="md" withBorder>
          <Stack gap="md">
            {/* Note Type Selector */}
            {showTypeSelector && (
              <Group gap="xs">
                <Text size="xs" c="dimmed" fw={500}>
                  Type:
                </Text>
                {noteTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = note.type === type.value;
                  
                  return (
                    <Tooltip key={type.value} label={type.label}>
                      <ActionIcon
                        variant={isSelected ? 'filled' : 'subtle'}
                        color={isSelected ? type.color : 'gray'}
                        size="sm"
                        onClick={() => setNote(prev => ({ ...prev, type: type.value }))}
                      >
                        <Icon size="0.8rem" />
                      </ActionIcon>
                    </Tooltip>
                  );
                })}
                {selectedNoteType && (
                  <Badge size="xs" color={selectedNoteType.color} variant="light">
                    {selectedNoteType.label}
                  </Badge>
                )}
              </Group>
            )}

            {/* Content Input */}
            <Textarea
              ref={textareaRef}
              placeholder={placeholder}
              value={note.content}
              onChange={(e) => setNote(prev => ({ ...prev, content: e.target.value }))}
              onKeyDown={handleKeyDown}
              autosize
              minRows={3}
              maxRows={8}
              autoFocus={autoFocus}
            />

            {/* Actions */}
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                Press Ctrl+Enter to save, Esc to cancel
              </Text>
              
              <Group gap="xs">
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={handleCollapse}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  size="xs"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  leftSection={<IconCheck size="0.8rem" />}
                  disabled={!note.content.trim()}
                >
                  Save Note
                </Button>
              </Group>
            </Group>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
