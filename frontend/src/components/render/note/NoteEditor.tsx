
import React, { useEffect, useRef, useCallback } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, ViewUpdate } from "@codemirror/view";
import { syntaxHighlighting } from "@codemirror/language";
import { autocompletion } from "@codemirror/autocomplete";
import { useSelector } from "react-redux";

import { baseExtensions } from "@/editor/extensions";
import { hideMarkdownSyntax } from "@/editor/plugins";
import { markdownHighlightStyle, customTheme } from "@/editor/theme";
import { createCombinedLinkCompletion } from "@/editor/linkCompletion";
import { createLinkDecorations } from "@/editor/linkDecorations";
import { RootState } from "@/store";
import { useAppDispatch } from "@/hooks";
import { openTab } from "@/store/slices/tabsSlice";
import { Entity } from "@/models/Entity";


interface Props {
  initialText: string;
  onContentChange?: (content: string) => void;
  currentNoteId?: string;
  onLinkClick?: (noteId: string) => void;
}


const NoteEditor: React.FC<Props> = ({
  initialText,
  onContentChange,
  currentNoteId,
  onLinkClick
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onContentChangeRef = useRef(onContentChange);
  const notesRef = useRef<Record<string, Entity>>({});
  const currentNoteIdRef = useRef<string | undefined>(currentNoteId);

  // Get notes from Redux store
  const notesState = useSelector((state: RootState) => state.entities);
  const dispatch = useAppDispatch();

  // Keep refs updated
  useEffect(() => {
    onContentChangeRef.current = onContentChange;
    notesRef.current = notesState.allEntities;
    currentNoteIdRef.current = currentNoteId;
  }, [onContentChange, notesState.allEntities, currentNoteId]);

  // Handle link clicks - use stable function
  const handleLinkClick = useCallback((noteId: string) => {
    if (onLinkClick) {
      onLinkClick(noteId);
    } else {
      // Default behavior: open note in new tab
      dispatch(openTab(notesRef.current[noteId]));
    }
  }, [onLinkClick, dispatch]);

  // Create update listener extension (stable, doesn't change)
  const updateListener = EditorView.updateListener.of((update: ViewUpdate) => {
    if (update.docChanged && onContentChangeRef.current) {
      const newContent = update.state.doc.toString();
      onContentChangeRef.current(newContent);
    }
  });

  useEffect(() => {
    if (!editorRef.current) return;

    // Create link completion and decoration extensions that use refs
    const getNotesData = () => ({
      allNotes: notesRef.current,
      currentNoteId: currentNoteIdRef.current
    });
    const linkCompletion = createCombinedLinkCompletion(getNotesData);
    const linkDecorations = createLinkDecorations(() => notesRef.current, handleLinkClick);

    const state = EditorState.create({
      doc: initialText,
      extensions: [
        ...baseExtensions,
        syntaxHighlighting(markdownHighlightStyle),
        hideMarkdownSyntax,
        updateListener,
        customTheme,
        linkDecorations, // Add link decorations
        autocompletion({ override: [linkCompletion] }), // Add link completion
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
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
    <div
      className="px-4 overflow-hidden"
      ref={editorRef}
      style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
    />
  );
};

export default NoteEditor;
