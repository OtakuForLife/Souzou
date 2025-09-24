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
        <div className="h-full overflow-y-scroll overflow-x-hidden">
            <div className="pb-10">
                {/* Header with Title */}
                <EntityTitle entity={entity} editable/>

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