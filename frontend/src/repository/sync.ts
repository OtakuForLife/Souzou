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
    if (pending.length > 0) {
      const entities = pending.filter((x: any) => x.data?.type || x.op === 'delete' && x.id).map(x => x) as ChangeOp<RepoEntity>[];
      const tags = pending.filter((x: any) => x.data?.name || x.op === 'delete' && x.id).map(x => x) as ChangeOp<RepoTag>[];

      const res: PushResults = await this.transport.push({ entities, tags });
      pushed = res.entities.length + res.tags.length;

      // TODO: remove successfully applied items from outbox (driver-specific IDs)
    }

    return { pulled, pushed };
  }
}

export default SyncOrchestrator;

