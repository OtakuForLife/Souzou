import { useAppDispatch, useLongPress, useIsMobile } from "@/hooks";
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
import { useState, useRef } from "react";

interface NoteTreeContextMenuProps {
    children: React.ReactNode;
    note: Entity;
}

export function NoteTreeItemContextMenu({children, note}: NoteTreeContextMenuProps) {
    const dispatch = useAppDispatch();
    const { openFileUpload } = useDialog();
    const isMobile = useIsMobile();
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);

    // Long press handler for mobile
    const longPressHandlers = useLongPress({
        onLongPress: (event) => {
            if (isMobile) {
                event.preventDefault();
                setIsOpen(true);
            }
        },
        delay: 500,
        shouldPreventDefault: false, // Allow normal clicks to propagate
    });

    return (
        <ContextMenu open={isOpen} onOpenChange={setIsOpen}>
            <ContextMenuTrigger asChild>
                <div
                    ref={triggerRef}
                    {...(isMobile ? longPressHandlers : {})}
                    style={{ WebkitTouchCallout: 'none' }} // Disable iOS callout menu
                >
                    {children}
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-64 theme-bg-surface-1 theme-text-secondary">
                <ContextMenuSub>
                    <ContextMenuSubTrigger inset className="cursor-pointer">New</ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-48">
                        <ContextMenuItem className="cursor-pointer" onSelect={async ()=>{
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
                        <ContextMenuItem className="cursor-pointer" onSelect={async ()=>{
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
                            className="cursor-pointer"
                            onSelect={() => openFileUpload(note.id)}
                        >
                            Upload Media
                        </ContextMenuItem>
                    </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuSeparator />
                <ContextMenuItem inset className="cursor-pointer" onSelect={()=>{
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
