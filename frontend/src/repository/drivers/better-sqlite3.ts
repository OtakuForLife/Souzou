/**
 * SQLite driver for Electron using better-sqlite3
 * 
 * This driver uses better-sqlite3 which is a synchronous SQLite library for Node.js
 * It only works in Electron's main process or with nodeIntegration enabled
 */

import type { IRepositoryDriver, RepoEntity, RepoTag, UUID, ChangeOp, Cursor } from '../types';
import { getDatabaseName } from '@/lib/platform';

type Database = any;

export class BetterSqlite3Driver implements IRepositoryDriver {
  private db: Database | null = null;
  private dbName: string = '';

  async init(): Promise<void> {
    try {
      this.dbName = getDatabaseName();
      console.log('[BetterSQLite3] Initializing database:', this.dbName);

      // Dynamically import better-sqlite3 (only available in Electron)
      const BetterSqlite3 = (window as any).require('better-sqlite3');
      
      // Open database
      this.db = new BetterSqlite3(this.dbName);
      
      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');

      await this.createTables();
      console.log('[BetterSQLite3] Initialization complete');
    } catch (error) {
      console.error('[BetterSQLite3] Initialization failed:', error);
      throw new Error(
        `better-sqlite3 driver initialization failed: ${error instanceof Error ? error.message : String(error)}. ` +
        'Make sure better-sqlite3 is installed and you are running in Electron with nodeIntegration enabled.'
      );
    }
  }

