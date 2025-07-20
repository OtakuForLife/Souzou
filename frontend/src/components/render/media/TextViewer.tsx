import { useState, useEffect } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaContent {
    data: string;
    mimeType: string;
    filename: string;
    size: number;
}

interface TextViewerProps {
    content: MediaContent;
}

function TextViewer({ content }: TextViewerProps) {
    const [textContent, setTextContent] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            // Decode base64 text content
            const decodedText = atob(content.data);
            setTextContent(decodedText);
            setLoading(false);
        } catch (err) {
            console.error('Failed to decode text content:', err);
            setError('Failed to decode text content');
            setLoading(false);
        }
    }, [content.data]);

    const handleDownload = () => {
        const blob = new Blob([textContent], { type: content.mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = content.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(textContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    // Determine if this is a code file based on extension
    const getLanguageFromFilename = (filename: string): string => {
        const ext = filename.split('.').pop()?.toLowerCase();
        const languageMap: Record<string, string> = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'json': 'json',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'md': 'markdown',
            'sql': 'sql',
            'sh': 'bash',
            'bash': 'bash'
        };
        return languageMap[ext || ''] || 'text';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading text content...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    const language = getLanguageFromFilename(content.filename);

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    title="Copy to Clipboard"
                >
                    {copied ? (
                        <Check className="w-4 h-4 mr-2 text-green-500" />
                    ) : (
                        <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                </Button>
                <div className="flex-1" />
                <span className="text-sm text-gray-500">
                    {textContent.split('\n').length} lines
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    title="Download File"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                </Button>
            </div>

            {/* Text Content */}
            <div className="border rounded-lg overflow-hidden bg-white">
                <pre className="p-4 text-sm overflow-auto max-h-96 whitespace-pre-wrap font-mono">
                    <code className={`language-${language}`}>
                        {textContent}
                    </code>
                </pre>
            </div>
        </div>
    );
}

export default TextViewer;
