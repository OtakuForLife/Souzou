import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Tag } from '@/models/Tag';
import { tagService, CreateTagRequest, UpdateTagRequest } from '@/services/tagService';
import type { RootState } from '@/store';

/**
 * Fetch all tags from local database
 */
export const fetchTags = createAsyncThunk('tags/fetchTags', async () => {
  return await tagService.fetchTags();
});

/**
 * Create a new tag in local database (queued for sync)
 */
export const createTag = createAsyncThunk('tags/createTag', async (tagData: CreateTagRequest) => {
  return await tagService.createTag(tagData);
});

/**
 * Update an existing tag in local database (queued for sync)
 */
export const updateTag = createAsyncThunk('tags/updateTag', async (payload: { id: string; tagData: UpdateTagRequest }) => {
  const { id, tagData } = payload;
  return await tagService.updateTag(id, tagData);
});

/**
 * Delete a tag from local database (queued for sync)
 */
export const deleteEntityTag = createAsyncThunk('tags/deleteTag', async (id: string) => {
  await tagService.deleteTag(id);
  return id;
});

interface TagState {
  allTags: { [id: string]: Tag };
  loading: boolean;
  error: string | null;
}

const initialState: TagState = {
  allTags: {},
  loading: false,
  error: null,
};

// Selectors
export const selectAllTags = createSelector(
  [(state: RootState) => state.tags.allTags],
  (allTags) => Object.values(allTags)
);

export const selectTagsByIds = createSelector(
  [(state: RootState) => state.tags.allTags, (_: RootState, tagIds: string[]) => tagIds],
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
      });
  },
});

export const { addTag, removeTag } = tagSlice.actions;
export default tagSlice.reducer;
