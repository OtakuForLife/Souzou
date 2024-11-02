import { ChevronDown, ChevronRight, StickyNote } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useState } from 'react';

import {Note} from '../lib/models/Note';
import {NoteTreeItemContextMenu} from '@/components/NoteTreeContextMenu';

import { useAppDispatch } from "@/lib/hooks";
import { notesState, openNote } from "../lib/slices/notesSlice";
import { useAppSelector } from '../lib/hooks';

interface NoteTreeItemProps {
    note: Note;
    depth: number;
    handleClick?: (e: React.MouseEvent<HTMLElement>)=>void;
}

function NoteTreeLeaf({ note, depth=0, handleClick }: NoteTreeItemProps){
  return (
    <div className='flex items-center w-full h-9 hover:bg-gray-500'>
      <div className="flex items-center ml-3 my-0 w-full" style={{ paddingLeft: `${depth * 25}px` }}>
          <StickyNote className="flex-none w-5 h-5 mr-2"/>
          <div className='cursor-pointer w-full' onClick={handleClick}>
            <span>{note.title}</span>
          </div>
      </div>
    </div>
  );
}

function NoteTreeNode({ note, depth=0, handleClick }: NoteTreeItemProps){
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className='w-full hover:bg-gray-500'>
        <div className="flex items-center w-full h-9" style={{ paddingLeft: `${depth * 25}px` }}>
          <CollapsibleTrigger asChild>
            <div>
              <Button variant="ghost" className="w-9 h-9 p-0">
                {isOpen ? <ChevronDown className="w-9 h-9" /> : <ChevronRight className="w-9 h-9" />}
                <span className="sr-only">Toggle</span>
              </Button>
            </div>
          </CollapsibleTrigger>
          <StickyNote className="flex-none w-5 h-5 mr-2"/>
          <div className="cursor-pointer w-full" onClick={handleClick}>
            <span>{note.title}</span>
          </div>
        </div>
      </div>
      <CollapsibleContent className="w-full space-y-2">
        {note.children.map(function (noteID: number) {
          const childNote: Note = useAppSelector((state: {notes: notesState}) => state.notes.allNotes[noteID]);
          return <NoteTreeItem key={noteID} note={childNote} depth={depth + 1}/>
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}


function NoteTreeItem({ note, depth=0 }: NoteTreeItemProps) {
  const dispatch = useAppDispatch();
  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    dispatch(openNote(note));
  }
  return (
    <NoteTreeItemContextMenu note={note}>
      {(note.children?.length>0)? <NoteTreeNode note={note} depth={depth} handleClick={onClick}/>: <NoteTreeLeaf note={note} depth={depth} handleClick={onClick}/>}
    </NoteTreeItemContextMenu>
  );
      
}

export default NoteTreeItem;