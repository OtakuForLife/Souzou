import { MDXEditor, MDXEditorMethods, diffSourcePlugin } from '@mdxeditor/editor';
import {
    headingsPlugin, 
    listsPlugin, 
    quotePlugin, 
    linkPlugin, 
    UndoRedo, 
    //BoldItalicUnderlineToggles, 
    tablePlugin, 
    //InsertTable,
    toolbarPlugin, 
    DiffSourceToggleWrapper,
    markdownShortcutPlugin,
    frontmatterPlugin } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css'

import { Block } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

import React, { useEffect, useState } from 'react';

interface editorProps {
  initialContent: string;
  onChange: (content: string)=> void
}

export function MDXNoteEditor({initialContent, onChange}: editorProps) {
  const mdxEditorRef = React.useRef<MDXEditorMethods>(null);
  return (
    <MDXEditor
    ref={mdxEditorRef}
    markdown={initialContent}
    plugins={[
      frontmatterPlugin(), 
      headingsPlugin(), 
      listsPlugin(), 
      quotePlugin(), 
      linkPlugin(), 
      tablePlugin(), 
      markdownShortcutPlugin(),
      /* diffSourcePlugin({ viewMode: 'source' }),
      toolbarPlugin({
        toolbarContents: () => (
          <DiffSourceToggleWrapper>
            <UndoRedo />
          </DiffSourceToggleWrapper>
        )
      }) */
    ]} 
    contentEditableClassName="outline-none min-h-screen max-w-none text-lg text-neutral-400 p-0
    prose prose-p:my-0 prose-p:py-0 prose-p:leading-relaxed prose-headings:my-2 
    prose-headings:text-neutral-400
    prose-blockquote:my-4 prose-ul:my-2 prose-li:my-0 prose-code:px-1 
    prose-code:text-red-500 prose-code:before:content-[''] prose-code:after:content-['']"
    onChange={(markdown: string) => {
        onChange(markdown)
    }}/>
  );
}


export function BlockNoteEditor({initialContent, onChange}: editorProps) {
  //console.log("initial content: "+initialContent);
  
  const editor = useCreateBlockNote();
  
  useEffect(()=>{
    async function loadInitialBlocks(){
      var blocks: Block[] = [];
      try {
          blocks = JSON.parse(initialContent);
        } catch (error) {
          //console.error(error);
          blocks = await editor.tryParseMarkdownToBlocks(initialContent);
        }
        editor.replaceBlocks(editor.document, blocks);
    }
    loadInitialBlocks();
    
  }, [editor]);
  
  
  return (
    <BlockNoteView
      editor={editor}
      shadCNComponents={
        {}
      }
      onChange={()=>{
        onChange(JSON.stringify(editor.document));
      }}
      formattingToolbar={true}
      linkToolbar={true}
      filePanel={true}
      sideMenu={true}
      slashMenu={true}
      tableHandles={true}
      className=''
    />
  );
}

interface SlashMenuProps {
  onSelect: (snippet: string)=>void;
}
const SlashMenu = ({ onSelect }: SlashMenuProps) => {
  const items = [
    { label: "Header 1", snippet: "\n# " },
    { label: "Header 2", snippet: "\n## " },
    { label: "Unordered List", snippet: "\n- " },
    { label: "Ordered List", snippet: "\n1. " },
    { label: "Quote", snippet: "\n> " },
    { label: "Code Block", snippet: "\n```\n\n```" }
  ];

  return (
    <div className="slash-menu">
      {items.map((item, index) => (
        <div
          key={index}
          className="slash-menu-item"
          onClick={() => onSelect(item.snippet)}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};

