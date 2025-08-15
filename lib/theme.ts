/**
 * Mantine Theme Configuration for ThinkSpace
 * 
 * This file defines the custom theme for the ThinkSpace application,
 * including colors, typography, component defaults, and responsive design.
 */

import { createTheme, MantineColorsTuple, rem } from '@mantine/core';

// Custom color palette for knowledge management
const thinkspaceBlue: MantineColorsTuple = [
  '#e7f5ff',
  '#d0ebff',
  '#a5d8ff',
  '#74c0fc',
  '#339af0',
  '#228be6',
  '#1c7ed6',
  '#1971c2',
  '#1864ab',
  '#145a94'
];

const thinkspacePurple: MantineColorsTuple = [
  '#f3f0ff',
  '#e5dbff',
  '#d0bfff',
  '#b197fc',
  '#9775fa',
  '#845ef7',
  '#7950f2',
  '#7048e8',
  '#6741d9',
  '#5f3dc4'
];

const thinkspaceGreen: MantineColorsTuple = [
  '#ebfbee',
  '#d3f9d8',
  '#b2f2bb',
  '#8ce99a',
  '#69db7c',
  '#51cf66',
  '#40c057',
  '#37b24d',
  '#2f9e44',
  '#2b8a3e'
];

const thinkspaceOrange: MantineColorsTuple = [
  '#fff4e6',
  '#ffe8cc',
  '#ffd8a8',
  '#ffc078',
  '#ffa94d',
  '#ff922b',
  '#fd7e14',
  '#f76707',
  '#e8590c',
  '#d9480f'
];

export const theme = createTheme({
  // Color scheme
  colors: {
    'thinkspace-blue': thinkspaceBlue,
    'thinkspace-purple': thinkspacePurple,
    'thinkspace-green': thinkspaceGreen,
    'thinkspace-orange': thinkspaceOrange,
  },

  // Primary color
  primaryColor: 'thinkspace-blue',

  // Typography
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  fontFamilyMonospace: 'JetBrains Mono, Monaco, Courier New, monospace',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: rem(34), lineHeight: '1.3' },
      h2: { fontSize: rem(26), lineHeight: '1.35' },
      h3: { fontSize: rem(22), lineHeight: '1.4' },
      h4: { fontSize: rem(18), lineHeight: '1.45' },
      h5: { fontSize: rem(16), lineHeight: '1.5' },
      h6: { fontSize: rem(14), lineHeight: '1.5' },
    },
  },

  // Spacing
  spacing: {
    xs: rem(8),
    sm: rem(12),
    md: rem(16),
    lg: rem(24),
    xl: rem(32),
  },

  // Border radius
  radius: {
    xs: rem(4),
    sm: rem(6),
    md: rem(8),
    lg: rem(12),
    xl: rem(16),
  },

  // Shadows
  shadows: {
    xs: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 6px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.05), 0 20px 25px rgba(0, 0, 0, 0.1)',
    xl: '0 25px 50px rgba(0, 0, 0, 0.15)',
  },

  // Component defaults
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
      styles: {
        root: {
          fontWeight: 500,
          transition: 'all 0.2s ease',
        },
      },
    },

    Card: {
      defaultProps: {
        radius: 'lg',
        shadow: 'sm',
        padding: 'lg',
      },
      styles: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },

    Paper: {
      defaultProps: {
        radius: 'md',
        shadow: 'xs',
      },
    },

    TextInput: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },

    PasswordInput: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },

    Textarea: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },

    Select: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },

    MultiSelect: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },

    Modal: {
      defaultProps: {
        radius: 'lg',
        shadow: 'xl',
        overlayProps: {
          backgroundOpacity: 0.55,
          blur: 3,
        },
      },
    },

    Drawer: {
      defaultProps: {
        overlayProps: {
          backgroundOpacity: 0.55,
          blur: 3,
        },
      },
    },

    Notification: {
      defaultProps: {
        radius: 'md',
      },
    },

    Badge: {
      defaultProps: {
        radius: 'sm',
        size: 'sm',
      },
    },

    Tooltip: {
      defaultProps: {
        radius: 'md',
        withArrow: true,
      },
    },

    ActionIcon: {
      defaultProps: {
        radius: 'md',
        size: 'md',
      },
    },

    Tabs: {
      defaultProps: {
        radius: 'md',
      },
    },

    Accordion: {
      defaultProps: {
        radius: 'md',
      },
    },

    Menu: {
      defaultProps: {
        radius: 'md',
        shadow: 'md',
      },
    },

    Popover: {
      defaultProps: {
        radius: 'md',
        shadow: 'md',
        withArrow: true,
      },
    },
  },

  // Breakpoints for responsive design
  breakpoints: {
    xs: '30em',    // 480px
    sm: '48em',    // 768px
    md: '64em',    // 1024px
    lg: '74em',    // 1184px
    xl: '90em',    // 1440px
  },

  // Other theme properties
  other: {
    // Custom properties for ThinkSpace
    paraColors: {
      projects: '#228be6',    // Blue
      areas: '#7950f2',       // Purple
      resources: '#51cf66',   // Green
      archive: '#868e96',     // Gray
    },
    
    // Knowledge graph colors
    graphColors: {
      node: '#339af0',
      edge: '#adb5bd',
      highlight: '#ff922b',
      cluster: '#e599f7',
    },
    
    // Chat interface colors
    chatColors: {
      user: '#228be6',
      assistant: '#7950f2',
      system: '#51cf66',
      background: '#f8f9fa',
    },
  },
});

// Export theme-related utilities
export const getParaColor = (type: 'projects' | 'areas' | 'resources' | 'archive'): string => {
  return theme.other?.paraColors[type];
};

export const getGraphColor = (type: 'node' | 'edge' | 'highlight' | 'cluster'): string => {
  return theme.other?.graphColors[type];
};

export const getChatColor = (type: 'user' | 'assistant' | 'system' | 'background'): string => {
  return theme.other?.chatColors[type];
};
