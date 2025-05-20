import { useAppDispatch } from "@/hooks";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
  } from "../components/ui/context-menu";
import { Note } from "@/models/Note";
import { closeNote, createNote, deleteNote } from "@/store/slices/notesSlice";
  
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
            <ContextMenuContent className="w-64 bg-skin-primary text-skin-primary">
                <ContextMenuSub>
                    <ContextMenuSubTrigger inset className="cursor-pointer hover:bg-skin-primary-hover">New</ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-48 bg-skin-primary">
                        <ContextMenuItem className="cursor-pointer hover:bg-skin-primary-hover" onSelect={()=>{
                            dispatch(createNote({title: "New Note", content:"", parent:note.id}));
                        }}>
                            Note
                            <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuItem>Template</ContextMenuItem>
                        <ContextMenuItem>Script</ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem>Upload Media</ContextMenuItem>
                    </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuItem inset className="cursor-pointer hover:bg-skin-primary-hover" onSelect={()=>{
                    dispatch(closeNote(note.id));
                    dispatch(deleteNote(note.id));
                }}>
                    Delete Note
                    <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}
  