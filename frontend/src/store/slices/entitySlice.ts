import { Entity } from '@/models/Entity';
import { CreateEntityRequest, entityService } from '@/services';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';


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

interface EntityState {
  rootEntities: Entity[];
  allEntities: { [id: string]: Entity; };
  dirtyEntityIDs: string[]; // IDs of entities that have been modified but not saved
  loading: boolean;
  error: string | null;
}

const initialState: EntityState = {
  rootEntities: [],
  allEntities: {},
  dirtyEntityIDs: [],
  loading: false,
  error: null,
}

export const entitySlice = createSlice({
  name: 'entities',
  initialState,
  reducers: {
    updateEntity: (state, action: PayloadAction<{
      noteID: string;
      title?: string;
      content?: string;
      parent?: string | null;
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
        state.rootEntities = action.payload.filter((entity: Entity) => entity.parent === null);
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

        // If it's a root entity (no parent), add it to rootEntities
        if (newEntity.parent === null) {
          state.rootEntities.push(newEntity);
        } else {
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

        if (oldEntity.parent === savedEntity.parent) {
          // Entity's parent didn't change - update in place
          state.allEntities[savedEntity.id] = savedEntity;

          // Also update in rootEntities if it's a root entity
          if (savedEntity.parent === null) {
            const rootIndex = state.rootEntities.findIndex(entity => entity.id === savedEntity.id);
            if (rootIndex !== -1) {
              state.rootEntities[rootIndex] = savedEntity;
            }
          }
        } else {
          console.log("Entity's parent changed");
          if (savedEntity.parent === null) {
            console.log("Entity is now root");
            // Entity is now root - add to rootEntities
            if (!state.rootEntities.includes(savedEntity)) {
              state.rootEntities.push(savedEntity);
            }
          } else {
            console.log("Entity has a new parent");
            // Entity has a new parent - add to new parent's children
            const newParent = state.allEntities[savedEntity.parent];
            if (newParent && !newParent.children.includes(savedEntity.id)) {
              newParent.children.push(savedEntity.id);
              state.allEntities[newParent.id] = newParent;
            }
          }
          if (oldEntity.parent !== null) {
            console.log("Entity had a parent before");
            // Entity had a parent before - remove from old parent's children
            const oldParent = state.allEntities[oldEntity.parent];
            if (oldParent) {
              oldParent.children = oldParent.children.filter(child => child !== savedEntity.id);
              state.allEntities[oldParent.id] = oldParent;
            }
          } else {
            console.log("Entity was root before");
            // Entity was root before - remove from rootEntities
            if (state.rootEntities.some(entity => entity.id === savedEntity.id)) {
              console.log("Removing from rootEntities");
              state.rootEntities = state.rootEntities.filter(entity => entity.id !== savedEntity.id);
            }
          }
          state.allEntities[savedEntity.id] = savedEntity;
        }

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
        state.rootEntities = action.payload.filter((entity: Entity) => entity.parent === null);
        state.allEntities = Object.fromEntries(action.payload.map((entity: Entity) => [entity.id, entity]));
      })
      .addCase(deleteEntity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete entity';
      })
  },
})

export const { updateEntity, changeEntityParent } = entitySlice.actions;
export default entitySlice.reducer;
export type { EntityState };