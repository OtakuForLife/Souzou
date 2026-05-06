import { EntityRendererProps } from "@/components/ContentRenderer";
import { useAppDispatch } from "@/hooks";
import { updateEntity } from "@/store/slices/entitySlice";
import NoteEditor from "./NoteEditor";
import { Entity } from "@/models/Entity";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import EntityTitle from "@/components/EntityTitle";


function NoteRenderer({ entityID }: EntityRendererProps) {
    const entity: Entity = useSelector((state: RootState) => state.entities.allEntities[entityID]);
    const dispatch = useAppDispatch();

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
        <div className="h-full flex flex-col overflow-hidden">
            {/* Title is pinned at the top; editor owns its own scrolling */}
            <EntityTitle entity={entity} editable/>

            <div className="flex-1 min-h-0 px-4">
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