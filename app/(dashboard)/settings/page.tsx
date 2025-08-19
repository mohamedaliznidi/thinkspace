/**
 * Settings Page for ThinkSpace
 * 
 * Comprehensive settings interface with unified user preferences,
 * data consistency controls, and system configuration.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Tabs,
  Card,
  Group,
  Switch,
  Select,
  Slider,
  Button,
  Textarea,
  Alert,
  Badge,
  Divider,
  Grid,
  ActionIcon,
  Tooltip,
  NumberInput,
} from '@mantine/core';
import {
  IconPalette,
  IconLayout,
  IconSearch,
  IconBell,
  IconDatabase,
  IconRefresh,
  IconShield,
  IconAccessible,
  IconCode,
  IconDownload,
  IconUpload,
  IconCheck,
  IconAlertTriangle,
  IconChartBar,
  IconTags,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { 
  usePreferences,
  useDisplayPreferences,
  useLayoutPreferences,
  useSearchPreferences,
  useNotificationPreferences,
  useParaPreferences,
  useSyncPreferences,
} from '@/lib/userPreferences';
import { RealtimeStatus } from '@/components/realtime/RealtimeStatus';
import { PerformanceDashboard } from '@/components/performance/PerformanceDashboard';
import { UniversalTagManager } from '@/components/tags/UniversalTagManager';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('display');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [tagManagerOpened, setTagManagerOpened] = useState(false);

  const {
    syncPreferences,
    loadPreferences,
    exportPreferences,
    importPreferences,
    resetPreferences,
    resetCategory,
  } = usePreferences();

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Auto-save preferences
  const handleSave = async () => {
    setIsLoading(true);
    try {
      await syncPreferences();
      setLastSaved(new Date());
      notifications.show({
        title: 'Settings Saved',
        message: 'Your preferences have been synchronized',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Save Failed',
        message: 'Failed to save preferences',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Export preferences
  const handleExport = () => {
    const data = exportPreferences();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thinkspace-preferences-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import preferences
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      if (importPreferences(data)) {
        notifications.show({
          title: 'Import Successful',
          message: 'Preferences have been imported',
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Import Failed',
          message: 'Invalid preferences file',
          color: 'red',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <Container size="xl" py="xl">
        <Stack gap="xl">
        {/* Header */}
        <div>
          <Group justify="space-between" mb="md">
            <div>
              <Title order={1} size="h2" mb="xs">
                Settings
              </Title>
              <Text c="dimmed" size="lg">
                Customize your ThinkSpace experience
              </Text>
            </div>
            
            <Group>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
                id="import-preferences"
              />

              <Tooltip label="Manage Tags">
                <ActionIcon
                  variant="light"
                  size="lg"
                  onClick={() => setTagManagerOpened(true)}
                >
                  <IconTags size="1.2rem" />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Import preferences">
                <ActionIcon
                  variant="light"
                  size="lg"
                  onClick={() => document.getElementById('import-preferences')?.click()}
                >
                  <IconUpload size="1.2rem" />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Export preferences">
                <ActionIcon variant="light" size="lg" onClick={handleExport}>
                  <IconDownload size="1.2rem" />
                </ActionIcon>
              </Tooltip>

              <Button
                leftSection={<IconCheck size="1rem" />}
                onClick={handleSave}
                loading={isLoading}
              >
                Save Changes
              </Button>
            </Group>
          </Group>

          {/* Last saved indicator */}
          {lastSaved && (
            <Alert color="green" variant="light" mb="md">
              <Group>
                <IconCheck size="1rem" />
                <Text size="sm">
                  Last saved: {lastSaved.toLocaleString()}
                </Text>
              </Group>
            </Alert>
          )}
        </div>

        {/* Real-time Status */}
        <RealtimeStatus />

        {/* Settings Tabs */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'display')} variant="outline">
          <Tabs.List>
            <Tabs.Tab value="display" leftSection={<IconPalette size="1rem" />}>
              Display
            </Tabs.Tab>
            <Tabs.Tab value="layout" leftSection={<IconLayout size="1rem" />}>
              Layout
            </Tabs.Tab>
            <Tabs.Tab value="search" leftSection={<IconSearch size="1rem" />}>
              Search
            </Tabs.Tab>
            <Tabs.Tab value="notifications" leftSection={<IconBell size="1rem" />}>
              Notifications
            </Tabs.Tab>
            <Tabs.Tab value="para" leftSection={<IconDatabase size="1rem" />}>
              PARA
            </Tabs.Tab>
            <Tabs.Tab value="sync" leftSection={<IconRefresh size="1rem" />}>
              Sync
            </Tabs.Tab>
            <Tabs.Tab value="privacy" leftSection={<IconShield size="1rem" />}>
              Privacy
            </Tabs.Tab>
            <Tabs.Tab value="accessibility" leftSection={<IconAccessible size="1rem" />}>
              Accessibility
            </Tabs.Tab>
            <Tabs.Tab value="advanced" leftSection={<IconCode size="1rem" />}>
              Advanced
            </Tabs.Tab>
            <Tabs.Tab value="performance" leftSection={<IconChartBar size="1rem" />}>
              Performance
            </Tabs.Tab>
          </Tabs.List>

          {/* Display Settings */}
          <Tabs.Panel value="display" pt="md">
            <DisplaySettings />
          </Tabs.Panel>

          {/* Layout Settings */}
          <Tabs.Panel value="layout" pt="md">
            <LayoutSettings />
          </Tabs.Panel>

          {/* Search Settings */}
          <Tabs.Panel value="search" pt="md">
            <SearchSettings />
          </Tabs.Panel>

          {/* Notification Settings */}
          <Tabs.Panel value="notifications" pt="md">
            <NotificationSettings />
          </Tabs.Panel>

          {/* PARA Settings */}
          <Tabs.Panel value="para" pt="md">
            <ParaSettings />
          </Tabs.Panel>

          {/* Sync Settings */}
          <Tabs.Panel value="sync" pt="md">
            <SyncSettings />
          </Tabs.Panel>

          {/* Privacy Settings */}
          <Tabs.Panel value="privacy" pt="md">
            <PrivacySettings />
          </Tabs.Panel>

          {/* Accessibility Settings */}
          <Tabs.Panel value="accessibility" pt="md">
            <AccessibilitySettings />
          </Tabs.Panel>

          {/* Advanced Settings */}
          <Tabs.Panel value="advanced" pt="md">
            <AdvancedSettings />
          </Tabs.Panel>

          {/* Performance Dashboard */}
          <Tabs.Panel value="performance" pt="md">
            <PerformanceDashboard showAdvanced={true} />
          </Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>

      {/* Universal Tag Manager Modal */}
      <UniversalTagManager
        opened={tagManagerOpened}
        onClose={() => setTagManagerOpened(false)}
        mode="analytics"
        onTagsUpdated={() => {
          // Handle tag updates if needed
          console.log('Tags updated');
        }}
      />
    </>
  );
}

