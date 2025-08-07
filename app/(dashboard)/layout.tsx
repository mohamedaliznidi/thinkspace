/**
 * Dashboard Layout for ThinkSpace
 *
 * This layout component provides the main application structure
 * for authenticated users with app shell, navigation, and providers.
 */

import { ReactNode } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { DashboardProviders } from '@/components/providers/DashboardProviders';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Get session for providers (middleware handles authentication redirects)
  const session = await getServerSession(authOptions);

  return (
    <DashboardProviders session={session}>
      {children}
    </DashboardProviders>
  );
}
