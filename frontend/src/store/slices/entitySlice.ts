import { Entity } from '@/models/Entity';
import { CreateEntityRequest, entityService } from '@/services';
import { tagService } from '@/services/tagService';
import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store';


export const createEntity = createAsyncThunk(
  'entities/createEntity',
  async (entity: CreateEntityRequest) => {
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

export const addTagsToEntity = createAsyncThunk(
  'entities/addTagsToEntity',
  async ({ entityId, tagIds }: { entityId: string; tagIds: string[] }) => {
    return await tagService.addTagsToEntity(entityId, tagIds);
  }
);

export const removeTagsFromEntity = createAsyncThunk(
  'entities/removeTagsFromEntity',
  async ({ entityId, tagIds }: { entityId: string; tagIds: string[] }) => {
    return await tagService.removeTagsFromEntity(entityId, tagIds);
  }
);

interface EntityState {
  allEntities: { [id: string]: Entity; };
  dirtyEntityIDs: string[]; // IDs of entities that have been modified but not saved
  loading: boolean;
  error: string | null;
}

const initialState: EntityState = {
  allEntities: {},
  dirtyEntityIDs: [],
  loading: false,
  error: null,
}

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
    changeEntityParent: (state, action: PayloadAction<{ noteID: string; newParent: string | null }>) => {
      // TODO: Implement entity parent change logic
      const { noteID, newParent } = action.payload;
      if (state.allEntities[noteID]) {
        state.allEntities[noteID].parent = newParent;
      }
    },
    removeTagFromAllEntities: (state, action: PayloadAction<string>) => {
      const tagIdToRemove = action.payload;
      // Remove the tag ID from all entities that have it
      Object.values(state.allEntities).forEach(entity => {
        if (entity.tags.includes(tagIdToRemove)) {
          entity.tags = entity.tags.filter(tagId => tagId !== tagIdToRemove);
          // Mark entity as dirty if it's not already
          if (!state.dirtyEntityIDs.includes(entity.id)) {
            state.dirtyEntityIDs.push(entity.id);
          }
        }
      });
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchEntities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEntities.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.allEntities = Object.fromEntries(action.payload.map((entity: Entity) => [entity.id, entity]));
      })
      .addCase(fetchEntities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch entities';
      })
      .addCase(createEntity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const newEntity = action.payload.newNoteData;

        // Add the new entity to allEntities
        state.allEntities[newEntity.id] = newEntity;

        // If it has a parent, add it to parent's children
        if (newEntity.parent !== null) {
          const parent = state.allEntities[newEntity.parent];
          if (parent) {
            if (!parent.children.includes(newEntity.id)) {
              parent.children.push(newEntity.id);
            }
            state.allEntities[newEntity.parent] = parent;
          }
        }
      })
      .addCase(createEntity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create entity';
      })
      .addCase(saveEntity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const savedEntity = action.payload.savedEntity;
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

        // Update the entity
        state.allEntities[savedEntity.id] = savedEntity;

        // Remove from dirty entities
        if (state.dirtyEntityIDs.includes(savedEntity.id)) {
          state.dirtyEntityIDs = state.dirtyEntityIDs.filter(id => id !== savedEntity.id);
        }
      })
      .addCase(saveEntity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to save entity';
      })
      .addCase(deleteEntity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.allEntities = Object.fromEntries(action.payload.map((entity: Entity) => [entity.id, entity]));
      })
      .addCase(deleteEntity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete entity';
      })
      // Add tags to entity
      .addCase(addTagsToEntity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTagsToEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const updatedEntity = action.payload;
        state.allEntities[updatedEntity.id] = updatedEntity;
      })
      .addCase(addTagsToEntity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add tags to entity';
      })
      // Remove tags from entity
      .addCase(removeTagsFromEntity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeTagsFromEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const updatedEntity = action.payload;
        state.allEntities[updatedEntity.id] = updatedEntity;
      })
      .addCase(removeTagsFromEntity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to remove tags from entity';
      });
  },
})

export const { updateEntity, changeEntityParent, removeTagFromAllEntities } = entitySlice.actions;
export default entitySlice.reducer;
export type { EntityState };