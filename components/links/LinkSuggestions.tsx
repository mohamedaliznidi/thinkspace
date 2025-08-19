/**
 * Link Suggestions Component for ThinkSpace
 * 
 * Automatically suggests potential links between items based on content similarity,
 * shared tags, and relationship patterns.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Button,
  Badge,
  ActionIcon,
  Tooltip,
  Loader,
  Alert,
  Progress,
  Collapse,
  Divider,
} from '@mantine/core';
import {
  IconBulb,
  IconLink,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconTarget,
  IconMap,
  IconBookmark,
  IconNote,
  IconTags,
  IconBrain,
  IconClock,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getParaColor } from '@/lib/theme';

// Suggestion interface
interface LinkSuggestion {
  id: string;
  targetType: string;
  targetId: string;
  targetItem: any;
  suggestionType: 'semantic' | 'tags' | 'pattern' | 'temporal';
  confidence: number;
  reason: string;
  suggestedLinkType: string;
  metadata?: any;
}

interface LinkSuggestionsProps {
  itemType: 'project' | 'area' | 'resource' | 'note';
  itemId: string;
  itemTitle: string;
  itemTags?: string[];
  itemContent?: string;
  onLinkCreated?: () => void;
  maxSuggestions?: number;
}

export function LinkSuggestions({
  itemType,
  itemId,
  itemTitle,
  itemTags = [],
  itemContent = '',
  onLinkCreated,
  maxSuggestions = 10,
}: LinkSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  // Load suggestions
  const loadSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      // This would call a suggestions API endpoint
      // For now, we'll simulate suggestions based on the current item
      const mockSuggestions = await generateMockSuggestions();
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [itemType, itemId, itemTags, itemContent]);

  // Generate mock suggestions (in a real app, this would be an API call)
  const generateMockSuggestions = async (): Promise<LinkSuggestion[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockSuggestions: LinkSuggestion[] = [];

    // Semantic suggestions based on content
    if (itemContent) {
      mockSuggestions.push({
        id: 'semantic-1',
        targetType: 'resource',
        targetId: 'mock-resource-1',
        targetItem: {
          id: 'mock-resource-1',
          title: 'Related Research Paper',
          description: 'A research paper with similar concepts',
          type: 'DOCUMENT',
        },
        suggestionType: 'semantic',
        confidence: 0.85,
        reason: 'High semantic similarity in content',
        suggestedLinkType: 'REFERENCES',
      });
    }

    // Tag-based suggestions
    if (itemTags.length > 0) {
      mockSuggestions.push({
        id: 'tags-1',
        targetType: 'project',
        targetId: 'mock-project-1',
        targetItem: {
          id: 'mock-project-1',
          title: 'Related Project',
          description: 'A project with shared tags',
          status: 'IN_PROGRESS',
        },
        suggestionType: 'tags',
        confidence: 0.75,
        reason: `Shares tags: ${itemTags.slice(0, 2).join(', ')}`,
        suggestedLinkType: 'RELATED',
      });
    }

    // Pattern-based suggestions
    mockSuggestions.push({
      id: 'pattern-1',
      targetType: 'area',
      targetId: 'mock-area-1',
      targetItem: {
        id: 'mock-area-1',
        title: 'Related Area',
        description: 'An area commonly linked with similar items',
        type: 'RESPONSIBILITY',
      },
      suggestionType: 'pattern',
      confidence: 0.65,
      reason: 'Commonly linked with similar items',
      suggestedLinkType: 'PART_OF',
    });

    // Temporal suggestions (recently created/modified items)
    mockSuggestions.push({
      id: 'temporal-1',
      targetType: 'note',
      targetId: 'mock-note-1',
      targetItem: {
        id: 'mock-note-1',
        title: 'Recent Note',
        description: 'A recently created note',
        type: 'QUICK',
      },
      suggestionType: 'temporal',
      confidence: 0.55,
      reason: 'Recently created in the same timeframe',
      suggestedLinkType: 'RELATED',
    });

    return mockSuggestions.slice(0, maxSuggestions);
  };

  // Load suggestions when component mounts
  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  // Create a link from suggestion
  const handleCreateLink = async (suggestion: LinkSuggestion) => {
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: itemType,
          sourceId: itemId,
          targetType: suggestion.targetType,
          targetId: suggestion.targetId,
          linkType: suggestion.suggestedLinkType,
          strength: suggestion.confidence,
          description: `Auto-suggested: ${suggestion.reason}`,
          bidirectional: true,
        }),
      });

      if (response.ok) {
        notifications.show({
          title: 'Link Created',
          message: `Successfully linked to ${suggestion.targetItem.title}`,
          color: 'green',
        });
        
        // Remove suggestion from list
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
        onLinkCreated?.();
      } else {
        const errorData = await response.json();
        notifications.show({
          title: 'Error',
          message: errorData.error || 'Failed to create link',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Error creating link:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to create link',
        color: 'red',
      });
    }
  };

  // Dismiss a suggestion
  const handleDismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  // Get icon for suggestion type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'semantic': return <IconBrain size="1rem" />;
      case 'tags': return <IconTags size="1rem" />;
      case 'pattern': return <IconLink size="1rem" />;
      case 'temporal': return <IconClock size="1rem" />;
      default: return <IconBulb size="1rem" />;
    }
  };

  // Get icon for content type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project': return <IconTarget size="1rem" />;
      case 'area': return <IconMap size="1rem" />;
      case 'resource': return <IconBookmark size="1rem" />;
      case 'note': return <IconNote size="1rem" />;
      default: return <IconLink size="1rem" />;
    }
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'project': return getParaColor('projects');
      case 'area': return getParaColor('areas');
      case 'resource': return getParaColor('resources');
      case 'note': return getParaColor('notes');
      default: return 'gray';
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'yellow';
    return 'orange';
  };

  const visibleSuggestions = suggestions.filter(s => !dismissedSuggestions.has(s.id));

  if (visibleSuggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <Card withBorder p="md">
      <Group justify="space-between" mb="md">
        <Group>
          <IconBulb size="1.2rem" color="orange" />
          <Text fw={600}>Link Suggestions</Text>
          {visibleSuggestions.length > 0 && (
            <Badge size="sm" variant="light" color="orange">
              {visibleSuggestions.length}
            </Badge>
          )}
        </Group>
        
        <ActionIcon
          variant="subtle"
          onClick={() => setShowSuggestions(!showSuggestions)}
        >
          {showSuggestions ? <IconChevronUp size="1rem" /> : <IconChevronDown size="1rem" />}
        </ActionIcon>
      </Group>

      <Collapse in={showSuggestions}>
        <Stack gap="md">
          {isLoading ? (
            <Group>
              <Loader size="sm" />
              <Text size="sm" c="dimmed">Finding potential links...</Text>
            </Group>
          ) : visibleSuggestions.length === 0 ? (
            <Alert color="blue">
              No link suggestions available at this time.
            </Alert>
          ) : (
            <Stack gap="xs">
              {visibleSuggestions.map((suggestion) => (
                <Card key={suggestion.id} withBorder p="sm" bg="gray.0">
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <Badge
                        size="sm"
                        variant="light"
                        color={getTypeColor(suggestion.targetType)}
                        leftSection={getTypeIcon(suggestion.targetType)}
                      >
                        {suggestion.targetType}
                      </Badge>
                      <Text fw={500} size="sm">
                        {suggestion.targetItem.title}
                      </Text>
                    </Group>
                    
                    <Group gap="xs">
                      <Tooltip label={`${(suggestion.confidence * 100).toFixed(0)}% confidence`}>
                        <Progress
                          value={suggestion.confidence * 100}
                          size="sm"
                          w={60}
                          color={getConfidenceColor(suggestion.confidence)}
                        />
                      </Tooltip>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="red"
                        onClick={() => handleDismissSuggestion(suggestion.id)}
                      >
                        <IconX size="0.8rem" />
                      </ActionIcon>
                    </Group>
                  </Group>

                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Group gap="xs" mb="xs">
                        <Badge
                          size="xs"
                          variant="outline"
                          leftSection={getSuggestionIcon(suggestion.suggestionType)}
                        >
                          {suggestion.suggestionType}
                        </Badge>
                        <Badge size="xs" variant="light">
                          {suggestion.suggestedLinkType}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {suggestion.reason}
                      </Text>
                    </div>
                    
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconLink size="0.8rem" />}
                      onClick={() => handleCreateLink(suggestion)}
                    >
                      Link
                    </Button>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}

          {visibleSuggestions.length > 0 && (
            <>
              <Divider />
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Suggestions are based on content similarity, shared tags, and usage patterns
                </Text>
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={loadSuggestions}
                  loading={isLoading}
                >
                  Refresh
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Collapse>
    </Card>
  );
}
