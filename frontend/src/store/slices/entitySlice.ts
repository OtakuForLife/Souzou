import { Entity } from '@/models/Entity';
import { CreateEntityRequest, entityService } from '@/services';
import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store';


export const createEntity = createAsyncThunk(
  'entities/createEntity',
  async (entity: CreateEntityRequest & { tempId?: string }) => {
    return await entityService.createEntity(entity);
  }
);

export const saveEntity = createAsyncThunk(
  'entities/saveEntity',
  async (entity: Entity) => {
    return await entityService.saveEntity(entity);
  }
);

export const deleteEntity = createAsyncThunk(
  'entities/deleteEntity',
  async (id: string) => {
    return await entityService.deleteEntity(id);
  }
);

export const fetchEntities = createAsyncThunk(
  'entities/fetchEntities',
  async () => {
    return await entityService.fetchEntities();
  }
);

/**
 * Add tags to an entity in local database (queued for sync)
 */
export const addTagsToEntity = createAsyncThunk(
  'entities/addTagsToEntity',
  async ({ entityId, tagIds }: { entityId: string; tagIds: string[] }) => {
    return await entityService.addTagsToEntity(entityId, tagIds);
  }
);

/**
 * Remove tags from an entity in local database (queued for sync)
 */
export const removeTagsFromEntity = createAsyncThunk(
  'entities/removeTagsFromEntity',
  async ({ entityId, tagIds }: { entityId: string; tagIds: string[] }) => {
    return await entityService.removeTagsFromEntity(entityId, tagIds);
  }
);

interface EntityState {
  allEntities: { [id: string]: Entity; };
  dirtyEntityIDs: string[]; // IDs of entities that have been modified but not saved

  // Granular loading states
  globalLoading: boolean; // Only for initial fetch
  pendingCreates: string[]; // Temporary IDs of entities being created
  pendingSaves: string[]; // IDs of entities being saved
  pendingDeletes: string[]; // IDs of entities being deleted

  // Optimistic operation tracking
  optimisticEntities: { [tempId: string]: Entity }; // Entities created optimistically

  error: string | null;
}

const initialState: EntityState = {
  allEntities: {},
  dirtyEntityIDs: [],
  globalLoading: false,
  pendingCreates: [],
  pendingSaves: [],
  pendingDeletes: [],
  optimisticEntities: {},
  error: null,
}

// Helper function to compute children relationships from parent field
const computeChildrenRelationships = (entities: Entity[]): { [id: string]: Entity } => {
  // First, create a map with all entities having empty children arrays
  const entityMap: { [id: string]: Entity } = {};
  entities.forEach(entity => {
    entityMap[entity.id] = { ...entity, children: [] };
  });

  // Then, populate children arrays based on parent relationships
  entities.forEach(entity => {
    if (entity.parent && entityMap[entity.parent]) {
      entityMap[entity.parent].children.push(entity.id);
    }
  });

  return entityMap;
};

// Selector to get root entities (entities with no parent)
export const selectRootEntities = createSelector(
  [(state: RootState) => state.entities.allEntities],
  (allEntities) => Object.values(allEntities).filter(entity => entity.parent === null)
);

