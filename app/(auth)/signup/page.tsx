/**
 * Sign Up Page for ThinkSpace
 * 
 * This page provides user registration functionality with form validation,
 * password confirmation, terms acceptance, and account creation.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Text,
  Progress
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconMail, IconLock, IconUser, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import Link from 'next/link';

interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
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

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<SignUpFormData>({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
    validate: {
      name: (value) => {
        if (!value) return 'Name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        return null;
      },
      email: (value) => {
        if (!value) return 'Email is required';
        if (!/^\S+@\S+$/.test(value)) return 'Invalid email format';
        return null;
      },
      password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(value)) {
          return 'Password must contain uppercase, lowercase, and number';
        }
        return null;
      },
      confirmPassword: (value, values) => {
        if (!value) return 'Please confirm your password';
        if (value !== values.password) return 'Passwords do not match';
        return null;
      },
      acceptTerms: (value) => {
        if (!value) return 'You must accept the terms and conditions';
        return null;
      },
    },
  });

  const passwordStrength = getPasswordStrength(form.values.password);

  const handleSubmit = async (values: SignUpFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          confirmPassword: values.confirmPassword,
          acceptTerms: values.acceptTerms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        notifications.show({
          title: 'Registration Failed',
          message: data.error || 'Please check your information and try again.',
          color: 'red',
          icon: <IconAlertCircle size="1rem" />,
        });
      } else {
        notifications.show({
          title: 'Account Created!',
          message: 'Your account has been created successfully. Please sign in.',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
        router.push('/signin?message=Account created successfully');
      }
    } catch (error) {
      console.error('Registration error:', error);
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
          Create your account
        </Title>
        <Text ta="center" c="dimmed" size="sm">
          Join ThinkSpace and start organizing your knowledge
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
            label="Full Name"
            placeholder="John Doe"
            leftSection={<IconUser size="1rem" />}
            required
            {...form.getInputProps('name')}
          />

          <TextInput
            label="Email"
            placeholder="your@email.com"
            leftSection={<IconMail size="1rem" />}
            required
            {...form.getInputProps('email')}
          />

          <div>
            <PasswordInput
              label="Password"
              placeholder="Create a strong password"
              leftSection={<IconLock size="1rem" />}
              required
              {...form.getInputProps('password')}
            />
            {form.values.password && (
              <div style={{ marginTop: '0.5rem' }}>
                <Progress
                  value={passwordStrength}
                  color={getPasswordStrengthColor(passwordStrength)}
                  size="xs"
                />
                <Text size="xs" c="dimmed" mt="xs">
                  Password strength: {passwordStrength < 50 ? 'Weak' : passwordStrength < 75 ? 'Medium' : 'Strong'}
                </Text>
              </div>
            )}
          </div>

          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm your password"
            leftSection={<IconLock size="1rem" />}
            required
            {...form.getInputProps('confirmPassword')}
          />

          <Checkbox
            label={
              <Text size="sm">
                I accept the{' '}
                <Anchor href="/terms" target="_blank" size="sm">
                  Terms of Service
                </Anchor>{' '}
                and{' '}
                <Anchor href="/privacy" target="_blank" size="sm">
                  Privacy Policy
                </Anchor>
              </Text>
            }
            required
            {...form.getInputProps('acceptTerms', { type: 'checkbox' })}
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            size="md"
            gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
          >
            Create Account
          </Button>
        </Stack>
      </form>

      <Divider label="or" labelPosition="center" />

      <Group justify="center" gap="xs">
        <Text size="sm" c="dimmed">
          Already have an account?
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
