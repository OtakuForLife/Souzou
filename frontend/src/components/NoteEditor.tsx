import React, { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, drawSelection, ViewPlugin, crosshairCursor, dropCursor, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, lineNumbers, rectangularSelection } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search"
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands"
import { foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldKeymap } from "@codemirror/language";
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete"
import { lintKeymap } from "@codemirror/lint"


const extensions = [
  // A line number gutter
  //lineNumbers(),
  // A gutter with code folding markers
  //foldGutter(),
  markdown(),
  // Replace non-printable characters with placeholders
  highlightSpecialChars(),
  // The undo history
  history(),
  // Replace native cursor/selection with our own
  drawSelection(),
  // Show a drop cursor when dragging over the editor
  dropCursor(),
  // Allow multiple cursors/selections
  EditorState.allowMultipleSelections.of(true),
  // Re-indent lines when typing specific input
  indentOnInput(),
  // Highlight syntax with a default style
  syntaxHighlighting(defaultHighlightStyle),
  // Highlight matching brackets near cursor
  bracketMatching(),
  // Automatically close brackets
  closeBrackets(),
  // Load the autocompletion system
  autocompletion(),
  // Allow alt-drag to select rectangular regions
  rectangularSelection(),
  // Change the cursor to a crosshair when holding alt
  crosshairCursor(),
  // Style the current line specially
  highlightActiveLine(),
  // Style the gutter for current line specially
  highlightActiveLineGutter(),
  // Highlight text that matches the selected text
  highlightSelectionMatches(),
  keymap.of([
    // Closed-brackets aware backspace
    ...closeBracketsKeymap,
    // A large set of basic bindings
    ...defaultKeymap,
    // Search-related keys
    ...searchKeymap,
    // Redo/undo keys
    ...historyKeymap,
    // Code folding bindings
    ...foldKeymap,
    // Autocompletion keys
    ...completionKeymap,
    // Keys related to the linter system
    ...lintKeymap
  ])
];

interface Props {
  initialText: string;
}


const NoteEditor: React.FC<Props> = ({ initialText }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    var caretColor = getComputedStyle(document.documentElement).getPropertyValue('--caret-color') || 'magenta';

    var customTheme = EditorView.theme({
      ".cm-cursor": {
        borderLeft: `2px solid ${caretColor.trim()}`,
        borderRight: "none",
        backgroundColor: "transparent",
      },
    });

    const state = EditorState.create({
      doc: initialText,
      extensions: [
        ...extensions,
        customTheme,
      ],
    });


    const view = new EditorView({
      state,
      parent: editorRef.current
    });

    return () => view.destroy();
  }, []);

  return (
    <div className="text-skin-primary" ref={editorRef} />
  );
};

export default NoteEditor;
