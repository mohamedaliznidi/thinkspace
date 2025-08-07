/**
 * Authentication Hooks for ThinkSpace
 * 
 * This file provides custom hooks for authentication operations,
 * session management, and user state handling.
 */

import { useState, useCallback } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconAlertCircle } from '@tabler/icons-react';

interface SignInData {
  email: string;
  password: string;
  remember?: boolean;
}

interface SignUpData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface UseAuthReturn {
  // State
  isLoading: boolean;
  isAuthenticated: boolean;
  user: any;
  
  // Actions
  signInWithCredentials: (data: SignInData) => Promise<boolean>;
  signUpWithCredentials: (data: SignUpData) => Promise<boolean>;
  signOutUser: () => Promise<void>;
  
  // Utilities
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const user = session?.user || null;

  // Sign in with credentials
  const signInWithCredentials = useCallback(async (data: SignInData): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        notifications.show({
          title: 'Sign In Failed',
          message: 'Invalid email or password. Please check your credentials.',
          color: 'red',
          icon: <IconAlertCircle size="1rem" />,
        });
        return false;
      }

      if (result?.ok) {
        notifications.show({
          title: 'Welcome back!',
          message: 'You have been successfully signed in.',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Sign in error:', error);
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
        color: 'red',
        icon: <IconAlertCircle size="1rem" />,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign up with credentials
  const signUpWithCredentials = useCallback(async (data: SignUpData): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        notifications.show({
          title: 'Registration Failed',
          message: result.error || 'Please check your information and try again.',
          color: 'red',
          icon: <IconAlertCircle size="1rem" />,
        });
        return false;
      }

      notifications.show({
        title: 'Account Created!',
        message: 'Your account has been created successfully. Please sign in.',
        color: 'green',
        icon: <IconCheck size="1rem" />,
      });

      // Redirect to sign in page
      router.push('/signin?message=Account created successfully');
      return true;
    } catch (error) {
      console.error('Sign up error:', error);
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
        color: 'red',
        icon: <IconAlertCircle size="1rem" />,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Sign out user
  const signOutUser = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      await signOut({ 
        redirect: true,
        callbackUrl: '/signin'
      });
      
      notifications.show({
        title: 'Signed Out',
        message: 'You have been successfully signed out.',
        color: 'blue',
        icon: <IconCheck size="1rem" />,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      notifications.show({
        title: 'Error',
        message: 'An error occurred while signing out.',
        color: 'red',
        icon: <IconAlertCircle size="1rem" />,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if user has specific role
  const hasRole = useCallback((role: string): boolean => {
    if (!user?.role) return false;
    
    const userRole = user.role;
    const roleHierarchy = ['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = roleHierarchy.indexOf(role);
    
    return userRoleIndex >= requiredRoleIndex;
  }, [user]);

  // Check if user has specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permission);
  }, [user]);

  return {
    isLoading: isLoading || status === 'loading',
    isAuthenticated,
    user,
    signInWithCredentials,
    signUpWithCredentials,
    signOutUser,
    hasRole,
    hasPermission,
  };
}
