import { EntityRendererProps } from "@/components/ContentRenderer";
import { Input } from "@/components/Input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppDispatch } from "@/hooks";
import { saveEntity, updateEntity } from "@/store/slices/entitySlice";
import { validateNoteTitle } from "@/utils/common";
import { Save } from "lucide-react";
import { useState } from "react";
import NoteEditor from "./NoteEditor";
import { Entity } from "@/models/Entity";
import { useSelector } from "react-redux";
import { RootState } from "@/store";


function NoteRenderer({entityID}: EntityRendererProps) {
    const entity: Entity = useSelector((state: RootState) => state.entities.allEntities[entityID]);
    const dispatch = useAppDispatch();
    const [titleError, setTitleError] = useState<string | undefined>();

    // Handle content changes from the editor
    const handleContentChange = (newContent: string) => {
        // Update note in store immediately for UI responsiveness
        dispatch(
            updateEntity({
                noteID: entity?.id,
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
                    if (entity?.id) {
                        dispatch(saveEntity(entity));
                    }
                }}
            >
                <Save className="w-5 h-5" />
            </span>
            <Input
                className="text-4xl h-15 p-0 py-1"
                value={entity?.title}
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
                            noteID: entity?.id,
                            title: newTitle,
                            content: entity?.content,
                            parent: entity?.parent,
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
                initialText={entity ? entity.content : ""}
                onContentChange={handleContentChange}
                currentNoteId={entity.id}
            />
        </ScrollArea>
    );
}

export default NoteRenderer;