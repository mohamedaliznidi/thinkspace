/**
 * Deadline Alerts Component for ThinkSpace
 * 
 * This component provides deadline alerts and notifications
 * for overdue tasks, upcoming deadlines, and project milestones.
 */

'use client';

import { useMemo } from 'react';
import {
  Stack,
  Alert,
  Group,
  Text,
  Badge,
  Button,
  ActionIcon,
  Anchor,
  Divider,
  Card,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconClock,
  IconCalendar,
  IconFlag,
  IconX,
  IconBell,
  IconTarget,
} from '@tabler/icons-react';
import { 
  differenceInDays, 
  differenceInHours,
  format, 
  isAfter, 
  isBefore, 
  parseISO,
  isToday,
  isTomorrow,
} from 'date-fns';
import type { TaskDisplay, ProjectDisplay } from '@/types';

interface DeadlineAlertsProps {
  tasks: TaskDisplay[];
  projects: ProjectDisplay[];
  onTaskClick?: (taskId: string) => void;
  onProjectClick?: (projectId: string) => void;
  onDismissAlert?: (type: string, id: string) => void;
  dismissedAlerts?: Set<string>;
  maxAlerts?: number;
}

interface AlertItem {
  id: string;
  type: 'task' | 'project';
  severity: 'overdue' | 'due-today' | 'due-tomorrow' | 'due-soon' | 'urgent';
  title: string;
  subtitle: string;
  dueDate: Date;
  priority: string;
  status: string;
  data: TaskDisplay | ProjectDisplay;
}

