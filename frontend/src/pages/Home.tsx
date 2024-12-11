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
import {ImperativePanelHandle, getPanelElement}  from "react-resizable-panels"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "../components/ui/sidebar"

import { useAppDispatch } from "../lib/hooks";
import { fetchNotes } from "../lib/slices/notesSlice";
import { NoteTree } from "../components/NoteTree";
import { useAppSelector } from "../lib/hooks";
import { notesState } from "../lib/slices/notesSlice";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { Note } from "../lib/models/Note";
import ContentFrame from "../components/ContentFrame";
import AppSidebar from "../components/Sidebar";


function Home() {
    const dispatch = useAppDispatch();
    useEffect(()=> {
        dispatch(fetchNotes());
    }, [dispatch]);

    const notes: { [id: string] : Note; } = useAppSelector((state: { notes: notesState }) => state.notes.allNotes);
    const [activeDrag, setActiveDrag] = useState<Active|null>(null);
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
    const mouseSensor = useSensor(MouseSensor, {
        activationConstraint: {
            distance: 10,
        },
    });
    const sensors = useSensors(mouseSensor,);



    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigationRef = useRef<ImperativePanelHandle>(null);
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
        <div className="flex bg-skin-primary min-h-screen h-full">
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[restrictToWindowEdges]} sensors={sensors}>
                <SidebarProvider>
                    <AppSidebar onIconOneClick={toggleNavigationBar}/>
                    <SidebarInset>
                        <ResizablePanelGroup direction="horizontal">
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
                            <ResizablePanel>
                                <ContentFrame/>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </SidebarInset>
                </SidebarProvider>
                <DragOverlay dropAnimation={null}>
                    {activeDrag?.data ? (
                        <div className="text-neutral-500 bg-gray-900 w-[150px] p-1 truncate ...">
                            <span>{notes[activeDrag.data.current?.note]?.title }</span>
                        </div> 
                    ): null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

export default Home;