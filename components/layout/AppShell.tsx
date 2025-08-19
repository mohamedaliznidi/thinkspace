/**
 * App Shell Component for ThinkSpace
 * 
 * This component provides the main application layout with header,
 * navigation, and responsive design for the PARA methodology interface.
 */

'use client';

import {
  AppShell,
  Burger,
  Group,
  Text,
  UnstyledButton,
  Avatar,
  Menu,
  ActionIcon,
  Tooltip,
  Indicator,
  Breadcrumbs,
  Anchor,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconBrain,
  IconBell,
  IconSearch,
  IconSettings,
  IconLogout,
  IconUser,
  IconMoon,
  IconSun,
  IconChevronDown,
} from '@tabler/icons-react';
import { signOut } from 'next-auth/react';
import { useUser } from '@/contexts/UserContext';
import { useMantineColorScheme } from '@mantine/core';
import { Navbar } from './Navbar';
import { spotlight } from '@mantine/spotlight';
import Link from 'next/link';
import { SearchSpotlight } from '../search/SearchSpotlight';
import { RealtimeStatus } from '../realtime/RealtimeStatus';

interface AppShellLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: Array<{ title: string; href?: string }>;
}

export function AppShellLayout({ children, breadcrumbs = [] }: AppShellLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const { user } = useUser();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/signin' });
  };

  const breadcrumbItems = breadcrumbs.map((item, index) => (
    item.href ? (
      <Anchor component={Link} href={item.href} key={index}>
        {item.title}
      </Anchor>
    ) : (
      <Text key={index}>{item.title}</Text>
    )
  ));

  return (
    <>
      
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 280,
          breakpoint: 'sm',
          collapsed: { mobile: !opened },
        }}
        padding="md"
      >
        {/* Header */}
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            {/* Left side - Logo and burger */}
            <Group>
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
              />
              
              <Group gap="sm">
                <IconBrain size={28} color="var(--mantine-color-blue-6)" />
                <Text
                  size="lg"
                  fw={700}
                  c="blue"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  ThinkSpace
                </Text>
              </Group>
            </Group>

            {/* Right side - Actions and user menu */}
            <Group gap="sm">
              {/* Real-time Status */}
              <RealtimeStatus compact={true} />

              {/* Search */}
              <Tooltip label="Search (Ctrl+K)">
                <ActionIcon
                  variant="subtle"
                  size="lg"
                  onClick={() => spotlight.open()}
                >
                  <IconSearch size="1.2rem" />
                </ActionIcon>
              </Tooltip>

              {/* Notifications */}
              <Tooltip label="Notifications">
                <Indicator inline size={8} color="red" disabled>
                  <ActionIcon variant="subtle" size="lg">
                    <IconBell size="1.2rem" />
                  </ActionIcon>
                </Indicator>
              </Tooltip>

              {/* Theme toggle */}
              <Tooltip label={`Switch to ${colorScheme === 'dark' ? 'light' : 'dark'} mode`}>
                <ActionIcon
                  variant="subtle"
                  size="lg"
                  onClick={() => toggleColorScheme()}
                >
                  {colorScheme === 'dark' ? (
                    <IconSun size="1.2rem" />
                  ) : (
                    <IconMoon size="1.2rem" />
                  )}
                </ActionIcon>
              </Tooltip>

              {/* User menu */}
              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <UnstyledButton>
                    <Group gap="sm">
                      <Avatar
                        src={user?.avatar}
                        alt={user?.name || 'User'}
                        radius="xl"
                        size="sm"
                      >
                        {user?.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" fw={500} truncate>
                          {user?.name || 'Loading...'}
                        </Text>
                        <Text size="xs" c="dimmed" truncate>
                          {user?.email}
                        </Text>
                      </div>
                      
                      <IconChevronDown size="0.9rem" />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>Account</Menu.Label>
                  
                  <Menu.Item
                    leftSection={<IconUser size="0.9rem" />}
                    component={Link}
                    href="/profile"
                  >
                    Profile
                  </Menu.Item>
                  
                  <Menu.Item
                    leftSection={<IconSettings size="0.9rem" />}
                    component={Link}
                    href="/settings"
                  >
                    Settings
                  </Menu.Item>

                  <Menu.Divider />

                  <Menu.Item
                    leftSection={<IconLogout size="0.9rem" />}
                    color="red"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </AppShell.Header>

        {/* Navbar */}
        <AppShell.Navbar p="md">
          <Navbar />
        </AppShell.Navbar>

        {/* Main content */}
        <AppShell.Main>
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <Breadcrumbs mb="md" separator="→">
              {breadcrumbItems}
            </Breadcrumbs>
          )}
          <SearchSpotlight onClose={spotlight.close} opened={false} />
          
          {children}
        </AppShell.Main>
      </AppShell>
    </>
  );
}
