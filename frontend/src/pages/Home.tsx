import { useEffect, useState } from "react";
import Editor from "@/components/Editor";
import NoteFrame from "@/components/NoteFrame";

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
  } from "@/components/ui/resizable";
import { useAppDispatch } from "@/lib/hooks";
import { createNote, fetchNotes } from "@/lib/slices/notesSlice";
import { NoteTree } from "@/components/NoteTree";
import { useAppSelector } from "../lib/hooks";
import { notesState } from "../lib/slices/notesSlice";
import { Note } from "../lib/models/Note";

function Home() {
    const dispatch = useAppDispatch();
    useEffect(()=> {
        dispatch(fetchNotes());
    }, [dispatch]);

    const notes: {} = useAppSelector((state: { notes: notesState }) => state.notes.allNotes);
    console.log(JSON.stringify(notes));
    return (
        <ResizablePanelGroup
        direction="horizontal"
        className="max-w-screen min-h-screen md:min-w-[450px] h-full">
            <ResizablePanel defaultSize={15} minSize={10}>
                <NoteTree className="flex-initial w-50 h-screen justify-center"/>
            </ResizablePanel>
        <ResizableHandle className="w-0 bg-gray-900"/>
            <ResizablePanel defaultSize={85}>
                <NoteFrame/>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}

export default Home;