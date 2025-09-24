import { EntityRendererProps } from "@/components/ContentRenderer";
import { Entity } from "@/models/Entity";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import ImageViewer from "./ImageViewer";
import PDFViewer from "./PDFViewer";
import TextViewer from "./TextViewer";
import GenericFileViewer from "./GenericFileViewer";
import EntityTitle from "@/components/EntityTitle";

interface MediaContent {
    data: string;
    mimeType: string;
    filename: string;
    size: number;
}

function MediaRenderer({ entityID }: EntityRendererProps) {
    const entity: Entity = useSelector((state: RootState) => state.entities.allEntities[entityID]);

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
                <EntityTitle entity={entity} editable/>

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
