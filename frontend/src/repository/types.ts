// Offline-first repository contracts (skeleton)
export type UUID = string;

export type Cursor = string | null; // ISO timestamp cursor

export interface BaseSyncFields {
  rev?: number;
  server_updated_at?: string; // ISO
  deleted?: boolean;
  deleted_at?: string | null; // ISO
}

export interface RepoEntity extends BaseSyncFields {
  id: UUID;
  type: string;
  title: string;
  content: string;
  parent: UUID | null;
  metadata: Record<string, any>;
  tags: UUID[];
  created_at?: string;
  updated_at?: string;
}

export interface RepoTag extends BaseSyncFields {
  id: UUID;
  name: string;
  color: string;
  description?: string;
  parent?: UUID | null;
  created_at?: string;
  updated_at?: string;
}

export type ChangeOp<T> =
  | { op: 'upsert'; id: UUID; client_rev: number; data: Partial<T> & { id: UUID } }
  | { op: 'delete'; id: UUID; client_rev: number };

export interface PullChanges {
  cursor: string; // ISO
  changes: {
    entities: { upserts: RepoEntity[]; deletes: UUID[] };
    tags: { upserts: RepoTag[]; deletes: UUID[] };
  };
}

export interface PushResultsItem {
  id: UUID;
  status: 'applied' | 'conflict' | 'error';
  rev?: number;
  server_updated_at?: string;
  error?: string;
  server?: any;
}

export interface PushResults {
  entities: PushResultsItem[];
  tags: PushResultsItem[];
}

export interface IRepositoryDriver {
  // Storage lifecycle
  init(): Promise<void>;
  close(): Promise<void>;
  clearAllData(): Promise<void>; // Clear all local data (entities, tags, outbox, sync cursor)

  // Entities
  getEntity(id: UUID): Promise<RepoEntity | undefined>;
  putEntity(entity: RepoEntity): Promise<void>;
  deleteEntity(id: UUID): Promise<void>;
  listEntitiesUpdatedSince(isoCursor: string): Promise<RepoEntity[]>; // optional helper

  // Tags
  getTag(id: UUID): Promise<RepoTag | undefined>;
  putTag(tag: RepoTag): Promise<void>;
  deleteTag(id: UUID): Promise<void>;
  listTagsUpdatedSince(isoCursor: string): Promise<RepoTag[]>; // optional helper

  // Outbox
  enqueueEntity(op: ChangeOp<RepoEntity>): Promise<void>;
  enqueueTag(op: ChangeOp<RepoTag>): Promise<void>;
  peekOutbox(limit: number): Promise<Array<ChangeOp<RepoEntity> | ChangeOp<RepoTag>>>;
  removeFromOutbox(ids: string[]): Promise<void>;

  // Cursor
  getCursor(): Promise<Cursor>;
  setCursor(cursor: string): Promise<void>;
}

export interface ISyncTransport {
  pull(since: Cursor): Promise<PullChanges>;
  push(payload: { entities: ChangeOp<RepoEntity>[]; tags: ChangeOp<RepoTag>[] }): Promise<PushResults>;
}

export interface ISyncOrchestrator {
  syncNow(): Promise<{ pulled: number; pushed: number }>;
}

