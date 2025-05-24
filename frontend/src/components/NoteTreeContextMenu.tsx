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
import { createNote, deleteNote } from "@/store/slices/notesSlice";
import { openTab, closeTab } from "@/store/slices/tabsSlice";
import { ContentType } from "@/types/contentTypes";
import { CONTENT_TYPE_CONFIG } from "@/config/constants";

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
                        <ContextMenuItem className="cursor-pointer hover:bg-skin-primary-hover" onSelect={async ()=>{
                            const result = await dispatch(createNote({
                                title: CONTENT_TYPE_CONFIG.NOTE.DEFAULT_TITLE,
                                content: CONTENT_TYPE_CONFIG.NOTE.DEFAULT_CONTENT,
                                parent: note.id
                            }));

                            // Open the newly created note in a tab
                            if (createNote.fulfilled.match(result) && result.payload.newNoteData) {
                              dispatch(openTab({
                                objectType: ContentType.NOTE,
                                objectID: result.payload.newNoteData.id
                              }));
                            }
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
                    // Close the tab if it's open
                    dispatch(closeTab({
                        objectType: ContentType.NOTE,
                        objectID: note.id
                    }));

                    // Delete the note from the store
                    dispatch(deleteNote(note.id));
                }}>
                    Delete Note
                    <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}
