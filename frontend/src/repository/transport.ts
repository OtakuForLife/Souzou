// HTTP transport to backend sync endpoints (uses api.ts)
import api from '@/lib/api';
import type { ISyncTransport, Cursor, PullChanges, ChangeOp, RepoEntity, RepoTag, PushResults } from './types';

export class HttpSyncTransport implements ISyncTransport {
  async pull(since: Cursor): Promise<PullChanges> {
    const qs = since ? `?since=${encodeURIComponent(since)}` : '';
    const res = await api.get<PullChanges>(`/api/sync/pull${qs}`);
    return res.data;
  }

  async push(payload: { entities: ChangeOp<RepoEntity>[]; tags: ChangeOp<RepoTag>[] }): Promise<PushResults> {
    const res = await api.post<PushResults>(`/api/sync/push`, payload);
    return res.data;
  }
}

export default HttpSyncTransport;

