

interface editorProps {
  initialContent: string;
  onChange: (content: string)=> void
}

export function NoteEditor({initialContent, onChange}: editorProps) {
  return (
    <div className="h-full w-full">
      <textarea className="h-full w-full" value={initialContent} onChange={(e) => onChange(e.target.value)}/>
    </div>
  );
}
