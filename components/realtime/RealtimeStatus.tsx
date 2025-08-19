/**
 * Real-time Status Component for ThinkSpace
 * 
 * Displays real-time connection status, pending updates, and conflicts
 * with options for manual resolution and sync management.
 */

'use client';

import { useState } from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Badge,
  Button,
  ActionIcon,
  Tooltip,
  Loader,
  Alert,
  Modal,
  Select,
  Textarea,
  Progress,
  Collapse,
  Divider,
  ScrollArea,
} from '@mantine/core';
import {
  IconWifi,
  IconWifiOff,
  IconRefresh,
  IconClock,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconSettings,
  IconBolt,
} from '@tabler/icons-react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { ConflictResolutionStrategy, RealtimeEvent } from '@/lib/realtime';

interface RealtimeStatusProps {
  compact?: boolean;
  showDetails?: boolean;
}

export function RealtimeStatus({ compact = false, showDetails = true }: RealtimeStatusProps) {
  const {
    isConnected,
    reconnectAttempts,
    pendingUpdates,
    conflicts,
    resolveConflict,
    forceSync,
  } = useRealtimeSync();

  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<RealtimeEvent | null>(null);
  const [resolutionStrategy, setResolutionStrategy] = useState<ConflictResolutionStrategy>('server_wins');
  const [manualResolution, setManualResolution] = useState('');
  const [showDetails_, setShowDetails_] = useState(false);

  // Handle conflict resolution
  const handleResolveConflict = async () => {
    if (!selectedConflict) return;

    try {
      await resolveConflict(
        selectedConflict.id,
        resolutionStrategy,
        resolutionStrategy === 'manual' ? JSON.parse(manualResolution) : undefined
      );
      
      setShowConflictModal(false);
      setSelectedConflict(null);
      setManualResolution('');
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  // Open conflict resolution modal
  const openConflictModal = (conflict: RealtimeEvent) => {
    setSelectedConflict(conflict);
    setShowConflictModal(true);
  };

  // Get status color
  const getStatusColor = () => {
    if (!isConnected) return 'red';
    if (conflicts.length > 0) return 'orange';
    if (pendingUpdates.length > 0) return 'yellow';
    return 'green';
  };

  // Get status text
  const getStatusText = () => {
    if (!isConnected) {
      return reconnectAttempts > 0 ? `Reconnecting... (${reconnectAttempts})` : 'Disconnected';
    }
    if (conflicts.length > 0) return `${conflicts.length} conflicts`;
    if (pendingUpdates.length > 0) return `${pendingUpdates.length} pending`;
    return 'Connected';
  };

  if (compact) {
    return (
      <Group gap="xs">
        <Tooltip label={getStatusText()}>
          <Badge
            variant="light"
            color={getStatusColor()}
            leftSection={
              isConnected ? (
                <IconWifi size="0.8rem" />
              ) : (
                <IconWifiOff size="0.8rem" />
              )
            }
          >
            {isConnected ? 'Online' : 'Offline'}
          </Badge>
        </Tooltip>
        
        {pendingUpdates.length > 0 && (
          <Tooltip label={`${pendingUpdates.length} pending updates`}>
            <Badge variant="light" color="yellow" leftSection={<IconClock size="0.8rem" />}>
              {pendingUpdates.length}
            </Badge>
          </Tooltip>
        )}
        
        {conflicts.length > 0 && (
          <Tooltip label={`${conflicts.length} conflicts need resolution`}>
            <Badge
              variant="light"
              color="red"
              leftSection={<IconAlertTriangle size="0.8rem" />}
              style={{ cursor: 'pointer' }}
              onClick={() => setShowDetails_(true)}
            >
              {conflicts.length}
            </Badge>
          </Tooltip>
        )}
      </Group>
    );
  }

  return (
    <>
      <Card withBorder p="md">
        <Stack gap="md">
          {/* Header */}
          <Group justify="space-between">
            <Group>
              <IconBolt size="1.2rem" />
              <Text fw={600}>Real-time Sync</Text>
            </Group>
            
            <Group gap="xs">
              <ActionIcon
                variant="light"
                onClick={forceSync}
                loading={!isConnected}
              >
                <IconRefresh size="1rem" />
              </ActionIcon>
              
              {showDetails && (
                <ActionIcon
                  variant="subtle"
                  onClick={() => setShowDetails_(!showDetails_)}
                >
                  {showDetails_ ? <IconChevronUp size="1rem" /> : <IconChevronDown size="1rem" />}
                </ActionIcon>
              )}
            </Group>
          </Group>

          {/* Status Overview */}
          <Group>
            <Badge
              size="lg"
              variant="light"
              color={getStatusColor()}
              leftSection={
                isConnected ? (
                  <IconWifi size="1rem" />
                ) : (
                  <IconWifiOff size="1rem" />
                )
              }
            >
              {getStatusText()}
            </Badge>
            
            {!isConnected && reconnectAttempts > 0 && (
              <Progress value={(reconnectAttempts / 5) * 100} size="sm" w={100} />
            )}
          </Group>

          {/* Quick Stats */}
          <Group>
            <Group gap="xs">
              <IconClock size="1rem" color="orange" />
              <Text size="sm">
                {pendingUpdates.length} pending updates
              </Text>
            </Group>
            
            <Group gap="xs">
              <IconAlertTriangle size="1rem" color="red" />
              <Text size="sm">
                {conflicts.length} conflicts
              </Text>
            </Group>
          </Group>

          {/* Detailed View */}
          {showDetails && (
            <Collapse in={showDetails_}>
              <Stack gap="md">
                <Divider />
                
                {/* Pending Updates */}
                {pendingUpdates.length > 0 && (
                  <div>
                    <Text fw={600} size="sm" mb="xs">
                      Pending Updates ({pendingUpdates.length})
                    </Text>
                    <ScrollArea.Autosize mah={150}>
                      <Stack gap="xs">
                        {pendingUpdates.map((update) => (
                          <Card key={update.id} withBorder p="xs" bg="yellow.0">
                            <Group justify="space-between">
                              <Group gap="xs">
                                <Loader size="xs" />
                                <Text size="sm">
                                  {update.type.replace('_', ' ')} • {update.itemType}
                                </Text>
                              </Group>
                              <Text size="xs" c="dimmed">
                                {new Date(update.timestamp).toLocaleTimeString()}
                              </Text>
                            </Group>
                          </Card>
                        ))}
                      </Stack>
                    </ScrollArea.Autosize>
                  </div>
                )}

                {/* Conflicts */}
                {conflicts.length > 0 && (
                  <div>
                    <Text fw={600} size="sm" mb="xs" c="red">
                      Conflicts ({conflicts.length})
                    </Text>
                    <ScrollArea.Autosize mah={200}>
                      <Stack gap="xs">
                        {conflicts.map((conflict) => (
                          <Card key={conflict.id} withBorder p="xs" bg="red.0">
                            <Group justify="space-between">
                              <Group gap="xs">
                                <IconAlertTriangle size="1rem" color="red" />
                                <div>
                                  <Text size="sm" fw={500}>
                                    Sync Conflict
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    {conflict.data.conflictData?.serverEvent?.data?.itemType} • {
                                      new Date(conflict.timestamp).toLocaleTimeString()
                                    }
                                  </Text>
                                </div>
                              </Group>
                              <Button
                                size="xs"
                                variant="light"
                                color="red"
                                onClick={() => openConflictModal(conflict)}
                              >
                                Resolve
                              </Button>
                            </Group>
                          </Card>
                        ))}
                      </Stack>
                    </ScrollArea.Autosize>
                  </div>
                )}

                {/* No Issues */}
                {pendingUpdates.length === 0 && conflicts.length === 0 && isConnected && (
                  <Alert color="green" icon={<IconCheck size="1rem" />}>
                    All changes are synchronized. No conflicts detected.
                  </Alert>
                )}
              </Stack>
            </Collapse>
          )}
        </Stack>
      </Card>

      {/* Conflict Resolution Modal */}
      <Modal
        opened={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        title="Resolve Sync Conflict"
        size="lg"
      >
        {selectedConflict && (
          <Stack gap="md">
            <Alert color="orange" icon={<IconAlertTriangle size="1rem" />}>
              A conflict was detected between your local changes and server updates.
              Choose how to resolve this conflict.
            </Alert>

            <div>
              <Text fw={600} mb="xs">Conflict Details</Text>
              <Card withBorder p="md" bg="gray.0">
                <Stack gap="xs">
                  <Group>
                    <Text size="sm" fw={500}>Item Type:</Text>
                    <Badge variant="light">
                      {selectedConflict.data.conflictData?.serverEvent?.data?.itemType}
                    </Badge>
                  </Group>
                  <Group>
                    <Text size="sm" fw={500}>Conflict Time:</Text>
                    <Text size="sm" c="dimmed">
                      {new Date(selectedConflict.timestamp).toLocaleString()}
                    </Text>
                  </Group>
                </Stack>
              </Card>
            </div>

            <Select
              label="Resolution Strategy"
              value={resolutionStrategy}
              onChange={(value) => setResolutionStrategy(value as ConflictResolutionStrategy)}
              data={[
                { value: 'server_wins', label: 'Use Server Version (Recommended)' },
                { value: 'client_wins', label: 'Keep My Changes' },
                { value: 'merge', label: 'Attempt Automatic Merge' },
                { value: 'manual', label: 'Manual Resolution' },
              ]}
            />

            {resolutionStrategy === 'manual' && (
              <Textarea
                label="Manual Resolution (JSON)"
                placeholder="Enter the resolved data as JSON..."
                value={manualResolution}
                onChange={(e) => setManualResolution(e.currentTarget.value)}
                rows={6}
                description="Provide the final state of the item as JSON"
              />
            )}

            <Group justify="flex-end">
              <Button
                variant="outline"
                onClick={() => setShowConflictModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolveConflict}
                disabled={resolutionStrategy === 'manual' && !manualResolution.trim()}
              >
                Resolve Conflict
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
