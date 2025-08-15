/**
 * Reset Password Page for ThinkSpace
 *
 * This page provides password reset functionality with token validation
 * and new password setting.
 */

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  PasswordInput,
  Button,
  Stack,
  Alert,
  Anchor,
  Title,
  Text,
  Group,
  Progress,
  Loader,
  Center
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconLock, IconAlertCircle, IconCheck, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

// Password strength checker
const getPasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (/[a-z]/.test(password)) strength += 25;
  if (/[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password)) strength += 25;
  return strength;
};

const getPasswordStrengthColor = (strength: number): string => {
  if (strength < 50) return 'red';
  if (strength < 75) return 'yellow';
  return 'green';
};

function ResetPasswordContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const form = useForm<ResetPasswordFormData>({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validate: {
      password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
        if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/(?=.*[0-9])/.test(value)) return 'Password must contain at least one number';
        return null;
      },
      confirmPassword: (value, values) => {
        if (!value) return 'Please confirm your password';
        if (value !== values.password) return 'Passwords do not match';
        return null;
      },
    },
  });

  const passwordStrength = getPasswordStrength(form.values.password);

  // Check if token is present
  if (!token) {
    return (
      <Stack gap="lg">
        <div>
          <Title order={3} ta="center" mb="xs" c="red">
            Invalid Reset Link
          </Title>
          <Text ta="center" c="dimmed" size="sm">
            This password reset link is invalid or has expired
          </Text>
        </div>

        <Alert
          icon={<IconAlertCircle size="1rem" />}
          color="red"
          variant="light"
        >
          The password reset link is invalid or has expired. Please request a new one.
        </Alert>

        <Button
          component={Link}
          href="/forgot-password"
          leftSection={<IconArrowLeft size="1rem" />}
          variant="outline"
          fullWidth
        >
          Request New Reset Link
        </Button>
      </Stack>
    );
  }

  const handleSubmit = async (values: ResetPasswordFormData) => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Implement password reset API call
      // For now, just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setSuccess(true);
      notifications.show({
        title: 'Password Reset Successful',
        message: 'Your password has been reset successfully. You can now sign in.',
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
            Password Reset Complete
          </Title>
          <Text ta="center" c="dimmed" size="sm">
            Your password has been successfully reset
          </Text>
        </div>

        <Alert
          icon={<IconCheck size="1rem" />}
          color="green"
          variant="light"
        >
          Your password has been reset successfully. You can now sign in with your new password.
        </Alert>

        <Button
          component={Link}
          href="/signin"
          leftSection={<IconArrowLeft size="1rem" />}
          variant="filled"
          fullWidth
        >
          Sign In
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={3} ta="center" mb="xs">
          Reset your password
        </Title>
        <Text ta="center" c="dimmed" size="sm">
          Enter your new password below
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
          <div>
            <PasswordInput
              label="New Password"
              placeholder="Your new password"
              leftSection={<IconLock size="1rem" />}
              required
              {...form.getInputProps('password')}
            />
            {form.values.password && (
              <div style={{ marginTop: '8px' }}>
                <Text size="xs" c="dimmed" mb="4px">
                  Password strength
                </Text>
                <Progress
                  value={passwordStrength}
                  color={getPasswordStrengthColor(passwordStrength)}
                  size="sm"
                />
              </div>
            )}
          </div>

          <PasswordInput
            label="Confirm New Password"
            placeholder="Confirm your new password"
            leftSection={<IconLock size="1rem" />}
            required
            {...form.getInputProps('confirmPassword')}
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            size="md"
            gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
          >
            Reset Password
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

function ResetPasswordLoading() {
  return (
    <Center h="400px">
      <Stack align="center" gap="md">
        <Loader size="lg" />
        <Text c="dimmed" size="sm">
          Loading reset form...
        </Text>
      </Stack>
    </Center>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
