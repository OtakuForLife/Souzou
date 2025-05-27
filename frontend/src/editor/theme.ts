import { HighlightStyle } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";


// Get CSS variables for theming
const computedStyle = getComputedStyle(document.documentElement);
const editorBackground = computedStyle.getPropertyValue('--color-editor-background').trim() || '#111827';
const editorText = computedStyle.getPropertyValue('--color-editor-text').trim() || '#adadad';
const editorSelection = computedStyle.getPropertyValue('--color-editor-selection').trim() || '#3b82f620';
const editorCursor = computedStyle.getPropertyValue('--color-editor-cursor').trim() || '#3b82f6';
const syntaxKeyword = computedStyle.getPropertyValue('--color-editor-syntax-keyword').trim() || '#a78bfa';
const syntaxString = computedStyle.getPropertyValue('--color-editor-syntax-string').trim() || '#34d399';
const syntaxComment = computedStyle.getPropertyValue('--color-editor-syntax-comment').trim() || '#6b7280';
const syntaxFunction = computedStyle.getPropertyValue('--color-editor-syntax-function').trim() || '#f87171';

// Create custom highlight style for markdown
const markdownHighlightStyle = HighlightStyle.define([
    // Headings
    { tag: t.heading1, fontSize: "2em", fontWeight: "bold", color: editorText, lineHeight: "1.2" },
    { tag: t.heading2, fontSize: "1.5em", fontWeight: "bold", color: editorText, lineHeight: "1.3" },
    { tag: t.heading3, fontSize: "1.25em", fontWeight: "bold", color: editorText, lineHeight: "1.4" },
    { tag: t.heading4, fontSize: "1.1em", fontWeight: "bold", color: editorText, lineHeight: "1.4" },
    { tag: t.heading5, fontSize: "1em", fontWeight: "bold", color: editorText, lineHeight: "1.5" },
    { tag: t.heading6, fontSize: "0.9em", fontWeight: "bold", color: editorText, lineHeight: "1.5" },

    // Text formatting
    { tag: t.strong, fontWeight: "bold" },
    { tag: t.emphasis, fontStyle: "italic" },
    { tag: t.strikethrough, textDecoration: "line-through", color: syntaxComment },

    // Code
    {
        tag: t.monospace,
        fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
        backgroundColor: `${editorText}15`,
        padding: "2px 4px",
        borderRadius: "3px",
        fontSize: "0.9em"
    },

    // Links
    { tag: t.link, color: syntaxFunction, textDecoration: "underline" },
    { tag: t.url, color: syntaxString },

    // Lists
    { tag: t.list, color: syntaxKeyword },

    // Quotes
    {
        tag: t.quote,
        color: syntaxComment,
        fontStyle: "italic",
        borderLeft: `4px solid ${syntaxComment}`,
        paddingLeft: "12px",
        marginLeft: "4px"
    },

    // Code blocks
    {
        tag: t.contentSeparator,
        backgroundColor: `${editorText}10`,
        padding: "8px 12px",
        borderRadius: "4px",
        fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
        fontSize: "0.9em"
    },

    // Syntax highlighting
    { tag: t.keyword, color: syntaxKeyword },
    { tag: t.string, color: syntaxString },
    { tag: t.comment, color: syntaxComment },
    { tag: t.function(t.variableName), color: syntaxFunction },
    { tag: t.variableName, color: editorText },

    // Markdown syntax characters (make them less prominent)
    { tag: t.processingInstruction, color: syntaxComment, opacity: "0.7" },
    { tag: t.punctuation, color: syntaxComment, opacity: "0.7" },
]);

var customTheme = EditorView.theme({
    // Basic editor styling
    "&": {
        color: editorText,
        backgroundColor: editorBackground,
    },
    ".cm-content": {
        padding: "16px",
        caretColor: editorCursor,
        fontSize: "14px",
        lineHeight: "1.6",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    ".cm-focused": {
        outline: "none",
    },
    ".cm-editor": {
        fontSize: "14px",
    },
    ".cm-cursor": {
        borderLeft: `2px solid ${editorCursor}`,
        borderRight: "none",
        backgroundColor: "transparent",
    },
    ".cm-selectionBackground": {
        backgroundColor: editorSelection,
    },

    // Markdown-specific styling
    ".cm-line": {
        lineHeight: "1.6",
    },
});

export { markdownHighlightStyle, customTheme };