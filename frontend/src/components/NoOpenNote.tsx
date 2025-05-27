import { Button } from "./ui/button";
import { useAppDispatch } from "@/hooks";
import { createNote } from "@/store/slices/notesSlice";
import { openTab } from "@/store/slices/tabsSlice";
import { ContentType } from "@/types/contentTypes";
import { CONTENT_TYPE_CONFIG } from "@/config/constants";

export default function NoOpenNote(){
    const dispatch = useAppDispatch();

    const handleCreateNote = async () => {
        const result = await dispatch(createNote({
            title: CONTENT_TYPE_CONFIG.NOTE.DEFAULT_TITLE,
            content: CONTENT_TYPE_CONFIG.NOTE.DEFAULT_CONTENT,
            parent: null
        }));

        // Open the newly created note in a tab
        if (createNote.fulfilled.match(result) && result.payload.newNoteData) {
            dispatch(openTab({
                objectType: ContentType.NOTE,
                objectID: result.payload.newNoteData.id
            }));
        }
    };

    return (
        <div className="h-full w-full flex justify-center items-center theme-main-content-background theme-main-content-text">
            <Button variant="ghost" onClick={handleCreateNote}>
                Create a Note
            </Button>
        </div>
    );
}