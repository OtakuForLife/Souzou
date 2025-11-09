import { useState, useEffect, useCallback, useRef } from 'react';
import { getBackendURL } from '@/lib/settings';
import { log } from '@/lib/logger';
import { syncManager } from '@/services/syncManager';
import { connectionState } from '@/lib/connectionState';

export enum ServerHealthStatusType {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  CHECKING = 'checking',
}

interface UseServerHealthOptions {
  checkInterval?: number; // in milliseconds
  enabled?: boolean;
  autoSync?: boolean; // Automatically sync when server becomes healthy
}

interface ServerHealthResult {
  status: ServerHealthStatusType;
  lastChecked: Date | null;
  checkHealth: () => Promise<void>;
  triggerSync: () => Promise<void>;
  triggerFullSync: () => Promise<void>;
}

const DEFAULT_CHECK_INTERVAL = 20000; // 10 seconds

/**
 * Hook to periodically check server health status and trigger sync when server becomes available
 */
export function useServerHealth(options: UseServerHealthOptions = {}): ServerHealthResult {
  const { checkInterval = DEFAULT_CHECK_INTERVAL, enabled = true, autoSync = true } = options;

  const [status, setStatus] = useState<ServerHealthStatusType>(ServerHealthStatusType.CHECKING);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const previousStatus = useRef<ServerHealthStatusType>(ServerHealthStatusType.CHECKING);

  const checkHealth = useCallback(async () => {
    if (!enabled) return;

    try {
      const baseURL = getBackendURL();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${baseURL}/api/health/`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setStatus(ServerHealthStatusType.HEALTHY);
        connectionState.setOnline(true);
        log.debug('Server health check: healthy');
      } else {
        setStatus(ServerHealthStatusType.UNHEALTHY);
        connectionState.setOnline(false);
        log.warn('Server health check: unhealthy', { status: response.status });
      }
    } catch (error) {
      setStatus(ServerHealthStatusType.UNHEALTHY);
      connectionState.setOnline(false);
      log.warn('Server health check: failed', { error });
    } finally {
      setLastChecked(new Date());
    }
  }, [enabled]);

  const triggerSync = useCallback(async () => {
    log.info('Manual sync triggered');
    try {
      await syncManager.initialize();
      await syncManager.sync();
      log.info('Manual sync completed successfully');
    } catch (error) {
      log.error('Manual sync failed', error as Error);
      throw error;
    }
  }, []);

  const triggerFullSync = useCallback(async () => {
    log.info('Full sync triggered - resetting cursor');
    try {
      await syncManager.initialize();
      await syncManager.resetCursorAndSync();
      log.info('Full sync completed successfully');
    } catch (error) {
      log.error('Full sync failed', error as Error);
      throw error;
    }
  }, []);

  // Trigger sync when server becomes healthy or periodically when healthy
  useEffect(() => {
    if (!autoSync) return;

    const wasUnhealthy = previousStatus.current === 'unhealthy';
    const isNowHealthy = status === 'healthy';

    // Sync when server reconnects
    if (wasUnhealthy && isNowHealthy) {
      log.info('Server reconnected, triggering sync...');

      syncManager.initialize()
        .then(() => syncManager.sync())
        .catch((error) => {
          log.error('Failed to sync after server reconnection', error as Error);
        });
    }

    // Periodic sync when server is healthy
    if (status === 'healthy') {
      const syncInterval = setInterval(() => {
        log.debug('Periodic sync triggered');
        syncManager.initialize()
          .then(() => syncManager.sync())
          .catch((error) => {
            log.error('Periodic sync failed', error as Error);
          });
      }, checkInterval); // Use same interval as health check

      return () => clearInterval(syncInterval);
    }

    previousStatus.current = status;
  }, [status, autoSync, checkInterval]);

  // Initial check
  useEffect(() => {
    if (enabled) {
      checkHealth();
    }
  }, [enabled, checkHealth]);

  // Periodic checks
  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      checkHealth();
    }, checkInterval);

    return () => clearInterval(intervalId);
  }, [enabled, checkInterval, checkHealth]);

  return {
    status,
    lastChecked,
    checkHealth,
    triggerSync,
    triggerFullSync,
  };
}

