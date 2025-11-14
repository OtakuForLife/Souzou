import { useEffect, useState, useRef } from "react";
import {
    DndContext,
    DragOverlay,
    MouseSensor,
    useSensor,
    useSensors,
  } from '@dnd-kit/core';
import {DragStartEvent, DragEndEvent} from '@dnd-kit/core/dist/types/events';
import {Active, Over} from '@dnd-kit/core/dist/store/types';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
  } from "../components/ui/resizable";
import {ImperativePanelHandle}  from "react-resizable-panels"
import {
    SidebarInset,
    SidebarProvider
} from "../components/ui/sidebar"
import { Pin, PinOff } from "lucide-react";

import { fetchEntities, EntityState, createEntity, saveEntity } from "@/store/slices/entitySlice";
import { NoteTree } from "../components/EntityTree";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import ContentFrame from "../components/ContentFrame";
import AppSidebar from "../components/Sidebar";

import { useAppDispatch, useKeyboardShortcuts } from "@/hooks";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { Entity } from "@/models/Entity";

import { CONTENT_TYPE_CONFIG } from "@/config/constants";
import { openTab } from "@/store/slices/tabsSlice";
import { EntityType } from "@/models/Entity";
import { createDefaultViewContent } from "@/types/widgetTypes";
import { Button } from "@/components/ui/button";


const NOTE_TREE_PIN_KEY = "note_tree_pinned";