export const entitySlice = createSlice({
  name: 'entities',
  initialState,
  reducers: {
    updateEntity: (state, action: PayloadAction<{
      noteID: string;
      title?: string;
      content?: string;
      parent?: string | null;
      tags?: string[]; // Changed from any[] to string[] (tag IDs)
      metadata?: Record<string, any>;
    }>) => {
      const noteID: string = action.payload.noteID;
      var entity: Entity = state.allEntities[noteID];
      var isDirty = false;
      if (entity) {
        if (action.payload.title !== undefined && action.payload.title !== entity.title) {
          entity.title = action.payload.title
          isDirty = true;
        };
        if (action.payload.content !== undefined && action.payload.content !== entity.content) {
          entity.content = action.payload.content
          isDirty = true;
        };
        if (action.payload.parent !== undefined && action.payload.parent !== entity.parent) {
          entity.parent = action.payload.parent
          isDirty = true;
        };
        if (action.payload.tags !== undefined) {
          entity.tags = action.payload.tags
          isDirty = true;
        };
        if (action.payload.metadata !== undefined) {
          entity.metadata = action.payload.metadata
          isDirty = true;
        };

        if (!state.dirtyEntityIDs.includes(noteID) && isDirty) {
          state.dirtyEntityIDs.push(noteID);
        }

        state.allEntities[noteID] = entity;
      }
    },

    // Optimistic create - add entity immediately with temporary ID
    optimisticCreateEntity: (state, action: PayloadAction<{
      tempId: string;
      entity: Omit<Entity, 'id' | 'created_at' | 'updated_at'>;
    }>) => {
      const { tempId, entity } = action.payload;
      const optimisticEntity: Entity = {
        ...entity,
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add to optimistic entities
      state.optimisticEntities[tempId] = optimisticEntity;
      if (!state.pendingCreates.includes(tempId)) {
        state.pendingCreates.push(tempId);
      }

      // Also add to allEntities for immediate display
      state.allEntities[tempId] = optimisticEntity;

      // Add to parent's children if it has a parent
      if (entity.parent) {
        const parent = state.allEntities[entity.parent];
        if (parent && !parent.children.includes(tempId)) {
          parent.children.push(tempId);
        }
      }
    },

    // Optimistic save - mark entity as pending save
    optimisticSaveEntity: (state, action: PayloadAction<string>) => {
      const entityId = action.payload;
      if (!state.pendingSaves.includes(entityId)) {
        state.pendingSaves.push(entityId);
      }
    },

    // Optimistic delete - mark entity as pending delete
    optimisticDeleteEntity: (state, action: PayloadAction<string>) => {
      const entityId = action.payload;
      if (!state.pendingDeletes.includes(entityId)) {
        state.pendingDeletes.push(entityId);
      }
    },

    changeEntityParent: (state, action: PayloadAction<{ noteID: string; newParent: string | null }>) => {
      const { noteID, newParent } = action.payload;
      if (state.allEntities[noteID]) {
        state.allEntities[noteID].parent = newParent;
      }
    },

    removeTagFromAllEntities: (state, action: PayloadAction<string>) => {
      const tagIdToRemove = action.payload;
      // Remove the tag ID from all entities that have it
      // Don't mark as dirty since the backend has already handled this change
      Object.values(state.allEntities).forEach(entity => {
        if (entity.tags?.includes(tagIdToRemove)) {
          entity.tags = (entity.tags || []).filter(tagId => tagId !== tagIdToRemove);
          // Don't mark as dirty - the backend has already removed the tag relationship
        }
      });
    }
  },
  extraReducers: builder => {
    builder
      // Fetch entities - only operation that uses global loading
      .addCase(fetchEntities.pending, (state) => {
        state.globalLoading = true;
        state.error = null;
      })
      .addCase(fetchEntities.fulfilled, (state, action) => {
        state.globalLoading = false;
        state.error = null;
        // Compute children relationships from parent field
        state.allEntities = computeChildrenRelationships(action.payload);
      })
      .addCase(fetchEntities.rejected, (state, action) => {
        state.globalLoading = false;
        state.error = action.error.message || 'Failed to fetch entities';
      })

      // Create entity - optimistic update already happened, just replace temp ID with real ID
      .addCase(createEntity.pending, (state, action) => {
        // Optimistic update already happened via optimisticCreateEntity
        // Just track that we're waiting for server response
        state.error = null;
      })
      .addCase(createEntity.fulfilled, (state, action) => {
        const newEntity = action.payload.newNoteData;
        const tempId = action.meta.arg.tempId as string | undefined;

        if (tempId) {
          // Remove optimistic entity
          delete state.optimisticEntities[tempId];
          state.pendingCreates = state.pendingCreates.filter(id => id !== tempId);

          // Remove temp entity from allEntities
          delete state.allEntities[tempId];

          // Remove temp ID from parent's children
          if (newEntity.parent) {
            const parent = state.allEntities[newEntity.parent];
            if (parent) {
              parent.children = parent.children.filter(id => id !== tempId);
            }
          }
        }

        // Add the real entity
        state.allEntities[newEntity.id] = newEntity;

        // Add real ID to parent's children
        if (newEntity.parent) {
          const parent = state.allEntities[newEntity.parent];
          if (parent && !parent.children.includes(newEntity.id)) {
            parent.children.push(newEntity.id);
          }
        }

        state.error = null;
      })
      .addCase(createEntity.rejected, (state, action) => {
        const tempId = action.meta.arg.tempId as string | undefined;

        if (tempId) {
          // Keep the optimistic entity but remove from pending
          state.pendingCreates = state.pendingCreates.filter(id => id !== tempId);
          // Don't remove from allEntities - let user retry
        }

        state.error = action.error.message || 'Failed to create entity';
      })
      // Save entity - optimistic update already happened via updateEntity
      .addCase(saveEntity.pending, (state, action) => {
        const entityId = action.meta.arg.id;
        if (!state.pendingSaves.includes(entityId)) {
          state.pendingSaves.push(entityId);
        }
        state.error = null;
      })
      .addCase(saveEntity.fulfilled, (state, action) => {
        const savedEntity = action.payload.savedEntity;
        state.pendingSaves = state.pendingSaves.filter(id => id !== savedEntity.id);

        const oldEntity = state.allEntities[savedEntity.id] || { parent: null };

        // Handle parent changes
        if (oldEntity.parent !== savedEntity.parent) {
          // Remove from old parent's children if it had a parent
          if (oldEntity.parent !== null) {
            const oldParent = state.allEntities[oldEntity.parent];
            if (oldParent) {
              oldParent.children = oldParent.children.filter(child => child !== savedEntity.id);
              state.allEntities[oldParent.id] = oldParent;
            }
          }

          // Add to new parent's children if it has a new parent
          if (savedEntity.parent !== null) {
            const newParent = state.allEntities[savedEntity.parent];
            if (newParent && !newParent.children.includes(savedEntity.id)) {
              newParent.children.push(savedEntity.id);
              state.allEntities[newParent.id] = newParent;
            }
          }
        }

        // Update the entity with server data
        state.allEntities[savedEntity.id] = savedEntity;

        // Remove from dirty entities
        if (state.dirtyEntityIDs.includes(savedEntity.id)) {
          state.dirtyEntityIDs = state.dirtyEntityIDs.filter(id => id !== savedEntity.id);
        }

        state.error = null;
      })
      .addCase(saveEntity.rejected, (state, action) => {
        const entityId = action.meta.arg.id;
        state.pendingSaves = state.pendingSaves.filter(id => id !== entityId);
        state.error = action.error.message || 'Failed to save entity';
      })

      // Delete entity
      .addCase(deleteEntity.pending, (state, action) => {
        const entityId = action.meta.arg;
        if (!state.pendingDeletes.includes(entityId)) {
          state.pendingDeletes.push(entityId);
        }
        state.error = null;
      })
      .addCase(deleteEntity.fulfilled, (state, action) => {
        const deletedId = action.meta.arg;
        state.pendingDeletes = state.pendingDeletes.filter(id => id !== deletedId);

        // Refresh all entities from server response and compute children relationships
        state.allEntities = computeChildrenRelationships(action.payload);
        state.error = null;
      })
      .addCase(deleteEntity.rejected, (state, action) => {
        const entityId = action.meta.arg;
        state.pendingDeletes = state.pendingDeletes.filter(id => id !== entityId);
        state.error = action.error.message || 'Failed to delete entity';
      })
      // Add tags to entity
      .addCase(addTagsToEntity.pending, (state, action) => {
        const entityId = action.meta.arg.entityId;
        if (!state.pendingSaves.includes(entityId)) {
          state.pendingSaves.push(entityId);
        }
        state.error = null;
      })
      .addCase(addTagsToEntity.fulfilled, (state, action) => {
        const updatedEntity = action.payload;
        state.pendingSaves = state.pendingSaves.filter(id => id !== updatedEntity.id);
        state.allEntities[updatedEntity.id] = updatedEntity;
        state.error = null;
      })
      .addCase(addTagsToEntity.rejected, (state, action) => {
        const entityId = action.meta.arg.entityId;
        state.pendingSaves = state.pendingSaves.filter(id => id !== entityId);
        state.error = action.error.message || 'Failed to add tags to entity';
      })

      // Remove tags from entity
      .addCase(removeTagsFromEntity.pending, (state, action) => {
        const entityId = action.meta.arg.entityId;
        if (!state.pendingSaves.includes(entityId)) {
          state.pendingSaves.push(entityId);
        }
        state.error = null;
      })
      .addCase(removeTagsFromEntity.fulfilled, (state, action) => {
        const updatedEntity = action.payload;
        state.pendingSaves = state.pendingSaves.filter(id => id !== updatedEntity.id);
        state.allEntities[updatedEntity.id] = updatedEntity;
        state.error = null;
      })
      .addCase(removeTagsFromEntity.rejected, (state, action) => {
        const entityId = action.meta.arg.entityId;
        state.pendingSaves = state.pendingSaves.filter(id => id !== entityId);
        state.error = action.error.message || 'Failed to remove tags from entity';
      });
  },
})

export const {
  updateEntity,
  changeEntityParent,
  removeTagFromAllEntities,
  optimisticCreateEntity,
  optimisticSaveEntity,
  optimisticDeleteEntity
} = entitySlice.actions;

export default entitySlice.reducer;
export type { EntityState };