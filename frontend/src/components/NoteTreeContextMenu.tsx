import {
    ContextMenu,
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
  } from "@/components/ui/context-menu";
import { Note } from "../lib/models/Note";
import { useAppDispatch } from "../lib/hooks";
import { deleteNote, createNote } from "../lib/slices/notesSlice";
  
interface NoteTreeContextMenuProps {
    children: React.ReactNode;
    note: Note;
}

export function NoteTreeItemContextMenu({children, note}: NoteTreeContextMenuProps) {
    const dispatch = useAppDispatch();
    return (
        <ContextMenu>
            <ContextMenuTrigger>
                {children}
            </ContextMenuTrigger>
            <ContextMenuContent className="w-64 bg-gray-500">
                <ContextMenuItem inset className="cursor-pointer hover:bg-gray-700" onSelect={()=>{
                    dispatch(createNote({title: "New Note", content:"", parent:note.id}));
                }}>
                    New Note
                    <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem inset className="cursor-pointer hover:bg-gray-700" onSelect={()=>{dispatch(deleteNote(note.id))}}>
                    Delete Note
                    <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}
  