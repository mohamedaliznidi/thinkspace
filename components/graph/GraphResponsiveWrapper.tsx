/**
 * Responsive Wrapper for Graph Components
 * 
 * Provides responsive design and accessibility features for the graph visualization
 * system, ensuring proper functionality on desktop and tablet devices.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import { 
  Box, 
  Stack, 
  Group, 
  ActionIcon, 
  Tooltip, 
  Text,
  Alert,
  Button,
  Modal,
} from '@mantine/core';
import { 
  IconDeviceDesktop, 
  IconDeviceTablet, 
  IconDeviceMobile,
  IconAccessible,
  IconKeyboard,
  IconEye,
  IconVolume,
} from '@tabler/icons-react';
import type { GraphVisualizationProps } from '@/types/graph';

interface GraphResponsiveWrapperProps extends GraphVisualizationProps {
  children: React.ReactNode;
  enableAccessibility?: boolean;
  enableKeyboardNavigation?: boolean;
  enableScreenReader?: boolean;
}

interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export function GraphResponsiveWrapper({
  children,
  data,
  config,
  enableAccessibility = true,
  enableKeyboardNavigation = true,
  enableScreenReader = true,
  onNodeClick,
  onEdgeClick,
  onNodeHover,
  onEdgeHover,
  onBackgroundClick,
  ...props
}: GraphResponsiveWrapperProps) {
  const { width, height } = useViewportSize();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');
  
  // Accessibility state
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>({
    highContrast: false,
    reducedMotion: false,
    screenReaderMode: false,
    keyboardNavigation: enableKeyboardNavigation,
    fontSize: 'medium',
  });

  const [showAccessibilityModal, setShowAccessibilityModal] = useState(false);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<string[]>([]);

  // Responsive configuration
  const getResponsiveConfig = useCallback(() => {
    const baseConfig = { ...config };
    
    if (isMobile) {
      return {
        ...baseConfig,
        width: Math.min(width - 32, 400),
        height: Math.min(height - 200, 400),
        nodeSize: { ...baseConfig.nodeSize, min: 6, max: 20 },
        showLabels: false, // Hide labels on mobile for better performance
        showEdgeLabels: false,
        forceSettings: {
          ...baseConfig.forceSettings,
          linkDistance: 60,
          chargeStrength: -200,
        },
      };
    }
    
    if (isTablet) {
      return {
        ...baseConfig,
        width: Math.min(width - 64, 600),
        height: Math.min(height - 150, 500),
        nodeSize: { ...baseConfig.nodeSize, min: 7, max: 25 },
        forceSettings: {
          ...baseConfig.forceSettings,
          linkDistance: 80,
          chargeStrength: -250,
        },
      };
    }
    
    // Desktop configuration
    return {
      ...baseConfig,
      width: Math.min(width - 100, 1200),
      height: Math.min(height - 100, 800),
    };
  }, [config, width, height, isMobile, isTablet]);

  // Accessibility announcements
  const announce = useCallback((message: string) => {
    if (accessibilitySettings.screenReaderMode) {
      setAnnouncements(prev => [...prev.slice(-4), message]);
      
      // Clear announcement after 5 seconds
      setTimeout(() => {
        setAnnouncements(prev => prev.slice(1));
      }, 5000);
    }
  }, [accessibilitySettings.screenReaderMode]);

  // Enhanced event handlers with accessibility
  const handleNodeClickAccessible = useCallback((node: any, event: any) => {
    setFocusedNodeId(node.id);
    announce(`Selected ${node.type}: ${node.label}`);
    onNodeClick?.(node, event);
  }, [onNodeClick, announce]);

  const handleNodeHoverAccessible = useCallback((node: any) => {
    if (node && accessibilitySettings.screenReaderMode) {
      announce(`Hovering over ${node.type}: ${node.label}, ${node.connectionCount} connections`);
    }
    onNodeHover?.(node);
  }, [onNodeHover, announce, accessibilitySettings.screenReaderMode]);

  // Keyboard navigation
  useEffect(() => {
    if (!accessibilitySettings.keyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!data?.nodes.length) return;

      const currentIndex = focusedNodeId 
        ? data.nodes.findIndex(n => n.id === focusedNodeId)
        : -1;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % data.nodes.length;
          const nextNode = data.nodes[nextIndex];
          setFocusedNodeId(nextNode.id);
          announce(`Focused on ${nextNode.type}: ${nextNode.label}`);
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          const prevIndex = currentIndex <= 0 ? data.nodes.length - 1 : currentIndex - 1;
          const prevNode = data.nodes[prevIndex];
          setFocusedNodeId(prevNode.id);
          announce(`Focused on ${prevNode.type}: ${prevNode.label}`);
          break;

        case 'Enter':
        case ' ':
          if (focusedNodeId) {
            event.preventDefault();
            const focusedNode = data.nodes.find(n => n.id === focusedNodeId);
            if (focusedNode) {
              handleNodeClickAccessible(focusedNode, {
                type: 'node_click',
                nodeId: focusedNode.id,
                modifiers: { ctrl: false, shift: false, alt: false },
              });
            }
          }
          break;

        case 'Escape':
          setFocusedNodeId(null);
          announce('Cleared selection');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [data, focusedNodeId, accessibilitySettings.keyboardNavigation, announce, handleNodeClickAccessible]);

  // Apply accessibility settings to CSS
  useEffect(() => {
    const root = document.documentElement;
    
    if (accessibilitySettings.highContrast) {
      root.style.setProperty('--graph-contrast-mode', 'high');
    } else {
      root.style.removeProperty('--graph-contrast-mode');
    }
    
    if (accessibilitySettings.reducedMotion) {
      root.style.setProperty('--graph-animation-duration', '0ms');
    } else {
      root.style.removeProperty('--graph-animation-duration');
    }
    
    const fontSizeMap = { small: '0.875rem', medium: '1rem', large: '1.125rem' };
    root.style.setProperty('--graph-font-size', fontSizeMap[accessibilitySettings.fontSize]);
  }, [accessibilitySettings]);

  const getDeviceIcon = () => {
    if (isMobile) return <IconDeviceMobile size="1rem" />;
    if (isTablet) return <IconDeviceTablet size="1rem" />;
    return <IconDeviceDesktop size="1rem" />;
  };

  const responsiveConfig = getResponsiveConfig();

  return (
    <Box
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
      {...props}
    >
      {/* Device indicator */}
      <Group
        gap="xs"
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.75rem',
        }}
      >
        {getDeviceIcon()}
        <Text size="xs" c="dimmed">
          {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}
        </Text>
      </Group>

      {/* Accessibility controls */}
      {enableAccessibility && (
        <Group
          gap="xs"
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 10,
          }}
        >
          <Tooltip label="Accessibility Settings">
            <ActionIcon
              variant="filled"
              color="blue"
              size="sm"
              onClick={() => setShowAccessibilityModal(true)}
            >
              <IconAccessible size="0.8rem" />
            </ActionIcon>
          </Tooltip>
        </Group>
      )}

      {/* Mobile warning */}
      {isMobile && (
        <Alert
          color="orange"
          title="Mobile View"
          style={{
            position: 'absolute',
            top: 40,
            left: 8,
            right: 8,
            zIndex: 10,
          }}
        >
          <Text size="sm">
            Graph functionality is limited on mobile. Use tablet or desktop for full experience.
          </Text>
        </Alert>
      )}

      {/* Screen reader announcements */}
      {accessibilitySettings.screenReaderMode && (
        <div
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            left: '-10000px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >
          {announcements.map((announcement, index) => (
            <div key={index}>{announcement}</div>
          ))}
        </div>
      )}

      {/* Main content with responsive config */}
      {React.isValidElement(children) ? React.cloneElement(children, {
        data,
        config: responsiveConfig,
        onNodeClick: handleNodeClickAccessible,
        onNodeHover: handleNodeHoverAccessible,
        onEdgeClick,
        onEdgeHover,
        onBackgroundClick,
      } as any) : children}

      {/* Accessibility Settings Modal */}
      <Modal
        opened={showAccessibilityModal}
        onClose={() => setShowAccessibilityModal(false)}
        title="Accessibility Settings"
        size="md"
      >
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="xs">
              <IconEye size="1rem" />
              <Text size="sm">High Contrast</Text>
            </Group>
            <Button
              variant={accessibilitySettings.highContrast ? 'filled' : 'outline'}
              size="xs"
              onClick={() => setAccessibilitySettings(prev => ({
                ...prev,
                highContrast: !prev.highContrast
              }))}
            >
              {accessibilitySettings.highContrast ? 'On' : 'Off'}
            </Button>
          </Group>

          <Group justify="space-between">
            <Group gap="xs">
              <IconVolume size="1rem" />
              <Text size="sm">Screen Reader Mode</Text>
            </Group>
            <Button
              variant={accessibilitySettings.screenReaderMode ? 'filled' : 'outline'}
              size="xs"
              onClick={() => setAccessibilitySettings(prev => ({
                ...prev,
                screenReaderMode: !prev.screenReaderMode
              }))}
            >
              {accessibilitySettings.screenReaderMode ? 'On' : 'Off'}
            </Button>
          </Group>

          <Group justify="space-between">
            <Group gap="xs">
              <IconKeyboard size="1rem" />
              <Text size="sm">Keyboard Navigation</Text>
            </Group>
            <Button
              variant={accessibilitySettings.keyboardNavigation ? 'filled' : 'outline'}
              size="xs"
              onClick={() => setAccessibilitySettings(prev => ({
                ...prev,
                keyboardNavigation: !prev.keyboardNavigation
              }))}
            >
              {accessibilitySettings.keyboardNavigation ? 'On' : 'Off'}
            </Button>
          </Group>

          <Text size="xs" c="dimmed" mt="md">
            Use arrow keys to navigate nodes, Enter/Space to select, Escape to clear selection.
          </Text>
        </Stack>
      </Modal>
    </Box>
  );
}
