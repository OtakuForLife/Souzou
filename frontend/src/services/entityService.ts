/**
 * Service layer for entity operations
 * Implements offline-first architecture:
 * - ALL CRUD operations work with local database (IndexedDB/SQLite) only
 * - Changes are queued in outbox
 * - Sync with server happens periodically (via health check) or manually
 */

import { Entity, EntityType } from '@/models/Entity';
import { log } from '@/lib/logger';
import { getRepositoryDriver } from '@/repository';
import type { IRepositoryDriver, RepoEntity } from '@/repository/types';

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
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface CreateEntityResponse {
  parent: string | null;
  newNoteData: Entity;
}

export interface SaveEntityResponse {
  savedEntity: Entity;
}

/**
 * Convert Entity to RepoEntity format
 */
function entityToRepo(entity: Entity): RepoEntity {
  return {
    id: entity.id,
    type: entity.type,
    title: entity.title,
    content: entity.content,
    parent: entity.parent,
    metadata: entity.metadata || {},
    tags: entity.tags || [],
    created_at: entity.created_at,
    updated_at: entity.updated_at,
    // Preserve sync fields
    rev: entity.rev,
    server_updated_at: entity.server_updated_at,
    deleted: entity.deleted,
    deleted_at: entity.deleted_at,
  };
}

/**
 * Convert RepoEntity to Entity format
 */
function repoToEntity(repo: RepoEntity): Entity {
  return {
    id: repo.id,
    type: repo.type as EntityType,
    title: repo.title,
    content: repo.content,
    parent: repo.parent,
    metadata: repo.metadata || {},
    tags: repo.tags || [], // Ensure tags is always an array
    children: [], // Will be populated by Redux
    created_at: repo.created_at || new Date().toISOString(),
    updated_at: repo.updated_at || new Date().toISOString(),
    // Preserve sync fields
    rev: repo.rev,
    server_updated_at: repo.server_updated_at,
    deleted: repo.deleted,
    deleted_at: repo.deleted_at,
  };
}

class EntityService {
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
        log.info('EntityService using repository driver singleton');
      })();
    }

    await this.initPromise;
  }

  /**
   * Fetch all entities from local database
   */
  async fetchEntities(): Promise<Entity[]> {
    await this.ensureInitialized();

    log.info('Fetching entities from local database');
    const repoEntities = await this.driver!.listEntitiesUpdatedSince('1970-01-01T00:00:00.000Z');
    const entities = repoEntities
      .filter(e => !e.deleted)
      .map(repoToEntity);

    log.info('Entities fetched from local DB', { count: entities.length });
    return entities;
  }

  /**
   * Create a new entity in local database
   * Changes are queued in outbox for sync
   */
  async createEntity(noteData: CreateEntityRequest): Promise<CreateEntityResponse> {
    await this.ensureInitialized();

    // Generate ID
    const entityId = crypto.randomUUID();

    const localEntity: Entity = {
      id: entityId,
      title: noteData.title,
      content: noteData.content,
      parent: noteData.parent,
      type: (noteData.type || 'note') as EntityType,
      children: [],
      tags: [],
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to local DB
    const repoEntity = entityToRepo(localEntity);
    await this.driver!.putEntity(repoEntity);

    // Queue for sync
    await this.driver!.enqueueEntity({
      op: 'upsert',
      id: entityId,
      client_rev: 1,
      data: repoEntity,
    });

    log.info('Entity created in local DB and queued for sync', {
      id: entityId,
      title: noteData.title
    });

    return {
      parent: noteData.parent,
      newNoteData: localEntity,
    };
  }

  /**
   * Save/update an existing entity in local database
   * Changes are queued in outbox for sync
   */
  async saveEntity(note: Entity): Promise<SaveEntityResponse> {
    await this.ensureInitialized();

    // Update timestamp
    const updatedEntity: Entity = {
      ...note,
      updated_at: new Date().toISOString(),
    };

    // Save to local DB
    const repoEntity = entityToRepo(updatedEntity);
    await this.driver!.putEntity(repoEntity);

    const client_rev = (repoEntity.rev || 0) + 1;

    // Queue for sync
    await this.driver!.enqueueEntity({
      op: 'upsert',
      id: note.id,
      client_rev: client_rev,
      data: repoEntity,
    });

    log.info('Entity updated in local DB and queued for sync', {
      id: note.id,
      title: note.title,
      current_rev: repoEntity.rev,
      client_rev: client_rev,
    });

    return { savedEntity: updatedEntity };
  }

  /**
   * Delete an entity from local database
   * Changes are queued in outbox for sync
   */
  async deleteEntity(noteId: string): Promise<Entity[]> {
    await this.ensureInitialized();

    // Mark as deleted in local DB
    await this.driver!.deleteEntity(noteId);

    // Queue for sync
    await this.driver!.enqueueEntity({
      op: 'delete',
      id: noteId,
      client_rev: 1,
    });

    log.info('Entity deleted from local DB and queued for sync', { id: noteId });

    // Return updated list
    return this.fetchEntities();
  }

  /**
   * Update entity metadata in local database
   * Changes are queued in outbox for sync
   */
  async updateEntity(updateData: UpdateEntityRequest): Promise<Entity> {
    await this.ensureInitialized();

    // Get existing entity
    const existing = await this.driver!.getEntity(updateData.noteID);
    if (!existing) {
      throw new Error(`Entity not found: ${updateData.noteID}`);
    }

    // Update entity
    const updatedEntity: RepoEntity = {
      ...existing,
      title: updateData.title ?? existing.title,
      content: updateData.content ?? existing.content,
      parent: updateData.parent !== undefined ? updateData.parent : existing.parent,
      metadata: updateData.metadata ?? existing.metadata,
      tags: updateData.tags ?? existing.tags,
      updated_at: new Date().toISOString(),
    };

    // Save to local DB
    await this.driver!.putEntity(updatedEntity);

    // Queue for sync
    await this.driver!.enqueueEntity({
      op: 'upsert',
      id: updateData.noteID,
      client_rev: (existing.rev || 0) + 1,
      data: updatedEntity,
    });

    log.info('Entity updated in local DB and queued for sync', { id: updateData.noteID });

    return repoToEntity(updatedEntity);
  }

}
// Export singleton instance
export const entityService = new EntityService();
