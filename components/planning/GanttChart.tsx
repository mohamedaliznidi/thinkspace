/**
 * Gantt Chart Component for ThinkSpace
 * 
 * This component provides a Gantt chart visualization for project
 * planning and tracking with task dependencies and milestones.
 */

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Badge,
  ScrollArea,
  Button,
  ActionIcon,
  Tooltip,
  Select,
} from '@mantine/core';
import {
  IconCalendar,
  IconFlag,
  IconZoomIn,
  IconZoomOut,
  IconArrowAutofitWidth,
} from '@tabler/icons-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays } from 'date-fns';
import type { TaskPlanningData } from '@/types';



interface Milestone {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  color?: string;
}

interface GanttChartProps {
  tasks: TaskPlanningData[];
  milestones?: Milestone[];
  startDate?: Date;
  endDate?: Date;
  onTaskClick?: (task: TaskPlanningData) => void;
  onMilestoneClick?: (milestone: Milestone) => void;
  showDependencies?: boolean;
  showCriticalPath?: boolean;
}

type ViewMode = 'days' | 'weeks' | 'months';

export function GanttChart({
  tasks,
  milestones = [],
  startDate,
  endDate,
  onTaskClick,
  onMilestoneClick,
  showDependencies = true,
  showCriticalPath = false,
}: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('weeks');
  const [zoomLevel, setZoomLevel] = useState(1);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Calculate date range
  const dateRange = useMemo(() => {
    const taskDates = tasks.flatMap(task => [
      task.startDate ? new Date(task.startDate) : null,
      task.dueDate ? new Date(task.dueDate) : null,
    ]).filter(Boolean) as Date[];

    const milestoneDates = milestones.map(m => new Date(m.date));
    const allDates = [...taskDates, ...milestoneDates];

    if (allDates.length === 0) {
      const today = new Date();
      return {
        start: startOfWeek(today),
        end: endOfWeek(addDays(today, 30)),
      };
    }

    const minDate = startDate || new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = endDate || new Date(Math.max(...allDates.map(d => d.getTime())));

    return {
      start: startOfWeek(minDate),
      end: endOfWeek(maxDate),
    };
  }, [tasks, milestones, startDate, endDate]);

  // Generate time periods based on view mode
  const timePeriods = useMemo(() => {
    const periods = [];
    let current = new Date(dateRange.start);
    
    while (current <= dateRange.end) {
      periods.push(new Date(current));
      
      switch (viewMode) {
        case 'days':
          current = addDays(current, 1);
          break;
        case 'weeks':
          current = addDays(current, 7);
          break;
        case 'months':
          current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
          break;
      }
    }
    
    return periods;
  }, [dateRange, viewMode]);

  // Calculate task bar properties
  const getTaskBarProps = (task: TaskPlanningData) => {
    if (!task.startDate || !task.dueDate) {
      return null;
    }

    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.dueDate);
    const totalDays = differenceInDays(dateRange.end, dateRange.start);
    const startOffset = differenceInDays(taskStart, dateRange.start);
    const duration = differenceInDays(taskEnd, taskStart) + 1;

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(100 - Math.max(0, left), width)}%`,
    };
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

  const columnWidth = 120 * zoomLevel;

  return (
    <Card padding="lg" radius="md" withBorder>
      <Stack gap="md">
        {/* Header Controls */}
        <Group justify="space-between">
          <Group gap="sm">
            <Text fw={600} size="lg">
              Project Timeline
            </Text>
            <Badge size="sm" variant="light">
              {tasks.length} tasks
            </Badge>
          </Group>

          <Group gap="sm">
            <Select
              value={viewMode}
              onChange={(value) => setViewMode(value as ViewMode)}
              data={[
                { value: 'days', label: 'Days' },
                { value: 'weeks', label: 'Weeks' },
                { value: 'months', label: 'Months' },
              ]}
              size="sm"
            />

            <Group gap="xs">
              <Tooltip label="Zoom out">
                <ActionIcon
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                  disabled={zoomLevel <= 0.5}
                >
                  <IconZoomOut size="1rem" />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Zoom in">
                <ActionIcon
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
                  disabled={zoomLevel >= 2}
                >
                  <IconZoomIn size="1rem" />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Fit to window">
                <ActionIcon
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(1)}
                >
                  <IconArrowAutofitWidth size="1rem" />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </Group>

        {/* Gantt Chart */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          {/* Timeline Header */}
          <div
            style={{
              display: 'flex',
              borderBottom: '2px solid var(--mantine-color-gray-3)',
              backgroundColor: 'var(--mantine-color-gray-0)',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            {/* Task column header */}
            <div
              style={{
                width: 250,
                padding: '12px',
                borderRight: '1px solid var(--mantine-color-gray-3)',
                fontWeight: 600,
              }}
            >
              Tasks
            </div>

            {/* Time period headers */}
            <ScrollArea
              style={{ flex: 1 }}
              scrollbarSize={8}
              ref={scrollAreaRef}
            >
              <div style={{ display: 'flex', minWidth: timePeriods.length * columnWidth }}>
                {timePeriods.map((period, index) => (
                  <div
                    key={index}
                    style={{
                      width: columnWidth,
                      padding: '12px 8px',
                      borderRight: '1px solid var(--mantine-color-gray-3)',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    {viewMode === 'days' && format(period, 'MMM d')}
                    {viewMode === 'weeks' && format(period, 'MMM d')}
                    {viewMode === 'months' && format(period, 'MMM yyyy')}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Task Rows */}
          <ScrollArea style={{ maxHeight: 400 }}>
            {tasks.map((task) => {
              const barProps = getTaskBarProps(task);
              
              return (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--mantine-color-gray-2)',
                    minHeight: 48,
                  }}
                >
                  {/* Task Info */}
                  <div
                    style={{
                      width: 250,
                      padding: '8px 12px',
                      borderRight: '1px solid var(--mantine-color-gray-3)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Group gap="xs">
                        <Text
                          size="sm"
                          fw={500}
                          style={{ cursor: onTaskClick ? 'pointer' : 'default' }}
                          onClick={() => onTaskClick?.(task)}
                        >
                          {task.title}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <Badge size="xs" color={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge size="xs" color={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </Group>
                    </Stack>
                  </div>

                  {/* Timeline */}
                  <div
                    style={{
                      flex: 1,
                      position: 'relative',
                      minWidth: timePeriods.length * columnWidth,
                      height: 48,
                    }}
                  >
                    {/* Grid lines */}
                    {timePeriods.map((_, index) => (
                      <div
                        key={index}
                        style={{
                          position: 'absolute',
                          left: index * columnWidth,
                          top: 0,
                          bottom: 0,
                          width: 1,
                          backgroundColor: 'var(--mantine-color-gray-2)',
                        }}
                      />
                    ))}

                    {/* Task Bar */}
                    {barProps && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          height: 20,
                          backgroundColor: `var(--mantine-color-${getStatusColor(task.status)}-6)`,
                          borderRadius: 4,
                          cursor: onTaskClick ? 'pointer' : 'default',
                          opacity: task.status === 'COMPLETED' ? 0.7 : 1,
                          ...barProps,
                        }}
                        onClick={() => onTaskClick?.(task)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </ScrollArea>

          {/* Milestones */}
          {milestones.length > 0 && (
            <div style={{ position: 'absolute', top: 0, left: 250, right: 0, pointerEvents: 'none' }}>
              {milestones.map((milestone) => {
                const milestoneDate = new Date(milestone.date);
                const totalDays = differenceInDays(dateRange.end, dateRange.start);
                const offset = differenceInDays(milestoneDate, dateRange.start);
                const left = (offset / totalDays) * 100;

                return (
                  <div
                    key={milestone.id}
                    style={{
                      position: 'absolute',
                      left: `${left}%`,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      backgroundColor: milestone.color || 'var(--mantine-color-red-6)',
                      pointerEvents: 'auto',
                      cursor: onMilestoneClick ? 'pointer' : 'default',
                    }}
                    onClick={() => onMilestoneClick?.(milestone)}
                  >
                    <Tooltip label={`${milestone.title} - ${format(milestoneDate, 'MMM d, yyyy')}`}>
                      <div
                        style={{
                          position: 'absolute',
                          top: -8,
                          left: -6,
                          width: 14,
                          height: 14,
                          backgroundColor: milestone.color || 'var(--mantine-color-red-6)',
                          borderRadius: '50%',
                          border: '2px solid white',
                        }}
                      />
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Stack>
    </Card>
  );
}
