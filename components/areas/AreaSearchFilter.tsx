/**
 * Area Search and Filter Component for ThinkSpace
 * 
 * Advanced search and filtering interface for areas with
 * multiple filter criteria, saved searches, and quick filters.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Group,
  TextInput,
  Select,
  MultiSelect,
  Button,
  ActionIcon,
  Menu,
  Badge,
  Collapse,
  Stack,
  Grid,
  RangeSlider,
  Switch,
  Paper,
  Text,
  Tooltip,
  Chip,
} from '@mantine/core';
import {
  IconSearch,
  IconFilter,
  IconX,
  IconBookmark,
  IconChevronDown,
  IconAdjustments,
  IconStar,
  IconClock,
  IconTarget,
} from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';

interface AreaFilters {
  search: string;
  types: string[];
  responsibilityLevels: string[];
  reviewFrequencies: string[];
  healthScoreRange: [number, number];
  isActive: boolean | null;
  hasRecentActivity: boolean | null;
  isReviewOverdue: boolean | null;
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AreaSearchFilterProps {
  filters: AreaFilters;
  onFiltersChange: (filters: AreaFilters) => void;
  availableTags?: string[];
  showAdvanced?: boolean;
  compact?: boolean;
}

const areaTypes = [
  { value: 'RESPONSIBILITY', label: 'Responsibility' },
  { value: 'INTEREST', label: 'Interest' },
  { value: 'LEARNING', label: 'Learning' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'CAREER', label: 'Career' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'OTHER', label: 'Other' },
];

const responsibilityLevels = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

const reviewFrequencies = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Bi-weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'BIANNUALLY', label: 'Bi-annually' },
  { value: 'ANNUALLY', label: 'Annually' },
  { value: 'CUSTOM', label: 'Custom' },
];

const sortOptions = [
  { value: 'title', label: 'Title' },
  { value: 'healthScore', label: 'Health Score' },
  { value: 'lastReviewedAt', label: 'Last Review' },
  { value: 'nextReviewDate', label: 'Next Review' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
  { value: 'responsibilityLevel', label: 'Priority Level' },
];

const quickFilters = [
  { key: 'highPriority', label: 'High Priority', icon: IconTarget },
  { key: 'reviewOverdue', label: 'Review Overdue', icon: IconClock },
  { key: 'lowHealth', label: 'Needs Attention', icon: IconAdjustments },
  { key: 'favorites', label: 'Favorites', icon: IconStar },
];

export default function AreaSearchFilter({
  filters,
  onFiltersChange,
  availableTags = [],
  showAdvanced = true,
  compact = false,
}: AreaSearchFilterProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [debouncedSearch] = useDebouncedValue(filters.search, 300);

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch]);

  const handleFilterChange = useCallback((key: keyof AreaFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  const handleQuickFilter = useCallback((filterKey: string) => {
    const newFilters = { ...filters };
    
    switch (filterKey) {
      case 'highPriority':
        newFilters.responsibilityLevels = newFilters.responsibilityLevels.includes('HIGH') 
          ? newFilters.responsibilityLevels.filter(l => l !== 'HIGH')
          : [...newFilters.responsibilityLevels, 'HIGH'];
        break;
      case 'reviewOverdue':
        newFilters.isReviewOverdue = newFilters.isReviewOverdue === true ? null : true;
        break;
      case 'lowHealth':
        newFilters.healthScoreRange = newFilters.healthScoreRange[1] < 0.6 
          ? [0, 1] 
          : [0, 0.6];
        break;
      case 'favorites':
        // This would need to be implemented based on your favorites system
        break;
    }
    
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    onFiltersChange({
      search: '',
      types: [],
      responsibilityLevels: [],
      reviewFrequencies: [],
      healthScoreRange: [0, 1],
      isActive: null,
      hasRecentActivity: null,
      isReviewOverdue: null,
      tags: [],
      sortBy: 'title',
      sortOrder: 'asc',
    });
  }, [onFiltersChange]);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.types.length > 0) count++;
    if (filters.responsibilityLevels.length > 0) count++;
    if (filters.reviewFrequencies.length > 0) count++;
    if (filters.healthScoreRange[0] > 0 || filters.healthScoreRange[1] < 1) count++;
    if (filters.isActive !== null) count++;
    if (filters.hasRecentActivity !== null) count++;
    if (filters.isReviewOverdue !== null) count++;
    if (filters.tags.length > 0) count++;
    return count;
  }, [filters]);

  const activeFiltersCount = getActiveFiltersCount();

  if (compact) {
    return (
      <Group gap="sm">
        <TextInput
          placeholder="Search areas..."
          leftSection={<IconSearch size="1rem" />}
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          style={{ flex: 1 }}
        />
        
        <Menu shadow="md" width={300}>
          <Menu.Target>
            <ActionIcon variant="subtle" size="lg">
              <IconFilter size="1rem" />
              {activeFiltersCount > 0 && (
                <Badge
                  size="xs"
                  color="blue"
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    minWidth: 16,
                    height: 16,
                    padding: 0,
                    fontSize: '0.6rem',
                  }}
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Stack gap="sm" p="sm">
              <MultiSelect
                label="Types"
                data={areaTypes}
                value={filters.types}
                onChange={(value) => handleFilterChange('types', value)}
                size="xs"
              />
              <MultiSelect
                label="Priority"
                data={responsibilityLevels}
                value={filters.responsibilityLevels}
                onChange={(value) => handleFilterChange('responsibilityLevels', value)}
                size="xs"
              />
              <Button size="xs" variant="subtle" onClick={clearFilters}>
                Clear Filters
              </Button>
            </Stack>
          </Menu.Dropdown>
        </Menu>
      </Group>
    );
  }

  return (
    <Stack gap="md">
      {/* Main Search and Quick Filters */}
      <Group gap="md">
        <TextInput
          placeholder="Search areas by title, description, or tags..."
          leftSection={<IconSearch size="1rem" />}
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          style={{ flex: 1 }}
          rightSection={
            filters.search && (
              <ActionIcon
                variant="subtle"
                onClick={() => handleFilterChange('search', '')}
              >
                <IconX size="1rem" />
              </ActionIcon>
            )
          }
        />

        {showAdvanced && (
          <Button
            variant="subtle"
            leftSection={<IconFilter size="1rem" />}
            rightSection={<IconChevronDown size="1rem" />}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            Filters
            {activeFiltersCount > 0 && (
              <Badge size="xs" color="blue" ml="xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        )}
      </Group>

      {/* Quick Filters */}
      <Group gap="xs">
        {quickFilters.map((filter) => {
          const Icon = filter.icon;
          const isActive = (() => {
            switch (filter.key) {
              case 'highPriority':
                return filters.responsibilityLevels.includes('HIGH');
              case 'reviewOverdue':
                return filters.isReviewOverdue === true;
              case 'lowHealth':
                return filters.healthScoreRange[1] < 0.6;
              default:
                return false;
            }
          })();

          return (
            <Chip
              key={filter.key}
              checked={isActive}
              onChange={() => handleQuickFilter(filter.key)}
              size="sm"
              variant="light"
            >
              <Group gap="xs">
                <Icon size="0.8rem" />
                {filter.label}
              </Group>
            </Chip>
          );
        })}
      </Group>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Collapse in={showAdvancedFilters}>
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <MultiSelect
                    label="Area Types"
                    data={areaTypes}
                    value={filters.types}
                    onChange={(value) => handleFilterChange('types', value)}
                    placeholder="All types"
                    clearable
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <MultiSelect
                    label="Priority Levels"
                    data={responsibilityLevels}
                    value={filters.responsibilityLevels}
                    onChange={(value) => handleFilterChange('responsibilityLevels', value)}
                    placeholder="All levels"
                    clearable
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <MultiSelect
                    label="Review Frequency"
                    data={reviewFrequencies}
                    value={filters.reviewFrequencies}
                    onChange={(value) => handleFilterChange('reviewFrequencies', value)}
                    placeholder="All frequencies"
                    clearable
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Select
                    label="Sort By"
                    data={sortOptions}
                    value={filters.sortBy}
                    onChange={(value) => handleFilterChange('sortBy', value || 'title')}
                  />
                </Grid.Col>
              </Grid>

              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Text size="sm" fw={500} mb="xs">
                    Health Score Range: {Math.round(filters.healthScoreRange[0] * 100)}% - {Math.round(filters.healthScoreRange[1] * 100)}%
                  </Text>
                  <RangeSlider
                    value={filters.healthScoreRange}
                    onChange={(value) => {
                      // When range=true, value is always [number, number]
                      handleFilterChange('healthScoreRange', value);
                    }}
                    min={0}
                    max={1}
                    step={0.1}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 0.5, label: '50%' },
                      { value: 1, label: '100%' },
                    ]}
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Switch
                      label="Active areas only"
                      checked={filters.isActive === true}
                      onChange={(e) => handleFilterChange('isActive', e.target.checked ? true : null)}
                    />
                    <Switch
                      label="Recent activity"
                      checked={filters.hasRecentActivity === true}
                      onChange={(e) => handleFilterChange('hasRecentActivity', e.target.checked ? true : null)}
                    />
                    <Switch
                      label="Review overdue"
                      checked={filters.isReviewOverdue === true}
                      onChange={(e) => handleFilterChange('isReviewOverdue', e.target.checked ? true : null)}
                    />
                  </Stack>
                </Grid.Col>
              </Grid>

              {availableTags.length > 0 && (
                <MultiSelect
                  label="Tags"
                  data={availableTags}
                  value={filters.tags}
                  onChange={(value) => handleFilterChange('tags', value)}
                  placeholder="Filter by tags"
                  searchable
                  clearable
                />
              )}

              <Group justify="flex-end">
                <Button variant="subtle" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Collapse>
      )}
    </Stack>
  );
}
