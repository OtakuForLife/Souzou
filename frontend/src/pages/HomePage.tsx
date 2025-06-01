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
import { SidebarInset, SidebarProvider } from "../components/ui/sidebar"

import { fetchEntities, EntityState, createEntity } from "@/store/slices/entitySlice";
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


function Home() {
    const dispatch = useAppDispatch();

    const entityState: EntityState = useSelector((state: RootState) => state.entities);
    const entities: { [id: string]: Entity; } = entityState.allEntities;
    const { error: notesError } = entityState;

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
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigationRef = useRef<ImperativePanelHandle>(null);

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
                    dispatch(openTab(result.payload.newNoteData));
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
                    dispatch(openTab(result.payload.newNoteData));
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

    const toggleNavigationBar = () => {
        if(isCollapsed){
            navigationRef.current?.expand();
            setIsCollapsed(false);
        }else {
            navigationRef.current?.collapse();
            setIsCollapsed(true);
        }
    };

    return (
        <div className="flex h-full w-full min-h-screen min-w-screen max-h-screen max-w-screen">
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[restrictToWindowEdges]} sensors={sensors}>
                <SidebarProvider>
                    <AppSidebar onIconOneClick={toggleNavigationBar} isNoteTreeCollapsed={isCollapsed}/>
                    <SidebarInset>
                        <ResizablePanelGroup direction="horizontal" tagName="div" className="h-full w-full">
                            <ResizablePanel ref={navigationRef}
                            className=""
                            minSize={10}
                            maxSize={25}
                            defaultSize={15}
                            collapsible={true}
                            onCollapse={()=>{setIsCollapsed(true)}}
                            onExpand={()=>{setIsCollapsed(false)}}
                            >
                                <NoteTree/>
                            </ResizablePanel>
                            <ResizableHandle className="w-1 theme-explorer-background"/>
                            <ResizablePanel className="theme-main-content-background">
                                <ContentFrame/>
                            </ResizablePanel>
                        </ResizablePanelGroup>
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