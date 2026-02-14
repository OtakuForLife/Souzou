/**
 * Service layer for theme operations
 * Implements offline-first architecture:
 * - ALL CRUD operations work with local database (IndexedDB/SQLite) only
 * - Changes are queued in outbox
 * - Sync with server happens periodically (via health check) or manually
 */

import { Theme, ThemeColors } from '@/types/themeTypes';
import { log } from '@/lib/logger';
import { getRepositoryDriver, OPERATIONS } from '@/repository';
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
      '--color-surface-0': '#acacacff',
      '--color-surface-0-hover': '#878787',
      '--color-surface-1': '#c8c8c8ff',
      '--color-surface-1-hover': '#f1f5f9',
      '--color-surface-2': '#c8c8c8ff',
      '--color-surface-2-hover': '#f1f5f9',

      '--color-text-primary': '#1f2937',
      '--color-text-primary-hover': '#1f2937',
      '--color-text-secondary': '#6b7280',
      '--color-text-secondary-hover': '#374151',
      '--color-text-tertiary': '#9ca3af',
      '--color-text-tertiary-hover': '#374151',

      '--color-tab-active': '#acacacff',
      '--color-tab-active-hover': '#acacacff',
      '--color-tab-inactive': '#f8fafc',
      '--color-tab-inactive-hover': '#f1f5f9',

      '--color-border-primary': '#e5e7eb',

      '--color-button-primary': '#3b82f6',
      '--color-button-primary-hover': '#2563eb',
      '--color-button-primary-clicked': '#1d4ed8',

      '--color-button-alert': '#ef4444',
      '--color-button-alert-hover': '#dc2626',
      '--color-button-alert-clicked': '#b91c1c',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'theme-dark',
    name: 'Dark',
    colors: {
      '--color-surface-0': '#111827',
      '--color-surface-0-hover': '#19233a',
      '--color-surface-1': '#293648',
      '--color-surface-1-hover': '#314054', 
      '--color-surface-2': '#19202D',
      '--color-surface-2-hover': '#232d3f',

      '--color-text-primary': '#adadad',
      '--color-text-primary-hover': '#adadad',
      '--color-text-secondary': '#adadad',
      '--color-text-secondary-hover': '#adadad',
      '--color-text-tertiary': '#adadad',
      '--color-text-tertiary-hover': '#adadad',

      '--color-tab-active': '#111827',
      '--color-tab-active-hover': '#111827',
      '--color-tab-inactive': '#19202D',
      '--color-tab-inactive-hover': '#29354a',

      '--color-border-primary': '#374151',

      '--color-button-primary': '#3b82f6',
      '--color-button-primary-hover': '#2563eb',  
      '--color-button-primary-clicked': '#1d4ed8',

      '--color-button-alert': '#f87171',
      '--color-button-alert-hover': '#f87171',
      '--color-button-alert-clicked': '#f87171',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'theme-test',
    name: 'Test',
    colors: {
      '--color-surface-0': '#0051FF',
      '--color-surface-0-hover': '#0051FF',
      '--color-surface-1': '#FF0000',
      '--color-surface-1-hover': '#FF0000',
      '--color-surface-2': '#00FFEA',
      '--color-surface-2-hover': '#00FFEA',

      '--color-text-primary': '#000000',
      '--color-text-primary-hover': '#000000',
      '--color-text-secondary': '#000000',
      '--color-text-secondary-hover': '#000000',
      '--color-text-tertiary': '#000000',
      '--color-text-tertiary-hover': '#000000',

      '--color-tab-active': '#000000',
      '--color-tab-active-hover': '#000000',
      '--color-tab-inactive': '#000000',
      '--color-tab-inactive-hover': '#000000',

      '--color-border-primary': '#000000',

      '--color-button-primary': '#0051FF',
      '--color-button-primary-hover': '#0051FF',
      '--color-button-primary-clicked': '#0051FF',

      '--color-button-alert': '#FF0000',
      '--color-button-alert-hover': '#FF0000',
      '--color-button-alert-clicked': '#FF0000',
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
      op: OPERATIONS.UPSERT,
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
      op: OPERATIONS.UPSERT,
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
      op: OPERATIONS.DELETE,
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
