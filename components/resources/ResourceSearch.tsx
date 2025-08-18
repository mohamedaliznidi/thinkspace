/**
 * Resource Search Component
 *
 * Advanced search interface with suggestions, filters,
 * and semantic search capabilities.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  IconSearch,
  IconX,
  IconClock,
  IconTag,
  IconFolder,
  IconFile
} from '@tabler/icons-react';
import {
  TextInput,
  ActionIcon,
  Badge,
  Popover,
  Stack,
  Group,
  Text,
  Loader,
  Button,
  Paper,
  UnstyledButton
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';

interface SearchSuggestion {
  suggestion: string;
  type: 'tag' | 'title' | 'topic' | 'folder';
  count?: number;
}

interface ResourceSearchProps {
  query: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  showSuggestions?: boolean;
  recentSearches?: string[];
  onRecentSearchSelect?: (search: string) => void;
}

export function ResourceSearch({
  query,
  onSearch,
  placeholder = "Search resources...",
  showSuggestions = true,
  recentSearches = [],
  onRecentSearchSelect,
}: ResourceSearchProps) {
  const [inputValue, setInputValue] = useState(query);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestionsPopover, setShowSuggestionsPopover] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the input value for API calls
  const [debouncedQuery] = useDebouncedValue(inputValue, 300);

  // Update input when external query changes
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2 && showSuggestions) {
      fetchSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery, showSuggestions]);

  const fetchSuggestions = async (searchQuery: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/resources/search?searchType=suggestions&query=${encodeURIComponent(searchQuery)}&limit=8`
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (value.length >= 2) {
      setShowSuggestionsPopover(true);
    } else {
      setShowSuggestionsPopover(false);
    }
  };

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || inputValue;
    onSearch(finalQuery);
    setShowSuggestionsPopover(false);

    if (finalQuery && !recentSearches.includes(finalQuery)) {
      // Add to recent searches (would be implemented with local storage or API)
    }
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setInputValue(suggestion.suggestion);
    handleSearch(suggestion.suggestion);
  };

  const handleRecentSearchSelect = (search: string) => {
    setInputValue(search);
    handleSearch(search);
    onRecentSearchSelect?.(search);
  };

  const clearSearch = () => {
    setInputValue('');
    onSearch('');
    setShowSuggestionsPopover(false);
    inputRef.current?.focus();
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'tag':
        return <IconTag size={16} />;
      case 'folder':
        return <IconFolder size={16} />;
      case 'title':
        return <IconFile size={16} />;
      case 'topic':
        return <IconTag size={16} />;
      default:
        return <IconSearch size={16} />;
    }
  };

  const getSuggestionTypeLabel = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'tag':
        return 'Tag';
      case 'folder':
        return 'Folder';
      case 'title':
        return 'Resource';
      case 'topic':
        return 'Topic';
      default:
        return '';
    }
  };

  return (
    <Popover
      opened={showSuggestionsPopover}
      onClose={() => setShowSuggestionsPopover(false)}
      position="bottom-start"
      width="target"
      shadow="md"
    >
      <Popover.Target>
        <TextInput
          ref={inputRef}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => handleInputChange(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            } else if (e.key === 'Escape') {
              setShowSuggestionsPopover(false);
            }
          }}
          onFocus={() => {
            if (inputValue.length >= 2 || recentSearches.length > 0) {
              setShowSuggestionsPopover(true);
            }
          }}
          leftSection={<IconSearch size={16} />}
          rightSection={
            inputValue ? (
              <ActionIcon
                variant="subtle"
                onClick={clearSearch}
                size="sm"
              >
                <IconX size={14} />
              </ActionIcon>
            ) : null
          }
        />
      </Popover.Target>

      <Popover.Dropdown>
        <Paper p="xs">
          <Stack gap="xs">
            {/* Recent Searches */}
            {recentSearches.length > 0 && !inputValue && (
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Recent Searches</Text>
                {recentSearches.slice(0, 5).map((search, index) => (
                  <UnstyledButton
                    key={index}
                    onClick={() => handleRecentSearchSelect(search)}
                    p="xs"
                    style={{ borderRadius: 4 }}
                    className="hover:bg-gray-50"
                  >
                    <Group gap="xs">
                      <IconClock size={16} color="gray" />
                      <Text size="sm">{search}</Text>
                    </Group>
                  </UnstyledButton>
                ))}
              </Stack>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Suggestions</Text>
                {suggestions.map((suggestion, index) => (
                  <UnstyledButton
                    key={index}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    p="xs"
                    style={{ borderRadius: 4 }}
                    className="hover:bg-gray-50"
                  >
                    <Group justify="space-between">
                      <Group gap="xs">
                        {getSuggestionIcon(suggestion.type)}
                        <Text size="sm">{suggestion.suggestion}</Text>
                      </Group>
                      <Group gap="xs">
                        {suggestion.count && (
                          <Badge size="xs" variant="light">
                            {suggestion.count}
                          </Badge>
                        )}
                        <Badge size="xs" variant="outline">
                          {getSuggestionTypeLabel(suggestion.type)}
                        </Badge>
                      </Group>
                    </Group>
                  </UnstyledButton>
                ))}
              </Stack>
            )}

            {/* Loading State */}
            {loading && (
              <Group gap="xs" p="xs">
                <Loader size="sm" />
                <Text size="sm">Searching...</Text>
              </Group>
            )}

            {/* Empty State */}
            {!loading && inputValue.length >= 2 && suggestions.length === 0 && (
              <Stack align="center" gap="xs" p="md">
                <IconSearch size={32} color="gray" />
                <Text size="sm" c="dimmed">No suggestions found</Text>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => handleSearch()}
                >
                  Search for "{inputValue}"
                </Button>
              </Stack>
            )}

            {/* Search Action */}
            {inputValue && (
              <UnstyledButton
                onClick={() => handleSearch()}
                p="xs"
                style={{ borderRadius: 4 }}
                className="hover:bg-gray-50"
              >
                <Group gap="xs">
                  <IconSearch size={16} />
                  <Text size="sm">Search for "{inputValue}"</Text>
                </Group>
              </UnstyledButton>
            )}
          </Stack>
        </Paper>
      </Popover.Dropdown>
    </Popover>
  );
}
