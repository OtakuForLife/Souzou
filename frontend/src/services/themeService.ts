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
      sidebar: { background: '#acacacff', text: '#1f2937' },
      explorer: {
        background: '#c8c8c8ff',
        item: {
          background: { hover: '#f1f5f9' },
          text: { default: '#1f2937', hover: '#1f2937' }
        }
      },
      main: {
        tabs: { background: '#f8fafcff' },
        tab: {
          text: { default: '#6b7280', hover: '#1f2937' },
          background: { default: '#ffffff', hover: '#f1f5f9' },
          active: { text: '#1f2937', background: '#ffffff' }
        },
        content: { background: '#acacacff', text: '#1f2937' }
      },
      editor: {
        background: '#bcbcbcff',
        text: '#1f2937',
        selection: '#3b82f620',
        cursor: '#3b82f6',
        lineNumber: '#9ca3af',
        syntax: {
          keyword: '#7c3aed',
          string: '#059669',
          comment: '#6b7280',
          function: '#dc2626',
          variable: '#1f2937'
        }
      }
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'theme-dark',
    name: 'Dark',
    colors: {
      sidebar: { background: '#111827', text: '#adadad' },
      explorer: {
        background: '#1f2937',
        item: {
          background: { hover: '#3a4657' },
          text: { default: '#adadad', hover: '#adadad' }
        }
      },
      main: {
        tabs: { background: '#1f2937' },
        tab: {
          text: { default: '#adadad', hover: '#adadad' },
          background: { default: '#19202D', hover: '#19202D' },
          active: { text: '#adadad', background: '#111827' }
        },
        content: { background: '#111827', text: '#adadad' }
      },
      editor: {
        background: '#111827',
        text: '#adadad',
        selection: '#FFFFFF',
        cursor: '#adadad',
        lineNumber: '#FFFFFF',
        syntax: {
          keyword: '#FFFFFF',
          string: '#FFFFFF',
          comment: '#FFFFFF',
          function: '#FFFFFF',
          variable: '#FFFFFF'
        }
      }
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'theme-test',
    name: 'Test',
    colors: {
      sidebar: { background: '#0051FF', text: '#000000' },
      explorer: {
        background: '#FF0000',
        item: {
          background: { hover: '#2AA11D' },
          text: { default: '#000000', hover: '#21449F' }
        }
      },
      main: {
        tabs: { background: '#00FFEA' },
        tab: {
          text: { default: '#FFFFFF', hover: '#525252' },
          background: { default: '#573A3A', hover: '#FF9696' },
          active: { text: '#840000', background: '#000000' }
        },
        content: { background: '#C6C618', text: '#000000' }
      },
      editor: {
        background: '#474BB0',
        text: '#428048',
        selection: '#FFFFFF',
        cursor: '#FFFFFF',
        lineNumber: '#FFFFFF',
        syntax: {
          keyword: '#FFFFFF',
          string: '#FFFFFF',
          comment: '#FFFFFF',
          function: '#FFFFFF',
          variable: '#FFFFFF'
        }
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
