/**
 * User Preferences Manager for ThinkSpace
 *
 * Handles unified user preferences and settings across all PARA categories
 * with real-time synchronization and consistency.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Type definitions for Zustand store
interface PreferencesState {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  updateCategory: <K extends keyof UserPreferences>(category: K, updates: Partial<UserPreferences[K]>) => void;
  resetPreferences: () => void;
  resetCategory: <K extends keyof UserPreferences>(category: K) => void;
  syncPreferences: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  exportPreferences: () => string;
  importPreferences: (data: string) => boolean;
}

// User preference categories
export interface UserPreferences {
  // Display preferences
  display: {
    theme: 'light' | 'dark' | 'auto';
    colorScheme: 'default' | 'colorful' | 'minimal';
    density: 'compact' | 'comfortable' | 'spacious';
    fontSize: 'small' | 'medium' | 'large';
    showAnimations: boolean;
    showTooltips: boolean;
  };

  // Layout preferences
  layout: {
    sidebarCollapsed: boolean;
    sidebarWidth: number;
    showQuickActions: boolean;
    showRecentItems: boolean;
    defaultView: 'grid' | 'list' | 'kanban';
    itemsPerPage: number;
  };

  // Search preferences
  search: {
    defaultSearchType: 'text' | 'semantic' | 'hybrid';
    includeArchived: boolean;
    maxResults: number;
    saveSearchHistory: boolean;
    showSuggestions: boolean;
  };

  // Notification preferences
  notifications: {
    enabled: boolean;
    realTimeUpdates: boolean;
    conflictAlerts: boolean;
    syncStatus: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };

  // PARA-specific preferences
  para: {
    projects: {
      defaultStatus: string;
      defaultPriority: string;
      showProgress: boolean;
      autoArchiveCompleted: boolean;
      reminderSettings: {
        enabled: boolean;
        daysBeforeDue: number;
      };
    };
    areas: {
      defaultType: string;
      showHealthScore: boolean;
      autoCalculateHealth: boolean;
      reviewFrequency: 'weekly' | 'monthly' | 'quarterly';
    };
    resources: {
      defaultType: string;
      autoExtractContent: boolean;
      showPreview: boolean;
      groupByType: boolean;
    };
    notes: {
      defaultType: string;
      autoSave: boolean;
      autoSaveInterval: number; // in seconds
      showWordCount: boolean;
      enableMarkdown: boolean;
    };
  };

  // Sync preferences
  sync: {
    enabled: boolean;
    optimisticUpdates: boolean;
    conflictResolution: 'manual' | 'server_wins' | 'client_wins';
    offlineMode: boolean;
    syncInterval: number; // in seconds
  };

  // Privacy preferences
  privacy: {
    shareUsageData: boolean;
    enableAnalytics: boolean;
    dataRetention: '30days' | '90days' | '1year' | 'forever';
  };

  // Accessibility preferences
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    screenReaderOptimized: boolean;
    keyboardNavigation: boolean;
    focusIndicators: boolean;
  };

  // Advanced preferences
  advanced: {
    enableBetaFeatures: boolean;
    debugMode: boolean;
    performanceMode: boolean;
    customCSS: string;
  };
}

// Default preferences
const defaultPreferences: UserPreferences = {
  display: {
    theme: 'auto',
    colorScheme: 'default',
    density: 'comfortable',
    fontSize: 'medium',
    showAnimations: true,
    showTooltips: true,
  },
  layout: {
    sidebarCollapsed: false,
    sidebarWidth: 280,
    showQuickActions: true,
    showRecentItems: true,
    defaultView: 'grid',
    itemsPerPage: 20,
  },
  search: {
    defaultSearchType: 'hybrid',
    includeArchived: false,
    maxResults: 50,
    saveSearchHistory: true,
    showSuggestions: true,
  },
  notifications: {
    enabled: true,
    realTimeUpdates: true,
    conflictAlerts: true,
    syncStatus: true,
    emailNotifications: false,
    pushNotifications: false,
  },
  para: {
    projects: {
      defaultStatus: 'PLANNING',
      defaultPriority: 'MEDIUM',
      showProgress: true,
      autoArchiveCompleted: false,
      reminderSettings: {
        enabled: true,
        daysBeforeDue: 3,
      },
    },
    areas: {
      defaultType: 'RESPONSIBILITY',
      showHealthScore: true,
      autoCalculateHealth: true,
      reviewFrequency: 'monthly',
    },
    resources: {
      defaultType: 'REFERENCE',
      autoExtractContent: true,
      showPreview: true,
      groupByType: false,
    },
    notes: {
      defaultType: 'QUICK',
      autoSave: true,
      autoSaveInterval: 30,
      showWordCount: false,
      enableMarkdown: true,
    },
  },
  sync: {
    enabled: true,
    optimisticUpdates: true,
    conflictResolution: 'manual',
    offlineMode: true,
    syncInterval: 30,
  },
  privacy: {
    shareUsageData: false,
    enableAnalytics: false,
    dataRetention: '1year',
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    screenReaderOptimized: false,
    keyboardNavigation: true,
    focusIndicators: true,
  },
  advanced: {
    enableBetaFeatures: false,
    debugMode: false,
    performanceMode: false,
    customCSS: '',
  },
};

// Preference store interface
interface PreferenceStore {
  preferences: UserPreferences;
  isLoading: boolean;
  lastSynced: Date | null;
  
  // Actions
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  updateCategory: <K extends keyof UserPreferences>(
    category: K,
    updates: Partial<UserPreferences[K]>
  ) => void;
  resetPreferences: () => void;
  resetCategory: <K extends keyof UserPreferences>(category: K) => void;
  
  // Sync actions
  syncPreferences: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  
  // Utility actions
  exportPreferences: () => string;
  importPreferences: (data: string) => boolean;
}

// Create preference store
export const usePreferences = create<PreferenceStore>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,
      isLoading: false,
      lastSynced: null,

      // Update entire preferences object
      updatePreferences: (updates: Partial<UserPreferences>) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...updates,
          },
          lastSynced: new Date(),
        }));
      },

      // Update specific category
      updateCategory: <K extends keyof UserPreferences>(
        category: K,
        updates: Partial<UserPreferences[K]>
      ) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            [category]: {
              ...state.preferences[category],
              ...updates,
            },
          },
          lastSynced: new Date(),
        }));
      },

      // Reset all preferences to defaults
      resetPreferences: () => {
        set({
          preferences: defaultPreferences,
          lastSynced: new Date(),
        });
      },

      // Reset specific category to defaults
      resetCategory: <K extends keyof UserPreferences>(category: K) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            [category]: defaultPreferences[category],
          },
          lastSynced: new Date(),
        }));
      },

      // Sync preferences with server
      syncPreferences: async () => {
        set({ isLoading: true });
        
        try {
          const { preferences } = get();
          
          const response = await fetch('/api/user/preferences', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(preferences),
          });

          if (response.ok) {
            set({ lastSynced: new Date() });
          } else {
            console.error('Failed to sync preferences');
          }
        } catch (error) {
          console.error('Error syncing preferences:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Load preferences from server
      loadPreferences: async () => {
        set({ isLoading: true });
        
        try {
          const response = await fetch('/api/user/preferences');
          
          if (response.ok) {
            const serverPreferences = await response.json();
            set({
              preferences: {
                ...defaultPreferences,
                ...serverPreferences.data,
              },
              lastSynced: new Date(),
            });
          }
        } catch (error) {
          console.error('Error loading preferences:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Export preferences as JSON string
      exportPreferences: () => {
        const { preferences } = get();
        return JSON.stringify(preferences, null, 2);
      },

      // Import preferences from JSON string
      importPreferences: (data: string) => {
        try {
          const importedPreferences = JSON.parse(data);
          
          // Validate structure (basic check)
          if (typeof importedPreferences === 'object' && importedPreferences !== null) {
            set({
              preferences: {
                ...defaultPreferences,
                ...importedPreferences,
              },
              lastSynced: new Date(),
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error importing preferences:', error);
          return false;
        }
      },
    }),
    {
      name: 'thinkspace-preferences',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: PreferenceStore) => ({
        preferences: state.preferences,
        lastSynced: state.lastSynced,
      }),
    }
  )
);

// Utility hooks for specific preference categories
export const useDisplayPreferences = () => {
  const preferences = usePreferences((state: PreferenceStore) => state.preferences.display);
  const updateCategory = usePreferences((state: PreferenceStore) => state.updateCategory);
  
  return {
    ...preferences,
    update: (updates: Partial<UserPreferences['display']>) => 
      updateCategory('display', updates),
  };
};

export const useLayoutPreferences = () => {
  const preferences = usePreferences((state: PreferenceStore) => state.preferences.layout);
  const updateCategory = usePreferences((state: PreferenceStore) => state.updateCategory);
  
  return {
    ...preferences,
    update: (updates: Partial<UserPreferences['layout']>) => 
      updateCategory('layout', updates),
  };
};

export const useSearchPreferences = () => {
  const preferences = usePreferences((state: PreferenceStore) => state.preferences.search);
  const updateCategory = usePreferences((state: PreferenceStore) => state.updateCategory);
  
  return {
    ...preferences,
    update: (updates: Partial<UserPreferences['search']>) => 
      updateCategory('search', updates),
  };
};

export const useNotificationPreferences = () => {
  const preferences = usePreferences((state: PreferenceStore) => state.preferences.notifications);
  const updateCategory = usePreferences((state: PreferenceStore) => state.updateCategory);
  
  return {
    ...preferences,
    update: (updates: Partial<UserPreferences['notifications']>) => 
      updateCategory('notifications', updates),
  };
};

export const useParaPreferences = () => {
  const preferences = usePreferences((state: PreferenceStore) => state.preferences.para);
  const updateCategory = usePreferences((state: PreferenceStore) => state.updateCategory);
  
  return {
    ...preferences,
    update: (updates: Partial<UserPreferences['para']>) => 
      updateCategory('para', updates),
  };
};

export const useSyncPreferences = () => {
  const preferences = usePreferences((state: PreferenceStore) => state.preferences.sync);
  const updateCategory = usePreferences((state: PreferenceStore) => state.updateCategory);
  
  return {
    ...preferences,
    update: (updates: Partial<UserPreferences['sync']>) => 
      updateCategory('sync', updates),
  };
};

// Preference validation utilities
export const validatePreferences = (preferences: unknown): boolean => {
  // Basic validation - in a real app, you'd want more comprehensive validation
  return (
    typeof preferences === 'object' &&
    preferences !== null &&
    typeof (preferences as any).display === 'object' &&
    typeof (preferences as any).layout === 'object' &&
    typeof (preferences as any).search === 'object'
  );
};

// Preference migration utilities
export const migratePreferences = (oldPreferences: unknown, version: string): UserPreferences => {
  // Handle preference migrations between versions
  // For now, just merge with defaults
  return {
    ...defaultPreferences,
    ...(oldPreferences as Partial<UserPreferences>),
  };
};
