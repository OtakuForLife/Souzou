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
      console.log('[Sync] Pulling entity:', e.id, 'rev:', e.rev, 'title:', e.title);
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
        }
      }

      // Remove successfully applied items from outbox
      if (appliedIds.length > 0) {
        console.log('[Sync] Removing from outbox:', appliedIds);
        await this.store.removeFromOutbox(appliedIds);
        console.log('[Sync] Removed from outbox successfully');
      }
    }

    return { pulled, pushed };
  }
}

export default SyncOrchestrator;

