/**
 * Dialog Context - Centralized dialog state management
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FileUploadDialogState {
  isOpen: boolean;
  parentId: string | null;
}

interface DialogContextType {
  fileUpload: FileUploadDialogState;
  openFileUpload: (parentId?: string | null) => void;
  closeFileUpload: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

interface DialogProviderProps {
  children: ReactNode;
}

export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  const [fileUpload, setFileUpload] = useState<FileUploadDialogState>({
    isOpen: false,
    parentId: null,
  });

  const openFileUpload = (parentId: string | null = null) => {
    setFileUpload({
      isOpen: true,
      parentId,
    });
  };

  const closeFileUpload = () => {
    setFileUpload({
      isOpen: false,
      parentId: null,
    });
  };

  const value: DialogContextType = {
    fileUpload,
    openFileUpload,
    closeFileUpload,
  };

  return (
    <DialogContext.Provider value={value}>
      {children}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};
