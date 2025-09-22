import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/hooks';
import { fetchEntities } from '@/store/slices/entitySlice';
import { API_CONFIG } from '@/config/constants';
import api from '@/lib/api';

interface FileUploadProps {
    onUploadComplete?: (entityId: string) => void;
    parentId: string | null;
}

interface UploadFile {
    file: File;
    id: string;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error: string | null;
    entityId?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml',
    'application/pdf',
    'text/plain', 'text/markdown', 'text/csv',
    'application/json', 'application/xml'
];

function FileUpload({ onUploadComplete, parentId }: FileUploadProps) {
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dispatch = useAppDispatch();

    const generateId = () => Math.random().toString(36).slice(2, 11);

    const validateFile = (file: File): string | null => {
        if (file.size > MAX_FILE_SIZE) {
            return `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            return `File type not supported: ${file.type}`;
        }
        return null;
    };

    const addFiles = useCallback((newFiles: FileList | File[]) => {
        const fileArray = Array.from(newFiles);
        const validFiles: UploadFile[] = [];

        fileArray.forEach(file => {
            const error = validateFile(file);
            validFiles.push({
                file,
                id: generateId(),
                progress: 0,
                status: error ? 'error' : 'pending',
                error
            });
        });

        setFiles(prev => [...prev, ...validFiles]);
    }, []);

    const uploadSingleFile = async (uploadFile: UploadFile) => {
        const formData = new FormData();
        formData.append('file', uploadFile.file);
        formData.append('title', uploadFile.file.name);
        if (parentId) {
            formData.append('parent', parentId);
        }

        try {
            setFiles(prev => prev.map(f => 
                f.id === uploadFile.id 
                    ? { ...f, status: 'uploading', progress: 0 }
                    : f
            ));

            const response = await api.post(
                `${API_CONFIG.ENDPOINTS.ENTITIES}/upload_file/`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (event) => {
                        const total = event.total || 0;
                        const loaded = event.loaded || 0;
                        const progress = total ? Math.round((loaded * 100) / total) : 0;
                        setFiles(prev => prev.map(f =>
                            f.id === uploadFile.id ? { ...f, progress } : f
                        ));
                    }
                }
            );

            const result = response.data;

            setFiles(prev => prev.map(f =>
                f.id === uploadFile.id 
                    ? { ...f, status: 'success', progress: 100, entityId: result.entity.id }
                    : f
            ));

            if (onUploadComplete) {
                onUploadComplete(result.entity.id);
            }

            // Refresh entities to show the new upload
            dispatch(fetchEntities());

        } catch (error) {
            console.error('Upload failed:', error);
            setFiles(prev => prev.map(f => 
                f.id === uploadFile.id 
                    ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
                    : f
            ));
        }
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files) {
            addFiles(e.dataTransfer.files);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(e.target.files);
        }
    };

    const handleUploadAll = () => {
        files.filter(f => f.status === 'pending').forEach(uploadSingleFile);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const pendingFiles = files.filter(f => f.status === 'pending');
    const hasErrors = files.some(f => f.status === 'error');

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <Upload className="w-12 h-12 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                    Drop files here or click to browse
                </p>
                <p className="text-sm opacity-70 mb-4">
                    Supports images, PDFs, and text files up to 10MB
                </p>
                <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                >
                    Choose Files
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    accept={ALLOWED_TYPES.join(',')}
                />
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">
                            Files ({files.length})
                        </h3>
                        {pendingFiles.length > 0 && (
                            <Button
                                size="sm"
                                onClick={handleUploadAll}
                                disabled={hasErrors}
                            >
                                Upload All ({pendingFiles.length})
                            </Button>
                        )}
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {files.map(uploadFile => (
                            <div
                                key={uploadFile.id}
                                className="flex items-center gap-3 p-3 border rounded-lg bg-opacity-10"
                            >
                                <File className="w-5 h-5 flex-shrink-0" />
                                
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {uploadFile.file.name}
                                    </p>
                                    <p className="text-xs opacity-70">
                                        {formatFileSize(uploadFile.file.size)}
                                    </p>
                                    
                                    {uploadFile.status === 'uploading' && (
                                        <div className="mt-1">
                                            <div className="w-full rounded-full h-1">
                                                <div 
                                                    className="bg-blue-500 h-1 rounded-full transition-all"
                                                    style={{ width: `${uploadFile.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    
                                    {uploadFile.error && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {uploadFile.error}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {uploadFile.status === 'success' && (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    )}
                                    {uploadFile.status === 'error' && (
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    )}
                                    {uploadFile.status === 'pending' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => uploadSingleFile(uploadFile)}
                                        >
                                            Upload
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeFile(uploadFile.id)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default FileUpload;
