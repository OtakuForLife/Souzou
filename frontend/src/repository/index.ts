// Repository factory with platform detection
import type { IRepositoryDriver } from './types';
import { IndexedDbDriver } from './drivers/indexeddb';
import { SqliteDriver } from './drivers/sqlite';
import { getPlatform, supportsSQLite } from '@/lib/platform';
import { log } from '@/lib/logger';

// Singleton instance of the repository driver
let driverInstance: IRepositoryDriver | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Get the singleton repository driver instance
 * This ensures all parts of the app use the same database connection
 * - Web: IndexedDB
 * - Electron: SQLite (via better-sqlite3)
 * - Capacitor (Android): SQLite (via @capacitor-community/sqlite)
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

      // Use SQLite for Electron and Capacitor platforms
      if (supportsSQLite()) {
        log.info('Using SQLite driver for platform', { platform });
        driverInstance = new SqliteDriver();
      } else {
        // Default to IndexedDB for web
        log.info('Using IndexedDB driver for web platform');
        driverInstance = new IndexedDbDriver();
      }

      await driverInstance.init();
      log.info('Repository driver initialized', { platform });
    })();
  }

  await initPromise;
  return driverInstance!;
}

/**
 * @deprecated Use getRepositoryDriver() instead for singleton pattern
 * Create a new repository driver instance (not recommended - use singleton)
 */
export function createRepositoryDriver(): IRepositoryDriver {
  const platform = getPlatform();

  log.warn('Creating new repository driver instance (consider using getRepositoryDriver singleton)', { platform });

  // Use SQLite for Electron and Capacitor platforms
  if (supportsSQLite()) {
    return new SqliteDriver();
  }

  // Default to IndexedDB for web
  return new IndexedDbDriver();
}

export * from './types';
export { SyncOrchestrator } from './sync';