export function DeadlineAlerts({
  tasks,
  projects,
  onTaskClick,
  onProjectClick,
  onDismissAlert,
  dismissedAlerts = new Set(),
  maxAlerts = 10,
}: DeadlineAlertsProps) {
  
  // Generate alert items
  const alerts = useMemo(() => {
    const now = new Date();
    const alertItems: AlertItem[] = [];

    // Process tasks
    tasks.forEach(task => {
      if (!task.dueDate || task.status === 'COMPLETED' || task.status === 'CANCELLED') {
        return;
      }

      const dueDate = parseISO(task.dueDate);
      const daysDiff = differenceInDays(dueDate, now);
      const hoursDiff = differenceInHours(dueDate, now);
      
      let severity: AlertItem['severity'];
      let subtitle: string;

      if (isAfter(now, dueDate)) {
        severity = 'overdue';
        const overdueDays = Math.abs(daysDiff);
        subtitle = `Overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}`;
      } else if (isToday(dueDate)) {
        severity = 'due-today';
        if (hoursDiff <= 2) {
          subtitle = `Due in ${hoursDiff} hour${hoursDiff !== 1 ? 's' : ''}`;
        } else {
          subtitle = 'Due today';
        }
      } else if (isTomorrow(dueDate)) {
        severity = 'due-tomorrow';
        subtitle = 'Due tomorrow';
      } else if (daysDiff <= 7) {
        severity = task.priority === 'URGENT' ? 'urgent' : 'due-soon';
        subtitle = `Due in ${daysDiff} day${daysDiff !== 1 ? 's' : ''}`;
      } else if (task.priority === 'URGENT' && daysDiff <= 14) {
        severity = 'urgent';
        subtitle = `Due in ${daysDiff} day${daysDiff !== 1 ? 's' : ''} (Urgent)`;
      } else {
        return; // Not urgent enough for alerts
      }

      const alertId = `task-${task.id}`;
      if (!dismissedAlerts.has(alertId)) {
        alertItems.push({
          id: alertId,
          type: 'task',
          severity,
          title: task.title,
          subtitle,
          dueDate,
          priority: task.priority,
          status: task.status,
          data: task,
        });
      }
    });

    // Process projects
    projects.forEach(project => {
      if (!project.dueDate || project.status === 'COMPLETED' || project.status === 'CANCELLED') {
        return;
      }

      const dueDate = parseISO(project.dueDate);
      const daysDiff = differenceInDays(dueDate, now);
      
      let severity: AlertItem['severity'];
      let subtitle: string;

      if (isAfter(now, dueDate)) {
        severity = 'overdue';
        const overdueDays = Math.abs(daysDiff);
        subtitle = `Project overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}`;
      } else if (isToday(dueDate)) {
        severity = 'due-today';
        subtitle = 'Project due today';
      } else if (isTomorrow(dueDate)) {
        severity = 'due-tomorrow';
        subtitle = 'Project due tomorrow';
      } else if (daysDiff <= 7) {
        severity = project.priority === 'URGENT' ? 'urgent' : 'due-soon';
        subtitle = `Project due in ${daysDiff} day${daysDiff !== 1 ? 's' : ''}`;
      } else if (project.priority === 'URGENT' && daysDiff <= 14) {
        severity = 'urgent';
        subtitle = `Project due in ${daysDiff} day${daysDiff !== 1 ? 's' : ''} (Urgent)`;
      } else {
        return;
      }

      const alertId = `project-${project.id}`;
      if (!dismissedAlerts.has(alertId)) {
        alertItems.push({
          id: alertId,
          type: 'project',
          severity,
          title: project.title,
          subtitle,
          dueDate,
          priority: project.priority,
          status: project.status,
          data: project,
        });
      }
    });

    // Sort by severity and due date
    const severityOrder = {
      'overdue': 0,
      'due-today': 1,
      'due-tomorrow': 2,
      'urgent': 3,
      'due-soon': 4,
    };

    return alertItems
      .sort((a, b) => {
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return a.dueDate.getTime() - b.dueDate.getTime();
      })
      .slice(0, maxAlerts);
  }, [tasks, projects, dismissedAlerts, maxAlerts]);

  const getSeverityColor = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'overdue': return 'red';
      case 'due-today': return 'orange';
      case 'due-tomorrow': return 'yellow';
      case 'urgent': return 'red';
      case 'due-soon': return 'blue';
      default: return 'gray';
    }
  };

  const getSeverityIcon = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'overdue': return IconAlertTriangle;
      case 'due-today': return IconClock;
      case 'due-tomorrow': return IconCalendar;
      case 'urgent': return IconFlag;
      case 'due-soon': return IconBell;
      default: return IconBell;
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

  const handleItemClick = (alert: AlertItem) => {
    if (alert.type === 'task' && onTaskClick) {
      onTaskClick((alert.data as TaskDisplay).id);
    } else if (alert.type === 'project' && onProjectClick) {
      onProjectClick((alert.data as ProjectDisplay).id);
    }
  };

  const handleDismiss = (alert: AlertItem) => {
    if (onDismissAlert) {
      onDismissAlert(alert.type, alert.id);
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <IconBell size="1.25rem" color="var(--mantine-color-orange-6)" />
            <Text fw={600} size="lg">
              Deadline Alerts
            </Text>
            <Badge size="sm" color="orange">
              {alerts.length}
            </Badge>
          </Group>
        </Group>

        <Stack gap="sm">
          {alerts.map((alert) => {
            const SeverityIcon = getSeverityIcon(alert.severity);
            const color = getSeverityColor(alert.severity);

            return (
              <Alert
                key={alert.id}
                icon={<SeverityIcon size="1rem" />}
                color={color}
                variant="light"
                style={{ cursor: 'pointer' }}
                onClick={() => handleItemClick(alert)}
              >
                <Group justify="space-between" align="flex-start">
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Group gap="xs">
                      <Text fw={500} size="sm">
                        {alert.title}
                      </Text>
                      <Badge size="xs" color={getPriorityColor(alert.priority)}>
                        {alert.priority}
                      </Badge>
                      {alert.type === 'task' && (
                        <Badge size="xs" variant="outline" color="gray">
                          {(alert.data as TaskDisplay).project.title}
                        </Badge>
                      )}
                    </Group>
                    
                    <Text size="xs" c="dimmed">
                      {alert.subtitle} • {format(alert.dueDate, 'MMM d, yyyy h:mm a')}
                    </Text>
                  </Stack>

                  {onDismissAlert && (
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(alert);
                      }}
                    >
                      <IconX size="0.875rem" />
                    </ActionIcon>
                  )}
                </Group>
              </Alert>
            );
          })}
        </Stack>

        {alerts.length >= maxAlerts && (
          <>
            <Divider />
            <Text size="xs" c="dimmed" ta="center">
              Showing first {maxAlerts} alerts. Check individual projects for more details.
            </Text>
          </>
        )}
      </Stack>
    </Card>
  );
}
