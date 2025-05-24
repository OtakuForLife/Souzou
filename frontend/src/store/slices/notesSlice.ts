import { Note } from '@/models/Note';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { noteService, CreateNoteRequest } from '@/services/noteService';

export const createNote = createAsyncThunk(
  'notes/createNote',
  async (note: CreateNoteRequest) => {
    return await noteService.createNote(note);
  }
);

export const saveNote = createAsyncThunk(
  'notes/saveNote',
  async (note: Note) => {
    return await noteService.saveNote(note);
  }
);

export const deleteNote = createAsyncThunk(
  'notes/deleteNote',
  async (id: string) => {
    return await noteService.deleteNote(id);
  }
);

export const fetchNotes = createAsyncThunk(
  'notes/fetchNotes',
  async () => {
    return await noteService.fetchNotes();
  }
);

interface NoteState {
  rootNotes: Note[];
  allNotes: { [id: string] : Note; };
  loading: boolean;
  error: string | null;
}

const initialState: NoteState = {
  rootNotes: [],
  allNotes: {},
  loading: false,
  error: null,
}

export const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    updateNote: (state, action: PayloadAction<{
      noteID: string;
      title?: string;
      content?: string;
      parent?: string | null;
    }>) => {
      const noteID: string = action.payload.noteID;
      var note: Note = state.allNotes[noteID];
      if(note){
        if (action.payload.title !== undefined) note.title = action.payload.title;
        if (action.payload.content !== undefined) note.content = action.payload.content;
        if (action.payload.parent !== undefined) note.parent = action.payload.parent;
        state.allNotes[noteID] = note;
      }
    },
    changeNoteParent: (state, action: PayloadAction<{ noteID: string; newParent: string | null }>) => {
      // TODO: Implement note parent change logic
      const { noteID, newParent } = action.payload;
      if (state.allNotes[noteID]) {
        state.allNotes[noteID].parent = newParent;
      }
    }
  },
  extraReducers: builder => {
    builder
    .addCase(fetchNotes.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchNotes.fulfilled, (state, action)=>{
      state.loading = false;
      state.error = null;
      state.rootNotes = action.payload.filter((note:Note)=> note.parent === null);
      state.allNotes = Object.fromEntries(action.payload.map((note: Note) => [note.id, note]));
    })
    .addCase(fetchNotes.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch notes';
    })
    .addCase(createNote.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(createNote.fulfilled, (state, action)=>{
      state.loading = false;
      state.error = null;
      state.rootNotes = action.payload.updatedNotes.filter((note:Note)=> note.parent === null);
      state.allNotes = Object.fromEntries(action.payload.updatedNotes.map((note: Note) => [note.id, note]));
    })
    .addCase(createNote.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to create note';
    })
    .addCase(saveNote.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(saveNote.fulfilled, (state, action)=>{
      state.loading = false;
      state.error = null;
      state.rootNotes = action.payload.updatedNotes.filter((note:Note)=> note.parent === null);
      state.allNotes = Object.fromEntries(action.payload.updatedNotes.map((note: Note) => [note.id, note]));
    })
    .addCase(saveNote.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to save note';
    })
    .addCase(deleteNote.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(deleteNote.fulfilled, (state, action)=>{
      state.loading = false;
      state.error = null;
      state.rootNotes = action.payload.filter((note:Note)=> note.parent === null);
      state.allNotes = Object.fromEntries(action.payload.map((note: Note) => [note.id, note]));
    })
    .addCase(deleteNote.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to delete note';
    })
  },
})

export const {updateNote, changeNoteParent} = notesSlice.actions;
export default notesSlice.reducer;
export type {NoteState};