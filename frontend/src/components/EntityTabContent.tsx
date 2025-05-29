import { useAppDispatch } from "@/hooks";
import { Entity } from "@/models/Entity";
import { RootState } from "@/store";
import { EntityState, saveEntity, updateEntity } from "@/store/slices/entiySlice";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Save } from "lucide-react";
import { useSelector } from "react-redux";
import { Input } from "./Input";
import NoteEditor from "./NoteEditor";
import { validateNoteTitle } from "@/utils/common";
import { useState } from "react";

interface NoteTabContentProps {
  objectID: string;
}

function NoteTabContent({ objectID }: NoteTabContentProps) {
  const noteState: EntityState = useSelector((state: RootState) => state.notes);
  const note: Entity = noteState.allNotes[objectID];
  const dispatch = useAppDispatch();
  const [titleError, setTitleError] = useState<string | undefined>();

  // Handle content changes from the editor
  const handleContentChange = (newContent: string) => {
    // Update note in store immediately for UI responsiveness
    dispatch(
      updateEntity({
        noteID: note?.id,
        content: newContent,
      }),
    );
  };
  return (
    <ScrollArea type="always" className="p-2 h-full">
      <span
        className="w-5 h-5 p-0"
        onClick={(e: React.MouseEvent<HTMLElement>) => {
          e.preventDefault();
          if (note) {
            dispatch(saveEntity(note));
          }
        }}
      >
        <Save className="w-5 h-5" />
      </span>
      <Input
        className="text-4xl h-15 p-0 py-1"
        value={note?.title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const newTitle = e.currentTarget.value;

          // Validate title
          const validation = validateNoteTitle(newTitle);
          if (!validation.isValid) {
            setTitleError(validation.error);
          } else {
            setTitleError(undefined);
          }

          // Update note in store immediately for UI responsiveness
          dispatch(
            updateEntity({
              noteID: note?.id,
              title: newTitle,
              content: note?.content,
              parent: note?.parent,
            }),
          );
        }}
      />
      {titleError && (
        <div className="text-sm mt-1 px-1">
          {titleError}
        </div>
      )}
      <NoteEditor
        initialText={note ? note.content : ""}
        onContentChange={handleContentChange}
        currentNoteId={objectID}
      />
    </ScrollArea>
  );
}

export default NoteTabContent;

