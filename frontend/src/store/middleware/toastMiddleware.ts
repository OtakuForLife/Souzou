/**
 * Toast Middleware
 * 
 * Displays toast notifications for entity operation errors
 * Does NOT rollback state - allows user to retry operations
 */

import { Middleware } from '@reduxjs/toolkit';
import { toast } from 'sonner';

export const toastMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action);

  // Check if this is a rejected async thunk action
  if (action.type && typeof action.type === 'string' && action.type.endsWith('/rejected')) {
    const actionType = action.type.replace('/rejected', '');
    
    // Entity operations
    if (actionType === 'entities/createEntity') {
      toast.error('Failed to create entity', {
        description: action.error?.message || 'Please try again',
        duration: 5000,
      });
    } else if (actionType === 'entities/saveEntity') {
      toast.error('Failed to save changes', {
        description: action.error?.message || 'Please try again',
        duration: 5000,
      });
    } else if (actionType === 'entities/deleteEntity') {
      toast.error('Failed to delete entity', {
        description: action.error?.message || 'Please try again',
        duration: 5000,
      });
    } else if (actionType === 'entities/addTagsToEntity') {
      toast.error('Failed to add tags', {
        description: action.error?.message || 'Please try again',
        duration: 5000,
      });
    } else if (actionType === 'entities/removeTagsFromEntity') {
      toast.error('Failed to remove tags', {
        description: action.error?.message || 'Please try again',
        duration: 5000,
      });
    } else if (actionType === 'entities/fetchEntities') {
      toast.error('Failed to load entities', {
        description: action.error?.message || 'Please refresh the page',
        duration: 5000,
      });
    }
    
    // Tag operations
    else if (actionType === 'tags/createTag') {
      toast.error('Failed to create tag', {
        description: action.error?.message || 'Please try again',
        duration: 5000,
      });
    } else if (actionType === 'tags/deleteTag') {
      toast.error('Failed to delete tag', {
        description: action.error?.message || 'Please try again',
        duration: 5000,
      });
    } else if (actionType === 'tags/updateTag') {
      toast.error('Failed to update tag', {
        description: action.error?.message || 'Please try again',
        duration: 5000,
      });
    }
  }
  
  // Show success toasts for certain operations (optional)
  if (action.type && typeof action.type === 'string' && action.type.endsWith('/fulfilled')) {
    const actionType = action.type.replace('/fulfilled', '');
    
    // Uncomment these if you want success notifications
    // if (actionType === 'entities/createEntity') {
    //   toast.success('Entity created successfully');
    // } else if (actionType === 'entities/saveEntity') {
    //   toast.success('Changes saved');
    // } else if (actionType === 'entities/deleteEntity') {
    //   toast.success('Entity deleted');
    // }
  }

  return result;
};

