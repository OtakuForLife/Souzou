import {Button} from '@/components/ui/button';
import {Input} from '@/components/Input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/Tabs";
import {X, Save} from 'lucide-react';
import { Note } from "../lib/models/Note";
import { useAppSelector, useAppDispatch } from "../lib/hooks";
import { notesState, changeCurrentNote, closeNote, updateNote, saveNote } from "../lib/slices/notesSlice";
import React, { useEffect, useState } from 'react';
import Editor from './MDXEditor';

interface NoteTabContentWrapperProps {
  noteID: number;
}

function NoteTabContentWrapper({noteID}: NoteTabContentWrapperProps){
  //console.log(noteID);
  const note: Note = useAppSelector((state: {notes: notesState}) => state.notes.allNotes[noteID]);

  const dispatch = useAppDispatch();;

  return (
    <div className="p-3 h-full">
      <div className="px-8 h-full bg-gray-800">
        <span className="w-5 h-5 p-0 text-neutral-400 hover:text-neutral-500" onClick={(e: React.MouseEvent<HTMLElement>) => {
              e.preventDefault();
              if(note){
                dispatch(saveNote(note));
              }
            }}>
          <Save className="w-5 h-5"/>
        </span>
        <Input className="bg-gray-800 text-4xl h-15 p-0" value={note?.title} onChange={
          (e: { currentTarget: { value: React.SetStateAction<string>; }; })=>{
            const newTitle = e.currentTarget.value;
            dispatch(updateNote({noteID: note?.id, title: newTitle, content: note?.content}))
          }
        }/>
        <Editor initialContent={note? note.content: ""} onChange={function (content: string): void {
          dispatch(updateNote({noteID: note?.id, title: note?.title, content: content}))
        } }/>
      </div>
    </div>
  );
}

export default function EditorTabs(){
  const dispatch = useAppDispatch();
  const openNotes: Note[] = useAppSelector((state: {notes: notesState}) => state.notes.openNotes);
  const currentNote: Note | null = useAppSelector((state: { notes: notesState }) => state.notes.currentNote);
  const onTabChange = (tabValue: string) => {
    dispatch(changeCurrentNote(tabValue));
  }
  console.log("Open Notes"+openNotes.toString())
  return (
  <Tabs className="w-full h-full" value={currentNote?.id} onValueChange={onTabChange}>
    <TabsList className="flex justify-start w-full bg-gray-700">
      {openNotes.map((note: Note) => (
        <TabsTrigger key={note.id} className="flex items-center bg-gray-600 hover:bg-gray-700 data-[state=active]:bg-gray-800" value={note.id}>
          <span className="pr-1 text-neutral-400">{note.title}</span>
          <span className="w-5 h-5 p-0 text-neutral-400 hover:text-neutral-500" onClick={(e: React.MouseEvent<HTMLElement>) => {
            e.preventDefault();
            dispatch(closeNote(note.id));
          }}>
            <X className="w-5 h-5"/>
          </span>
        </TabsTrigger>
      ))}
    </TabsList>
    {openNotes.map((note: Note) => (
      <TabsContent className="w-full h-full bg-gray-800 text-neutral-400" key={note.id} value={note.id}>
        <NoteTabContentWrapper noteID={note.id}/>
      </TabsContent>
    ))}
  </Tabs>
  );
}