// Display Settings Component
function DisplaySettings() {
  const { theme, colorScheme, density, fontSize, showAnimations, showTooltips, update } = useDisplayPreferences();

  return (
    <Stack gap="md">
      <Card withBorder p="md">
        <Stack gap="md">
          <Text fw={600}>Appearance</Text>
          
          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Theme"
                value={theme}
                onChange={(value) => update({ theme: value as any })}
                data={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'auto', label: 'Auto (System)' },
                ]}
              />
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Select
                label="Color Scheme"
                value={colorScheme}
                onChange={(value) => update({ colorScheme: value as any })}
                data={[
                  { value: 'default', label: 'Default' },
                  { value: 'colorful', label: 'Colorful' },
                  { value: 'minimal', label: 'Minimal' },
                ]}
              />
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Select
                label="Density"
                value={density}
                onChange={(value) => update({ density: value as any })}
                data={[
                  { value: 'compact', label: 'Compact' },
                  { value: 'comfortable', label: 'Comfortable' },
                  { value: 'spacious', label: 'Spacious' },
                ]}
              />
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Select
                label="Font Size"
                value={fontSize}
                onChange={(value) => update({ fontSize: value as any })}
                data={[
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'large', label: 'Large' },
                ]}
              />
            </Grid.Col>
          </Grid>

          <Divider />

          <Group justify="space-between">
            <div>
              <Text fw={500}>Show Animations</Text>
              <Text size="sm" c="dimmed">Enable smooth transitions and animations</Text>
            </div>
            <Switch
              checked={showAnimations}
              onChange={(e) => update({ showAnimations: e.currentTarget.checked })}
            />
          </Group>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Show Tooltips</Text>
              <Text size="sm" c="dimmed">Display helpful tooltips on hover</Text>
            </div>
            <Switch
              checked={showTooltips}
              onChange={(e) => update({ showTooltips: e.currentTarget.checked })}
            />
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}

