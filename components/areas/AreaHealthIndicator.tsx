/**
 * Area Health Indicator Component for ThinkSpace Areas
 * 
 * Visual indicator showing area health score with color coding,
 * trend indicators, and maintenance alerts.
 */

'use client';

import {
  Group,
  Text,
  Badge,
  Progress,
  Tooltip,
  Box,
  Stack,
  ActionIcon,
  ThemeIcon,
  rem,
} from '@mantine/core';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconAlertTriangle,
  IconClock,
  IconCheck,
  IconX,
  IconInfoCircle,
} from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';

interface AreaHealthIndicatorProps {
  healthScore?: number;
  lastReviewDate?: Date;
  nextReviewDate?: Date;
  trend?: 'improving' | 'declining' | 'stable';
  isReviewOverdue?: boolean;
  responsibilityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onReviewClick?: () => void;
}

export default function AreaHealthIndicator({
  healthScore = 0,
  lastReviewDate,
  nextReviewDate,
  trend = 'stable',
  isReviewOverdue = false,
  responsibilityLevel,
  showDetails = true,
  size = 'md',
  onReviewClick,
}: AreaHealthIndicatorProps) {
  // Calculate health category and color
  const getHealthCategory = (score: number) => {
    if (score >= 0.8) return { category: 'Excellent', color: 'green' };
    if (score >= 0.6) return { category: 'Good', color: 'blue' };
    if (score >= 0.4) return { category: 'Fair', color: 'yellow' };
    if (score >= 0.2) return { category: 'Poor', color: 'orange' };
    return { category: 'Critical', color: 'red' };
  };

  const { category, color } = getHealthCategory(healthScore);
  const percentage = Math.round(healthScore * 100);

  // Get trend icon
  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <IconTrendingUp size="0.8rem" color="green" />;
      case 'declining':
        return <IconTrendingDown size="0.8rem" color="red" />;
      default:
        return <IconMinus size="0.8rem" color="gray" />;
    }
  };

  // Get responsibility level color
  const getResponsibilityColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'red';
      case 'MEDIUM': return 'yellow';
      case 'LOW': return 'green';
      default: return 'gray';
    }
  };

  // Calculate review status
  const getReviewStatus = () => {
    if (isReviewOverdue) {
      return {
        status: 'Overdue',
        color: 'red',
        icon: <IconAlertTriangle size="0.8rem" />,
      };
    }

    if (nextReviewDate) {
      const now = new Date();
      const daysUntilReview = Math.floor(
        (nextReviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilReview <= 7) {
        return {
          status: 'Due Soon',
          color: 'orange',
          icon: <IconClock size="0.8rem" />,
        };
      }

      return {
        status: 'On Track',
        color: 'green',
        icon: <IconCheck size="0.8rem" />,
      };
    }

    return {
      status: 'Not Scheduled',
      color: 'gray',
      icon: <IconX size="0.8rem" />,
    };
  };

  const reviewStatus = getReviewStatus();

  if (size === 'sm') {
    return (
      <Group gap="xs">
        <Tooltip label={`Health: ${percentage}% (${category})`}>
          <Progress
            value={percentage}
            color={color}
            size="sm"
            style={{ width: rem(60) }}
          />
        </Tooltip>
        {getTrendIcon()}
        {isReviewOverdue && (
          <Tooltip label="Review overdue">
            <ThemeIcon size="sm" color="red" variant="light">
              <IconAlertTriangle size="0.6rem" />
            </ThemeIcon>
          </Tooltip>
        )}
      </Group>
    );
  }

  if (size === 'lg') {
    return (
      <Stack gap="md">
        {/* Main Health Score */}
        <Box>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>Area Health</Text>
            <Group gap="xs">
              <Text size="sm" c="dimmed">{percentage}%</Text>
              {getTrendIcon()}
            </Group>
          </Group>
          <Progress
            value={percentage}
            color={color}
            size="lg"
            radius="md"
          />
          <Group justify="space-between" mt="xs">
            <Badge size="sm" color={color} variant="light">
              {category}
            </Badge>
            <Badge size="sm" color={getResponsibilityColor(responsibilityLevel)} variant="outline">
              {responsibilityLevel} Priority
            </Badge>
          </Group>
        </Box>

        {/* Review Status */}
        {showDetails && (
          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>Review Status</Text>
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={onReviewClick}
                disabled={!onReviewClick}
              >
                <IconInfoCircle size="0.8rem" />
              </ActionIcon>
            </Group>
            
            <Group justify="space-between">
              <Group gap="xs">
                {reviewStatus.icon}
                <Text size="sm" c={reviewStatus.color}>
                  {reviewStatus.status}
                </Text>
              </Group>
              
              {lastReviewDate && (
                <Text size="xs" c="dimmed">
                  Last: {formatDistanceToNow(lastReviewDate, { addSuffix: true })}
                </Text>
              )}
            </Group>

            {nextReviewDate && !isReviewOverdue && (
              <Text size="xs" c="dimmed" mt="xs">
                Next review: {formatDistanceToNow(nextReviewDate, { addSuffix: true })}
              </Text>
            )}
          </Box>
        )}
      </Stack>
    );
  }

  // Default medium size
  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <Group gap="xs">
          <Text size="sm" fw={500}>Health</Text>
          <Badge size="xs" color={color} variant="light">
            {category}
          </Badge>
        </Group>
        <Group gap="xs">
          <Text size="sm" c="dimmed">{percentage}%</Text>
          {getTrendIcon()}
        </Group>
      </Group>

      <Progress
        value={percentage}
        color={color}
        size="md"
        radius="sm"
      />

      {showDetails && (
        <Group justify="space-between">
          <Group gap="xs">
            {reviewStatus.icon}
            <Text size="xs" c={reviewStatus.color}>
              {reviewStatus.status}
            </Text>
          </Group>
          
          <Badge size="xs" color={getResponsibilityColor(responsibilityLevel)} variant="outline">
            {responsibilityLevel}
          </Badge>
        </Group>
      )}

      {showDetails && lastReviewDate && (
        <Text size="xs" c="dimmed">
          Last review: {formatDistanceToNow(lastReviewDate, { addSuffix: true })}
        </Text>
      )}
    </Stack>
  );
}
