import { Entity } from "@/models/Entity";
import { Input } from "./Input";
import { useAppDispatch } from "@/hooks";
import { updateEntity } from "@/store/slices/entitySlice";
import { validateNoteTitle } from "@/utils/common";
import { useState } from "react";

interface EntityTitleProps {
    entity: Entity;
    editable?: boolean;
}

function EntityTitle({ entity, editable = false }: EntityTitleProps) {
    const dispatch = useAppDispatch();
    const [titleError, setTitleError] = useState<string | undefined>();
    if (editable) {
        return (
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
        );
    } else {
        return (
            <div className="flex items-center gap-2 p-4">
                <div className="flex-1">
                    <span className="text-4xl">{entity?.title}</span>
                </div>
            </div>
        );
    }
}

export default EntityTitle;