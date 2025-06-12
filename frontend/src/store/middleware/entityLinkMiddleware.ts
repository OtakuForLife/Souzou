/**
 * Entity Link Middleware - Intelligently updates link state
 * 
 * This middleware watches for entity changes and only updates the entityLink
 * state when link-relevant properties actually change.
 */

import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { updateLinkData, updateSingleEntityLinkData, removeEntityLinkData } from '../slices/entityLinkSlice';
import { linkParsingService } from '@/services/linkParsingService';

// Helper function to extract link-relevant data from an entity
const extractLinkRelevantData = (entity: any) => ({
  id: entity.id,
  title: entity.title,
  parent: entity.parent || undefined,
  content: entity.content || undefined,
  type: entity.type,
});

// Helper function to check if ONLY graph-relevant data has changed
const hasGraphRelevantDataChanged = (oldEntity: any, newEntity: any, allEntities: Record<string, any>): boolean => {
  if (!oldEntity || !newEntity) return true;

  // Check title change
  if (oldEntity.title !== newEntity.title) {
    console.log('🔍 EntityLink Middleware: Title changed');
    return true;
  }

  // Check parent change
  if (oldEntity.parent !== newEntity.parent) {
    console.log('🔍 EntityLink Middleware: Parent changed');
    return true;
  }

  // Check type change
  if (oldEntity.type !== newEntity.type) {
    console.log('🔍 EntityLink Middleware: Type changed');
    return true;
  }

  // Check if markdown links in content changed (not just any content change)
  const linksChanged = hasMarkdownLinksChanged(oldEntity.content, newEntity.content, allEntities);
  if (linksChanged) {
    console.log('🔍 EntityLink Middleware: Markdown links changed');
    return true;
  }

  console.log('🔍 EntityLink Middleware: No graph-relevant changes detected');
  return false;
};

// Helper function to check if markdown links in content have changed
const hasMarkdownLinksChanged = (oldContent: string | undefined, newContent: string | undefined, allEntities: Record<string, any>): boolean => {
  if (oldContent === newContent) return false;
  
  const oldLinks = oldContent ? linkParsingService.parseLinks(oldContent, allEntities).links : [];
  const newLinks = newContent ? linkParsingService.parseLinks(newContent, allEntities).links : [];
  
  // Compare link patterns (simplified comparison)
  const oldLinkIds = oldLinks.map(link => link.targetNoteId).sort();
  const newLinkIds = newLinks.map(link => link.targetNoteId).sort();
  
  return JSON.stringify(oldLinkIds) !== JSON.stringify(newLinkIds);
};

export const entityLinkMiddleware: Middleware<{}, RootState> = (store) => (next) => (action: any) => {
  const prevState = store.getState();
  const result = next(action);
  const nextState = store.getState();
  
  // Only process entity-related actions
  if (!action.type.startsWith('entities/')) {
    return result;
  }
  
  const prevEntities = prevState.entities.allEntities;
  const nextEntities = nextState.entities.allEntities;
  
  // Check if entities have changed
  if (prevEntities === nextEntities) {
    return result;
  }
  
  console.log('🔍 EntityLink Middleware: Processing entity change', action.type);
  
  // Handle different types of entity changes
  switch (action.type) {
    case 'entities/setEntities':
      // Full entity reload - update all link data
      console.log('🔍 EntityLink Middleware: Full entity reload');
      store.dispatch(updateLinkData(nextEntities));
      break;
      
    case 'entities/updateEntity':
    case 'entities/addEntity':
      // Single entity update - check if ONLY graph-relevant data changed
      const entityId = action.payload.noteID || action.payload.id;
      const prevEntity = prevEntities[entityId];
      const nextEntity = nextEntities[entityId];

      if (hasGraphRelevantDataChanged(prevEntity, nextEntity, nextEntities)) {
        console.log('🔍 EntityLink Middleware: Graph-relevant data changed for entity', entityId);

        // Check if markdown links changed specifically
        const linksChanged = hasMarkdownLinksChanged(
          prevEntity?.content,
          nextEntity?.content,
          nextEntities
        );

        if (linksChanged) {
          console.log('🔍 EntityLink Middleware: Markdown links changed, updating all link data');
          // If markdown links changed, we need to update all link data
          // because other entities might be affected
          store.dispatch(updateLinkData(nextEntities));
        } else {
          console.log('🔍 EntityLink Middleware: Only entity properties changed, updating single entity');
          store.dispatch(updateSingleEntityLinkData(nextEntity));
        }
      } else {
        console.log('🔍 EntityLink Middleware: No graph-relevant changes, skipping update');
      }
      break;
      
    case 'entities/deleteEntity':
      // Entity deletion
      const deletedEntityId = action.payload;
      console.log('🔍 EntityLink Middleware: Entity deleted', deletedEntityId);
      store.dispatch(removeEntityLinkData(deletedEntityId));
      break;
      
    default:
      // For other entity actions, do a full comparison
      const entitiesChanged = Object.keys(nextEntities).some(id =>
        hasGraphRelevantDataChanged(prevEntities[id], nextEntities[id], nextEntities)
      );

      if (entitiesChanged) {
        console.log('🔍 EntityLink Middleware: Entities changed, updating link data');
        store.dispatch(updateLinkData(nextEntities));
      }
      break;
  }
  
  return result;
};
