// Repository factory with platform detection
import type { IRepositoryDriver } from './types';
import { getPlatform, isElectron, isCapacitor } from '@/lib/platform';
import { log } from '@/lib/logger';

// Singleton instance of the repository driver
let driverInstance: IRepositoryDriver | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Get the singleton repository driver instance
 * This ensures all parts of the app use the same database connection
 * - Web: IndexedDB
 * - Electron: SQLite (via better-sqlite3)
 * - Capacitor (iOS/Android): SQLite (via @capacitor-community/sqlite)
 */
export async function getRepositoryDriver(): Promise<IRepositoryDriver> {
  if (driverInstance) {
    return driverInstance;
  }

  // Ensure only one initialization happens
  if (!initPromise) {
    initPromise = (async () => {
      const platform = getPlatform();
      log.info('Creating repository driver singleton', { platform });

      // Select driver based on platform (lazy-load to avoid Vite bundling issues)
      if (isElectron()) {
        log.info('Using better-sqlite3 driver for Electron', { platform });
        const { BetterSqlite3Driver } = await import('./drivers/better-sqlite3');
        driverInstance = new BetterSqlite3Driver();
      } else if (isCapacitor()) {
        log.info('Using Capacitor SQLite driver for mobile', { platform });
        const { CapacitorSqliteDriver } = await import('./drivers/capacitor-sqlite');
        driverInstance = new CapacitorSqliteDriver();
      } else {
        // Default to IndexedDB for web
        log.info('Using IndexedDB driver for web platform');
        const { IndexedDbDriver } = await import('./drivers/indexeddb');
        driverInstance = new IndexedDbDriver();
      }

      await driverInstance!.init();
      log.info('Repository driver initialized', { platform });
    })();
  }

  await initPromise;
  return driverInstance!;
}

export * from './types';
export { SyncOrchestrator } from './sync';

