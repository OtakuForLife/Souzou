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
  type?: 'custom'; // Only custom themes can be created via API
}

export interface UpdateThemeRequest {
  themeId: string;
  name?: string;
  colors?: ThemeColors;
}

// Convert RepoTheme to Theme
function repoToTheme(repo: RepoTheme): Theme {
  return {
    id: repo.id,
    name: repo.name,
    type: repo.type,
    colors: repo.colors as ThemeColors,
    createdAt: repo.created_at || new Date().toISOString(),
    updatedAt: repo.updated_at || new Date().toISOString(),
    isDefault: false, // This would need to be determined by business logic
  };
}

// Convert Theme to RepoTheme
function themeToRepo(theme: Theme): RepoTheme {
  return {
    id: theme.id,
    name: theme.name,
    type: theme.type,
    colors: theme.colors,
    created_at: theme.createdAt,
    updated_at: theme.updatedAt,
  };
}

class ThemeService {
  private driver: IRepositoryDriver | null = null;
  private initPromise: Promise<void> | null = null;

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
   * Fetch all themes from local database
   */
  async fetchThemes(): Promise<Theme[]> {
    await this.ensureInitialized();

    log.info('Fetching themes from local database');
    const repoThemes = await this.driver!.listThemesUpdatedSince('1970-01-01T00:00:00.000Z');
    const themes = repoThemes
      .filter(t => !t.deleted)
      .map(repoToTheme);

    log.info('Themes fetched from local DB', { count: themes.length });
    return themes;
  }

  /**
   * Fetch predefined themes only
   */
  async fetchPredefinedThemes(): Promise<Theme[]> {
    const allThemes = await this.fetchThemes();
    return allThemes.filter(t => t.type === 'predefined');
  }

  /**
   * Fetch custom themes only
   */
  async fetchCustomThemes(): Promise<Theme[]> {
    const allThemes = await this.fetchThemes();
    return allThemes.filter(t => t.type === 'custom');
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
   * Get a specific theme by ID
   */
  async fetchThemeById(themeId: string): Promise<Theme> {
    await this.ensureInitialized();

    log.info('Fetching theme by ID', { themeId });
    const repoTheme = await this.driver!.getTheme(themeId);
    if (!repoTheme || repoTheme.deleted) {
      throw new Error(`Theme not found: ${themeId}`);
    }

    log.info('Theme fetched successfully', { id: repoTheme.id, name: repoTheme.name });
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
      type: 'custom',
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
   * Changes are queued in outbox for sync
   */
  async updateTheme(updateData: UpdateThemeRequest): Promise<Theme> {
    await this.ensureInitialized();

    log.info('Updating theme', { id: updateData.themeId });

    // Get existing theme
    const existing = await this.driver!.getTheme(updateData.themeId);
    if (!existing || existing.deleted) {
      throw new Error(`Theme not found: ${updateData.themeId}`);
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

    // Queue for sync
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
   * Changes are queued in outbox for sync
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

    // Mark as deleted in local DB
    await this.driver!.deleteTheme(themeId);

    const client_rev = (existing.rev || 0) + 1;

    // Queue for sync
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
