import { markdown } from "@codemirror/lang-markdown";
import {
    indentOnInput,
    bracketMatching,
    foldKeymap } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import {
    highlightSpecialChars,
    drawSelection,
    dropCursor,
    rectangularSelection,
    crosshairCursor,
    keymap,
    EditorView } from "@codemirror/view";
import {
    autocompletion,
    completionKeymap,
    closeBrackets,
    closeBracketsKeymap } from "@codemirror/autocomplete"
import { lintKeymap } from "@codemirror/lint"
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search"
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands"
import { checkboxPlugin } from "./checkboxExtension"
import { tablePlugin } from "./tableExtension"


const baseExtensions = [
  // A line number gutter
  //lineNumbers(),
  // A gutter with code folding markers
  //foldGutter(),
  markdown(),
  // Enable line wrapping for long text
  EditorView.lineWrapping,
  // Replace non-printable characters with placeholders
  highlightSpecialChars(),
  // The undo history
  history(),
  // Replace native cursor/selection with our own
  drawSelection(),
  // Show a drop cursor when dragging over the editor
  dropCursor(),
  // Allow multiple cursors/selections
  EditorState.allowMultipleSelections.of(false),
  // Re-indent lines when typing specific input
  indentOnInput(),
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
  //highlightActiveLine(),
  // Style the gutter for current line specially
  //highlightActiveLineGutter(),
  // Highlight text that matches the selected text
  highlightSelectionMatches(),
  // Obsidian-style checkbox live preview
  checkboxPlugin,
  // TanStack table rendering
  tablePlugin,
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
  ]),
];

export { baseExtensions };