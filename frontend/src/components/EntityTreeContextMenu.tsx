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
  } from "@/components/ui/context-menu";
import { Entity, EntityType } from "@/models/Entity";
import { createEntity, deleteEntity } from "@/store/slices/entitySlice";
import { openTab, closeTab } from "@/store/slices/tabsSlice";
import { CONTENT_TYPE_CONFIG } from "@/config/constants";
import { useDialog } from "@/contexts/DialogContext";

interface NoteTreeContextMenuProps {
    children: React.ReactNode;
    note: Entity;
}

export function NoteTreeItemContextMenu({children, note}: NoteTreeContextMenuProps) {
    const dispatch = useAppDispatch();
    const { openFileUpload } = useDialog();

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
                              dispatch(openTab(result.payload.newNoteData.id));
                            }
                        }}>
                            Note
                            <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuItem className="cursor-pointer theme-explorer-item-background theme-explorer-item-text" onSelect={async ()=>{
                            const result = await dispatch(createEntity({
                                title: CONTENT_TYPE_CONFIG.VIEW.DEFAULT_TITLE,
                                content: CONTENT_TYPE_CONFIG.VIEW.DEFAULT_CONTENT,
                                parent: note.id,
                                type: EntityType.VIEW
                            }));

                            // Open the newly created note in a tab
                            if (createEntity.fulfilled.match(result) && result.payload.newNoteData) {
                              dispatch(openTab(result.payload.newNoteData.id));
                            }
                        }}>
                            View
                            <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                            className="cursor-pointer theme-explorer-item-background theme-explorer-item-text"
                            onSelect={() => openFileUpload(note.id)}
                        >
                            Upload Media
                        </ContextMenuItem>
                    </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuSeparator />
                <ContextMenuItem inset className="cursor-pointer theme-explorer-item-background theme-explorer-item-text" onSelect={()=>{
                    // Close the tab if it's open
                    dispatch(closeTab(note));

                    // Delete the note from the store
                    dispatch(deleteEntity(note.id));
                }}>
                    Delete Note
                    <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
