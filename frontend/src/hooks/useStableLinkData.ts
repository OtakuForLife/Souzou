/**
 * useStableLinkData Hook - Provides stable link data for graph widgets
 * 
 * This hook returns link-relevant entity data that only changes when
 * actual link relationships change, not on every entity update.
 */

import { useSelector } from 'react-redux';
import { selectLinkData, selectRootLinkEntities, LinkEntityData } from '@/store/slices/entityLinkSlice';

export interface StableLinkData {
  linkData: Record<string, LinkEntityData>;
  rootEntities: LinkEntityData[];
}

export const useStableLinkData = (): StableLinkData => {
  const linkData = useSelector(selectLinkData);
  const rootEntities = useSelector(selectRootLinkEntities);

  // DEBUG: Log when hook is called (remove in production)
  // console.log('🔍 useStableLinkData: Hook called', { entityCount: Object.keys(linkData).length });
  
  return {
    linkData,
    rootEntities,
  };
};
