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

import { fetchNotes, NoteState } from "@/store/slices/notesSlice";
import { GraphState } from "@/store/slices/graphSlice";
import { NoteTree } from "../components/NoteTree";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import ContentFrame from "../components/ContentFrame";
import AppSidebar from "../components/Sidebar";
import { useAppDispatch, useKeyboardShortcuts } from "@/hooks";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { Note } from "@/models/Note";
import { LoadingSpinner } from "@/components/common";
import { createNote } from "@/store/slices/notesSlice";
import { CONTENT_TYPE_CONFIG } from "@/config/constants";
import { ContentType, GraphContentData } from "@/types/contentTypes";
import { openTab } from "@/store/slices/tabsSlice";


function Home() {
    const dispatch = useAppDispatch();

    // Fetch notes on component mount
    useEffect(()=> {
        dispatch(fetchNotes());
    }, [dispatch]);

    const noteState: NoteState = useSelector((state: RootState) => state.notes);
    const notes: { [id: string]: Note; } = noteState.allNotes;
    const { loading: notesLoading, error: notesError } = noteState;

    const graphState: GraphState = useSelector((state: RootState) => state.graphs);
    const graphs: { [id: string]: GraphContentData; } = graphState.allGraphs;
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
                const result = await dispatch(createNote({
                    title: CONTENT_TYPE_CONFIG.NOTE.DEFAULT_TITLE,
                    content: CONTENT_TYPE_CONFIG.NOTE.DEFAULT_CONTENT,
                    parent: null
                }));

                if (createNote.fulfilled.match(result) && result.payload.newNoteData) {
                    dispatch(openTab({
                        objectType: ContentType.NOTE,
                        objectID: result.payload.newNoteData.id
                    }));
                }
            }
        },
        {
            key: 'r',
            ctrlKey: true,
            callback: () => {
                // Refresh notes with Ctrl+R
                dispatch(fetchNotes());
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

    // Show loading state while notes are being fetched
    if (notesLoading) {
        return (
            <div className="flex bg-skin-primary h-full">
                <div className="flex-1 flex items-center justify-center">
                    <LoadingSpinner size="lg" text="Loading notes..." />
                </div>
            </div>
        );
    }

    // Show error state if notes failed to load
    if (notesError) {
        return (
            <div className="flex bg-skin-primary h-full">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-red-500 text-center">
                        <p className="text-lg font-semibold mb-2">Failed to load notes</p>
                        <p className="text-sm">{notesError}</p>
                        <button
                            onClick={() => dispatch(fetchNotes())}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }
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
        <div className="flex bg-skin-primary h-full w-full">
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[restrictToWindowEdges]} sensors={sensors}>
                <SidebarProvider>
                    <AppSidebar onIconOneClick={toggleNavigationBar}/>
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
                            <ResizableHandle className="w-1"/>
                            <ResizablePanel className="h-full overflow-hidden">
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
                                <div className="text-neutral-500 bg-gray-900 w-[150px] p-1 truncate shadow-lg rounded">
                                    <span>{notes[activeDrag.data.current?.note]?.title}</span>
                                </div>
                            )}

                            {/* Tab drag overlay */}
                            {activeDrag.data.current?.type === "tab" && (
                                <div className="bg-gray-800 border border-blue-500 rounded w-[150px] p-2 text-white shadow-xl">
                                    <span className="text-sm font-medium">
                                        {activeDrag.data.current?.objectType === "note"
                                            ? notes[activeDrag.data.current?.objectID]?.title || "Unknown Note"
                                            : activeDrag.data.current?.objectType === "graph"
                                            ? graphs[activeDrag.data.current?.objectID]?.title || "Unknown Graph"
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