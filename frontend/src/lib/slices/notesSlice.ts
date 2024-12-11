import api from '../../api';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { RootState } from '../store';
import { Note } from '../models/Note';


export const createNote = createAsyncThunk('notes/createNote', async (note: {title: string, content: string, parent: string|null}) => {
  var newNoteData = null
  try{
    const createResponse = await api.post("/api/notes/", note);
    if(createResponse.status === 201){
      newNoteData = createResponse.data;
      console.log(`[LOG] successfully created Note with data: ${JSON.stringify(note)}`);
    }
  } catch (error) {
    console.log(error);
  }
  const fetchResponse = await api.get("/api/notes/");
  return {parent:note.parent, newNoteData:newNoteData, updatedNotes: fetchResponse.data};
});

export const saveNote = createAsyncThunk('notes/saveNote', async (note: Note) => {
  try{
    const response = await api.put(`/api/notes/update/${note.id}/`, {title:note.title, content:note.content, parent:note.parent});
    //console.log(response);
  } catch (error) {
    console.log(error);
  }
  const fetchResponse = await api.get("/api/notes/");
  return {updatedNotes: fetchResponse.data};
});

export const deleteNote = createAsyncThunk('notes/deleteNote', async (id: string) => {
  try {
    const deleteResponse = await api.delete(`/api/notes/delete/${id}/`);
    if(deleteResponse.status === 204){
      console.log(`[LOG] note successfully deleted: ${id}`);
    } else {
      console.warn(`[WARN] note could not be deleted: ${id}`);
    }
  } catch (error) {
    console.error(error);
  }

  const fetchResponse = await api.get("/api/notes/");
  return fetchResponse.data;
});

export const fetchNotes = createAsyncThunk('notes/fetchNotes', async () =>{
    const response = await api.get("/api/notes/");
    console.log(`[LOG] Notes fetched: ${JSON.stringify(response.data)}`);
    return response.data;
});

interface notesState {
  rootNotes: Note[];
  allNotes: { [id: string] : Note; };
  openNotes: Note[];
  currentNote: Note | null;
}

const initialState: notesState = {
  rootNotes: [],
  allNotes: {},
  openNotes: [],
  currentNote: null
}

export const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    openNote: (state, action) => {
      var payload: Note = action.payload;
      var noteIndex = state.openNotes.findIndex((note: Note) => note.id == payload.id);
      if(noteIndex < 0){
        state.openNotes.push(payload);
      }
      state.currentNote = payload;
    },
    changeCurrentNote: (state, action) => {
      var noteIndex = state.openNotes.findIndex((note: Note) => note.id == action.payload);
      state.currentNote = state.openNotes[noteIndex];
    },
    closeNote: (state, action) => {
      var noteIndex = state.openNotes.findIndex((note: Note) => note.id == action.payload);
      if(noteIndex>=0){
        state.openNotes.splice(noteIndex, 1);
      }
      if(action.payload==state.currentNote?.id) {
        if(state.openNotes.length>0){
          var newNoteIndex = Math.max(0,noteIndex-1);
          var newCurrentNote = state.openNotes[newNoteIndex];
          state.currentNote = newCurrentNote;
        } else {
          state.currentNote = null;
        }
      }
    },
    updateNote: (state, action) => {
      const noteID: string = action.payload.noteID;
      var note: Note = state.allNotes[noteID];
      if(note){
        note.title = action.payload.title;
        note.content = action.payload.content;
        note.parent = action.payload.parent;
        state.allNotes[noteID] = note;
      }
      /* var openNoteIndex = state.openNotes.findIndex((note: Note) => note.id == noteID);
      if(openNoteIndex>0){
        state.openNotes[openNoteIndex] = note;
      } */
    },
    moveOpenNote: (state, action) => {
      var startNoteIndex = state.openNotes.findIndex((note: Note) => note.id == action.payload.startID);
      var endNoteIndex = state.openNotes.findIndex((note: Note) => note.id == action.payload.endID);

      state.openNotes.splice(endNoteIndex, 0, state.openNotes.splice(startNoteIndex, 1)[0]);
    },
    changeNoteParent: (state, action) => {
      
    }
  },
  extraReducers: builder => {
    builder
    .addCase(fetchNotes.pending, (state, action) => {

    })
    .addCase(fetchNotes.fulfilled, (state, action)=>{
      state.rootNotes = action.payload.filter((note:Note)=> note.parent==null);
      state.allNotes = Object.fromEntries(action.payload.map((note: Note) => [note.id, note]));
    })
    .addCase(deleteNote.fulfilled, (state, action)=>{
      state.rootNotes = action.payload.filter((note:Note)=> note.parent==null);
      state.allNotes = Object.fromEntries(action.payload.map((note: Note) => [note.id, note]));

      state.openNotes = state.openNotes.filter((note:Note)=> note.id in state.allNotes);
    })
    .addCase(createNote.fulfilled, (state, action)=>{
      //{parent:note.parent, newNoteData:newNoteData, updatedNotes: fetchResponse.data}
      state.rootNotes = action.payload.updatedNotes.filter((note:Note)=> note.parent==null);
      state.allNotes = Object.fromEntries(action.payload.updatedNotes.map((note: Note) => [note.id, note]));
      state.openNotes = state.openNotes.filter((note:Note)=> note.id in state.allNotes);
      
      const newNote: Note = state.allNotes[action.payload.newNoteData.id];
      state.openNotes.push(newNote);
      state.currentNote = newNote;
      
    })
    .addCase(saveNote.fulfilled, (state, action)=>{
      state.rootNotes = action.payload.updatedNotes.filter((note:Note)=> note.parent==null);
      state.allNotes = Object.fromEntries(action.payload.updatedNotes.map((note: Note) => [note.id, note]));
      state.openNotes = state.openNotes.filter((note:Note)=> note.id in state.allNotes);
    })
  },
})

export const selectNotes = (state: RootState) => state.notes.rootNotes;
export const {openNote, changeCurrentNote, closeNote, updateNote, moveOpenNote} = notesSlice.actions;
export default notesSlice.reducer;
export type {notesState};