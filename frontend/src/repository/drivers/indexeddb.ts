// Dexie/IndexedDB driver skeleton (no Dexie import yet to avoid install)
import type { IRepositoryDriver, RepoEntity, RepoTag, UUID, ChangeOp, Cursor } from '../types';

// Light in-memory fallback to let app compile without Dexie installed yet
const mem = {
  entities: new Map<UUID, RepoEntity>(),
  tags: new Map<UUID, RepoTag>(),
  outbox: [] as Array<(ChangeOp<RepoEntity> | ChangeOp<RepoTag>) & { _id: string }>,
  cursor: null as Cursor,
};

export class IndexedDbDriver implements IRepositoryDriver {
  async init(): Promise<void> {
    // TODO: replace with Dexie schema
  }
  async close(): Promise<void> {}

  // Entities
  async getEntity(id: UUID): Promise<RepoEntity | undefined> { return mem.entities.get(id); }
  async putEntity(entity: RepoEntity): Promise<void> { mem.entities.set(entity.id, entity); }
  async deleteEntity(id: UUID): Promise<void> { mem.entities.delete(id); }
  async listEntitiesUpdatedSince(_isoCursor: string): Promise<RepoEntity[]> { return Array.from(mem.entities.values()); }

  // Tags
  async getTag(id: UUID): Promise<RepoTag | undefined> { return mem.tags.get(id); }
  async putTag(tag: RepoTag): Promise<void> { mem.tags.set(tag.id, tag); }
  async deleteTag(id: UUID): Promise<void> { mem.tags.delete(id); }
  async listTagsUpdatedSince(_isoCursor: string): Promise<RepoTag[]> { return Array.from(mem.tags.values()); }

  // Outbox
  async enqueueEntity(op: ChangeOp<RepoEntity>): Promise<void> { mem.outbox.push({ ...op, _id: crypto.randomUUID() }); }
  async enqueueTag(op: ChangeOp<RepoTag>): Promise<void> { mem.outbox.push({ ...op, _id: crypto.randomUUID() }); }
  async peekOutbox(limit: number) { return mem.outbox.slice(0, limit); }
  async removeFromOutbox(ids: string[]) { mem.outbox = mem.outbox.filter(x => !ids.includes(x._id)); }

  // Cursor
  async getCursor(): Promise<Cursor> { return mem.cursor; }
  async setCursor(cursor: string): Promise<void> { mem.cursor = cursor; }
}

export default IndexedDbDriver;

