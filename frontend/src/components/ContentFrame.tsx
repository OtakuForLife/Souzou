
import NoOpenNote from "./NoOpenNote";
import { Note } from "../lib/models/Note";
import { useAppSelector } from "../lib/hooks";
import { notesState } from "../lib/slices/notesSlice";
import EditorTabs from './EditorTabs';


export default function ContentFrame(){
    const openNotes: Note[] = useAppSelector((state: {notes: notesState}) => state.notes.openNotes);
    const currentNote: Note | null | undefined = useAppSelector((state: { notes: notesState }) => state.notes.currentNote);
    return (
        <>
            {openNotes?.length>0 && currentNote!=null ? <EditorTabs/>: <NoOpenNote/>}
        </>
    )
    
}