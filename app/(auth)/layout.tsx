/**
 * Authentication Layout for ThinkSpace
 * 
 * This layout component provides a consistent structure for authentication
 * pages including login, registration, and password reset forms.
 */

import { ReactNode } from 'react';
import { Container, Paper, Title, Text, Group, Stack } from '@mantine/core';
import { IconBrain } from '@tabler/icons-react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <Container size="sm" style={{ width: '100%', maxWidth: '480px' }}>
        <Paper
          radius="lg"
          p="xl"
          shadow="xl"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <Stack gap="lg">
            {/* Logo and Brand */}
            <Group justify="center" gap="sm">
              <IconBrain size={32} color="#667eea" />
              <Title order={2} c="#667eea" fw={700}>
                ThinkSpace
              </Title>
            </Group>
            
            <Text ta="center" c="dimmed" size="sm">
              Your PARA methodology knowledge management system
            </Text>

            {/* Authentication Form Content */}
            {children}
          </Stack>
        </Paper>
      </Container>
    </div>
  );
}
