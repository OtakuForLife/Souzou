// SQLite driver skeleton (Electron/Android) — placeholder only
import type { IRepositoryDriver, RepoEntity, RepoTag, UUID, ChangeOp, Cursor } from '../types';

export class SqliteDriver implements IRepositoryDriver {
  async init(): Promise<void> {
    // TODO: wire up better-sqlite3 (Electron) or @capacitor-community/sqlite (Android)
  }
  async close(): Promise<void> {}

  // Entities
  async getEntity(_id: UUID): Promise<RepoEntity | undefined> { return undefined; }
  async putEntity(_entity: RepoEntity): Promise<void> {}
  async deleteEntity(_id: UUID): Promise<void> {}
  async listEntitiesUpdatedSince(_isoCursor: string): Promise<RepoEntity[]> { return []; }

  // Tags
  async getTag(_id: UUID): Promise<RepoTag | undefined> { return undefined; }
  async putTag(_tag: RepoTag): Promise<void> {}
  async deleteTag(_id: UUID): Promise<void> {}
  async listTagsUpdatedSince(_isoCursor: string): Promise<RepoTag[]> { return []; }

  // Outbox
  async enqueueEntity(_op: ChangeOp<RepoEntity>): Promise<void> {}
  async enqueueTag(_op: ChangeOp<RepoTag>): Promise<void> {}
  async peekOutbox(_limit: number) { return [] as Array<ChangeOp<RepoEntity> | ChangeOp<RepoTag>>; }
  async removeFromOutbox(_ids: string[]): Promise<void> {}

  // Cursor
  async getCursor(): Promise<Cursor> { return null; }
  async setCursor(_cursor: string): Promise<void> {}
}

export default SqliteDriver;