  private async createTables(): Promise<void> {
    // Create entities table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        parent TEXT,
        metadata TEXT NOT NULL,
        tags TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT,
        rev INTEGER,
        server_updated_at TEXT,
        deleted INTEGER DEFAULT 0,
        deleted_at TEXT
      )
    `);

    // Create tags table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT,
        created_at TEXT,
        updated_at TEXT,
        rev INTEGER,
        server_updated_at TEXT,
        deleted INTEGER DEFAULT 0,
        deleted_at TEXT
      )
    `);

    // Create outbox table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS outbox (
        _id INTEGER PRIMARY KEY AUTOINCREMENT,
        op TEXT NOT NULL,
        id TEXT NOT NULL,
        client_rev INTEGER NOT NULL,
        data TEXT
      )
    `);

    // Create sync_meta table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_meta (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Create indices for performance
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_entities_updated_at ON entities(updated_at)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_entities_deleted ON entities(deleted)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_tags_updated_at ON tags(updated_at)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_tags_deleted ON tags(deleted)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_outbox_id ON outbox(id)`);
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) return;
    this.db.exec('DELETE FROM entities');
    this.db.exec('DELETE FROM tags');
    this.db.exec('DELETE FROM outbox');
    this.db.exec('DELETE FROM sync_meta');
  }

  // Entities
  async getEntity(id: UUID): Promise<RepoEntity | undefined> {
    const stmt = this.db.prepare('SELECT * FROM entities WHERE id = ?');
    const row = stmt.get(id);
    if (!row) return undefined;
    return this.deserializeEntity(row);
  }

  async putEntity(entity: RepoEntity): Promise<void> {
    const entityToStore: RepoEntity = {
      ...entity,
      updated_at: entity.updated_at || entity.server_updated_at || new Date().toISOString(),
      tags: entity.tags || [],
      metadata: entity.metadata || {},
    };

    const serialized = this.serializeEntity(entityToStore);
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO entities
      (id, type, title, content, parent, metadata, tags, created_at, updated_at, rev, server_updated_at, deleted, deleted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      serialized.id,
      serialized.type,
      serialized.title,
      serialized.content,
      serialized.parent,
      serialized.metadata,
      serialized.tags,
      serialized.created_at,
      serialized.updated_at,
      serialized.rev,
      serialized.server_updated_at,
      serialized.deleted,
      serialized.deleted_at,
    );
  }

  async deleteEntity(id: UUID): Promise<void> {
    const entity = await this.getEntity(id);
    if (entity) {
      const updated = {
        ...entity,
        deleted: true,
        deleted_at: new Date().toISOString(),
      };
      await this.putEntity(updated);
    }
  }

  async listEntitiesUpdatedSince(isoCursor: string): Promise<RepoEntity[]> {
    const stmt = this.db.prepare('SELECT * FROM entities');
    const rows = stmt.all();
    const allEntities = rows.map((row: any) => this.deserializeEntity(row));

    return allEntities.filter((e: RepoEntity) => {
      if (!e.updated_at) return true;
      return e.updated_at >= isoCursor;
    });
  }

  // Tags
  async getTag(id: UUID): Promise<RepoTag | undefined> {
    const stmt = this.db.prepare('SELECT * FROM tags WHERE id = ?');
    const row = stmt.get(id);
    if (!row) return undefined;
    return this.deserializeTag(row);
  }

  async putTag(tag: RepoTag): Promise<void> {
    const tagToStore: RepoTag = {
      ...tag,
      updated_at: tag.updated_at || tag.server_updated_at || new Date().toISOString(),
    };

    const serialized = this.serializeTag(tagToStore);
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO tags
      (id, name, color, created_at, updated_at, rev, server_updated_at, deleted, deleted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      serialized.id,
      serialized.name,
      serialized.color,
      serialized.created_at,
      serialized.updated_at,
      serialized.rev,
      serialized.server_updated_at,
      serialized.deleted,
      serialized.deleted_at,
    );
  }

  async deleteTag(id: UUID): Promise<void> {
    const tag = await this.getTag(id);
    if (tag) {
      const updated = {
        ...tag,
        deleted: true,
        deleted_at: new Date().toISOString(),
      };
      await this.putTag(updated);
    }
  }

  async listTagsUpdatedSince(isoCursor: string): Promise<RepoTag[]> {
    const stmt = this.db.prepare('SELECT * FROM tags');
    const rows = stmt.all();
    const allTags = rows.map((row: any) => this.deserializeTag(row));

    return allTags.filter((t: RepoTag) => {
      if (!t.updated_at) return true;
      return t.updated_at >= isoCursor;
    });
  }

  // Outbox
  async enqueueEntity(op: ChangeOp<RepoEntity>): Promise<void> {
    // Check if there's already an outbox item for this entity
    const checkStmt = this.db.prepare('SELECT * FROM outbox WHERE id = ?');
    const existing = checkStmt.get(op.id);

    if (existing) {
      // Update existing outbox item
      const updateStmt = this.db.prepare('UPDATE outbox SET op = ?, client_rev = ?, data = ? WHERE id = ?');
      updateStmt.run(op.op, op.client_rev, op.op === 'upsert' ? JSON.stringify(op.data) : null, op.id);
    } else {
      // Add new outbox item
      const insertStmt = this.db.prepare('INSERT INTO outbox (op, id, client_rev, data) VALUES (?, ?, ?, ?)');
      insertStmt.run(op.op, op.id, op.client_rev, op.op === 'upsert' ? JSON.stringify(op.data) : null);
    }
  }

  async enqueueTag(op: ChangeOp<RepoTag>): Promise<void> {
    // Check if there's already an outbox item for this tag
    const checkStmt = this.db.prepare('SELECT * FROM outbox WHERE id = ?');
    const existing = checkStmt.get(op.id);

    if (existing) {
      // Update existing outbox item
      const updateStmt = this.db.prepare('UPDATE outbox SET op = ?, client_rev = ?, data = ? WHERE id = ?');
      updateStmt.run(op.op, op.client_rev, op.op === 'upsert' ? JSON.stringify(op.data) : null, op.id);
    } else {
      // Add new outbox item
      const insertStmt = this.db.prepare('INSERT INTO outbox (op, id, client_rev, data) VALUES (?, ?, ?, ?)');
      insertStmt.run(op.op, op.id, op.client_rev, op.op === 'upsert' ? JSON.stringify(op.data) : null);
    }
  }

  async peekOutbox(limit: number): Promise<Array<ChangeOp<RepoEntity> | ChangeOp<RepoTag>>> {
    const stmt = this.db.prepare('SELECT * FROM outbox ORDER BY _id ASC LIMIT ?');
    const rows = stmt.all(limit);
    return rows.map((row: any) => {
      if (row.op === 'upsert') {
        return {
          op: 'upsert',
          id: row.id,
          client_rev: row.client_rev,
          data: JSON.parse(row.data),
        };
      } else {
        return {
          op: 'delete',
          id: row.id,
          client_rev: row.client_rev,
        };
      }
    });
  }

  async removeFromOutbox(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    const stmt = this.db.prepare(`DELETE FROM outbox WHERE id IN (${placeholders})`);
    stmt.run(...ids);
  }

  // Cursor
  async getCursor(): Promise<Cursor> {
    const stmt = this.db.prepare('SELECT value FROM sync_meta WHERE key = ?');
    const row = stmt.get('cursor');
    if (!row) return null;
    return row.value;
  }

  async setCursor(cursor: string): Promise<void> {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)');
    stmt.run('cursor', cursor);
  }

  private serializeEntity(entity: RepoEntity): any {
    return {
      ...entity,
      metadata: JSON.stringify(entity.metadata),
      tags: JSON.stringify(entity.tags),
      deleted: entity.deleted ? 1 : 0,
    };
  }

  private deserializeEntity(row: any): RepoEntity {
    return {
      ...row,
      metadata: JSON.parse(row.metadata),
      tags: JSON.parse(row.tags),
      deleted: Boolean(row.deleted),
    };
  }

  private serializeTag(tag: RepoTag): any {
    return {
      ...tag,
      deleted: tag.deleted ? 1 : 0,
    };
  }

  private deserializeTag(row: any): RepoTag {
    return {
      ...row,
      deleted: Boolean(row.deleted),
    };
  }
}

