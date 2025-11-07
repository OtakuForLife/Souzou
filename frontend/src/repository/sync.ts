// Sync orchestrator skeleton
import type {
  IRepositoryDriver,
  ISyncTransport,
  RepoEntity,
  RepoTag,
  ChangeOp,
  PushResults,
} from './types';

export class SyncOrchestrator {
  constructor(private store: IRepositoryDriver, private transport: ISyncTransport) {}

  async syncNow(): Promise<{ pulled: number; pushed: number }> {
    let pulled = 0;
    let pushed = 0;

    // 1) Pull
    const since = await this.store.getCursor();
    const pull = await this.transport.pull(since);

    // Apply server upserts
    for (const e of pull.changes.entities.upserts) {
      console.log('[Sync] Pulling entity:', e.id, 'rev:', e.rev, 'title:', e.title, 'content length:', e.content?.length || 0);
      await this.store.putEntity(e as RepoEntity);
      pulled++;
    }
    for (const t of pull.changes.tags.upserts) {
      await this.store.putTag(t as RepoTag);
      pulled++;
    }
    // Apply server deletes
    for (const id of pull.changes.entities.deletes) {
      await this.store.deleteEntity(id);
      pulled++;
    }
    for (const id of pull.changes.tags.deletes) {
      await this.store.deleteTag(id);
      pulled++;
    }

    await this.store.setCursor(pull.cursor);

    // 2) Push
    const pending = await this.store.peekOutbox(100);
    console.log('[Sync] Outbox items to push:', pending.length, pending);
    if (pending.length > 0) {
      const entities = pending.filter((x: any) => x.data?.type || x.op === 'delete' && x.id).map(x => x) as ChangeOp<RepoEntity>[];
      const tags = pending.filter((x: any) => x.data?.name || x.op === 'delete' && x.id).map(x => x) as ChangeOp<RepoTag>[];

      console.log('[Sync] Pushing entities:', entities.length, 'tags:', tags.length);
      const res: PushResults = await this.transport.push({ entities, tags });
      pushed = res.entities.length + res.tags.length;
      console.log('[Sync] Push results:', res);

      // Update local entities with server rev and remove from outbox
      const appliedIds: string[] = [];
      const conflictIds: string[] = [];

      for (const result of res.entities) {
        if (result.status === 'applied') {
          // Update local entity with new rev from server
          const entity = await this.store.getEntity(result.id);
          if (entity) {
            entity.rev = result.rev;
            entity.server_updated_at = result.server_updated_at;
            await this.store.putEntity(entity);
          }
          appliedIds.push(result.id);
        } else if (result.status === 'conflict' && result.server) {
          // Conflict: server has a newer version
          console.warn('[Sync] Conflict detected for entity:', result.id, 'server version:', result.server);

          // Strategy: Accept server version (server wins)
          // This prevents infinite conflict loops
          await this.store.putEntity(result.server as RepoEntity);

          // Remove from outbox since we accepted server version
          conflictIds.push(result.id);

          console.log('[Sync] Resolved conflict by accepting server version for entity:', result.id);
        }
      }

      for (const result of res.tags) {
        if (result.status === 'applied') {
          // Update local tag with new rev from server
          const tag = await this.store.getTag(result.id);
          if (tag) {
            tag.rev = result.rev;
            tag.server_updated_at = result.server_updated_at;
            await this.store.putTag(tag);
          }
          appliedIds.push(result.id);
        } else if (result.status === 'conflict' && result.server) {
          // Conflict: server has a newer version
          console.warn('[Sync] Conflict detected for tag:', result.id);

          // Strategy: Accept server version (server wins)
          await this.store.putTag(result.server as RepoTag);

          // Remove from outbox since we accepted server version
          conflictIds.push(result.id);

          console.log('[Sync] Resolved conflict by accepting server version for tag:', result.id);
        }
      }

      // Remove successfully applied items and resolved conflicts from outbox
      const idsToRemove = [...appliedIds, ...conflictIds];
      if (idsToRemove.length > 0) {
        console.log('[Sync] Removing from outbox:', idsToRemove);
        await this.store.removeFromOutbox(idsToRemove);
        console.log('[Sync] Removed from outbox successfully');
      }

      if (conflictIds.length > 0) {
        console.warn('[Sync] Resolved', conflictIds.length, 'conflicts by accepting server version');
      }
    }

    return { pulled, pushed };
  }
}

export default SyncOrchestrator;

