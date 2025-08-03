import { EntityRendererProps } from "@/components/ContentRenderer";
import { Input } from "@/components/Input";
import { useAppDispatch } from "@/hooks";
import { updateEntity } from "@/store/slices/entitySlice";
import { validateNoteTitle } from "@/utils/common";
import { useState } from "react";
import { Entity } from "@/models/Entity";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import ImageViewer from "./ImageViewer";
import PDFViewer from "./PDFViewer";
import TextViewer from "./TextViewer";
import GenericFileViewer from "./GenericFileViewer";

interface MediaContent {
    data: string;
    mimeType: string;
    filename: string;
    size: number;
}

function MediaRenderer({ entityID }: EntityRendererProps) {
    const entity: Entity = useSelector((state: RootState) => state.entities.allEntities[entityID]);
    const dispatch = useAppDispatch();
    const [titleError, setTitleError] = useState<string | undefined>();

    // Parse the media content
    let mediaContent: MediaContent | null = null;
    try {
        mediaContent = JSON.parse(entity.content) as MediaContent;
    } catch (error) {
        console.error('Failed to parse media content:', error);
    }

    if (!mediaContent) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center text-red-500">
                    <p>Error: Invalid media content</p>
                    <p className="text-sm text-gray-500">Unable to parse media data</p>
                </div>
            </div>
        );
    }

    // Render appropriate viewer based on MIME type
    const renderMediaViewer = () => {
        const { mimeType } = mediaContent!;

        if (mimeType.startsWith('image/')) {
            return <ImageViewer content={mediaContent!} />;
        } else if (mimeType === 'application/pdf') {
            return <PDFViewer content={mediaContent!} />;
        } else if (mimeType.startsWith('text/')) {
            return <TextViewer content={mediaContent!} />;
        } else {
            return <GenericFileViewer content={mediaContent!} />;
        }
    };

    return (
        <div className="h-full overflow-y-scroll overflow-x-hidden">
            <div className="pb-10">
                {/* Header with Title */}
                <div className="flex items-center gap-2 p-4">
                    <div className="flex-1">
                        <Input
                            className="text-4xl p-0 border-none bg-transparent focus:ring-0 focus:border-none"
                            value={entity?.title}
                            placeholder="Media title..."
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const newTitle = e.currentTarget.value;

                                // Validate title
                                const validation = validateNoteTitle(newTitle);
                                if (!validation.isValid) {
                                    setTitleError(validation.error);
                                } else {
                                    setTitleError(undefined);
                                }

                                // Update entity in store immediately for UI responsiveness
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

                {/* File Info */}
                <div className="px-4 pb-4">
                    <div className="text-sm space-y-1">
                        <p>File: {mediaContent.filename}</p>
                        <p>Type: {mediaContent.mimeType}</p>
                        <p>Size: {(mediaContent.size / 1024).toFixed(1)} KB</p>
                    </div>
                </div>

                {/* Media Viewer */}
                <div className="px-4">
                    {renderMediaViewer()}
                </div>
            </div>
        </div>
    );
}

export default MediaRenderer;
