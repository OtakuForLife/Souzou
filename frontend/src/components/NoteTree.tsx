import NoteTreeItem from "./NoteTreeItem";
import { Note } from "@/models/Note";
import { RootState } from "@/store";
import { NoteState } from "@/store/slices/notesSlice";
import { useSelector } from "react-redux";


export const NoteTree = () => {
  const noteState: NoteState = useSelector((state: RootState) => state.notes);
  const notes: Note[] = noteState.rootNotes;
  return (
    <div className="flex-initial justify-center w-full h-full theme-explorer-background">
      <h1 className="text-center text-2xl font-bold mb-4 w-full theme-explorer-item-text">My Notes</h1>
      <div className="px-1">
        {notes.map((note: Note) => (
          <NoteTreeItem key={note.id} noteID={note.id} depth={0}/>
        ))}
      </div>
    </div>
  );
};