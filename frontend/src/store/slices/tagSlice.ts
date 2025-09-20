import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Tag, TagHierarchy } from '@/models/Tag';
import { tagService, CreateTagRequest, UpdateTagRequest } from '@/services/tagService';
import type { RootState } from '@/store';
import { addTagsToEntity, removeTagsFromEntity } from './entitySlice';

export const fetchTags = createAsyncThunk('tags/fetchTags', async () => {
  return await tagService.fetchTags();
});

export const fetchTagHierarchy = createAsyncThunk('tags/fetchTagHierarchy', async () => {
  return await tagService.fetchTagHierarchy();
});

export const createTag = createAsyncThunk('tags/createTag', async (tagData: CreateTagRequest) => {
  return await tagService.createTag(tagData);
});

export const updateTag = createAsyncThunk('tags/updateTag', async (payload: { id: string; tagData: UpdateTagRequest }) => {
  const { id, tagData } = payload;
  return await tagService.updateTag(id, tagData);
});

export const deleteEntityTag = createAsyncThunk('tags/deleteTag', async (id: string) => {
  await tagService.deleteTag(id);
  return id;
});

export const getEntitiesByTags = createAsyncThunk('tags/getEntitiesByTags', async (tagIds: string[]) => {
  return await tagService.getEntitiesByTags(tagIds);
});

interface TagState {
  allTags: { [id: string]: Tag };
  tagHierarchy: TagHierarchy[];
  loading: boolean;
  error: string | null;
}

const initialState: TagState = {
  allTags: {},
  tagHierarchy: [],
  loading: false,
  error: null,
};

// Selectors
export const selectAllTags = createSelector(
  [(state: RootState) => state.tags.allTags],
  (allTags) => Object.values(allTags)
);

export const selectTagsByIds = createSelector(
  [(state: RootState) => state.tags.allTags, (state: RootState, tagIds: string[]) => tagIds],
  (allTags, tagIds) => tagIds.map(id => allTags[id]).filter(Boolean)
);

export const tagSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    addTag: (state, action: PayloadAction<Tag>) => {
      state.allTags[action.payload.id] = action.payload;
    },
    removeTag: (state, action: PayloadAction<string>) => {
      delete state.allTags[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tags
      .addCase(fetchTags.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.loading = false;
        state.allTags = {};
        action.payload.forEach(tag => {
          state.allTags[tag.id] = tag;
        });
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tags';
      })
      // Fetch tag hierarchy
      .addCase(fetchTagHierarchy.fulfilled, (state, action) => {
        state.tagHierarchy = action.payload;
      })
      // Create tag
      .addCase(createTag.fulfilled, (state, action) => {
        state.allTags[action.payload.id] = action.payload;
      })
      // Update tag
      .addCase(updateTag.fulfilled, (state, action) => {
        state.allTags[action.payload.id] = action.payload;
      })
      // Delete tag
      .addCase(deleteEntityTag.fulfilled, (state, action) => {
        delete state.allTags[action.payload];
      })
      // When tags are added to an entity, increment the entities_count for those tags
      .addCase(addTagsToEntity.fulfilled, (state, action) => {
        const { tagIds } = action.meta.arg as { entityId: string; tagIds: string[] };
        tagIds.forEach((id) => {
          const tag = state.allTags[id];
          if (tag) {
            tag.entities_count = (tag.entities_count ?? 0) + 1;
          }
        });
      })
      // When tags are removed from an entity, decrement the entities_count for those tags
      .addCase(removeTagsFromEntity.fulfilled, (state, action) => {
        const { tagIds } = action.meta.arg as { entityId: string; tagIds: string[] };
        tagIds.forEach((id) => {
          const tag = state.allTags[id];
          if (tag) {
            tag.entities_count = Math.max(0, (tag.entities_count ?? 0) - 1);
          }
        });
      })
  },
});

export const { addTag, removeTag } = tagSlice.actions;
export default tagSlice.reducer;
