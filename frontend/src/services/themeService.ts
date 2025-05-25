/**
 * Service layer for theme-related API operations
 */

import api from '@/lib/api';
import { Theme, ThemeColors } from '@/types/themeTypes';
import { API_CONFIG } from '@/config/constants';
import { log } from '@/lib/logger';

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

class ThemeService {
  private readonly endpoint = API_CONFIG.ENDPOINTS.THEMES;

  /**
   * Fetch all themes
   */
  async fetchThemes(): Promise<Theme[]> {
    try {
      log.info('Fetching themes');
      const response = await api.get<Theme[]>(this.endpoint);
      log.info('Themes fetched successfully', { count: response.data.length });
      return response.data;
    } catch (error) {
      log.error('Failed to fetch themes', error as Error);
      throw error;
    }
  }

  /**
   * Fetch predefined themes only
   */
  async fetchPredefinedThemes(): Promise<Theme[]> {
    try {
      log.info('Fetching predefined themes');
      const response = await api.get<Theme[]>(`${this.endpoint}predefined/`);
      log.info('Predefined themes fetched successfully', { count: response.data.length });
      return response.data;
    } catch (error) {
      log.error('Failed to fetch predefined themes', error as Error);
      throw error;
    }
  }

  /**
   * Fetch custom themes only
   */
  async fetchCustomThemes(): Promise<Theme[]> {
    try {
      log.info('Fetching custom themes');
      const response = await api.get<Theme[]>(`${this.endpoint}custom/`);
      log.info('Custom themes fetched successfully', { count: response.data.length });
      return response.data;
    } catch (error) {
      log.error('Failed to fetch custom themes', error as Error);
      throw error;
    }
  }

  /**
   * Get the default theme
   */
  async fetchDefaultTheme(): Promise<Theme> {
    try {
      log.info('Fetching default theme');
      const response = await api.get<Theme>(`${this.endpoint}default/`);
      log.info('Default theme fetched successfully', { id: response.data.id, name: response.data.name });
      return response.data;
    } catch (error) {
      log.error('Failed to fetch default theme', error as Error);
      throw error;
    }
  }

  /**
   * Get a specific theme by ID
   */
  async fetchThemeById(themeId: string): Promise<Theme> {
    try {
      log.info('Fetching theme by ID', { themeId });
      const response = await api.get<Theme>(`${this.endpoint}${themeId}/`);
      log.info('Theme fetched successfully', { id: response.data.id, name: response.data.name });
      return response.data;
    } catch (error) {
      log.error('Failed to fetch theme by ID', error as Error, { themeId });
      throw error;
    }
  }

  /**
   * Create a new custom theme
   */
  async createTheme(themeData: CreateThemeRequest): Promise<Theme> {
    try {
      log.info('Creating custom theme', { name: themeData.name });

      const response = await api.post<Theme>(this.endpoint, {
        ...themeData,
        type: 'custom' // Ensure it's marked as custom
      });

      if (response.status !== 201) {
        throw new Error(`Failed to create theme: ${response.status}`);
      }

      const newTheme = response.data;
      log.info('Theme created successfully', { id: newTheme.id, name: newTheme.name });
      return newTheme;
    } catch (error) {
      log.error('Failed to create theme', error as Error, { themeData });
      throw error;
    }
  }

  /**
   * Update an existing theme
   */
  async updateTheme(updateData: UpdateThemeRequest): Promise<Theme> {
    try {
      log.info('Updating theme', { id: updateData.themeId });

      const response = await api.patch<Theme>(`${this.endpoint}${updateData.themeId}/`, updateData);

      if (response.status !== 200) {
        throw new Error(`Failed to update theme: ${response.status}`);
      }

      log.info('Theme updated successfully', { id: updateData.themeId });
      return response.data;
    } catch (error) {
      log.error('Failed to update theme', error as Error, { updateData });
      throw error;
    }
  }

  /**
   * Delete a theme
   */
  async deleteTheme(themeId: string): Promise<void> {
    try {
      log.info('Deleting theme', { id: themeId });

      const response = await api.delete(`${this.endpoint}${themeId}/`);

      if (response.status !== 200 && response.status !== 204) {
        throw new Error(`Failed to delete theme: ${response.status}`);
      }

      log.info('Theme deleted successfully', { id: themeId });
    } catch (error) {
      log.error('Failed to delete theme', error as Error, { themeId });
      throw error;
    }
  }
}

// Export singleton instance
export const themeService = new ThemeService();
