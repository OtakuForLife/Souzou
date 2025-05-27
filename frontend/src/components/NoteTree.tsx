import NoteTreeItem from "./NoteTreeItem";
import { Note } from "@/models/Note";
import { RootState } from "@/store";
import { NoteState } from "@/store/slices/notesSlice";
import { useSelector } from "react-redux";
import { LoadingSpinner } from "@/components/common";


export const NoteTree = () => {
  const noteState: NoteState = useSelector((state: RootState) => state.notes);
  const notes: Note[] = noteState.rootNotes;
  const { loading } = noteState;

  return (
    <div className="relative flex-initial justify-center w-full h-full theme-explorer-background">
      <h1 className="text-center text-2xl font-bold mb-4 w-full theme-explorer-item-text">My Notes</h1>
      <div className="px-1">
        {notes.map((note: Note) => (
          <NoteTreeItem key={note.id} noteID={note.id} depth={0}/>
        ))}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 bg-opacity-30 flex items-center justify-center z-50">
            <LoadingSpinner size="md" text="Loading notes..." />
        </div>
      )}
    </div>
  );
};