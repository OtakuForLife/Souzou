import { ChevronDown, ChevronRight, StickyNote } from 'lucide-react';
import { Button } from "../components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible"
import React, { JSX, useState } from 'react';
import {
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import {Active, Over} from '@dnd-kit/core/dist/store/types';


import {NoteTreeItemContextMenu} from '../components/NoteTreeContextMenu';


import { useAppDispatch } from '@/hooks';
import { NoteState, saveNote } from '@/store/slices/notesSlice';
import { openTab } from '@/store/slices/tabsSlice';
import { ContentType } from '@/types/contentTypes';
import { useSelector } from 'react-redux';
import { Note } from '@/models/Note';
import { RootState } from '@/store';

interface TreeItemDroppableProps {
  noteID: string;
  children: JSX.Element | JSX.Element[];
}

function TreeItemDroppable({noteID, children}: TreeItemDroppableProps){
  const dispatch = useAppDispatch();
  const noteState: NoteState = useSelector((state: RootState) => state.notes);
  const notes: { [id: string] : Note; } = noteState.allNotes;

  const onTreeItemDropped = (active: Active, over: Over) => {
    var startNoteID = active.data.current?.note;
    var endNoteID = over.data.current?.note;

    const note = notes[startNoteID];
    var updatedNote: Note = {...note};
    updatedNote.parent = endNoteID;
    dispatch(saveNote(updatedNote));
  }

  const {setNodeRef} = useDroppable({
    id: "treeitem-"+noteID,
    data: {
      note: noteID,
      accepts: ['treeitem'],
      onDragEnd: onTreeItemDropped,
    },
  });
  return (
    <div ref={setNodeRef}>{children}</div>
  );
}

interface TreeItemDraggableProps {
  noteID: string;
  children: JSX.Element | JSX.Element[];
  onDragStart: (active: Active) => void;
}

function TreeItemDraggable({noteID, children, onDragStart}: TreeItemDraggableProps){
  const {attributes, listeners, setNodeRef} = useDraggable({
    id: "treeitem-"+noteID,
    data: {
      note: noteID,
      type: "treeitem",
      onDragStart: onDragStart,
    },
  });
  return (
    <div ref={setNodeRef}
    {...listeners} {...attributes}>
      {children}
    </div>
  );
}


interface VerticalLineProps {
  depth: number;
  maxDepth: number;
  lineSize: number;
  depthSize: number;
  children: React.ReactNode;
}

function VerticalLine({depth, maxDepth, lineSize, depthSize, children}: VerticalLineProps){
  if(maxDepth>0){
      return (
        <div className='pl-3'>
          <div className='border-l-skin-navigation-tree' style={{borderLeftColor: 'var(--color-text-primary)', borderLeftWidth: lineSize, paddingLeft: `${depthSize}px` }}>
            {depth>=maxDepth-1? children: <VerticalLine depth={depth+1} maxDepth={maxDepth} lineSize={lineSize} depthSize={depthSize}>{children}</VerticalLine>}
          </div>
        </div>
    );
  }
  return (
    <>{children}</>
  );

}

interface NoteTreeItemProps {
  noteID: string;
  depth: number;
}

function NoteTreeItem({ noteID, depth=0 }: NoteTreeItemProps) {
  const depthSize = 4;
  const noteState: NoteState = useSelector((state: RootState) => state.notes);
  const note: Note = noteState.allNotes[noteID];
  const dispatch = useAppDispatch();
  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    dispatch(openTab({
      objectType: ContentType.NOTE,
      objectID: note.id
    }));
  }
  const [isOpen, setIsOpen] = useState(false);
  const onDragStart = (_active: Active) => {
    setIsOpen(false);
  };

  if(note.children?.length>0){
    return (
      <NoteTreeItemContextMenu note={note}>
        <TreeItemDroppable noteID={note.id}>
          <TreeItemDraggable noteID={note.id} onDragStart={onDragStart}>
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
              <div className='w-full hover:bg-skin-primary-hover rounded-md'>
                <VerticalLine depth={0} maxDepth={depth} lineSize={1} depthSize={depthSize}>
                  <div className="flex flex-shrink items-center w-full h-7">
                    <CollapsibleTrigger asChild>
                      <div>
                        <Button variant="ghost" className="w-7 h-5 p-0">
                          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-5 h-5" />}
                          <span className="sr-only">Toggle</span>
                        </Button>
                      </div>
                    </CollapsibleTrigger>
                    <StickyNote className="flex-none w-4 h-4 mr-2"/>
                    <div className="cursor-pointer w-full truncate ... mr-1" onClick={onClick}>
                      <span className='text-xs'>{note.title}</span>
                    </div>
                  </div>
                </VerticalLine>
              </div>
              <CollapsibleContent className="w-full space-y-0">
                {note.children.map(function (noteID: string) {
                  return <NoteTreeItem key={noteID} noteID={noteID} depth={depth + 1}/>
                })}
              </CollapsibleContent>
            </Collapsible>
          </TreeItemDraggable>
      </TreeItemDroppable>
    </NoteTreeItemContextMenu>
    );
  } else {
    return (
      <NoteTreeItemContextMenu note={note}>
        <TreeItemDroppable noteID={note.id}>
          <TreeItemDraggable noteID={note.id} onDragStart={onDragStart}>
                <div className='w-full hover:bg-skin-primary-hover rounded-md'>
                  <VerticalLine depth={0} maxDepth={depth} lineSize={1} depthSize={depthSize}>
                    <div className="pl-2 flex flex-shrink items-center w-full h-7">
                        <StickyNote className="flex-none items-center w-4 h-4 mr-2"/>
                        <div className='cursor-pointer w-full truncate ... mr-1' onClick={onClick}>
                          <span className='text-xs'>{note.title}</span>
                        </div>
                    </div>
                  </VerticalLine>
                </div>
          </TreeItemDraggable>
        </TreeItemDroppable>
      </NoteTreeItemContextMenu>
    );
  }
}

export default NoteTreeItem;