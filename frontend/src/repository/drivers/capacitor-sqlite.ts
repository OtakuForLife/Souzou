/**
 * SQLite driver for Capacitor (mobile iOS/Android)
 *
 * Uses @capacitor-community/sqlite plugin (async)
 */

import type { IRepositoryDriver, RepoEntity, RepoTag, UUID, ChangeOp, Cursor } from '../types';
import { getDatabaseName } from '@/lib/platform';

type SQLiteDBConnection = any;
type SQLiteConnection = any;

export class CapacitorSqliteDriver implements IRepositoryDriver {
  private db: SQLiteDBConnection | null = null;
  private dbName: string = '';
  private sqlite: SQLiteConnection | null = null;

  async init(): Promise<void> {
    try {
      this.dbName = getDatabaseName();
      console.log('[CapacitorSQLite] Initializing database:', this.dbName);

      // Import the Capacitor SQLite plugin
      const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
      this.sqlite = new SQLiteConnection(CapacitorSQLite);

      if (!this.sqlite) {
        throw new Error('Failed to load @capacitor-community/sqlite plugin');
      }

      console.log('[CapacitorSQLite] Creating connection...');

      // Create connection with positional parameters
      // Signature: createConnection(database, encrypted, mode, version, readonly)
      this.db = await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1, false);

      console.log('[CapacitorSQLite] Connection created:', this.db);

      if (!this.db) {
        throw new Error('Failed to create database connection');
      }

      console.log('[CapacitorSQLite] Opening database...');

      // Open database
      await this.db.open();

      console.log('[CapacitorSQLite] Database opened');

      // Create tables
      await this.createTables();
      console.log('[CapacitorSQLite] Initialization complete');
    } catch (error) {
      console.error('[CapacitorSQLite] Initialization failed:', error);
      throw new Error(
        `Capacitor SQLite driver initialization failed: ${error instanceof Error ? error.message : String(error)}. ` +
        'Make sure @capacitor-community/sqlite is installed and configured properly.'
      );
    }
  }

  private async createTables(): Promise<void> {
    // Create entities table
    await this.executeSQL(`
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
    await this.executeSQL(`
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
    await this.executeSQL(`
      CREATE TABLE IF NOT EXISTS outbox (
        _id INTEGER PRIMARY KEY AUTOINCREMENT,
        op TEXT NOT NULL,
        id TEXT NOT NULL,
        client_rev INTEGER NOT NULL,
        data TEXT
      )
    `);

    // Create sync_meta table
    await this.executeSQL(`
      CREATE TABLE IF NOT EXISTS sync_meta (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Create indices for performance
    await this.executeSQL(`CREATE INDEX IF NOT EXISTS idx_entities_updated_at ON entities(updated_at)`);
    await this.executeSQL(`CREATE INDEX IF NOT EXISTS idx_entities_deleted ON entities(deleted)`);
    await this.executeSQL(`CREATE INDEX IF NOT EXISTS idx_tags_updated_at ON tags(updated_at)`);
    await this.executeSQL(`CREATE INDEX IF NOT EXISTS idx_tags_deleted ON tags(deleted)`);
    await this.executeSQL(`CREATE INDEX IF NOT EXISTS idx_outbox_id ON outbox(id)`);
  }

  /**
   * Helper method to execute SQL statements (async)
   */
  private async executeSQL(sql: string, params?: any[]): Promise<any> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const isQuery = sql.trim().toUpperCase().startsWith('SELECT');

    if (isQuery) {
      const result = await this.db.query(sql, params || []);
      return result.values || [];
    } else {
      const result = await this.db.run(sql, params || []);
      return result;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  // Entities
  async getEntity(id: UUID): Promise<RepoEntity | undefined> {
    const rows = await this.executeSQL('SELECT * FROM entities WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return undefined;
    return this.deserializeEntity(rows[0]);
  }

  async putEntity(entity: RepoEntity): Promise<void> {
    const entityToStore: RepoEntity = {
      ...entity,
      updated_at: entity.updated_at || entity.server_updated_at || new Date().toISOString(),
      tags: entity.tags || [],
      metadata: entity.metadata || {},
    };

    const serialized = this.serializeEntity(entityToStore);
    await this.executeSQL(
      `INSERT OR REPLACE INTO entities
       (id, type, title, content, parent, metadata, tags, created_at, updated_at, rev, server_updated_at, deleted, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ]
    );
  }

  async deleteEntity(id: UUID): Promise<void> {
    const rows = await this.executeSQL('SELECT * FROM entities WHERE id = ?', [id]);
    if (rows && rows.length > 0) {
      const entity = this.deserializeEntity(rows[0]);
      const updated = {
        ...entity,
        deleted: true,
        deleted_at: new Date().toISOString(),
      };
      await this.putEntity(updated);
    }
  }

  async listEntitiesUpdatedSince(isoCursor: string): Promise<RepoEntity[]> {
    const rows = await this.executeSQL('SELECT * FROM entities');
    const allEntities = rows.map((row: any) => this.deserializeEntity(row));

    return allEntities.filter((e: RepoEntity) => {
      if (!e.updated_at) return true;
      return e.updated_at >= isoCursor;
    });
  }

  // Tags
  async getTag(id: UUID): Promise<RepoTag | undefined> {
    const rows = await this.executeSQL('SELECT * FROM tags WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return undefined;
    return this.deserializeTag(rows[0]);
  }

  async putTag(tag: RepoTag): Promise<void> {
    const tagToStore: RepoTag = {
      ...tag,
      updated_at: tag.updated_at || tag.server_updated_at || new Date().toISOString(),
    };

    const serialized = this.serializeTag(tagToStore);
    await this.executeSQL(
      `INSERT OR REPLACE INTO tags
       (id, name, color, created_at, updated_at, rev, server_updated_at, deleted, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        serialized.id,
        serialized.name,
        serialized.color,
        serialized.created_at,
        serialized.updated_at,
        serialized.rev,
        serialized.server_updated_at,
        serialized.deleted,
        serialized.deleted_at,
      ]
    );
  }

  async deleteTag(id: UUID): Promise<void> {
    const rows = await this.executeSQL('SELECT * FROM tags WHERE id = ?', [id]);
    if (rows && rows.length > 0) {
      const tag = this.deserializeTag(rows[0]);
      const updated = {
        ...tag,
        deleted: true,
        deleted_at: new Date().toISOString(),
      };
      await this.putTag(updated);
    }
  }

  async listTagsUpdatedSince(isoCursor: string): Promise<RepoTag[]> {
    const rows = await this.executeSQL('SELECT * FROM tags');
    const allTags = rows.map((row: any) => this.deserializeTag(row));

    return allTags.filter((t: RepoTag) => {
      if (!t.updated_at) return true;
      return t.updated_at >= isoCursor;
    });
  }

  // Outbox
  async enqueueEntity(op: ChangeOp<RepoEntity>): Promise<void> {
    // Check if there's already an outbox item for this entity
    const rows = await this.executeSQL('SELECT * FROM outbox WHERE id = ?', [op.id]);

    if (rows && rows.length > 0) {
      // Update existing outbox item
      await this.executeSQL(
        'UPDATE outbox SET op = ?, client_rev = ?, data = ? WHERE id = ?',
        [op.op, op.client_rev, op.op === 'upsert' ? JSON.stringify(op.data) : null, op.id]
      );
    } else {
      // Add new outbox item
      await this.executeSQL(
        'INSERT INTO outbox (op, id, client_rev, data) VALUES (?, ?, ?, ?)',
        [op.op, op.id, op.client_rev, op.op === 'upsert' ? JSON.stringify(op.data) : null]
      );
    }
  }

  async enqueueTag(op: ChangeOp<RepoTag>): Promise<void> {
    // Check if there's already an outbox item for this tag
    const rows = await this.executeSQL('SELECT * FROM outbox WHERE id = ?', [op.id]);

    if (rows && rows.length > 0) {
      // Update existing outbox item
      await this.executeSQL(
        'UPDATE outbox SET op = ?, client_rev = ?, data = ? WHERE id = ?',
        [op.op, op.client_rev, op.op === 'upsert' ? JSON.stringify(op.data) : null, op.id]
      );
    } else {
      // Add new outbox item
      await this.executeSQL(
        'INSERT INTO outbox (op, id, client_rev, data) VALUES (?, ?, ?, ?)',
        [op.op, op.id, op.client_rev, op.op === 'upsert' ? JSON.stringify(op.data) : null]
      );
    }
  }

  async peekOutbox(limit: number): Promise<Array<ChangeOp<RepoEntity> | ChangeOp<RepoTag>>> {
    const rows = await this.executeSQL('SELECT * FROM outbox ORDER BY _id ASC LIMIT ?', [limit]);
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
    await this.executeSQL(`DELETE FROM outbox WHERE id IN (${placeholders})`, ids);
  }

  // Cursor
  async getCursor(): Promise<Cursor> {
    const rows = await this.executeSQL('SELECT value FROM sync_meta WHERE key = ?', ['cursor']);
    if (!rows || rows.length === 0) return null;
    return rows[0].value;
  }

  async setCursor(cursor: string): Promise<void> {
    await this.executeSQL(
      'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
      ['cursor', cursor]
    );
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

