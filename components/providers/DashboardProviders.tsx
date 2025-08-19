/**
 * Dashboard Providers for ThinkSpace
 * 
 * This component wraps all client-side providers needed for the dashboard,
 * including SessionProvider, UserProvider, and AppShellLayout.
 */

'use client';

import { ReactNode } from 'react';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { UserProvider } from '@/contexts/UserContext';
import { AppShellLayout } from '@/components/layout/AppShell';
import { SyncProvider } from '@/components/providers/SyncProvider';

interface DashboardProvidersProps {
  children: ReactNode;
  session: Session | null;
}

export function DashboardProviders({ children, session }: DashboardProvidersProps) {
  return (
    <SessionProvider session={session}>
      <UserProvider>
        <SyncProvider enableNotifications={true} enableOfflineMode={true}>
          <AppShellLayout>
            {children}
          </AppShellLayout>
        </SyncProvider>
      </UserProvider>
    </SessionProvider>
  );
}
