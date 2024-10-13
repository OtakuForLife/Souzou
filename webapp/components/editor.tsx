"use client";
import  React, { useEffect, useState } from "react";

import "@blocknote/core/fonts/inter.css";
import { PartialBlock, Block, BlockNoteEditor } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";


interface EditorProps {
    onChange: () => void;
    initialContent?: string;
    editable?: boolean;
}

export default function Editor({
    initialContent,
    editable
}: EditorProps) {
    const editor: BlockNoteEditor = useCreateBlockNote({initialContent: initialContent ? JSON.parse(initialContent) as PartialBlock[] : undefined}); 
    
    return (
        <div className="flex justify-center p-1 flex-1 h-full overflow-y-auto">
            <BlockNoteView 
                editor={editor} 
                editable={editable}
                theme='light'
                className="w-3/4 h-full"
            />
        </div>
    );
}