// Layout Settings Component
function LayoutSettings() {
  const { 
    sidebarCollapsed, 
    sidebarWidth, 
    showQuickActions, 
    showRecentItems, 
    defaultView, 
    itemsPerPage, 
    update 
  } = useLayoutPreferences();

  return (
    <Stack gap="md">
      <Card withBorder p="md">
        <Stack gap="md">
          <Text fw={600}>Layout Configuration</Text>
          
          <Group justify="space-between">
            <div>
              <Text fw={500}>Collapse Sidebar</Text>
              <Text size="sm" c="dimmed">Start with sidebar collapsed</Text>
            </div>
            <Switch
              checked={sidebarCollapsed}
              onChange={(e) => update({ sidebarCollapsed: e.currentTarget.checked })}
            />
          </Group>

          <div>
            <Text fw={500} mb="xs">Sidebar Width: {sidebarWidth}px</Text>
            <Slider
              value={sidebarWidth}
              onChange={(value) => update({ sidebarWidth: value })}
              min={200}
              max={500}
              step={20}
              marks={[
                { value: 200, label: '200px' },
                { value: 350, label: '350px' },
                { value: 500, label: '500px' },
              ]}
            />
          </div>

          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Default View"
                value={defaultView}
                onChange={(value) => update({ defaultView: value as any })}
                data={[
                  { value: 'grid', label: 'Grid' },
                  { value: 'list', label: 'List' },
                  { value: 'kanban', label: 'Kanban' },
                ]}
              />
            </Grid.Col>
            
            <Grid.Col span={6}>
              <NumberInput
                label="Items Per Page"
                value={itemsPerPage}
                onChange={(value) => update({ itemsPerPage: typeof value === 'number' ? value : 20 })}
                min={10}
                max={100}
                step={10}
              />
            </Grid.Col>
          </Grid>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Show Quick Actions</Text>
              <Text size="sm" c="dimmed">Display quick action buttons</Text>
            </div>
            <Switch
              checked={showQuickActions}
              onChange={(e) => update({ showQuickActions: e.currentTarget.checked })}
            />
          </Group>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Show Recent Items</Text>
              <Text size="sm" c="dimmed">Display recently accessed items</Text>
            </div>
            <Switch
              checked={showRecentItems}
              onChange={(e) => update({ showRecentItems: e.currentTarget.checked })}
            />
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}

// Search Settings Component
function SearchSettings() {
  const { 
    defaultSearchType, 
    includeArchived, 
    maxResults, 
    saveSearchHistory, 
    showSuggestions, 
    update 
  } = useSearchPreferences();

  return (
    <Stack gap="md">
      <Card withBorder p="md">
        <Stack gap="md">
          <Text fw={600}>Search Configuration</Text>
          
          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Default Search Type"
                value={defaultSearchType}
                onChange={(value) => update({ defaultSearchType: value as any })}
                data={[
                  { value: 'text', label: 'Text Search' },
                  { value: 'semantic', label: 'Semantic Search' },
                  { value: 'hybrid', label: 'Hybrid Search' },
                ]}
              />
            </Grid.Col>
            
            <Grid.Col span={6}>
              <NumberInput
                label="Max Results"
                value={maxResults}
                onChange={(value) => update({ maxResults: typeof value === 'number' ? value : 50 })}
                min={10}
                max={200}
                step={10}
              />
            </Grid.Col>
          </Grid>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Include Archived Items</Text>
              <Text size="sm" c="dimmed">Search archived content by default</Text>
            </div>
            <Switch
              checked={includeArchived}
              onChange={(e) => update({ includeArchived: e.currentTarget.checked })}
            />
          </Group>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Save Search History</Text>
              <Text size="sm" c="dimmed">Remember your search queries</Text>
            </div>
            <Switch
              checked={saveSearchHistory}
              onChange={(e) => update({ saveSearchHistory: e.currentTarget.checked })}
            />
          </Group>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Show Suggestions</Text>
              <Text size="sm" c="dimmed">Display search suggestions as you type</Text>
            </div>
            <Switch
              checked={showSuggestions}
              onChange={(e) => update({ showSuggestions: e.currentTarget.checked })}
            />
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}

// Notification Settings Component
function NotificationSettings() {
  const { 
    enabled, 
    realTimeUpdates, 
    conflictAlerts, 
    syncStatus, 
    emailNotifications, 
    pushNotifications, 
    update 
  } = useNotificationPreferences();

  return (
    <Stack gap="md">
      <Card withBorder p="md">
        <Stack gap="md">
          <Text fw={600}>Notification Preferences</Text>
          
          <Group justify="space-between">
            <div>
              <Text fw={500}>Enable Notifications</Text>
              <Text size="sm" c="dimmed">Master switch for all notifications</Text>
            </div>
            <Switch
              checked={enabled}
              onChange={(e) => update({ enabled: e.currentTarget.checked })}
            />
          </Group>

          <Divider />

          <Group justify="space-between">
            <div>
              <Text fw={500}>Real-time Updates</Text>
              <Text size="sm" c="dimmed">Notify about live changes</Text>
            </div>
            <Switch
              checked={realTimeUpdates}
              disabled={!enabled}
              onChange={(e) => update({ realTimeUpdates: e.currentTarget.checked })}
            />
          </Group>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Conflict Alerts</Text>
              <Text size="sm" c="dimmed">Alert when sync conflicts occur</Text>
            </div>
            <Switch
              checked={conflictAlerts}
              disabled={!enabled}
              onChange={(e) => update({ conflictAlerts: e.currentTarget.checked })}
            />
          </Group>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Sync Status</Text>
              <Text size="sm" c="dimmed">Show sync status notifications</Text>
            </div>
            <Switch
              checked={syncStatus}
              disabled={!enabled}
              onChange={(e) => update({ syncStatus: e.currentTarget.checked })}
            />
          </Group>

          <Divider />

          <Group justify="space-between">
            <div>
              <Text fw={500}>Email Notifications</Text>
              <Text size="sm" c="dimmed">Send notifications via email</Text>
            </div>
            <Switch
              checked={emailNotifications}
              disabled={!enabled}
              onChange={(e) => update({ emailNotifications: e.currentTarget.checked })}
            />
          </Group>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Push Notifications</Text>
              <Text size="sm" c="dimmed">Browser push notifications</Text>
            </div>
            <Switch
              checked={pushNotifications}
              disabled={!enabled}
              onChange={(e) => update({ pushNotifications: e.currentTarget.checked })}
            />
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}

// PARA Settings Component
function ParaSettings() {
  const { projects, areas, resources, notes, update } = useParaPreferences();

  return (
    <Stack gap="md">
      {/* Projects Settings */}
      <Card withBorder p="md">
        <Stack gap="md">
          <Text fw={600}>Projects</Text>
          
          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Default Status"
                value={projects.defaultStatus}
                onChange={(value) => update({ 
                  projects: { ...projects, defaultStatus: value || 'PLANNING' }
                })}
                data={[
                  { value: 'PLANNING', label: 'Planning' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'ON_HOLD', label: 'On Hold' },
                  { value: 'COMPLETED', label: 'Completed' },
                ]}
              />
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Select
                label="Default Priority"
                value={projects.defaultPriority}
                onChange={(value) => update({ 
                  projects: { ...projects, defaultPriority: value || 'MEDIUM' }
                })}
                data={[
                  { value: 'LOW', label: 'Low' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' },
                  { value: 'URGENT', label: 'Urgent' },
                ]}
              />
            </Grid.Col>
          </Grid>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Show Progress</Text>
              <Text size="sm" c="dimmed">Display progress indicators</Text>
            </div>
            <Switch
              checked={projects.showProgress}
              onChange={(e) => update({ 
                projects: { ...projects, showProgress: e.currentTarget.checked }
              })}
            />
          </Group>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Auto-archive Completed</Text>
              <Text size="sm" c="dimmed">Automatically archive completed projects</Text>
            </div>
            <Switch
              checked={projects.autoArchiveCompleted}
              onChange={(e) => update({ 
                projects: { ...projects, autoArchiveCompleted: e.currentTarget.checked }
              })}
            />
          </Group>
        </Stack>
      </Card>

      {/* Areas Settings */}
      <Card withBorder p="md">
        <Stack gap="md">
          <Text fw={600}>Areas</Text>
          
          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Default Type"
                value={areas.defaultType}
                onChange={(value) => update({ 
                  areas: { ...areas, defaultType: value || 'RESPONSIBILITY' }
                })}
                data={[
                  { value: 'RESPONSIBILITY', label: 'Responsibility' },
                  { value: 'INTEREST', label: 'Interest' },
                  { value: 'SKILL', label: 'Skill' },
                  { value: 'HABIT', label: 'Habit' },
                ]}
              />
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Select
                label="Review Frequency"
                value={areas.reviewFrequency}
                onChange={(value) => update({ 
                  areas: { ...areas, reviewFrequency: value as any }
                })}
                data={[
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'quarterly', label: 'Quarterly' },
                ]}
              />
            </Grid.Col>
          </Grid>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Show Health Score</Text>
              <Text size="sm" c="dimmed">Display area health indicators</Text>
            </div>
            <Switch
              checked={areas.showHealthScore}
              onChange={(e) => update({ 
                areas: { ...areas, showHealthScore: e.currentTarget.checked }
              })}
            />
          </Group>
        </Stack>
      </Card>

      {/* Resources Settings */}
      <Card withBorder p="md">
        <Stack gap="md">
          <Text fw={600}>Resources</Text>
          
          <Select
            label="Default Type"
            value={resources.defaultType}
            onChange={(value) => update({ 
              resources: { ...resources, defaultType: value || 'REFERENCE' }
            })}
            data={[
              { value: 'REFERENCE', label: 'Reference' },
              { value: 'TEMPLATE', label: 'Template' },
              { value: 'TOOL', label: 'Tool' },
              { value: 'INSPIRATION', label: 'Inspiration' },
            ]}
          />

          <Group justify="space-between">
            <div>
              <Text fw={500}>Auto-extract Content</Text>
              <Text size="sm" c="dimmed">Automatically extract content from URLs</Text>
            </div>
            <Switch
              checked={resources.autoExtractContent}
              onChange={(e) => update({ 
                resources: { ...resources, autoExtractContent: e.currentTarget.checked }
              })}
            />
          </Group>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Show Preview</Text>
              <Text size="sm" c="dimmed">Display content previews</Text>
            </div>
            <Switch
              checked={resources.showPreview}
              onChange={(e) => update({ 
                resources: { ...resources, showPreview: e.currentTarget.checked }
              })}
            />
          </Group>
        </Stack>
      </Card>

      {/* Notes Settings */}
      <Card withBorder p="md">
        <Stack gap="md">
          <Text fw={600}>Notes</Text>
          
          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Default Type"
                value={notes.defaultType}
                onChange={(value) => update({ 
                  notes: { ...notes, defaultType: value || 'QUICK' }
                })}
                data={[
                  { value: 'QUICK', label: 'Quick Note' },
                  { value: 'MEETING', label: 'Meeting Note' },
                  { value: 'JOURNAL', label: 'Journal Entry' },
                  { value: 'IDEA', label: 'Idea' },
                ]}
              />
            </Grid.Col>
            
            <Grid.Col span={6}>
              <NumberInput
                label="Auto-save Interval (seconds)"
                value={notes.autoSaveInterval}
                onChange={(value) => update({
                  notes: { ...notes, autoSaveInterval: typeof value === 'number' ? value : 30 }
                })}
                min={10}
                max={300}
                step={10}
                disabled={!notes.autoSave}
              />
            </Grid.Col>
          </Grid>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Auto-save</Text>
              <Text size="sm" c="dimmed">Automatically save notes while typing</Text>
            </div>
            <Switch
              checked={notes.autoSave}
              onChange={(e) => update({ 
                notes: { ...notes, autoSave: e.currentTarget.checked }
              })}
            />
          </Group>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Enable Markdown</Text>
              <Text size="sm" c="dimmed">Support Markdown formatting</Text>
            </div>
            <Switch
              checked={notes.enableMarkdown}
              onChange={(e) => update({ 
                notes: { ...notes, enableMarkdown: e.currentTarget.checked }
              })}
            />
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}

// Sync Settings Component
function SyncSettings() {
  const { 
    enabled, 
    optimisticUpdates, 
    conflictResolution, 
    offlineMode, 
    syncInterval, 
    update 
  } = useSyncPreferences();

  return (
    <Stack gap="md">
      <Card withBorder p="md">
        <Stack gap="md">
          <Text fw={600}>Synchronization</Text>
          
          <Group justify="space-between">
            <div>
              <Text fw={500}>Enable Sync</Text>
              <Text size="sm" c="dimmed">Synchronize data across devices</Text>
            </div>
            <Switch
              checked={enabled}
              onChange={(e) => update({ enabled: e.currentTarget.checked })}
            />
          </Group>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Optimistic Updates</Text>
              <Text size="sm" c="dimmed">Apply changes immediately before sync</Text>
            </div>
            <Switch
              checked={optimisticUpdates}
              disabled={!enabled}
              onChange={(e) => update({ optimisticUpdates: e.currentTarget.checked })}
            />
          </Group>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Offline Mode</Text>
              <Text size="sm" c="dimmed">Work offline and sync when connected</Text>
            </div>
            <Switch
              checked={offlineMode}
              disabled={!enabled}
              onChange={(e) => update({ offlineMode: e.currentTarget.checked })}
            />
          </Group>

          <Select
            label="Conflict Resolution"
            value={conflictResolution}
            onChange={(value) => update({ conflictResolution: value as any })}
            disabled={!enabled}
            data={[
              { value: 'manual', label: 'Manual Resolution' },
              { value: 'server_wins', label: 'Server Wins' },
              { value: 'client_wins', label: 'Client Wins' },
            ]}
          />

          <div>
            <Text fw={500} mb="xs">Sync Interval: {syncInterval} seconds</Text>
            <Slider
              value={syncInterval}
              onChange={(value) => update({ syncInterval: value })}
              min={10}
              max={300}
              step={10}
              disabled={!enabled}
              marks={[
                { value: 10, label: '10s' },
                { value: 60, label: '1m' },
                { value: 300, label: '5m' },
              ]}
            />
          </div>
        </Stack>
      </Card>
    </Stack>
  );
}

// Privacy Settings Component
function PrivacySettings() {
  const { resetCategory } = usePreferences();

  return (
    <Stack gap="md">
      <Card withBorder p="md">
        <Stack gap="md">
          <Text fw={600}>Privacy & Data</Text>
          
          <Alert color="blue" icon={<IconShield size="1rem" />}>
            Your data is stored locally and encrypted. We respect your privacy and never share your personal information.
          </Alert>

          <Group justify="space-between">
            <Text fw={500}>Data Retention</Text>
            <Select
              value="1year"
              data={[
                { value: '30days', label: '30 Days' },
                { value: '90days', label: '90 Days' },
                { value: '1year', label: '1 Year' },
                { value: 'forever', label: 'Forever' },
              ]}
            />
          </Group>

          <Divider />

          <Button
            variant="outline"
            color="red"
            onClick={() => resetCategory('privacy')}
          >
            Reset Privacy Settings
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
}

// Accessibility Settings Component
function AccessibilitySettings() {
  return (
    <Stack gap="md">
      <Card withBorder p="md">
        <Stack gap="md">
          <Text fw={600}>Accessibility Options</Text>
          
          <Group justify="space-between">
            <div>
              <Text fw={500}>High Contrast</Text>
              <Text size="sm" c="dimmed">Increase contrast for better visibility</Text>
            </div>
            <Switch />
          </Group>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Reduced Motion</Text>
              <Text size="sm" c="dimmed">Minimize animations and transitions</Text>
            </div>
            <Switch />
          </Group>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Screen Reader Optimized</Text>
              <Text size="sm" c="dimmed">Optimize for screen readers</Text>
            </div>
            <Switch />
          </Group>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Keyboard Navigation</Text>
              <Text size="sm" c="dimmed">Enable full keyboard navigation</Text>
            </div>
            <Switch defaultChecked />
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}

// Advanced Settings Component
function AdvancedSettings() {
  const { resetPreferences } = usePreferences();

  return (
    <Stack gap="md">
      <Card withBorder p="md">
        <Stack gap="md">
          <Text fw={600}>Advanced Options</Text>
          
          <Group justify="space-between">
            <div>
              <Text fw={500}>Enable Beta Features</Text>
              <Text size="sm" c="dimmed">Access experimental features</Text>
            </div>
            <Switch />
          </Group>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Debug Mode</Text>
              <Text size="sm" c="dimmed">Show debug information</Text>
            </div>
            <Switch />
          </Group>

          <Group justify="space-between">
            <div>
              <Text fw={500}>Performance Mode</Text>
              <Text size="sm" c="dimmed">Optimize for performance</Text>
            </div>
            <Switch />
          </Group>

          <Textarea
            label="Custom CSS"
            placeholder="Add your custom CSS here..."
            rows={6}
            description="Advanced users can add custom CSS to modify the appearance"
          />

          <Divider />

          <Alert color="orange" icon={<IconAlertTriangle size="1rem" />}>
            <Text fw={500} mb="xs">Danger Zone</Text>
            <Text size="sm" mb="md">
              These actions cannot be undone. Please proceed with caution.
            </Text>
            <Button
              variant="outline"
              color="red"
              onClick={() => {
                if (confirm('Are you sure you want to reset all settings? This cannot be undone.')) {
                  resetPreferences();
                }
              }}
            >
              Reset All Settings
            </Button>
          </Alert>
        </Stack>
      </Card>
    </Stack>
  );
}
