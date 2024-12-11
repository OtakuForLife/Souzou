import { configureStore } from '@reduxjs/toolkit'
import notesSlice from './slices/notesSlice';
import themeSlice from './slices/themeSlice';

const store = configureStore({
  reducer: {
    notes: notesSlice,
    theme: themeSlice,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export default store;