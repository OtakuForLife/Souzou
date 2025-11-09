/**
 * Sync Manager Service
 * Manages automatic synchronization between local and server databases
 * based on server health status
 *
 * Platform Support:
 * - Web: Uses IndexedDB for local storage
 * - Desktop (Electron): Uses SQLite for local storage
 * - Mobile (Android/Capacitor): Uses SQLite for local storage
 *
 * The appropriate driver is automatically selected based on the platform.
 */

import { SyncOrchestrator } from '@/repository/sync';
import { getRepositoryDriver } from '@/repository';
import { HttpSyncTransport } from '@/repository/transport';
import { log } from '@/lib/logger';
import { getPlatformDisplayName } from '@/lib/platform';

export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  ERROR = 'error',
}

export interface SyncResult {
  pulled: number;
  pushed: number;
  timestamp: Date;
}

export type SyncCallback = (result: SyncResult) => void | Promise<void>;

class SyncManager {
  private orchestrator: SyncOrchestrator | null = null;
  private driver: any = null; // Store driver reference for cursor operations
  private isInitialized = false;
  private isSyncing = false;
  private lastSyncResult: SyncResult | null = null;
  private syncListeners: Set<(result: SyncResult) => void> = new Set();
  private statusListeners: Set<(status: SyncStatus) => void> = new Set();
  private currentStatus: SyncStatus = SyncStatus.IDLE;

  /**
   * Initialize the sync manager with repository driver and transport
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      log.debug('SyncManager already initialized');
      return;
    }

    try {
      const platformName = getPlatformDisplayName();
      log.info('Initializing SyncManager', { platform: platformName });

      this.driver = await getRepositoryDriver();

      const transport = new HttpSyncTransport();
      this.orchestrator = new SyncOrchestrator(this.driver, transport);

      this.isInitialized = true;
      log.info('SyncManager initialized successfully (using singleton driver)', { platform: platformName });
    } catch (error) {
      log.error('Failed to initialize SyncManager', error as Error);
      throw error;
    }
  }

  /**
   * Perform synchronization with the server
   * @param force - Force sync even if already syncing
   */
  async sync(force: boolean = false): Promise<SyncResult | null> {
    if (!this.isInitialized || !this.orchestrator) {
      log.warn('SyncManager not initialized, skipping sync');
      return null;
    }

    if (this.isSyncing && !force) {
      log.debug('Sync already in progress, skipping');
      return null;
    }

    this.isSyncing = true;
    this.updateStatus(SyncStatus.SYNCING);

    try {
      log.info('Starting sync...');
      const result = await this.orchestrator.syncNow();

      const syncResult: SyncResult = {
        pulled: result.pulled,
        pushed: result.pushed,
        timestamp: new Date(),
      };

      this.lastSyncResult = syncResult;
      this.updateStatus(SyncStatus.IDLE);

      log.info('Sync completed successfully', {
        pulled: result.pulled,
        pushed: result.pushed,
      });

      // Notify listeners
      this.notifySyncListeners(syncResult);

      return syncResult;
    } catch (error) {
      log.error('Sync failed', error as Error);
      this.updateStatus(SyncStatus.ERROR);
      return null;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Reset sync cursor and perform a full sync from the beginning
   * This will pull all entities from the server
   */
  async resetCursorAndSync(): Promise<SyncResult | null> {
    if (!this.isInitialized || !this.orchestrator || !this.driver) {
      log.warn('SyncManager not initialized, skipping full sync');
      return null;
    }

    try {
      log.info('Resetting sync cursor for full sync');
      // Use the same driver instance that the orchestrator is using
      await this.driver.setCursor('1970-01-01T00:00:00.000Z'); // Reset to epoch
      log.info('Cursor reset, starting full sync');

      return await this.sync(true); // Force sync
    } catch (error) {
      log.error('Failed to reset cursor and sync', error as Error);
      throw error;
    }
  }

  /**
   * Get the last sync result
   */
  getLastSyncResult(): SyncResult | null {
    return this.lastSyncResult;
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return this.currentStatus;
  }

  /**
   * Check if currently syncing
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Subscribe to sync completion events
   */
  onSync(callback: (result: SyncResult) => void): () => void {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  /**
   * Subscribe to status change events
   */
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  /**
   * Update sync status and notify listeners
   */
  private updateStatus(status: SyncStatus): void {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.notifyStatusListeners(status);
    }
  }

  /**
   * Notify all sync listeners
   */
  private notifySyncListeners(result: SyncResult): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(result);
      } catch (error) {
        log.error('Error in sync listener', error as Error);
      }
    });
  }

  /**
   * Notify all status listeners
   */
  private notifyStatusListeners(status: SyncStatus): void {
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        log.error('Error in status listener', error as Error);
      }
    });
  }
}

// Export singleton instance
export const syncManager = new SyncManager();
export default syncManager;

