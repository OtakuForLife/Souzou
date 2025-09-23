import { useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Download, MoveHorizontal, MoveVertical } from 'lucide-react';
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
    const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);

    const containerRef = useRef<HTMLDivElement | null>(null);

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

    const computeFitZoom = (mode: 'width' | 'height') => {
        if (!containerRef.current || !natural) return;
        const padding = 32; // matches p-4 on inner wrapper (top+bottom/left+right)
        const containerWidth = containerRef.current.clientWidth - padding;
        const containerHeight = containerRef.current.clientHeight - padding;

        const rotated = rotation % 180 !== 0;
        const imgWidth = rotated ? natural.height : natural.width;
        const imgHeight = rotated ? natural.width : natural.height;

        if (mode === 'width') {
            if (imgWidth > 0) setZoom(containerWidth / imgWidth);
        } else {
            if (imgHeight > 0) setZoom(containerHeight / imgHeight);
        }
    };


    const handleFitWidth = () => {
        computeFitZoom('width');
    };

    const handleFitHeight = () => {
        computeFitZoom('height');
    };



    return (
        <div className="space-y-4 min-w-0">
            {/* Controls */}
            <div className="flex items-center gap-2 rounded-lg">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFitWidth}
                    title="Fit to width"
                >
                    <MoveHorizontal className="w-4 h-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFitHeight}
                    title="Fit to height"
                >
                    <MoveVertical className="w-4 h-4" />
                </Button>
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
            <div ref={containerRef} className="w-full max-w-full min-w-0 border rounded-lg overflow-auto" style={{ height: '70vh', contain: 'layout paint size' }}>
                <div className="grid place-items-center w-full h-full p-4">
                    {/* Rotation wrapper ensures the outer box matches rotated footprint so aspect ratio is preserved and scroll ranges are correct */}
                    <div
                        className="transition-[width,height] duration-200"
                        style={{
                            width: natural ? `${(rotation % 180 !== 0 ? (natural.height * zoom) : (natural.width * zoom))}px` : undefined,
                            height: natural ? `${(rotation % 180 !== 0 ? (natural.width * zoom) : (natural.height * zoom))}px` : undefined,
                        }}
                    >
                        <img
                            src={imageUrl}
                            alt={content.filename}
                            className="block transition-[transform] duration-200"
                            style={{
                                width: natural ? `${natural.width * zoom}px` : undefined,
                                height: natural ? `${natural.height * zoom}px` : undefined,
                                transform: `rotate(${rotation}deg)`
                            }}
                            onLoad={(e) => {
                                const img = e.currentTarget;
                                setNatural({ width: img.naturalWidth, height: img.naturalHeight });
                            }}
                            onError={(e) => {
                                console.error('Failed to load image:', e);
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ImageViewer;
