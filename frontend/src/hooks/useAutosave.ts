import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { saveEntity } from '@/store/slices/entitySlice';
import { useAppDispatch } from '@/hooks';
import { log } from '@/lib/logger';

const AUTOSAVE_INTERVAL = 10000; // 10 seconds

/**
 * Hook to automatically save dirty entities every x seconds
 * 
 * This hook monitors the dirtyEntityIDs array in Redux state and
 * automatically saves all dirty entities at regular intervals.
 */
export function useAutosave() {
  const dispatch = useAppDispatch();
  const dirtyEntityIDs = useSelector((state: RootState) => state.entities.dirtyEntityIDs);
  const allEntities = useSelector((state: RootState) => state.entities.allEntities);
  const pendingSaves = useSelector((state: RootState) => state.entities.pendingSaves);
  
  // Use ref to track if autosave is currently running
  const isSavingRef = useRef(false);

  useEffect(() => {
    // Set up interval for autosave
    const intervalId = setInterval(async () => {
      // Skip if no dirty entities or already saving
      if (dirtyEntityIDs.length === 0 || isSavingRef.current) {
        return;
      }

      // Filter out entities that are already being saved
      const entitiesToSave = dirtyEntityIDs.filter(id => !pendingSaves.includes(id));

      if (entitiesToSave.length === 0) {
        return;
      }

      isSavingRef.current = true;
      
      log.info('Autosave triggered', { 
        dirtyCount: dirtyEntityIDs.length,
        savingCount: entitiesToSave.length 
      });

      try {
        // Save all dirty entities in parallel
        const savePromises = entitiesToSave.map(entityId => {
          const entity = allEntities[entityId];
          if (!entity) {
            log.warn('Autosave: Entity not found', { entityId });
            return Promise.resolve();
          }
          
          return dispatch(saveEntity(entity)).unwrap();
        });

        await Promise.allSettled(savePromises);
        
        log.info('Autosave completed', { savedCount: entitiesToSave.length });
      } catch (error) {
        log.error('Autosave failed', error as Error);
      } finally {
        isSavingRef.current = false;
      }
    }, AUTOSAVE_INTERVAL);

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [dirtyEntityIDs, allEntities, pendingSaves, dispatch]);

  // Return autosave status for debugging/UI purposes
  return {
    isDirty: dirtyEntityIDs.length > 0,
    dirtyCount: dirtyEntityIDs.length,
  };
}

