/**
 * Time Tracker Component for ThinkSpace
 * 
 * This component provides time tracking functionality for tasks
 * with start/stop timer, manual time entry, and time analytics.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Button,
  ActionIcon,
  NumberInput,
  Modal,
  Badge,
  Progress,
  Alert,
  Divider,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconClock,
  IconEdit,
  IconCheck,
  IconX,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

// Simple task interface for time tracking
interface TaskForTimeTracking {
  id: string;
  title: string;
  estimatedHours?: number;
  actualHours?: number;
}

interface TimeTrackerProps {
  task: TaskForTimeTracking;
  onTimeUpdate: (taskId: string, actualHours: number) => Promise<void>;
  disabled?: boolean;
}

interface TimeSession {
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
}

export function TimeTracker({ task, onTimeUpdate, disabled = false }: TimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState<TimeSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [manualHours, setManualHours] = useState(task.actualHours || 0);
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [saving, setSaving] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update elapsed time every second when tracking
  useEffect(() => {
    if (isTracking && currentSession) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - currentSession.startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking, currentSession]);

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHours = (totalSeconds: number) => {
    return (totalSeconds / 3600).toFixed(2);
  };

  // Start time tracking
  const startTracking = () => {
    if (disabled) return;
    
    const session: TimeSession = {
      startTime: new Date(),
      duration: 0,
    };
    
    setCurrentSession(session);
    setIsTracking(true);
    setElapsedTime(0);
    
    notifications.show({
      title: 'Timer Started',
      message: `Started tracking time for "${task.title}"`,
      color: 'green',
    });
  };

  // Pause time tracking
  const pauseTracking = () => {
    if (!currentSession) return;
    
    setIsTracking(false);
    
    notifications.show({
      title: 'Timer Paused',
      message: 'Time tracking paused',
      color: 'yellow',
    });
  };

  // Resume time tracking
  const resumeTracking = () => {
    if (!currentSession) return;
    
    setIsTracking(true);
    
    notifications.show({
      title: 'Timer Resumed',
      message: 'Time tracking resumed',
      color: 'blue',
    });
  };

  // Stop time tracking and save
  const stopTracking = async () => {
    if (!currentSession) return;
    
    try {
      setSaving(true);
      
      const sessionDuration = elapsedTime / 3600; // Convert to hours
      const newTotalHours = (task.actualHours || 0) + sessionDuration;
      
      await onTimeUpdate(task.id, newTotalHours);
      
      setCurrentSession(null);
      setIsTracking(false);
      setElapsedTime(0);
      
      notifications.show({
        title: 'Time Saved',
        message: `Added ${formatHours(elapsedTime)} hours to "${task.title}"`,
        color: 'green',
      });
      
    } catch (error) {
      console.error('Error saving time:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save time tracking data',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  // Save manual time entry
  const saveManualTime = async () => {
    try {
      setSaving(true);
      await onTimeUpdate(task.id, manualHours);
      closeEditModal();
      
      notifications.show({
        title: 'Time Updated',
        message: `Updated time for "${task.title}" to ${manualHours} hours`,
        color: 'green',
      });
      
    } catch (error) {
      console.error('Error updating time:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update time',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const actualHours = task.actualHours || 0;
  const estimatedHours = task.estimatedHours || 0;
  const currentSessionHours = elapsedTime / 3600;
  const totalHours = actualHours + currentSessionHours;
  const progressPercentage = estimatedHours > 0 ? (totalHours / estimatedHours) * 100 : 0;
  const isOverBudget = estimatedHours > 0 && totalHours > estimatedHours;

  return (
    <>
      <Card padding="md" radius="md" withBorder>
        <Stack gap="md">
          {/* Header */}
          <Group justify="space-between">
            <Text fw={600}>Time Tracking</Text>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={openEditModal}
              disabled={disabled}
            >
              <IconEdit size="1rem" />
            </ActionIcon>
          </Group>

          {/* Current Timer Display */}
          <Card padding="sm" radius="sm" withBorder style={{ backgroundColor: isTracking ? 'var(--mantine-color-blue-0)' : 'var(--mantine-color-gray-0)' }}>
            <Stack gap="xs" align="center">
              <Text size="xl" fw={700} ta="center" style={{ fontFamily: 'monospace' }}>
                {formatTime(elapsedTime)}
              </Text>
              {currentSession && (
                <Text size="xs" c="dimmed" ta="center">
                  Started at {currentSession.startTime.toLocaleTimeString()}
                </Text>
              )}
            </Stack>
          </Card>

          {/* Timer Controls */}
          <Group justify="center" gap="sm">
            {!currentSession ? (
              <Button
                leftSection={<IconPlayerPlay size="1rem" />}
                onClick={startTracking}
                disabled={disabled}
                color="green"
              >
                Start Timer
              </Button>
            ) : (
              <>
                {isTracking ? (
                  <Button
                    leftSection={<IconPlayerPause size="1rem" />}
                    onClick={pauseTracking}
                    disabled={disabled}
                    color="yellow"
                  >
                    Pause
                  </Button>
                ) : (
                  <Button
                    leftSection={<IconPlayerPlay size="1rem" />}
                    onClick={resumeTracking}
                    disabled={disabled}
                    color="blue"
                  >
                    Resume
                  </Button>
                )}
                
                <Button
                  leftSection={<IconPlayerStop size="1rem" />}
                  onClick={stopTracking}
                  disabled={disabled}
                  loading={saving}
                  color="red"
                >
                  Stop & Save
                </Button>
              </>
            )}
          </Group>

          <Divider />

          {/* Time Summary */}
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm">Total Time Logged</Text>
              <Badge size="lg" color="blue">
                {actualHours.toFixed(2)}h
              </Badge>
            </Group>

            {currentSessionHours > 0 && (
              <Group justify="space-between">
                <Text size="sm">Current Session</Text>
                <Badge size="lg" color="green">
                  +{currentSessionHours.toFixed(2)}h
                </Badge>
              </Group>
            )}

            {estimatedHours > 0 && (
              <>
                <Group justify="space-between">
                  <Text size="sm">Estimated Time</Text>
                  <Badge size="lg" color="gray">
                    {estimatedHours.toFixed(2)}h
                  </Badge>
                </Group>

                <div>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm">Progress</Text>
                    <Text size="sm" c={isOverBudget ? 'red' : 'dimmed'}>
                      {progressPercentage.toFixed(1)}%
                    </Text>
                  </Group>
                  <Progress 
                    value={Math.min(progressPercentage, 100)} 
                    color={isOverBudget ? 'red' : 'blue'} 
                    size="sm"
                  />
                  {isOverBudget && (
                    <Text size="xs" c="red" mt="xs">
                      Over budget by {(totalHours - estimatedHours).toFixed(2)} hours
                    </Text>
                  )}
                </div>
              </>
            )}
          </Stack>

          {/* Warnings */}
          {isOverBudget && (
            <Alert
              icon={<IconAlertTriangle size="1rem" />}
              title="Over Budget"
              color="red"
            >
              This task has exceeded its estimated time budget.
            </Alert>
          )}
        </Stack>
      </Card>

      {/* Manual Time Edit Modal */}
      <Modal
        opened={editModalOpened}
        onClose={closeEditModal}
        title="Edit Time Manually"
        centered
      >
        <Stack gap="md">
          <NumberInput
            label="Actual Hours"
            description="Enter the total hours spent on this task"
            value={manualHours}
            onChange={(value) => setManualHours(Number(value) || 0)}
            min={0}
            step={0.25}
            leftSection={<IconClock size="1rem" />}
          />

          {estimatedHours > 0 && (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Estimated: {estimatedHours}h</Text>
              <Text size="sm" c={manualHours > estimatedHours ? 'red' : 'green'}>
                {manualHours > estimatedHours ? 'Over' : 'Under'} by {Math.abs(manualHours - estimatedHours).toFixed(2)}h
              </Text>
            </Group>
          )}

          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button 
              leftSection={<IconCheck size="1rem" />}
              onClick={saveManualTime}
              loading={saving}
            >
              Save Time
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
