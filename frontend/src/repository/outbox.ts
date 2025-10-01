// Outbox item types (skeleton)
import type { ChangeOp, RepoEntity, RepoTag } from './types';

export type OutboxItem = (ChangeOp<RepoEntity> | ChangeOp<RepoTag>) & {
  _id?: string; // internal id used by drivers
  createdAt?: string; // optional driver-set timestamp
};

