/**
 * Navigation Component for ThinkSpace
 * 
 * This component provides the main navigation for the PARA methodology
 * sections with visual indicators, counters, and responsive design.
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Stack,
  NavLink,
  Text,
  Badge,
  Group,
  Divider,
  ScrollArea,
  Tooltip,
  ActionIcon,
  Collapse,
} from '@mantine/core';
import {
  IconDashboard,
  IconTarget,
  IconMap,
  IconBookmark,
  IconArchive,
  IconMessageCircle,
  IconNetwork,
  IconSearch,
  IconSettings,
  IconChevronRight,
  IconPlus,
  IconFolder,
  IconNote,
  IconFile,
} from '@tabler/icons-react';
import Link from 'next/link';
import { getParaColor } from '@/lib/theme';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  color?: string;
  count?: number;
  children?: NavItem[];
}

interface NavStats {
  projects: number;
  areas: number;
  resources: number;
  notes: number;
  archived: number;
  chats: number;
}

export function Navbar() {
  const pathname = usePathname();
  const [stats, setStats] = useState<NavStats>({
    projects: 0,
    areas: 0,
    resources: 0,
    notes: 0,
    archived: 0,
    chats: 0,
  });
  const [expandedSections, setExpandedSections] = useState<string[]>(['para']);

  // Fetch navigation stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats/navigation');
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch navigation stats:', error);
      }
    };

    fetchStats();
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const paraNavItems: NavItem[] = [
    {
      label: 'Projects',
      icon: <IconTarget size="1.1rem" />,
      href: '/projects',
      color: getParaColor('projects'),
      count: stats?.projects || 0,
      children: [
        {
          label: 'Active Projects',
          icon: <IconFolder size="1rem" />,
          href: '/projects?status=active',
        },
        {
          label: 'Create Project',
          icon: <IconPlus size="1rem" />,
          href: '/projects/new',
        },
      ],
    },
    {
      label: 'Areas',
      icon: <IconMap size="1.1rem" />,
      href: '/areas',
      color: getParaColor('areas'),
      count: stats?.areas || 0,
      children: [
        {
          label: 'Responsibility Areas',
          icon: <IconFolder size="1rem" />,
          href: '/areas?type=responsibility',
        },
        {
          label: 'Create Area',
          icon: <IconPlus size="1rem" />,
          href: '/areas/new',
        },
      ],
    },
    {
      label: 'Resources',
      icon: <IconBookmark size="1.1rem" />,
      href: '/resources',
      color: getParaColor('resources'),
      count: stats?.resources || 0,
      children: [
        {
          label: 'All Resources',
          icon: <IconFile size="1rem" />,
          href: '/resources',
        },
        {
          label: 'Upload Resource',
          icon: <IconPlus size="1rem" />,
          href: '/resources/upload',
        },
      ],
    },
    {
      label: 'Archive',
      icon: <IconArchive size="1.1rem" />,
      href: '/archive',
      color: getParaColor('archive'),
      count: stats?.archived || 0,
    },
  ];

  const toolsNavItems: NavItem[] = [
    {
      label: 'Chat',
      icon: <IconMessageCircle size="1.1rem" />,
      href: '/chat',
      count: stats?.chats || 0,
    },
    {
      label: 'Knowledge Graph',
      icon: <IconNetwork size="1.1rem" />,
      href: '/graph',
    },
    {
      label: 'Search',
      icon: <IconSearch size="1.1rem" />,
      href: '/search',
    },
  ];

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.href);
    const active = isActive(item.href);

    return (
      <div key={item.href}>
        <NavLink
          component={hasChildren ? "button" : undefined}
          {...(!hasChildren ? { href: item.href } : {})}
          label={
            <Group justify="space-between" gap="xs">
              <Text size="sm" fw={active ? 600 : 400}>
                {item.label}
              </Text>
              {item.count !== undefined && item.count > 0 && (
                <Badge
                  size="xs"
                  variant="light"
                  color={item.color || 'blue'}
                >
                  {item.count}
                </Badge>
              )}
            </Group>
          }
          leftSection={item.icon}
          rightSection={hasChildren ? (
            <IconChevronRight
              size="0.8rem"
              style={{
                transform: isExpanded ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
          ) : undefined}
          active={active}
          color={item.color}
          onClick={hasChildren ? () => toggleSection(item.href) : undefined}
          style={{
            marginLeft: level * 16,
            borderRadius: 'var(--mantine-radius-md)',
          }}
        />
        
        {hasChildren && (
          <Collapse in={isExpanded}>
            <Stack gap={2} mt="xs">
              {item.children?.map(child => renderNavItem(child, level + 1))}
            </Stack>
          </Collapse>
        )}
      </div>
    );
  };

  return (
    <ScrollArea h="100%">
      <Stack gap="md">
        {/* Dashboard */}
        <NavLink
          component={Link}
          href="/"
          label="Dashboard"
          leftSection={<IconDashboard size="1.1rem" />}
          active={pathname === '/'}
          style={{ borderRadius: 'var(--mantine-radius-md)' }}
        />

        <Divider label="PARA Method" labelPosition="center" />

        {/* PARA Navigation */}
        <Stack gap={4}>
          {paraNavItems.map(item => renderNavItem(item))}
        </Stack>

        <Divider label="Tools" labelPosition="center" />

        {/* Tools Navigation */}
        <Stack gap={4}>
          {toolsNavItems.map(item => renderNavItem(item))}
        </Stack>

        <Divider label="Notes" labelPosition="center" />

        {/* Notes Navigation */}
        <NavLink
          component={Link}
          href="/notes"
          label={
            <Group justify="space-between" gap="xs">
              <Text size="sm">All Notes</Text>
              {stats?.notes > 0 && (
                <Badge size="xs" variant="light" color="gray">
                  {stats.notes}
                </Badge>
              )}
            </Group>
          }
          leftSection={<IconNote size="1.1rem" />}
          active={pathname.startsWith('/notes')}
          style={{ borderRadius: 'var(--mantine-radius-md)' }}
        />

        <Divider />

        {/* Settings */}
        <NavLink
          component={Link}
          href="/settings"
          label="Settings"
          leftSection={<IconSettings size="1.1rem" />}
          active={pathname.startsWith('/settings')}
          style={{ borderRadius: 'var(--mantine-radius-md)' }}
        />
      </Stack>
    </ScrollArea>
  );
}
