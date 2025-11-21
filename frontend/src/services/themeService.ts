/**
 * Service layer for theme operations
 * Implements offline-first architecture:
 * - ALL CRUD operations work with local database (IndexedDB/SQLite) only
 * - Changes are queued in outbox
 * - Sync with server happens periodically (via health check) or manually
 */

import { Theme, ThemeColors } from '@/types/themeTypes';
import { log } from '@/lib/logger';
import { getRepositoryDriver } from '@/repository';
import type { IRepositoryDriver, RepoTheme } from '@/repository/types';

export interface CreateThemeRequest {
  name: string;
  colors: ThemeColors;
  custom: boolean;
}

export interface UpdateThemeRequest {
  themeId: string;
  name?: string;
  colors?: ThemeColors;
}

// Predefined themes (local-only, never synced)
const PREDEFINED_THEMES: RepoTheme[] = [
  {
    id: 'theme-light',
    name: 'Light',
    colors: {
      'nav-sidebar': { background: '#acacacff', text: '#1f2937' },
      explorer: {
        background: '#c8c8c8ff',
        item: {
          'background-hover': '#f1f5f9',
          text: '#1f2937',
          'text-hover': '#1f2937'
        }
      },
      main: {
        tabs: { background: '#f8fafcff' },
        tab: {
          inactive: {
            text: '#6b7280',
            'text-hover': '#1f2937',
            background: '#ffffff',
            'background-hover': '#f1f5f9'
          },
          active: {
            text: '#1f2937',
            'text-hover': '#0f172a',
            background: '#ffffff',
            'background-hover': '#f8fafc'
          }
        },
        content: {
          background: '#acacacff',
          title: '#1f2937',
          text: '#1f2937',
          editor: {
            selection: '#dbeafe',
            cursor: '#1f2937'
          }
        }
      },
      'entity-sidebar': { background: '#ffffff', text: '#1f2937' },
      dialog: {
        background: '#ffffff',
        border: '#e5e7eb',
        text: '#1f2937',
        'text-danger': '#dc2626',
        button: '#3b82f6',
        'button-hover': '#2563eb',
        'button-hover-border': '#1d4ed8',
        'button-clicked': '#1e40af',
        'button-clicked-border': '#1e3a8a'
      }
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'theme-dark',
    name: 'Dark',
    colors: {
      'nav-sidebar': { background: '#111827', text: '#adadad' },
      explorer: {
        background: '#1f2937',
        item: {
          'background-hover': '#3a4657',
          text: '#adadad',
          'text-hover': '#adadad'
        }
      },
      main: {
        tabs: { background: '#1f2937' },
        tab: {
          inactive: {
            text: '#adadad',
            'text-hover': '#ffffff',
            background: '#19202D',
            'background-hover': '#374151'
          },
          active: {
            text: '#ffffff',
            'text-hover': '#ffffff',
            background: '#111827',
            'background-hover': '#1f2937'
          }
        },
        content: {
          background: '#111827',
          title: '#ffffff',
          text: '#adadad',
          editor: {
            selection: '#3b82f640',
            cursor: '#adadad'
          }
        }
      },
      'entity-sidebar': { background: '#1f2937', text: '#adadad' },
      dialog: {
        background: '#1f2937',
        border: '#374151',
        text: '#adadad',
        'text-danger': '#f87171',
        button: '#3b82f6',
        'button-hover': '#2563eb',
        'button-hover-border': '#1d4ed8',
        'button-clicked': '#1e40af',
        'button-clicked-border': '#1e3a8a'
      }
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'theme-test',
    name: 'Test',
    colors: {
      'nav-sidebar': { background: '#0051FF', text: '#000000' },
      explorer: {
        background: '#FF0000',
        item: {
          'background-hover': '#2AA11D',
          text: '#000000',
          'text-hover': '#21449F'
        }
      },
      main: {
        tabs: { background: '#00FFEA' },
        tab: {
          inactive: {
            text: '#FFFFFF',
            'text-hover': '#525252',
            background: '#573A3A',
            'background-hover': '#FF9696'
          },
          active: {
            text: '#840000',
            'text-hover': '#FF0000',
            background: '#000000',
            'background-hover': '#333333'
          }
        },
        content: {
          background: '#C6C618',
          title: '#000000',
          text: '#000000',
          editor: {
            selection: '#FFFFFF40',
            cursor: '#000000'
          }
        }
      },
      'entity-sidebar': { background: '#474BB0', text: '#FFFFFF' },
      dialog: {
        background: '#FFFFFF',
        border: '#000000',
        text: '#000000',
        'text-danger': '#FF0000',
        button: '#0051FF',
        'button-hover': '#0040CC',
        'button-hover-border': '#003399',
        'button-clicked': '#002266',
        'button-clicked-border': '#001133'
      }
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

// Helper to check if a theme ID is predefined
function isPredefinedTheme(themeId: string): boolean {
  return PREDEFINED_THEMES.some(t => t.id === themeId);
}

// Convert RepoTheme to Theme
function repoToTheme(repo: RepoTheme): Theme {
  // Determine if theme is custom based on ID
  // Predefined themes have fixed IDs, all others are custom
  const isCustom = !isPredefinedTheme(repo.id);

  return {
    id: repo.id,
    name: repo.name,
    custom: isCustom,
    colors: repo.colors as ThemeColors,
    createdAt: repo.created_at || new Date().toISOString(),
    updatedAt: repo.updated_at || new Date().toISOString(),
    isDefault: false, // This would need to be determined by business logic
  };
}

// Convert Theme to RepoTheme
function themeToRepo(theme: Theme): RepoTheme {
  // Don't include 'custom' field - it's derived from the ID
  return {
    id: theme.id,
    name: theme.name,
    colors: theme.colors,
    created_at: theme.createdAt,
    updated_at: theme.updatedAt,
  };
}

class ThemeService {
  private driver: IRepositoryDriver | null = null;
  private initPromise: Promise<void> | null = null;
  private predefinedThemesInitialized = false;

  /**
   * Initialize the repository driver (uses singleton)
   */
  private async ensureInitialized(): Promise<void> {
    if (this.driver) return;

    if (!this.initPromise) {
      this.initPromise = (async () => {
        this.driver = await getRepositoryDriver();
        log.info('ThemeService using repository driver singleton');
      })();
    }

    await this.initPromise;
  }

  /**
   * Initialize predefined themes in local database
   * These themes are NOT synced with the server
   */
  async initializePredefinedThemes(): Promise<void> {
    if (this.predefinedThemesInitialized) return;

    await this.ensureInitialized();

    // Predefined themes are NOT saved to database - they only exist in memory
    this.predefinedThemesInitialized = true;
    log.info('Predefined themes initialized (in-memory only)');
  }

  /**
   * Fetch all themes (predefined from memory + custom from database)
   */
  async fetchThemes(): Promise<Theme[]> {
    await this.ensureInitialized();
    await this.initializePredefinedThemes();

    log.info('Fetching themes');

    // Get predefined themes from memory
    const predefinedThemes = PREDEFINED_THEMES.map(repoToTheme);

    // Get custom themes from database
    const repoThemes = await this.driver!.listThemesUpdatedSince('1970-01-01T00:00:00.000Z');
    const customThemes = repoThemes
      .filter(t => !t.deleted)
      .map(repoToTheme);

    const allThemes = [...predefinedThemes, ...customThemes];
    log.info('Themes fetched', { predefined: predefinedThemes.length, custom: customThemes.length, total: allThemes.length });
    return allThemes;
  }

  /**
   * Fetch predefined themes only (from memory)
   */
  async fetchPredefinedThemes(): Promise<Theme[]> {
    await this.initializePredefinedThemes();
    return PREDEFINED_THEMES.map(repoToTheme);
  }

  /**
   * Fetch custom themes only (from database)
   */
  async fetchCustomThemes(): Promise<Theme[]> {
    await this.ensureInitialized();

    const repoThemes = await this.driver!.listThemesUpdatedSince('1970-01-01T00:00:00.000Z');
    return repoThemes
      .filter(t => !t.deleted)
      .map(repoToTheme);
  }

  /**
   * Get the default theme
   */
  async fetchDefaultTheme(): Promise<Theme> {
    const allThemes = await this.fetchThemes();
    const defaultTheme = allThemes.find(t => t.isDefault);
    if (!defaultTheme && allThemes.length > 0) {
      return allThemes[0]; // Fallback to first theme
    }
    if (!defaultTheme) {
      throw new Error('No themes available');
    }
    return defaultTheme;
  }

  /**
   * Get a specific theme by ID (checks predefined themes first, then database)
   */
  async fetchThemeById(themeId: string): Promise<Theme> {
    await this.ensureInitialized();

    log.info('Fetching theme by ID', { themeId });

    // Check predefined themes first (in-memory)
    const predefinedTheme = PREDEFINED_THEMES.find(t => t.id === themeId);
    if (predefinedTheme) {
      log.info('Predefined theme found', { id: predefinedTheme.id, name: predefinedTheme.name });
      return repoToTheme(predefinedTheme);
    }

    // Check database for custom themes
    const repoTheme = await this.driver!.getTheme(themeId);
    if (!repoTheme || repoTheme.deleted) {
      throw new Error(`Theme not found: ${themeId}`);
    }

    log.info('Custom theme fetched from database', { id: repoTheme.id, name: repoTheme.name });
    return repoToTheme(repoTheme);
  }

  /**
   * Create a new custom theme in local database
   * Changes are queued in outbox for sync
   */
  async createTheme(themeData: CreateThemeRequest): Promise<Theme> {
    await this.ensureInitialized();

    log.info('Creating custom theme', { name: themeData.name });

    const themeId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newTheme: Theme = {
      id: themeId,
      name: themeData.name,
      custom: themeData.custom,
      colors: themeData.colors,
      createdAt: now,
      updatedAt: now,
      isDefault: false,
    };

    // Save to local DB
    const repoTheme = themeToRepo(newTheme);
    await this.driver!.putTheme(repoTheme);

    // Queue for sync
    await this.driver!.enqueueTheme({
      op: 'upsert',
      id: themeId,
      client_rev: 1,
      data: repoTheme,
    });

    log.info('Theme created in local DB and queued for sync', {
      id: themeId,
      name: themeData.name
    });

    return newTheme;
  }

  /**
   * Update an existing theme in local database
   * Changes are queued in outbox for sync (only for custom themes)
   */
  async updateTheme(updateData: UpdateThemeRequest): Promise<Theme> {
    await this.ensureInitialized();

    log.info('Updating theme', { id: updateData.themeId });

    // Get existing theme
    const existing = await this.driver!.getTheme(updateData.themeId);
    if (!existing || existing.deleted) {
      throw new Error(`Theme not found: ${updateData.themeId}`);
    }

    // Prevent updating predefined themes
    if (isPredefinedTheme(existing.id)) {
      throw new Error('Cannot update predefined themes');
    }

    // Update theme
    const updatedTheme: RepoTheme = {
      ...existing,
      name: updateData.name ?? existing.name,
      colors: updateData.colors ?? existing.colors,
      updated_at: new Date().toISOString(),
    };

    // Save to local DB
    await this.driver!.putTheme(updatedTheme);

    const client_rev = (existing.rev || 0) + 1;

    // Queue for sync (only custom themes)
    await this.driver!.enqueueTheme({
      op: 'upsert',
      id: updateData.themeId,
      client_rev: client_rev,
      data: updatedTheme,
    });

    log.info('Theme updated in local DB and queued for sync', {
      id: updateData.themeId,
      current_rev: existing.rev,
      client_rev: client_rev,
    });

    return repoToTheme(updatedTheme);
  }

  /**
   * Delete a theme from local database
   * Changes are queued in outbox for sync (only for custom themes)
   */
  async deleteTheme(themeId: string): Promise<void> {
    await this.ensureInitialized();

    log.info('Deleting theme', { id: themeId });

    // Get existing theme
    const existing = await this.driver!.getTheme(themeId);
    if (!existing) {
      log.warn('Theme not found for deletion', { id: themeId });
      return;
    }

    // Prevent deleting predefined themes
    if (isPredefinedTheme(existing.id)) {
      throw new Error('Cannot delete predefined themes');
    }

    // Mark as deleted in local DB
    await this.driver!.deleteTheme(themeId);

    const client_rev = (existing.rev || 0) + 1;

    // Queue for sync (only custom themes)
    await this.driver!.enqueueTheme({
      op: 'delete',
      id: themeId,
      client_rev: client_rev,
    });

    log.info('Theme deleted in local DB and queued for sync', {
      id: themeId,
      client_rev: client_rev,
    });
  }
}

// Export singleton instance
export const themeService = new ThemeService();
