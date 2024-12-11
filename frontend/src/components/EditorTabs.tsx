import {Input} from '../components/Input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./Tabs";
import { ScrollArea, ScrollBar } from "./ui/scroll-area"
import {X, Save} from 'lucide-react';

import {SortableContext, rectSortingStrategy, useSortable, } from '@dnd-kit/sortable';
import {CSS, Transform} from '@dnd-kit/utilities';

import { Note } from "../lib/models/Note";
import { useAppSelector, useAppDispatch } from "../lib/hooks";
import { notesState, changeCurrentNote, closeNote, updateNote, saveNote, moveOpenNote } from "../lib/slices/notesSlice";
import React from 'react';
import {MDXNoteEditor, BlockNoteEditor} from './NoteEditor';

interface noteTabProps {
  noteID: string;
  dndID: string;
}

function NoteTab({noteID, dndID}: noteTabProps) {
  const note: Note = useAppSelector((state: {notes: notesState}) => state.notes.allNotes[noteID]);
  const dispatch = useAppDispatch();
  
  const onTabDropped = (active:any, over:any) => {
    var startNoteID = active.data.current.note;
    var endNoteID = over.data.current.note;
    dispatch(moveOpenNote({startID:startNoteID, endID: endNoteID}));
  }
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({
    id: dndID,
    data: {
      note: note.id,
      type: 'notetab',
      accepts: ['notetab'],
      onDragEnd: onTabDropped,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }; 

  const tabRef = React.createRef<HTMLButtonElement>();

  return (
    <div className="flex bg-skin-primary-hover text-skin-primary hover:bg-skin-primary w-[150px]"
    ref={setNodeRef} {...attributes} {...listeners} style={style}
    key={note.id}>
      <TabsTrigger
      asChild
      ref={tabRef}
      key={note.id} 
      className="flex justify-between data-[state=active]:bg-skin-secondary data-[state=active]:text-skin-primary w-full" value={""+note.id}>
        <div>
          <span className="pr-1 truncate ...">{note.title}</span>
          <span 
          className="w-5 h-5 p-0" 
          onMouseDown={(e: React.MouseEvent<HTMLElement>) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e: React.MouseEvent<HTMLElement>) => {
            e.preventDefault();
            e.stopPropagation();
            dispatch(closeNote(note.id));
          }}>
            <X className="w-5 h-5 hover:bg-skin-primary-hover"/>
          </span>
        </div>
      </TabsTrigger>
      
    </div>
  );
}

interface NoteTabContentWrapperProps {
  noteID: string;
}


function NoteTabContentWrapper({noteID}: NoteTabContentWrapperProps){
  const note: Note = useAppSelector((state: {notes: notesState}) => state.notes.allNotes[noteID]);

  const dispatch = useAppDispatch();

  return (
    <ScrollArea type='always' className="p-2 h-screen bg-skin-secondary">
      <span className="w-5 h-5 p-0 text-skin-primary hover:bg-skin-primary-hover" onClick={(e: React.MouseEvent<HTMLElement>) => {
            e.preventDefault();
            if(note){
              dispatch(saveNote(note));
            }
          }}>
        <Save className="w-5 h-5"/>
      </span>
      <Input className="bg-skin-secondary text-skin-primary text-4xl h-15 p-0 py-1" value={note?.title} onChange={
        (e: { currentTarget: { value: React.SetStateAction<string>; }; })=>{
          const newTitle = e.currentTarget.value;
          dispatch(updateNote({noteID: note?.id, title: newTitle, content: note?.content, parent: note?.parent}))
        }
      }/>
      <BlockNoteEditor initialContent={note? note.content: ""} onChange={function (content: string): void {
        dispatch(updateNote({noteID: note?.id, title: note?.title, content: content, parent: note?.parent}))
      } }/>
    </ScrollArea>
  );
}

export default function EditorTabs(){
  const dispatch = useAppDispatch();
  const openNotes: Note[] = useAppSelector((state: {notes: notesState}) => state.notes.openNotes);
  const currentNote: Note | null = useAppSelector((state: { notes: notesState }) => state.notes.currentNote);
  
  const onTabChange = (tabValue: string) => {
    dispatch(changeCurrentNote(tabValue));
  }

  var openNotesDndIDs: string[] = openNotes.map((e: Note) => ("notetab-"+e.id));
  return (
  <Tabs className="w-full h-screen" value={currentNote?.id} onValueChange={onTabChange} activationMode="manual">
    <TabsList className="flex justify-start w-full bg-skin-primary">
      <SortableContext items={openNotesDndIDs} strategy={rectSortingStrategy}>
          {openNotes.map((note: Note) => (
            <NoteTab key={note.id} noteID={note.id} dndID={"notetab-"+note.id}/>
          ))}
        </SortableContext>
    </TabsList>
    <div className='pb-2'>
      {openNotes.map((note: Note) => (
        <TabsContent className="w-full h-screen p-4 bg-skin-secondary text-skin-primary" key={note.id} value={""+note.id}>
          <NoteTabContentWrapper noteID={note.id}/>
        </TabsContent>
      ))}
    </div>
  </Tabs>
  );
}