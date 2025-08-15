/**
 * Authentication Error Page for ThinkSpace
 *
 * This page displays authentication errors with user-friendly messages
 * and provides options to retry or return to sign in.
 */

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Stack,
  Alert,
  Button,
  Title,
  Text,
  Group,
  Loader,
  Center
} from '@mantine/core';
import { IconAlertCircle, IconArrowLeft, IconRefresh } from '@tabler/icons-react';
import Link from 'next/link';

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The verification token has expired or has already been used.',
  Default: 'An error occurred during authentication.',
  Signin: 'Try signing in with a different account.',
  OAuthSignin: 'Try signing in with a different account.',
  OAuthCallback: 'Try signing in with a different account.',
  OAuthCreateAccount: 'Try signing in with a different account.',
  EmailCreateAccount: 'Try signing in with a different account.',
  Callback: 'Try signing in with a different account.',
  OAuthAccountNotLinked: 'To confirm your identity, sign in with the same account you used originally.',
  EmailSignin: 'Check your email address.',
  CredentialsSignin: 'Sign in failed. Check the details you provided are correct.',
  SessionRequired: 'Please sign in to access this page.',
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';

  const errorMessage = errorMessages[error] || errorMessages.Default;

  const getErrorTitle = (error: string): string => {
    switch (error) {
      case 'Configuration':
        return 'Server Configuration Error';
      case 'AccessDenied':
        return 'Access Denied';
      case 'Verification':
        return 'Verification Failed';
      case 'OAuthAccountNotLinked':
        return 'Account Not Linked';
      case 'CredentialsSignin':
        return 'Sign In Failed';
      case 'SessionRequired':
        return 'Authentication Required';
      default:
        return 'Authentication Error';
    }
  };

  const getErrorIcon = (error: string) => {
    return <IconAlertCircle size="1.2rem" />;
  };

  const getErrorColor = (error: string): string => {
    switch (error) {
      case 'AccessDenied':
        return 'orange';
      case 'Configuration':
        return 'red';
      default:
        return 'red';
    }
  };

  return (
    <Stack gap="lg">
      <div>
        <Title order={3} ta="center" mb="xs" c="red">
          {getErrorTitle(error)}
        </Title>
        <Text ta="center" c="dimmed" size="sm">
          We encountered an issue while trying to authenticate you
        </Text>
      </div>

      <Alert
        icon={getErrorIcon(error)}
        color={getErrorColor(error)}
        variant="light"
        title="Authentication Error"
      >
        {errorMessage}
      </Alert>

      <Stack gap="sm">
        <Button
          component={Link}
          href="/signin"
          leftSection={<IconArrowLeft size="1rem" />}
          variant="filled"
          fullWidth
        >
          Back to Sign In
        </Button>

        <Button
          onClick={() => window.location.reload()}
          leftSection={<IconRefresh size="1rem" />}
          variant="outline"
          fullWidth
        >
          Try Again
        </Button>
      </Stack>

      <Group justify="center" gap="xs" mt="md">
        <Text size="sm" c="dimmed">
          Need help?
        </Text>
        <Text
          component="a"
          href="mailto:support@thinkspace.com"
          size="sm"
          c="blue"
          style={{ textDecoration: 'none' }}
        >
          Contact Support
        </Text>
      </Group>
    </Stack>
  );
}

function ErrorPageLoading() {
  return (
    <Center h="400px">
      <Stack align="center" gap="md">
        <Loader size="lg" />
        <Text c="dimmed" size="sm">
          Loading error details...
        </Text>
      </Stack>
    </Center>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<ErrorPageLoading />}>
      <AuthErrorContent />
    </Suspense>
  );
}
