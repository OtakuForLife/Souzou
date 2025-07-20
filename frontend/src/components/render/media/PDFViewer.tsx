import { Download, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface MediaContent {
    data: string;
    mimeType: string;
    filename: string;
    size: number;
}

interface PDFViewerProps {
    content: MediaContent;
}

function PDFViewer({ content }: PDFViewerProps) {
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const pdfUrl = `data:${content.mimeType};base64,${content.data}`;

    // Create a blob URL instead of data URL for better browser compatibility
    const [blobUrl, setBlobUrl] = useState<string>('');

    useEffect(() => {
        try {
            // Convert base64 to blob for better browser handling
            const byteCharacters = atob(content.data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setBlobUrl(url);

            return () => {
                URL.revokeObjectURL(url);
            };
        } catch (error) {
            console.error('Failed to create PDF blob:', error);
            setPdfError('Failed to process PDF data');
            setIsLoading(false);
        }
    }, [content.data]);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = blobUrl || pdfUrl;
        link.download = content.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleOpenInNewTab = () => {
        window.open(blobUrl || pdfUrl, '_blank');
    };

    const handleIframeLoad = () => {
        setIsLoading(false);
        setPdfError(null);
    };

    const handleIframeError = () => {
        setIsLoading(false);
        setPdfError('Failed to load PDF. The file may be corrupted or your browser may not support PDF viewing.');
    };

    if (pdfError) {
        return (
            <div className="space-y-4">
                {/* Controls */}
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenInNewTab}
                        title="Open in New Tab"
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in New Tab
                    </Button>
                    <div className="flex-1" />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        title="Download PDF"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                    </Button>
                </div>

                {/* Error Display */}
                <div className="border rounded-lg p-8 bg-red-50 border-red-200">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                        <h3 className="text-lg font-semibold text-red-800 mb-2">PDF Viewer Error</h3>
                        <p className="text-red-700 mb-4">{pdfError}</p>
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                onClick={handleOpenInNewTab}
                                className="border-red-300 text-red-700 hover:bg-red-100"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Try Opening in New Tab
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleDownload}
                                className="border-red-300 text-red-700 hover:bg-red-100"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInNewTab}
                    title="Open in New Tab"
                >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                </Button>
                <div className="flex-1" />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    title="Download PDF"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                </Button>
            </div>

            {/* PDF Viewer */}
            <div className="border rounded-lg overflow-hidden bg-white relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-gray-600">Loading PDF...</p>
                        </div>
                    </div>
                )}
                <iframe
                    src={blobUrl || pdfUrl}
                    className="w-full"
                    style={{ height: '70vh' }}
                    title={content.filename}
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    // Allow necessary permissions but restrict others to minimize PDF.js conflicts
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
            </div>

            {/* Fallback message */}
            <div className="text-center text-gray-500 text-sm">
                <p>If the PDF doesn't display properly, try opening it in a new tab or downloading it.</p>
            </div>
        </div>
    );
}

export default PDFViewer;
