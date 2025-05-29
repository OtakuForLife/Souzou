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
import { Entity } from "@/models/Entity";
import { createEntity, deleteEntity } from "@/store/slices/entiySlice";
import { openTab, closeTab } from "@/store/slices/tabsSlice";
import { ContentType } from "@/types/contentTypes";
import { CONTENT_TYPE_CONFIG } from "@/config/constants";

interface NoteTreeContextMenuProps {
    children: React.ReactNode;
    note: Entity;
}

export function NoteTreeItemContextMenu({children, note}: NoteTreeContextMenuProps) {
    const dispatch = useAppDispatch();
    return (
        <ContextMenu>
            <ContextMenuTrigger>
                {children}
            </ContextMenuTrigger>
            <ContextMenuContent className="w-64 theme-explorer-background theme-explorer-item-text">
                <ContextMenuSub>
                    <ContextMenuSubTrigger inset className="cursor-pointer theme-explorer-item-background theme-explorer-item-text">New</ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-48 theme-explorer-background theme-explorer-item-text">
                        <ContextMenuItem className="cursor-pointer theme-explorer-item-background theme-explorer-item-text" onSelect={async ()=>{
                            const result = await dispatch(createEntity({
                                title: CONTENT_TYPE_CONFIG.NOTE.DEFAULT_TITLE,
                                content: CONTENT_TYPE_CONFIG.NOTE.DEFAULT_CONTENT,
                                parent: note.id
                            }));

                            // Open the newly created note in a tab
                            if (createEntity.fulfilled.match(result) && result.payload.newNoteData) {
                              dispatch(openTab({
                                objectType: ContentType.NOTE,
                                objectID: result.payload.newNoteData.id
                              }));
                            }
                        }}>
                            Note
                            <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuItem className="cursor-pointer theme-explorer-item-background theme-explorer-item-text">Template</ContextMenuItem>
                        <ContextMenuItem className="cursor-pointer theme-explorer-item-background theme-explorer-item-text">Script</ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem className="cursor-pointer theme-explorer-item-background theme-explorer-item-text">Upload Media</ContextMenuItem>
                    </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuItem inset className="cursor-pointer theme-explorer-item-background theme-explorer-item-text" onSelect={()=>{
                    // Close the tab if it's open
                    dispatch(closeTab({
                        objectType: ContentType.NOTE,
                        objectID: note.id
                    }));

                    // Delete the note from the store
                    dispatch(deleteEntity(note.id));
                }}>
                    Delete Note
                    <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}
