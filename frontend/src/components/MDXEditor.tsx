import { MDXEditor, MDXEditorMethods } from '@mdxeditor/editor';
import {
    headingsPlugin, 
    listsPlugin, 
    quotePlugin, 
    linkPlugin, 
    //UndoRedo, 
    //BoldItalicUnderlineToggles, 
    tablePlugin, 
    //InsertTable,
    //toolbarPlugin, 
    markdownShortcutPlugin,
    frontmatterPlugin } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css'
import React from 'react';

interface editorProps {
  initialContent: string;
  onChange: (content: string)=> void
}

function Editor({initialContent, onChange}: editorProps) {
  console.log("initial content: "+initialContent);
  const mdxEditorRef = React.useRef<MDXEditorMethods>(null);
  return (
    <MDXEditor
    ref={mdxEditorRef}
    markdown={initialContent} 
    plugins={[frontmatterPlugin(), headingsPlugin(), listsPlugin(), quotePlugin(), linkPlugin(), tablePlugin(), markdownShortcutPlugin()]} 
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
export default Editor;