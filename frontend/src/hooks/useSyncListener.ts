/**
 * Hook to listen to sync events and refresh Redux state
 */

import { useEffect } from 'react';
import { fetchEntities } from '@/store/slices/entitySlice';
import { fetchTags } from '@/store/slices/tagSlice';
import { syncManager } from '@/services/syncManager';
import { log } from '@/lib/logger';
import { useAppDispatch } from '.';

/**
 * Hook that listens to sync completion events and refreshes entities and tags in Redux
 * Also loads initial data from local database on mount
 */
export function useSyncListener() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Load initial data from local database on mount
    log.info('Loading initial data from local database');
    dispatch(fetchEntities());
    dispatch(fetchTags());

    // Subscribe to sync completion events
    const unsubscribe = syncManager.onSync(async (result) => {
      // Refresh Redux if any changes were pulled OR pushed
      // We need to refresh after push because:
      // 1. Local DB entities/tags have updated rev values after successful push
      // 2. Conflicts may have been resolved by accepting server version
      if (result.pulled > 0 || result.pushed > 0) {
        log.info('Sync completed, refreshing entities and tags in Redux', {
          pulled: result.pulled,
          pushed: result.pushed,
        });

        // Refresh entities and tags from local database to Redux
        await dispatch(fetchEntities());
        await dispatch(fetchTags());
      }
    });

    return unsubscribe;
  }, [dispatch]);
}

export default useSyncListener;

