import { EntityRendererProps } from "@/components/ContentRenderer";
import { Input } from "@/components/Input";
import { useAppDispatch } from "@/hooks";
import { updateEntity } from "@/store/slices/entitySlice";
import { validateNoteTitle } from "@/utils/common";
import { useState } from "react";
import NoteEditor from "./NoteEditor";
import { Entity } from "@/models/Entity";
import { useSelector } from "react-redux";
import { RootState } from "@/store";


function NoteRenderer({ entityID }: EntityRendererProps) {
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
        <div className="h-full overflow-y-scroll">
            <div className="pb-10">
                {/* Header with Title */}
                <div className="flex items-center gap-2 p-4">
                    <div className="flex-1">
                        <Input
                            className="text-4xl p-0 border-none bg-transparent focus:ring-0 focus:border-none"
                            value={entity?.title}
                            placeholder="Note title..."
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
                            <div className="text-sm text-red-500 mt-1">
                                {titleError}
                            </div>
                        )}
                    </div>
                </div>
                <NoteEditor
                    initialText={entity ? entity.content : ""}
                    onContentChange={handleContentChange}
                    currentNoteId={entity.id}
                />
            </div>
        </div>
    );
}

export default NoteRenderer;