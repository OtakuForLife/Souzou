import { Middleware } from '@reduxjs/toolkit';
import { deleteEntityTag } from '../slices/tagSlice';
import { removeTagFromAllEntities } from '../slices/entitySlice';

/**
 * Middleware to clean up tag references from entities when a tag is deleted
 */
export const tagCleanupMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  // Check if a tag was successfully deleted
  if (deleteEntityTag.fulfilled.match(action)) {
    const deletedTagId = action.payload;
    // Remove the deleted tag from all entities
    store.dispatch(removeTagFromAllEntities(deletedTagId));
  }

  return result;
};
