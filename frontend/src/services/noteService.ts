/**
 * Service layer for note-related API operations
 */

import api from '@/lib/api';
import { Note } from '@/models/Note';
import { API_CONFIG } from '@/config/constants';
import { log } from '@/lib/logger';

export interface CreateNoteRequest {
  title: string;
  content: string;
  parent: string | null;
}

export interface UpdateNoteRequest {
  noteID: string;
  title?: string;
  content?: string;
  parent?: string | null;
}

export interface CreateNoteResponse {
  parent: string | null;
  newNoteData: Note;
  updatedNotes: Note[];
}

export interface SaveNoteResponse {
  updatedNotes: Note[];
}

class NoteService {
  private readonly endpoint = API_CONFIG.ENDPOINTS.NOTES;

  /**
   * Fetch all notes
   */
  async fetchNotes(): Promise<Note[]> {
    try {
      log.info('Fetching notes');
      const response = await api.get<Note[]>(this.endpoint);
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
  async createNote(noteData: CreateNoteRequest): Promise<CreateNoteResponse> {
    try {
      log.info('Creating note', { title: noteData.title, parent: noteData.parent });
      
      const createResponse = await api.post<Note>(this.endpoint, noteData);
      
      if (createResponse.status !== 201) {
        throw new Error(`Failed to create note: ${createResponse.status}`);
      }

      const newNoteData = createResponse.data;
      log.info('Note created successfully', { id: newNoteData.id, title: newNoteData.title });

      // Fetch updated notes list
      const updatedNotes = await this.fetchNotes();

      return {
        parent: noteData.parent,
        newNoteData,
        updatedNotes,
      };
    } catch (error) {
      log.error('Failed to create note', error as Error, { noteData });
      throw error;
    }
  }

  /**
   * Save/update an existing note
   */
  async saveNote(note: Note): Promise<SaveNoteResponse> {
    try {
      log.info('Saving note', { id: note.id, title: note.title });
      
      const response = await api.put<Note>(`${this.endpoint}${note.id}/`, note);
      
      if (response.status !== 200) {
        throw new Error(`Failed to save note: ${response.status}`);
      }

      log.info('Note saved successfully', { id: note.id });

      // Fetch updated notes list
      const updatedNotes = await this.fetchNotes();

      return { updatedNotes };
    } catch (error) {
      log.error('Failed to save note', error as Error, { noteId: note.id });
      throw error;
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<Note[]> {
    try {
      log.info('Deleting note', { id: noteId });
      
      const response = await api.delete(`${this.endpoint}${noteId}/`);
      
      if (response.status !== 200 && response.status !== 204) {
        throw new Error(`Failed to delete note: ${response.status}`);
      }

      log.info('Note deleted successfully', { id: noteId });

      // Fetch updated notes list
      const updatedNotes = await this.fetchNotes();
      return updatedNotes;
    } catch (error) {
      log.error('Failed to delete note', error as Error, { noteId });
      throw error;
    }
  }

  /**
   * Update note metadata (title, parent, etc.)
   */
  async updateNote(updateData: UpdateNoteRequest): Promise<Note> {
    try {
      log.info('Updating note', { id: updateData.noteID });
      
      const response = await api.patch<Note>(`${this.endpoint}${updateData.noteID}/`, updateData);
      
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

  /**
   * Search notes by title or content
   */
  async searchNotes(query: string): Promise<Note[]> {
    try {
      log.info('Searching notes', { query });
      
      const response = await api.get<Note[]>(`${this.endpoint}search/`, {
        params: { q: query },
      });

      log.info('Notes search completed', { query, count: response.data.length });
      return response.data;
    } catch (error) {
      log.error('Failed to search notes', error as Error, { query });
      throw error;
    }
  }
}

// Export singleton instance
export const noteService = new NoteService();
