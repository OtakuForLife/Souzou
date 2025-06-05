/**
 * Service layer for note-related API operations
 */

import api from '@/lib/api';
import { Entity, EntityType } from '@/models/Entity';
import { API_CONFIG } from '@/config/constants';
import { log } from '@/lib/logger';

export interface CreateEntityRequest {
  title: string;
  content: string;
  parent: string | null;
  type?: EntityType;
}

export interface UpdateEntityRequest {
  noteID: string;
  title?: string;
  content?: string;
  parent?: string | null;
}

export interface CreateEntityResponse {
  parent: string | null;
  newNoteData: Entity;
}

export interface SaveEntityResponse {
  savedEntity: Entity;
}

class EntityService {
  private readonly endpoint = API_CONFIG.ENDPOINTS.ENTITIES;

  /**
   * Fetch all notes
   */
  async fetchEntities(): Promise<Entity[]> {
    try {
      log.info('Fetching notes');
      const response = await api.get<Entity[]>(this.endpoint);
      log.info('Notes fetched successfully', { count: response.data.length });
      return response.data;
    } catch (error) {
      log.error('Failed to fetch notes', error as Error);
      throw error;
    }
  }

  /**
   * Create a new note
   */
  async createEntity(noteData: CreateEntityRequest): Promise<CreateEntityResponse> {
    try {
      log.info('Creating note', { title: noteData.title, parent: noteData.parent });

      const createResponse = await api.post<Entity>(this.endpoint, noteData);

      if (createResponse.status !== 201) {
        throw new Error(`Failed to create note: ${createResponse.status}`);
      }

      const newNoteData = createResponse.data;
      log.info('Note created successfully', { id: newNoteData.id, title: newNoteData.title });

      return {
        parent: noteData.parent,
        newNoteData,
      };
    } catch (error) {
      log.error('Failed to create note', error as Error, { noteData });
      throw error;
    }
  }

  /**
   * Save/update an existing note
   */
  async saveEntity(note: Entity): Promise<SaveEntityResponse> {
    try {
      log.info('Saving note', { id: note.id, title: note.title });

      const response = await api.put<Entity>(`${this.endpoint}${note.id}/`, note);

      if (response.status !== 200) {
        throw new Error(`Failed to save note: ${response.status}`);
      }

      const savedEntity = response.data;
      log.info('Note saved successfully', { id: savedEntity.id });

      return { savedEntity };
    } catch (error) {
      log.error('Failed to save note', error as Error, { noteId: note.id });
      throw error;
    }
  }

  /**
   * Delete a note
   */
  async deleteEntity(noteId: string): Promise<Entity[]> {
    try {
      log.info('Deleting note', { id: noteId });

      const response = await api.delete(`${this.endpoint}${noteId}/`);

      if (response.status !== 200 && response.status !== 204) {
        throw new Error(`Failed to delete note: ${response.status}`);
      }

      log.info('Note deleted successfully', { id: noteId });

      // Fetch updated notes list
      const updatedNotes = await this.fetchEntities();
      return updatedNotes;
    } catch (error) {
      log.error('Failed to delete note', error as Error, { noteId });
      throw error;
    }
  }

  /**
   * Update note metadata (title, parent, etc.)
   */
  async updateEntity(updateData: UpdateEntityRequest): Promise<Entity> {
    try {
      log.info('Updating note', { id: updateData.noteID });

      const response = await api.patch<Entity>(`${this.endpoint}${updateData.noteID}/`, updateData);

      if (response.status !== 200) {
        throw new Error(`Failed to update note: ${response.status}`);
      }

      log.info('Note updated successfully', { id: updateData.noteID });
      return response.data;
    } catch (error) {
      log.error('Failed to update note', error as Error, { updateData });
      throw error;
    }
  }

}
// Export singleton instance
export const entityService = new EntityService();
