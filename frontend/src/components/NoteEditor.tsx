import React, { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, ViewUpdate } from "@codemirror/view";
import { syntaxHighlighting } from "@codemirror/language";

import { baseExtensions } from "@/editor/extensions";
import { hideMarkdownSyntax } from "@/editor/plugins";
import { markdownHighlightStyle, customTheme } from "@/editor/theme";


interface Props {
  initialText: string;
  onContentChange?: (content: string) => void;
}


const NoteEditor: React.FC<Props> = ({ initialText, onContentChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onContentChangeRef = useRef(onContentChange);

  // Keep the callback ref updated
  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  // Create update listener extension (stable, doesn't change)
  const updateListener = EditorView.updateListener.of((update: ViewUpdate) => {
    if (update.docChanged && onContentChangeRef.current) {
      const newContent = update.state.doc.toString();
      onContentChangeRef.current(newContent);
    }
  });

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: initialText,
      extensions: [
        ...baseExtensions,
        syntaxHighlighting(markdownHighlightStyle),
        hideMarkdownSyntax,
        updateListener,
        customTheme,
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Only run once on mount

  // Update editor content when initialText changes (e.g., when switching notes)
  useEffect(() => {
    if (viewRef.current && viewRef.current.state.doc.toString() !== initialText) {
      const transaction = viewRef.current.state.update({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: initialText
        }
      });
      viewRef.current.dispatch(transaction);
    }
  }, [initialText]);

  return (
    <div className="" ref={editorRef} />
  );
};

export default NoteEditor;
