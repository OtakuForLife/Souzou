/**
 * IndexedDB driver using Dexie
 * Provides persistent local storage for entities, tags, and sync state
 */

import Dexie, { Table } from 'dexie';
import type { IRepositoryDriver, RepoEntity, RepoTag, UUID, ChangeOp, Cursor } from '../types';
import { getDatabaseName } from '@/lib/platform';

// Outbox item with internal ID
interface OutboxItem {
  _id?: string;
  op: 'upsert' | 'delete';
  id: UUID;
  client_rev: number;
  data?: Partial<RepoEntity> | Partial<RepoTag>;
}

// Sync metadata
interface SyncMeta {
  key: string;
  value: string | null;
}

class SouzouDatabase extends Dexie {
  entities!: Table<RepoEntity, UUID>;
  tags!: Table<RepoTag, UUID>;
  outbox!: Table<OutboxItem, string>;
  syncMeta!: Table<SyncMeta, string>;

  constructor(dbName: string) {
    super(dbName);

    this.version(1).stores({
      entities: 'id, updated_at, server_updated_at, deleted',
      tags: 'id, updated_at, server_updated_at, deleted',
      outbox: '++_id, id, op',
      syncMeta: 'key',
    });
  }
}

export class IndexedDbDriver implements IRepositoryDriver {
  private db: SouzouDatabase | null = null;

  async init(): Promise<void> {
    const dbName = getDatabaseName();
    this.db = new SouzouDatabase(dbName);
    await this.db.open();
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // Entities
  async getEntity(id: UUID): Promise<RepoEntity | undefined> {
    return await this.db!.entities.get(id);
  }

  async putEntity(entity: RepoEntity): Promise<void> {
    // Ensure updated_at is set (use server_updated_at as fallback, or current time)
    // Ensure tags and metadata are always defined
    const entityToStore: RepoEntity = {
      ...entity,
      updated_at: entity.updated_at || entity.server_updated_at || new Date().toISOString(),
      tags: entity.tags || [],
      metadata: entity.metadata || {},
    };

    await this.db!.entities.put(entityToStore);
  }

  async deleteEntity(id: UUID): Promise<void> {
    // Mark as deleted instead of removing
    const entity = await this.db!.entities.get(id);
    if (entity) {
      await this.db!.entities.put({
        ...entity,
        deleted: true,
        deleted_at: new Date().toISOString(),
      });
    }
  }

  async listEntitiesUpdatedSince(isoCursor: string): Promise<RepoEntity[]> {
    // Get all entities and filter in memory
    // This is more reliable than using Dexie's where() when fields might be undefined
    const allEntities = await this.db!.entities.toArray();

    // Filter entities: include if updated_at >= cursor OR if updated_at is undefined
    return allEntities.filter(e => {
      if (!e.updated_at) return true; // Include entities without updated_at
      return e.updated_at >= isoCursor;
    });
  }

  // Tags
  async getTag(id: UUID): Promise<RepoTag | undefined> {
    return await this.db!.tags.get(id);
  }

  async putTag(tag: RepoTag): Promise<void> {
    // Ensure updated_at is set (use server_updated_at as fallback, or current time)
    const tagToStore: RepoTag = {
      ...tag,
      updated_at: tag.updated_at || tag.server_updated_at || new Date().toISOString(),
    };

    await this.db!.tags.put(tagToStore);
  }

  async deleteTag(id: UUID): Promise<void> {
    // Mark as deleted instead of removing
    const tag = await this.db!.tags.get(id);
    if (tag) {
      await this.db!.tags.put({
        ...tag,
        deleted: true,
        deleted_at: new Date().toISOString(),
      });
    }
  }

  async listTagsUpdatedSince(isoCursor: string): Promise<RepoTag[]> {
    // Get all tags and filter in memory
    const allTags = await this.db!.tags.toArray();

    // Filter tags: include if updated_at >= cursor OR if updated_at is undefined
    return allTags.filter(t => {
      if (!t.updated_at) return true; // Include tags without updated_at
      return t.updated_at >= isoCursor;
    });
  }

  // Outbox
  async enqueueEntity(op: ChangeOp<RepoEntity>): Promise<void> {
    // Check if there's already an outbox item for this entity
    // This implements deduplication: multiple edits before sync = one outbox item with latest data
    const existing = await this.db!.outbox.where('id').equals(op.id).first();

    console.log('[IndexedDB] Enqueue entity:', op.id, 'existing:', existing ? existing._id : 'none');

    if (existing) {
      // Update existing outbox item with latest data
      console.log('[IndexedDB] Updating existing outbox item:', existing._id);
      await this.db!.outbox.update(existing._id!, {
        op: op.op,
        client_rev: op.client_rev,
        data: op.op === 'upsert' ? op.data : undefined,
      });
    } else {
      // Add new outbox item
      console.log('[IndexedDB] Adding new outbox item for:', op.id);
      await this.db!.outbox.add({
        op: op.op,
        id: op.id,
        client_rev: op.client_rev,
        data: op.op === 'upsert' ? op.data : undefined,
      });
    }
  }

  async enqueueTag(op: ChangeOp<RepoTag>): Promise<void> {
    // Check if there's already an outbox item for this tag
    // This implements deduplication: multiple edits before sync = one outbox item with latest data
    const existing = await this.db!.outbox.where('id').equals(op.id).first();

    if (existing) {
      // Update existing outbox item with latest data
      await this.db!.outbox.update(existing._id!, {
        op: op.op,
        client_rev: op.client_rev,
        data: op.op === 'upsert' ? op.data : undefined,
      });
    } else {
      // Add new outbox item
      await this.db!.outbox.add({
        op: op.op,
        id: op.id,
        client_rev: op.client_rev,
        data: op.op === 'upsert' ? op.data : undefined,
      });
    }
  }

  async peekOutbox(limit: number): Promise<Array<ChangeOp<RepoEntity> | ChangeOp<RepoTag>>> {
    const items = await this.db!.outbox.limit(limit).toArray();
    return items.map(item => {
      if (item.op === 'upsert') {
        return {
          op: 'upsert',
          id: item.id,
          client_rev: item.client_rev,
          data: item.data as any,
        };
      } else {
        return {
          op: 'delete',
          id: item.id,
          client_rev: item.client_rev,
        };
      }
    });
  }

  async removeFromOutbox(ids: string[]): Promise<void> {
    // Delete outbox items by entity/tag ID (not by _id primary key)
    await this.db!.outbox.where('id').anyOf(ids).delete();
  }

  // Cursor
  async getCursor(): Promise<Cursor> {
    const meta = await this.db!.syncMeta.get('cursor');
    return meta?.value || null;
  }

  async setCursor(cursor: string): Promise<void> {
    await this.db!.syncMeta.put({ key: 'cursor', value: cursor });
  }
}

export default IndexedDbDriver;

