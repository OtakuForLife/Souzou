import { Block } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";


interface editorProps {
  initialContent: string;
  onChange: (content: string)=> void
}

function BlockNoteEditor({initialContent, onChange}: editorProps) {
  console.log("initial content: "+initialContent);
  var blocks: Block[] = [];
  const blockNotesConfig: {initialContent?: Block[]} = {};
  try {
    blocks = JSON.parse(initialContent);
    blockNotesConfig.initialContent = blocks;
  } catch (error) {
    console.log(error);
  }
  
  const editor = useCreateBlockNote(blockNotesConfig);
  
  return (
    <BlockNoteView
      editor={editor}
      shadCNComponents={
        {}
      }
      onChange={()=>{
        onChange(JSON.stringify(editor.document));
      }}
    />
  );
}
     

export default BlockNoteEditor;
