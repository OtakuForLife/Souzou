
import { useState } from "react";
import NoOpenNote from "./NoOpenNote";
import { Note } from "../lib/models/Note";
import { useAppSelector, useAppDispatch } from "../lib/hooks";
import { notesState, changeCurrentNote, closeNote } from "../lib/slices/notesSlice";
import EditorTabs from './EditorTabs';
import React from "react";


export default function NoteFrame(){
    const openNotes: Note[] = useAppSelector((state: {notes: notesState}) => state.notes.openNotes);
    const currentNote: Note | null | undefined = useAppSelector((state: { notes: notesState }) => state.notes.currentNote);
    if(openNotes?.length>0 && currentNote!=null){
        return (
            <EditorTabs/>
        );
    } else {
        return (
            <NoOpenNote/>
        );
    }
    
}