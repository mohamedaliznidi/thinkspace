/**
 * Forgot Password Page for ThinkSpace
 * 
 * This page provides password reset functionality with email validation
 * and integration with the authentication system.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TextInput,
  Button,
  Stack,
  Alert,
  Anchor,
  Title,
  Text,
  Group
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconMail, IconAlertCircle, IconCheck, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const form = useForm<ForgotPasswordFormData>({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => {
        if (!value) return 'Email is required';
        if (!/^\S+@\S+$/.test(value)) return 'Invalid email format';
        return null;
      },
    },
  });

  const handleSubmit = async (values: ForgotPasswordFormData) => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Implement password reset API call
      // For now, just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setSuccess(true);
      notifications.show({
        title: 'Reset Link Sent',
        message: 'If an account with that email exists, we\'ve sent a password reset link.',
        color: 'green',
        icon: <IconCheck size="1rem" />,
      });
    } catch (error) {
      console.error('Password reset error:', error);
      setError('An unexpected error occurred. Please try again.');
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
        color: 'red',
        icon: <IconAlertCircle size="1rem" />,
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Stack gap="lg">
        <div>
          <Title order={3} ta="center" mb="xs">
            Check your email
          </Title>
          <Text ta="center" c="dimmed" size="sm">
            We've sent a password reset link to your email address
          </Text>
        </div>

        <Alert
          icon={<IconCheck size="1rem" />}
          color="green"
          variant="light"
        >
          If an account with that email exists, you'll receive a password reset link shortly.
        </Alert>

        <Button
          component={Link}
          href="/signin"
          leftSection={<IconArrowLeft size="1rem" />}
          variant="outline"
          fullWidth
        >
          Back to Sign In
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={3} ta="center" mb="xs">
          Forgot your password?
        </Title>
        <Text ta="center" c="dimmed" size="sm">
          Enter your email address and we'll send you a reset link
        </Text>
      </div>

      {error && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          color="red"
          variant="light"
        >
          {error}
        </Alert>
      )}

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Email"
            placeholder="your@email.com"
            leftSection={<IconMail size="1rem" />}
            required
            {...form.getInputProps('email')}
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            size="md"
            gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
          >
            Send Reset Link
          </Button>
        </Stack>
      </form>

      <Group justify="center" gap="xs">
        <Text size="sm" c="dimmed">
          Remember your password?
        </Text>
        <Anchor
          component={Link}
          href="/signin"
          size="sm"
          fw={500}
          c="blue"
        >
          Sign in
        </Anchor>
      </Group>
    </Stack>
  );
}
