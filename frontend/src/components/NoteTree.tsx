
import NoteTreeItem from "./NoteTreeItem";
import { useAppSelector } from "@/lib/hooks";
import { Note } from "@/lib/models/Note";
import { notesState, openNote } from "../lib/slices/notesSlice";


export const NoteTree = () => {
  const notes: Note[] = useAppSelector((state: { notes: notesState }) => state.notes.rootNotes);
  console.log(notes);
  return (
    <div className="w-full h-full bg-gray-700 text-neutral-400">
      <h1 className="text-center text-2xl font-bold mb-4">My Notes</h1>
      <div className="px-1">
        {notes.map((note: Note) => (
          <NoteTreeItem key={note.id} note={note} depth={0}/>
        ))}
      </div>
    </div>
  );
};