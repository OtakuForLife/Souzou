// Repository factory (skeleton)
import type { IRepositoryDriver } from './types';
import { IndexedDbDriver } from './drivers/indexeddb';
// import { SqliteDriver } from './drivers/sqlite'; // For Electron/Android later

export function createRepositoryDriver(): IRepositoryDriver {
  // TODO: detect platform; for now, default to IndexedDB driver everywhere to compile
  return new IndexedDbDriver();
}

export * from './types';
export { SyncOrchestrator } from './sync';

