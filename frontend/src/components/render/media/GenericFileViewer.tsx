import { Download, File } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaContent {
    data: string;
    mimeType: string;
    filename: string;
    size: number;
}

interface GenericFileViewerProps {
    content: MediaContent;
}

function GenericFileViewer({ content }: GenericFileViewerProps) {
    const handleDownload = () => {
        const dataUrl = `data:${content.mimeType};base64,${content.data}`;
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = content.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileExtension = (filename: string): string => {
        return filename.split('.').pop()?.toUpperCase() || 'FILE';
    };

    return (
        <div className="space-y-4">
            {/* File Preview Card */}
            <div className="border rounded-lg p-8 bg-white">
                <div className="flex flex-col items-center text-center space-y-4">
                    {/* File Icon */}
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                        <File className="w-12 h-12 text-gray-400" />
                    </div>

                    {/* File Info */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-medium text-gray-900">
                            {content.filename}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="px-2 py-1 bg-gray-100 rounded">
                                {getFileExtension(content.filename)}
                            </span>
                            <span>{formatFileSize(content.size)}</span>
                            <span>{content.mimeType}</span>
                        </div>
                    </div>

                    {/* Download Button */}
                    <Button
                        onClick={handleDownload}
                        className="mt-4"
                        size="lg"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download File
                    </Button>
                </div>
            </div>

            {/* Info Message */}
            <div className="text-center text-gray-500 text-sm p-4 bg-gray-50 rounded-lg">
                <p>This file type cannot be previewed in the browser.</p>
                <p>Click the download button above to save the file to your device.</p>
            </div>
        </div>
    );
}

export default GenericFileViewer;
