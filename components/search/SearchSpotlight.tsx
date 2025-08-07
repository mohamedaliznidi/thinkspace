/**
 * Search Spotlight Component for ThinkSpace
 * 
 * This component provides a command palette-style search interface
 * with quick navigation, content search, and action shortcuts.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Spotlight,
  SpotlightActionData,
  SpotlightActionGroupData,
} from '@mantine/spotlight';
import {
  IconDashboard,
  IconTarget,
  IconMap,
  IconBookmark,
  IconArchive,
  IconMessageCircle,
  IconNetwork,
  IconSearch,
  IconPlus,
  IconNote,
  IconFile,
  IconUser,
  IconSettings,
} from '@tabler/icons-react';
import { getParaColor } from '@/lib/theme';

interface SearchSpotlightProps {
  opened: boolean;
  onClose: () => void;
}

export function SearchSpotlight({ opened, onClose }: SearchSpotlightProps) {
  const router = useRouter();
  const [searchResults, setSearchResults] = useState<SpotlightActionData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Static navigation actions
  const navigationActions: SpotlightActionGroupData = {
    group: 'Navigation',
    actions: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        description: 'Go to main dashboard',
        onClick: () => router.push('/dashboard'),
        leftSection: <IconDashboard size="1.2rem" />,
      },
      {
        id: 'projects',
        label: 'Projects',
        description: 'Manage your projects',
        onClick: () => router.push('/projects'),
        leftSection: <IconTarget size="1.2rem" color={getParaColor('projects')} />,
      },
      {
        id: 'areas',
        label: 'Areas',
        description: 'Manage your areas of responsibility',
        onClick: () => router.push('/areas'),
        leftSection: <IconMap size="1.2rem" color={getParaColor('areas')} />,
      },
      {
        id: 'resources',
        label: 'Resources',
        description: 'Browse your resource library',
        onClick: () => router.push('/resources'),
        leftSection: <IconBookmark size="1.2rem" color={getParaColor('resources')} />,
      },
      {
        id: 'archive',
        label: 'Archive',
        description: 'View archived items',
        onClick: () => router.push('/archive'),
        leftSection: <IconArchive size="1.2rem" color={getParaColor('archive')} />,
      },
      {
        id: 'chat',
        label: 'Chat',
        description: 'Start a new conversation',
        onClick: () => router.push('/chat'),
        leftSection: <IconMessageCircle size="1.2rem" />,
      },
      {
        id: 'graph',
        label: 'Knowledge Graph',
        description: 'Explore knowledge connections',
        onClick: () => router.push('/graph'),
        leftSection: <IconNetwork size="1.2rem" />,
      },
      {
        id: 'notes',
        label: 'Notes',
        description: 'View all notes',
        onClick: () => router.push('/notes'),
        leftSection: <IconNote size="1.2rem" />,
      },
    ],
  };

  // Quick action shortcuts
  const quickActions: SpotlightActionGroupData = {
    group: 'Quick Actions',
    actions: [
      {
        id: 'new-project',
        label: 'New Project',
        description: 'Create a new project',
        onClick: () => router.push('/projects/new'),
        leftSection: <IconPlus size="1.2rem" color={getParaColor('projects')} />,
      },
      {
        id: 'new-area',
        label: 'New Area',
        description: 'Create a new area of responsibility',
        onClick: () => router.push('/areas/new'),
        leftSection: <IconPlus size="1.2rem" color={getParaColor('areas')} />,
      },
      {
        id: 'upload-resource',
        label: 'Upload Resource',
        description: 'Upload a new resource',
        onClick: () => router.push('/resources/upload'),
        leftSection: <IconPlus size="1.2rem" color={getParaColor('resources')} />,
      },
      {
        id: 'new-note',
        label: 'New Note',
        description: 'Create a new note',
        onClick: () => router.push('/notes/new'),
        leftSection: <IconPlus size="1.2rem" />,
      },
      {
        id: 'new-chat',
        label: 'New Chat',
        description: 'Start a new conversation',
        onClick: () => router.push('/chat/new'),
        leftSection: <IconPlus size="1.2rem" />,
      },
    ],
  };

  // Account actions
  const accountActions: SpotlightActionGroupData = {
    group: 'Account',
    actions: [
      {
        id: 'profile',
        label: 'Profile',
        description: 'View and edit your profile',
        onClick: () => router.push('/profile'),
        leftSection: <IconUser size="1.2rem" />,
      },
      {
        id: 'settings',
        label: 'Settings',
        description: 'Application settings',
        onClick: () => router.push('/settings'),
        leftSection: <IconSettings size="1.2rem" />,
      },
    ],
  };

  // Search for content
  const searchContent = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        const results: SpotlightActionData[] = data.results.map((item: any) => ({
          id: `${item.type}-${item.id}`,
          label: item.title,
          description: `${item.type} • ${item.description || 'No description'}`,
          onClick: () => router.push(`/${item.type}s/${item.id}`),
          leftSection: getIconForType(item.type),
        }));
        
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'project':
        return <IconTarget size="1.2rem" color={getParaColor('projects')} />;
      case 'area':
        return <IconMap size="1.2rem" color={getParaColor('areas')} />;
      case 'resource':
        return <IconBookmark size="1.2rem" color={getParaColor('resources')} />;
      case 'note':
        return <IconNote size="1.2rem" />;
      case 'chat':
        return <IconMessageCircle size="1.2rem" />;
      default:
        return <IconFile size="1.2rem" />;
    }
  };

  // Combine all actions
  const allActions = [
    navigationActions,
    quickActions,
    accountActions,
  ];

  // Add search results if available
  if (searchResults.length > 0) {
    allActions.unshift({
      group: 'Search Results',
      actions: searchResults,
    });
  }

  return (
    <Spotlight
      actions={allActions}
      onQueryChange={searchContent}
      searchProps={{
        leftSection: <IconSearch size="1.2rem" />,
        placeholder: 'Search or navigate...',
      }}
      nothingFound="Nothing found..."
      highlightQuery
      limit={50}
      shortcut={['mod + K']}
      onSpotlightClose={onClose}
    />
  );
}
