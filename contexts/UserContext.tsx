/**
 * User Context for ThinkSpace
 * 
 * This context provides user state management, authentication status,
 * and user-related operations throughout the application.
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { User, UserPreferences, UserSettings } from '@/types';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  preferences: UserPreferences | null;
  settings: UserSettings | null;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!session?.user && status === 'authenticated';

  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!session?.user?.id) {
      setUser(null);
      setPreferences(null);
      setSettings(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user/profile');
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
        setPreferences(data.data.user.preferences || null);
        setSettings(data.data.user.settings || null);
      } else {
        console.error('Failed to fetch user profile');
        setUser(null);
        setPreferences(null);
        setSettings(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
      setPreferences(null);
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (data: Partial<User>) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setUser(result.data.user);
        setPreferences(result.data.user.preferences || null);
        setSettings(result.data.user.settings || null);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Update user preferences
  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!preferences) return;

    const updatedPreferences = { ...preferences, ...newPreferences };
    
    try {
      await updateProfile({ preferences: updatedPreferences });
      setPreferences(updatedPreferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  // Update user settings
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!settings) return;

    const updatedSettings = { ...settings, ...newSettings };
    
    try {
      await updateProfile({ settings: updatedSettings });
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    setIsLoading(true);
    await fetchUserProfile();
  };

  // Fetch user profile when session changes
  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    fetchUserProfile();
  }, [session, status]);

  const value: UserContextType = {
    user,
    isLoading: isLoading || status === 'loading',
    isAuthenticated,
    preferences,
    settings,
    updateProfile,
    updatePreferences,
    updateSettings,
    refreshUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to use the user context
export function useUser() {
  const context = useContext(UserContext);
  
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  
  return context;
}

// Export the context for advanced usage
export { UserContext };
