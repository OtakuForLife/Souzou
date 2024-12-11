
import NoteTreeItem from "./NoteTreeItem";
import { useAppSelector } from "../lib/hooks";
import { Note } from "../lib/models/Note";
import { notesState } from "../lib/slices/notesSlice";


export const NoteTree = () => {
  const notes: Note[] = useAppSelector((state: { notes: notesState }) => state.notes.rootNotes);
  return (
    
    <div className="flex-initial justify-center w-full h-full bg-skin-primary text-skin-primary">
      <h1 className="text-center text-2xl font-bold mb-4 w-full">My Notes</h1>
      <div className="px-1">
        {notes.map((note: Note) => (
          <NoteTreeItem key={note.id} noteID={note.id} depth={0}/>
        ))}
      </div>
    </div>
  );
};