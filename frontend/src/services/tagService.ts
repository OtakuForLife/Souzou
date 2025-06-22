import api from '@/lib/api';
import { Tag, TagHierarchy } from '@/models/Tag';
import { Entity } from '@/models/Entity';
import { API_CONFIG } from '@/config/constants';
import { log } from '@/lib/logger';

export interface CreateTagRequest {
  name: string;
  color?: string;
  description?: string;
  parent?: string | null;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string;
  description?: string;
  parent?: string | null;
}

class TagService {
  private readonly endpoint = `${API_CONFIG.ENDPOINTS.TAGS}`;

  async fetchTags(): Promise<Tag[]> {
    try {
      log.info('Fetching tags');
      const response = await api.get<Tag[]>(this.endpoint);
      log.info('Tags fetched successfully', { count: response.data.length });
      return response.data;
    } catch (error) {
      log.error('Failed to fetch tags', error as Error);
      throw error;
    }
  }

  async fetchTagHierarchy(): Promise<TagHierarchy[]> {
    try {
      log.info('Fetching tag hierarchy');
      const response = await api.get<TagHierarchy[]>(`${this.endpoint}/hierarchy/`);
      log.info('Tag hierarchy fetched successfully');
      return response.data;
    } catch (error) {
      log.error('Failed to fetch tag hierarchy', error as Error);
      throw error;
    }
  }

  async createTag(tagData: CreateTagRequest): Promise<Tag> {
    try {
      log.info('Creating tag', { name: tagData.name });
      const response = await api.post<Tag>(`${this.endpoint}/`, tagData);
      log.info('Tag created successfully', { id: response.data.id, name: response.data.name });
      return response.data;
    } catch (error) {
      log.error('Failed to create tag', error as Error, { tagData });
      throw error;
    }
  }

  async updateTag(id: string, tagData: UpdateTagRequest): Promise<Tag> {
    try {
      log.info('Updating tag', { id, tagData });
      const response = await api.patch<Tag>(`${this.endpoint}/${id}/`, tagData);
      log.info('Tag updated successfully', { id: response.data.id });
      return response.data;
    } catch (error) {
      log.error('Failed to update tag', error as Error, { id, tagData });
      throw error;
    }
  }

  async deleteTag(id: string): Promise<void> {
    try {
      log.info('Deleting tag', { id });
      await api.delete(`${this.endpoint}/${id}/`);
      log.info('Tag deleted successfully', { id });
    } catch (error) {
      log.error('Failed to delete tag', error as Error, { id });
      throw error;
    }
  }

  async getEntitiesByTags(tagIds: string[]): Promise<Entity[]> {
    try {
      log.info('Fetching entities by tags', { tagIds });
      const params = new URLSearchParams();
      tagIds.forEach(id => params.append('tags', id));
      const response = await api.get<Entity[]>(`${API_CONFIG.ENDPOINTS.ENTITIES}/by_tags/?${params}`);
      log.info('Entities fetched by tags successfully', { count: response.data.length });
      return response.data;
    } catch (error) {
      log.error('Failed to fetch entities by tags', error as Error, { tagIds });
      throw error;
    }
  }

  async addTagsToEntity(entityId: string, tagIds: string[]): Promise<Entity> {
    try {
      log.info('Adding tags to entity', { entityId, tagIds });
      const response = await api.post<Entity>(`${API_CONFIG.ENDPOINTS.ENTITIES}/${entityId}/add_tags/`, { tag_ids: tagIds });
      log.info('Tags added to entity successfully', { entityId });
      return response.data;
    } catch (error) {
      log.error('Failed to add tags to entity', error as Error, { entityId, tagIds });
      throw error;
    }
  }

  async removeTagsFromEntity(entityId: string, tagIds: string[]): Promise<Entity> {
    try {
      log.info('Removing tags from entity', { entityId, tagIds });
      const response = await api.delete<Entity>(`${API_CONFIG.ENDPOINTS.ENTITIES}/${entityId}/remove_tags/`, { 
        data: { tag_ids: tagIds } 
      });
      log.info('Tags removed from entity successfully', { entityId });
      return response.data;
    } catch (error) {
      log.error('Failed to remove tags from entity', error as Error, { entityId, tagIds });
      throw error;
    }
  }
}

export const tagService = new TagService();
