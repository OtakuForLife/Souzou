/**
 * Hook to listen to sync events and refresh Redux state
 */

import { useEffect } from 'react';
import { fetchEntities } from '@/store/slices/entitySlice';
import { syncManager } from '@/services/syncManager';
import { log } from '@/lib/logger';
import { useAppDispatch } from '.';

/**
 * Hook that listens to sync completion events and refreshes entities in Redux
 */
export function useSyncListener() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Subscribe to sync completion events
    const unsubscribe = syncManager.onSync(async (result) => {
      // Refresh Redux if any changes were pulled OR pushed
      // We need to refresh after push because the local DB entities have updated rev values
      if (result.pulled > 0 || result.pushed > 0) {
        log.info('Sync completed, refreshing entities in Redux', {
          pulled: result.pulled,
          pushed: result.pushed,
        });

        // Refresh entities from local database to Redux
        await dispatch(fetchEntities());
      }
    });

    return unsubscribe;
  }, [dispatch]);
}

export default useSyncListener;

