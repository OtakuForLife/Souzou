/**
 * Service layer for tag operations
 * Implements offline-first architecture:
 * - ALL CRUD operations work with local database (IndexedDB/SQLite) only
 * - Changes are queued in outbox
 * - Sync with server happens periodically (via health check) or manually
 */

import { Tag } from '@/models/Tag';
import { log } from '@/lib/logger';
import { getRepositoryDriver } from '@/repository';
import type { IRepositoryDriver, RepoTag } from '@/repository/types';

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

/**
 * Convert Tag to RepoTag format
 */
function tagToRepo(tag: Tag): RepoTag {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color || '#6B7280',
    description: tag.description,
    parent: tag.parent,
    created_at: tag.created_at,
    updated_at: tag.updated_at,
    // Preserve sync fields
    rev: tag.rev,
    server_updated_at: tag.server_updated_at,
    deleted: tag.deleted,
    deleted_at: tag.deleted_at,
  };
}

/**
 * Convert RepoTag to Tag format
 */
function repoToTag(repo: RepoTag): Tag {
  return {
    id: repo.id,
    name: repo.name,
    color: repo.color || '#6B7280',
    description: repo.description,
    parent: repo.parent,
    created_at: repo.created_at || new Date().toISOString(),
    updated_at: repo.updated_at || new Date().toISOString(),
    // Preserve sync fields
    rev: repo.rev,
    server_updated_at: repo.server_updated_at,
    deleted: repo.deleted,
    deleted_at: repo.deleted_at,
  };
}

class TagService {
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
        log.info('TagService using repository driver singleton');
      })();
    }

    await this.initPromise;
  }

  /**
   * Fetch all tags from local database
   */
  async fetchTags(): Promise<Tag[]> {
    await this.ensureInitialized();

    log.info('Fetching tags from local database');
    const repoTags = await this.driver!.listTagsUpdatedSince('1970-01-01T00:00:00.000Z');
    const tags = repoTags
      .filter(t => !t.deleted)
      .map(repoToTag);

    log.info('Tags fetched from local DB', { count: tags.length });
    return tags;
  }

  /**
   * Create a new tag in local database
   * Changes are queued in outbox for sync
   */
  async createTag(tagData: CreateTagRequest): Promise<Tag> {
    await this.ensureInitialized();

    // Generate ID
    const tagId = crypto.randomUUID();

    const localTag: Tag = {
      id: tagId,
      name: tagData.name,
      color: tagData.color || '#6B7280',
      description: tagData.description,
      parent: tagData.parent || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to local DB
    const repoTag = tagToRepo(localTag);
    await this.driver!.putTag(repoTag);

    // Queue for sync
    await this.driver!.enqueueTag({
      op: 'upsert',
      id: tagId,
      client_rev: 1,
      data: repoTag,
    });

    log.info('Tag created in local DB and queued for sync', {
      id: tagId,
      name: tagData.name
    });

    return localTag;
  }

  /**
   * Update an existing tag in local database
   * Changes are queued in outbox for sync
   */
  async updateTag(id: string, tagData: UpdateTagRequest): Promise<Tag> {
    await this.ensureInitialized();

    // Get existing tag
    const existing = await this.driver!.getTag(id);
    if (!existing) {
      throw new Error(`Tag not found: ${id}`);
    }

    // Update tag
    const updatedTag: RepoTag = {
      ...existing,
      name: tagData.name ?? existing.name,
      color: tagData.color ?? existing.color,
      description: tagData.description !== undefined ? tagData.description : existing.description,
      parent: tagData.parent !== undefined ? tagData.parent : existing.parent,
      updated_at: new Date().toISOString(),
    };

    // Save to local DB
    await this.driver!.putTag(updatedTag);

    const client_rev = (existing.rev || 0) + 1;

    // Queue for sync
    await this.driver!.enqueueTag({
      op: 'upsert',
      id: id,
      client_rev: client_rev,
      data: updatedTag,
    });

    log.info('Tag updated in local DB and queued for sync', {
      id: id,
      name: updatedTag.name,
      current_rev: existing.rev,
      client_rev: client_rev,
    });

    return repoToTag(updatedTag);
  }

  /**
   * Delete a tag from local database
   * Changes are queued in outbox for sync
   */
  async deleteTag(id: string): Promise<void> {
    await this.ensureInitialized();

    // Mark as deleted in local DB
    await this.driver!.deleteTag(id);

    // Queue for sync
    await this.driver!.enqueueTag({
      op: 'delete',
      id: id,
      client_rev: 1,
    });

    log.info('Tag deleted from local DB and queued for sync', { id });
  }
}

export const tagService = new TagService();
