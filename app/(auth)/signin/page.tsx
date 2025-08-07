/**
 * Sign In Page for ThinkSpace
 * 
 * This page provides user authentication functionality with email/password
 * login, form validation, error handling, and integration with NextAuth.js.
 */

'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Alert,
  Anchor,
  Divider,
  Checkbox,
  Group,
  Title,
  Text
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconMail, IconLock, IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';

interface SignInFormData {
  email: string;
  password: string;
  remember: boolean;
}

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const form = useForm<SignInFormData>({
    initialValues: {
      email: '',
      password: '',
      remember: false,
    },
    validate: {
      email: (value) => {
        if (!value) return 'Email is required';
        if (!/^\S+@\S+$/.test(value)) return 'Invalid email format';
        return null;
      },
      password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return null;
      },
    },
  });

  const handleSubmit = async (values: SignInFormData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
        notifications.show({
          title: 'Sign In Failed',
          message: 'Invalid email or password. Please check your credentials.',
          color: 'red',
          icon: <IconAlertCircle size="1rem" />,
        });
      } else if (result?.ok) {
        notifications.show({
          title: 'Welcome back!',
          message: 'You have been successfully signed in.',
          color: 'green',
        });

        // Get the updated session and redirect
        const session = await getSession();
        if (session) {
          router.push(callbackUrl);
          router.refresh();
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
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

  return (
    <Stack gap="lg">
      <div>
        <Title order={3} ta="center" mb="xs">
          Welcome back
        </Title>
        <Text ta="center" c="dimmed" size="sm">
          Sign in to your ThinkSpace account
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

          <PasswordInput
            label="Password"
            placeholder="Your password"
            leftSection={<IconLock size="1rem" />}
            required
            {...form.getInputProps('password')}
          />

          <Group justify="space-between">
            <Checkbox
              label="Remember me"
              {...form.getInputProps('remember', { type: 'checkbox' })}
            />
            <Anchor
              component={Link}
              href="/forgot-password"
              size="sm"
              c="blue"
            >
              Forgot password?
            </Anchor>
          </Group>

          <Button
            type="submit"
            fullWidth
            loading={loading}
            size="md"
            gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
          >
            Sign In
          </Button>
        </Stack>
      </form>

      <Divider label="or" labelPosition="center" />

      <Group justify="center" gap="xs">
        <Text size="sm" c="dimmed">
          Don't have an account?
        </Text>
        <Anchor
          component={Link}
          href="/signup"
          size="sm"
          fw={500}
          c="blue"
        >
          Sign up
        </Anchor>
      </Group>
    </Stack>
  );
}
