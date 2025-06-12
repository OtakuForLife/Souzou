/**
 * Entity Link Slice - Manages link-relevant entity data for graph widgets
 * 
 * This slice maintains a separate state that only updates when link-relevant
 * entity properties change (title, parent, content, type), not on every entity update.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Entity } from '@/models/Entity';

// Link-relevant entity data
export interface LinkEntityData {
  id: string;
  title: string;
  parent?: string;
  content?: string;
  type: string;
}

interface EntityLinkState {
  // Map of entity ID to link-relevant data
  linkData: Record<string, LinkEntityData>;
  // Root entities (entities with no parent)
  rootEntities: LinkEntityData[];
}

const initialState: EntityLinkState = {
  linkData: {},
  rootEntities: [],
};

const entityLinkSlice = createSlice({
  name: 'entityLink',
  initialState,
  reducers: {
    // Update link data for entities
    updateLinkData: (state, action: PayloadAction<Record<string, Entity>>) => {
      const allEntities = action.payload;
      
      // Extract link-relevant data
      const newLinkData: Record<string, LinkEntityData> = {};
      const newRootEntities: LinkEntityData[] = [];
      
      Object.values(allEntities).forEach(entity => {
        const linkEntity: LinkEntityData = {
          id: entity.id,
          title: entity.title,
          parent: entity.parent || undefined,
          content: entity.content || undefined,
          type: entity.type,
        };
        
        newLinkData[entity.id] = linkEntity;
        
        // Track root entities
        if (!entity.parent) {
          newRootEntities.push(linkEntity);
        }
      });
      
      state.linkData = newLinkData;
      state.rootEntities = newRootEntities;
    },
    
    // Update a single entity's link data
    updateSingleEntityLinkData: (state, action: PayloadAction<Entity>) => {
      const entity = action.payload;
      
      const linkEntity: LinkEntityData = {
        id: entity.id,
        title: entity.title,
        parent: entity.parent || undefined,
        content: entity.content || undefined,
        type: entity.type,
      };
      
      // Update the entity
      state.linkData[entity.id] = linkEntity;
      
      // Update root entities list
      state.rootEntities = Object.values(state.linkData).filter(e => !e.parent);
    },
    
    // Remove entity from link data
    removeEntityLinkData: (state, action: PayloadAction<string>) => {
      const entityId = action.payload;
      delete state.linkData[entityId];
      state.rootEntities = state.rootEntities.filter(e => e.id !== entityId);
    },
  },
});

export const { 
  updateLinkData, 
  updateSingleEntityLinkData, 
  removeEntityLinkData 
} = entityLinkSlice.actions;

export default entityLinkSlice.reducer;

// Selectors with better memoization
import { createSelector } from '@reduxjs/toolkit';

export const selectLinkData = (state: { entityLink: EntityLinkState }) => state.entityLink.linkData;
export const selectRootLinkEntities = (state: { entityLink: EntityLinkState }) => state.entityLink.rootEntities;

// Create a memoized selector that creates a stable hash of the link data
export const selectLinkDataHash = createSelector(
  [selectLinkData],
  (linkData) => {
    // Create a hash of only the properties that affect graph rendering
    const hashData: Record<string, string> = {};
    Object.values(linkData).forEach(entity => {
      // Only include properties that affect the graph
      hashData[entity.id] = `${entity.title}|${entity.parent || ''}|${entity.type}|${(entity.content || '').length}`;
    });
    return JSON.stringify(hashData);
  }
);

// Create a memoized selector for root entities hash
export const selectRootEntitiesHash = createSelector(
  [selectRootLinkEntities],
  (rootEntities) => {
    return rootEntities.map(e => `${e.id}|${e.title}`).join(',');
  }
);