function Home() {
    const dispatch = useAppDispatch();

    const entityState: EntityState = useSelector((state: RootState) => state.entities);
    const entities: { [id: string]: Entity; } = entityState.allEntities;
    const { error: notesError } = entityState;

    // Get current tab for Ctrl+S shortcut
    const currentTabId = useSelector((state: RootState) => state.tabs.currentTab);
    const currentEntity = currentTabId ? entities[currentTabId] : null;

    // Fetch entities on component mount
    useEffect(()=> {
        dispatch(fetchEntities());
    }, [dispatch]);

    // Show toast notification for entities errors
    useEffect(() => {
        if (notesError) {
            //TODO display error
        }
    }, [notesError, dispatch]);

    const [activeDrag, setActiveDrag] = useState<Active|null>(null);

    // Note tree visibility and pin state
    const [isNoteTreeVisible, setIsNoteTreeVisible] = useState(true);
    const [isNoteTreePinned, setIsNoteTreePinned] = useState(() => {
        const stored = localStorage.getItem(NOTE_TREE_PIN_KEY);
        return stored !== "false"; // Default to true (pinned)
    });
    const navigationRef = useRef<ImperativePanelHandle>(null);

    const toggleNoteTreeVisibility = () => {
        setIsNoteTreeVisible(!isNoteTreeVisible);
    };

    const toggleNoteTreePin = () => {
        const newPinned = !isNoteTreePinned;
        setIsNoteTreePinned(newPinned);
        localStorage.setItem(NOTE_TREE_PIN_KEY, String(newPinned));
    };


    // Keyboard shortcuts
    useKeyboardShortcuts([
        {
            key: 'n',
            ctrlKey: true,
            callback: async () => {
                // Create new note with Ctrl+N
                const result = await dispatch(createEntity({
                    title: CONTENT_TYPE_CONFIG.NOTE.DEFAULT_TITLE,
                    content: CONTENT_TYPE_CONFIG.NOTE.DEFAULT_CONTENT,
                    parent: null
                }));

                if (createEntity.fulfilled.match(result) && result.payload.newNoteData) {
                    dispatch(openTab(result.payload.newNoteData.id));
                }
            }
        },
        {
            key: 'd',
            ctrlKey: true,
            callback: async () => {
                // Create new dashboard view with Ctrl+D
                const result = await dispatch(createEntity({
                    title: CONTENT_TYPE_CONFIG.VIEW.DEFAULT_TITLE,
                    content: JSON.stringify(createDefaultViewContent()),
                    parent: null,
                    type: EntityType.VIEW
                }));

                if (createEntity.fulfilled.match(result) && result.payload.newNoteData) {
                    dispatch(openTab(result.payload.newNoteData.id));
                }
            }
        },
        {
            key: 'r',
            ctrlKey: true,
            callback: () => {
                // Refresh entities with Ctrl+R
                dispatch(fetchEntities());
            }
        },
        {
            key: 's',
            ctrlKey: true,
            callback: () => {
                // Save current entity with Ctrl+S
                if (currentEntity) {
                    dispatch(saveEntity(currentEntity));
                }
            }
        }
    ]);

    const mouseSensor = useSensor(MouseSensor, {
        activationConstraint: {
            distance: 10,
        },
    });
    const sensors = useSensors(mouseSensor,);

    const handleDragEnd = (event: DragEndEvent) => {
        const active: Active = event.active;
        const over: Over | null = event.over;
        setActiveDrag(active);
        if(over == null) {
            return;
        }
        console.log("onDragEnd: "+over.id);
        if(active.id === over.id) {
          return;
        }
        if(over && over.data.current?.accepts?.includes(active.data.current?.type)){
            if(over.data.current.onDragEnd){
                over.data.current.onDragEnd(active, over);
            }
        }
    };
    const handleDragStart = (event: DragStartEvent) => {
        setActiveDrag(event.active);
        console.log("onDragStart: "+event.active.id);
        if(event.active.data.current?.onDragStart){
            event.active.data.current.onDragStart(event.active);
        }

    };

    return (
        <div className="flex w-full h-screen theme-main-content-background">
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[restrictToWindowEdges]} sensors={sensors}>
                <SidebarProvider>
                    <AppSidebar
                        onToggleNoteTree={toggleNoteTreeVisibility}
                        isNoteTreeVisible={isNoteTreeVisible}
                    />

                    <SidebarInset>
                        {/* Pinned Mode: ResizablePanel Layout (like before) */}
                        {isNoteTreePinned && isNoteTreeVisible && (
                            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                                <ResizablePanel
                                    ref={navigationRef}
                                    className="theme-explorer-background"
                                    minSize={10}
                                    maxSize={25}
                                    defaultSize={15}
                                    collapsible={false}
                                >
                                    <div className="h-full flex flex-col theme-explorer-item-text">
                                        <div className="flex items-center justify-between px-2 py-1.5 border-b theme-explorer-background">
                                            <span className="text-sm font-semibold">Notes</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 p-0"
                                                onClick={toggleNoteTreePin}
                                                title="Unpin sidebar (floating overlay)"
                                            >
                                                <Pin className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex-1 overflow-auto">
                                            <NoteTree/>
                                        </div>
                                    </div>
                                </ResizablePanel>
                                <ResizableHandle className="w-1 theme-explorer-background"/>
                                <ResizablePanel className="theme-main-content-background" defaultSize={85}>
                                    <ContentFrame/>
                                </ResizablePanel>
                            </ResizablePanelGroup>
                        )}

                        {/* Pinned Mode but Hidden */}
                        {isNoteTreePinned && !isNoteTreeVisible && (
                            <div className="h-full w-full theme-main-content-background">
                                <ContentFrame/>
                            </div>
                        )}

                        {/* Floating Mode: Overlay */}
                        {!isNoteTreePinned && (
                            <div className="relative h-full w-full theme-main-content-background">
                                <ContentFrame/>
                                {isNoteTreeVisible && (
                                    <div className="absolute top-0 left-0 h-full w-64 z-50 theme-explorer-background border-r shadow-lg flex flex-col">
                                        <div className="flex items-center justify-between px-2 py-1.5 border-b theme-explorer-background theme-explorer-item-text">
                                            <span className="text-sm font-semibold">Notes</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 p-0"
                                                onClick={toggleNoteTreePin}
                                                title="Pin sidebar"
                                            >
                                                <PinOff className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex-1 overflow-auto">
                                            <NoteTree/>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </SidebarInset>
                </SidebarProvider>
                <DragOverlay dropAnimation={null}>
                    {activeDrag?.data ? (
                        <>
                            {/* Note tree item drag overlay */}
                            {activeDrag.data.current?.type === "treeitem" && (
                                <div className="w-[150px] p-1 truncate rounded border border-lg border-black-100 theme-explorer-background theme-explorer-item-text opacity-70">
                                    <span>{entities[activeDrag.data.current?.note]?.title}</span>
                                </div>
                            )}

                            {/* Tab drag overlay */}
                            {activeDrag.data.current?.type === "tab" && (
                                <div className="truncate border border-blue-500 rounded w-[150px] p-2 theme-explorer-background theme-explorer-item-text opacity-70">
                                    <span className="text-sm font-medium">
                                        {[EntityType.NOTE, EntityType.VIEW].includes(activeDrag.data.current?.objectType)
                                            ? entities[activeDrag.data.current?.objectID]?.title
                                            : "Unknown Tab"
                                        }
                                    </span>
                                </div>
                            )}
                        </>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

export default Home;