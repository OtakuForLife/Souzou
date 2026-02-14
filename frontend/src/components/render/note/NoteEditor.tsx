
import React, { useEffect, useRef, useCallback } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, ViewUpdate } from "@codemirror/view";
import { syntaxHighlighting } from "@codemirror/language";
import { autocompletion } from "@codemirror/autocomplete";
import { useSelector } from "react-redux";

import { baseExtensions } from "@/editor/extensions";
import { hideMarkdownSyntax } from "@/editor/hideSyntax";
import { createMarkdownHighlightStyle, createCustomTheme } from "@/editor/theme";
import { createCombinedLinkCompletion } from "@/editor/linkCompletion";
import { createLinkDecorations } from "@/editor/linkDecorations";
import { createWikiLinkDisplay } from "@/editor/wikiLinkDisplay";
import { createWikiLinkSyntax } from "@/editor/wikiLinkSyntax";
import { checkboxPlugin } from "@/editor/checkboxExtension";
import { tablePlugin } from "@/editor/tableExtension";
import { RootState } from "@/store";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { openTab } from "@/store/slices/tabsSlice";
import { Entity } from "@/models/Entity";
import { selectCurrentTheme } from "@/store/selectors/themeSelectors";


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

  // Create compartments for theme-related extensions
  const themeCompartment = useRef(new Compartment());
  const highlightCompartment = useRef(new Compartment());

  // Get notes from Redux store
  const notesState = useSelector((state: RootState) => state.entities);
  const dispatch = useAppDispatch();

  // Get current theme to track changes
  const currentTheme = useAppSelector(selectCurrentTheme);

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
      dispatch(openTab(noteId));
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
    const wikiLinkDisplay = createWikiLinkDisplay(() => notesRef.current, handleLinkClick);
    const wikiLinkSyntax = createWikiLinkSyntax(() => notesRef.current);

    const state = EditorState.create({
      doc: initialText,
      extensions: [
        ...baseExtensions,
        // Obsidian-style checkbox live preview
        checkboxPlugin,
        // TanStack table rendering
        tablePlugin,
        highlightCompartment.current.of(syntaxHighlighting(createMarkdownHighlightStyle())),
        hideMarkdownSyntax,
        wikiLinkSyntax, // Add wiki link syntax styling (for raw text)
        wikiLinkDisplay, // Add wiki link display (should come before linkDecorations)
        updateListener,
        themeCompartment.current.of(createCustomTheme()),
        linkDecorations,
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

  // Update editor theme when theme changes
  useEffect(() => {
    if (viewRef.current && currentTheme) {
      // Use double requestAnimationFrame to ensure CSS variables are updated before reading them
      // First frame: CSS variables are applied by useTheme.ts
      // Second frame: We read the updated CSS variables
      let frameId2: number;
      const frameId1 = requestAnimationFrame(() => {
        frameId2 = requestAnimationFrame(() => {
          if (!viewRef.current) return;

          // Reconfigure the editor with new theme (reads fresh CSS variables)
          const newHighlightStyle = createMarkdownHighlightStyle();
          const newCustomTheme = createCustomTheme();

          viewRef.current.dispatch({
            effects: [
              // Reconfigure syntax highlighting
              highlightCompartment.current.reconfigure(syntaxHighlighting(newHighlightStyle)),
              // Reconfigure theme
              themeCompartment.current.reconfigure(newCustomTheme),
            ]
          });
        });
      });

      return () => {
        cancelAnimationFrame(frameId1);
        if (frameId2) cancelAnimationFrame(frameId2);
      };
    }
  }, [currentTheme]);

  return (
    <div
      className="px-4 overflow-hidden"
      ref={editorRef}
      style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
    />
  );
};

export default NoteEditor;
