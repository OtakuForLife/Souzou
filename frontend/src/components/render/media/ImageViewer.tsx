import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaContent {
    data: string;
    mimeType: string;
    filename: string;
    size: number;
}

interface ImageViewerProps {
    content: MediaContent;
}

function ImageViewer({ content }: ImageViewerProps) {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);

    const imageUrl = `data:${content.mimeType};base64,${content.data}`;

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev * 1.2, 5));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev / 1.2, 0.1));
    };

    const handleRotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = content.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setZoom(1);
        setRotation(0);
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center gap-2 p-2 rounded-lg">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    title="Zoom In"
                >
                    <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    title="Zoom Out"
                >
                    <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRotate}
                    title="Rotate"
                >
                    <RotateCw className="w-4 h-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    title="Reset View"
                >
                    Reset
                </Button>
                <div className="flex-1" />
                <span className="text-sm text-gray-500">
                    {Math.round(zoom * 100)}%
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    title="Download"
                >
                    <Download className="w-4 h-4" />
                </Button>
            </div>

            {/* Image Container */}
            <div className="border rounded-lg overflow-auto" style={{ maxHeight: '70vh' }}>
                <div className="flex items-center justify-center min-h-96 p-4">
                    <img
                        src={imageUrl}
                        alt={content.filename}
                        className="transition-transform duration-200"
                        style={{
                            transform: `scale(${zoom}) rotate(${rotation}deg)`,
                            transformOrigin: 'center'
                        }}
                        onError={(e) => {
                            console.error('Failed to load image:', e);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default ImageViewer;
