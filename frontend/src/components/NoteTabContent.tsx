import { useAppDispatch, useDebounce } from "@/hooks";
import { Note } from "@/models/Note";
import { RootState } from "@/store";
import { NoteState, saveNote, updateNote } from "@/store/slices/notesSlice";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Save } from "lucide-react";
import { useSelector } from "react-redux";
import { Input } from "./Input";
import NoteEditor from "./NoteEditor";
import { validateNoteTitle } from "@/utils/common";
import { log } from "@/lib/logger";
import { useState, useEffect } from "react";

interface NoteTabContentProps {
  objectID: string;
}

function NoteTabContent({ objectID }: NoteTabContentProps) {
  const noteState: NoteState = useSelector((state: RootState) => state.notes);
  const note: Note = noteState.allNotes[objectID];
  const dispatch = useAppDispatch();
  const [titleError, setTitleError] = useState<string | undefined>();
  const [pendingTitle, setPendingTitle] = useState<string>('');

  // Use debounce hook for auto-save
  const debouncedTitle = useDebounce(pendingTitle, 2000);

  // Auto-save when debounced title changes
  useEffect(() => {
    if (debouncedTitle && note && debouncedTitle !== note.title) {
      const validation = validateNoteTitle(debouncedTitle);
      if (validation.isValid) {
        log.info('Auto-saving note', { noteId: note.id, title: debouncedTitle });
        dispatch(saveNote({ ...note, title: debouncedTitle }));
      }
    }
  }, [debouncedTitle, note, dispatch]);

  return (
    <ScrollArea type="always" className="p-2 h-screen bg-skin-secondary">
      <span
        className="w-5 h-5 p-0 text-skin-primary hover:bg-skin-primary-hover"
        onClick={(e: React.MouseEvent<HTMLElement>) => {
          e.preventDefault();
          if (note) {
            dispatch(saveNote(note));
          }
        }}
      >
        <Save className="w-5 h-5" />
      </span>
      <Input
        className="bg-skin-secondary text-skin-primary text-4xl h-15 p-0 py-1"
        value={note?.title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const newTitle = e.currentTarget.value;

          // Validate title
          const validation = validateNoteTitle(newTitle);
          if (!validation.isValid) {
            setTitleError(validation.error);
            log.warn('Invalid note title', { title: newTitle, error: validation.error });
          } else {
            setTitleError(undefined);
          }

          // Update note in store immediately for UI responsiveness
          dispatch(
            updateNote({
              noteID: note?.id,
              title: newTitle,
              content: note?.content,
              parent: note?.parent,
            }),
          );

          // Set pending title for debounced auto-save
          if (validation.isValid) {
            setPendingTitle(newTitle);
          }
        }}
      />
      {titleError && (
        <div className="text-red-500 text-sm mt-1 px-1">
          {titleError}
        </div>
      )}
      <NoteEditor initialText={note ? note.content : ""} />
    </ScrollArea>
  );
}

export default NoteTabContent;

