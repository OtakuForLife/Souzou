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
  rootNotes: Entity[];
  allNotes: { [id: string] : Entity; };
  loading: boolean;
  error: string | null;
}

const initialState: EntityState = {
  rootNotes: [],
  allNotes: {},
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
      var entity: Entity = state.allNotes[noteID];
      if(entity){
        if (action.payload.title !== undefined) entity.title = action.payload.title;
        if (action.payload.content !== undefined) entity.content = action.payload.content;
        if (action.payload.parent !== undefined) entity.parent = action.payload.parent;
        state.allNotes[noteID] = entity;
      }
    },
    changeEntityParent: (state, action: PayloadAction<{ noteID: string; newParent: string | null }>) => {
      // TODO: Implement entity parent change logic
      const { noteID, newParent } = action.payload;
      if (state.allNotes[noteID]) {
        state.allNotes[noteID].parent = newParent;
      }
    }
  },
  extraReducers: builder => {
    builder
    .addCase(fetchEntities.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchEntities.fulfilled, (state, action)=>{
      state.loading = false;
      state.error = null;
      state.rootNotes = action.payload.filter((entity:Entity)=> entity.parent === null);
      state.allNotes = Object.fromEntries(action.payload.map((entity: Entity) => [entity.id, entity]));
    })
    .addCase(fetchEntities.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch entities';
    })
    .addCase(createEntity.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(createEntity.fulfilled, (state, action)=>{
      state.loading = false;
      state.error = null;
      state.rootNotes = action.payload.updatedNotes.filter((entity:Entity)=> entity.parent === null);
      state.allNotes = Object.fromEntries(action.payload.updatedNotes.map((entity: Entity) => [entity.id, entity]));
    })
    .addCase(createEntity.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to create entity';
    })
    .addCase(saveEntity.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(saveEntity.fulfilled, (state, action)=>{
      state.loading = false;
      state.error = null;
      state.rootNotes = action.payload.updatedNotes.filter((entity:Entity)=> entity.parent === null);
      state.allNotes = Object.fromEntries(action.payload.updatedNotes.map((entity: Entity) => [entity.id, entity]));
    })
    .addCase(saveEntity.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to save entity';
    })
    .addCase(deleteEntity.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(deleteEntity.fulfilled, (state, action)=>{
      state.loading = false;
      state.error = null;
      state.rootNotes = action.payload.filter((entity:Entity)=> entity.parent === null);
      state.allNotes = Object.fromEntries(action.payload.map((entity: Entity) => [entity.id, entity]));
    })
    .addCase(deleteEntity.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to delete entity';
    })
  },
})

export const {updateEntity, changeEntityParent} = entitySlice.actions;
export default entitySlice.reducer;
export type {EntityState};