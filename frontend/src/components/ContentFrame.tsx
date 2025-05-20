
import NoOpenNote from "./NoOpenNote";
import EditorTabs from './EditorTabs';
import { Note } from "@/models/Note";
import { RootState } from "@/store";
import { NoteState } from "@/store/slices/notesSlice";
import { useSelector } from "react-redux";


export default function ContentFrame(){
    const noteState: NoteState = useSelector((state: RootState) => state.notes);
    const openNotes: Note[] = noteState.openNotes;
    const currentNote: Note | null = noteState.currentNote;
    return (
        <>
            {openNotes?.length>0 && currentNote!=null ? <EditorTabs/>: <NoOpenNote/>}
        </>
    )
    
}