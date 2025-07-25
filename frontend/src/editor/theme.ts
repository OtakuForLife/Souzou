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
const syntaxLink = computedStyle.getPropertyValue('--color-editor-syntax-link').trim() || '#3746e7';

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
    { tag: t.link, color: syntaxLink, textDecoration: "underline" },
    { tag: t.url, color: syntaxFunction },

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
        overflowX: "hidden", // Prevent horizontal scrolling
    },
    ".cm-content": {
        padding: "0",
        caretColor: editorCursor,
        fontSize: "14px",
        lineHeight: "1.6",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        whiteSpace: "pre-wrap", // Enable text wrapping
        wordWrap: "break-word", // Break long words if necessary
        overflowWrap: "break-word", // Modern CSS property for word breaking
    },
    ".cm-focused": {
        outline: "none",
    },
    ".cm-editor": {
        fontSize: "14px",
        overflowX: "hidden", // Prevent horizontal scrolling on editor
    },
    ".cm-scroller": {
        overflowX: "hidden", // Prevent horizontal scrolling on scroller
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
        padding: "0 0 0 0",
        lineHeight: "1.6",
        whiteSpace: "pre-wrap", // Ensure line wrapping
        wordWrap: "break-word", // Break long words
    },

    // Note link styling
    ".cm-note-link": {
        textDecoration: "underline",
        cursor: "pointer",
        borderRadius: "2px",
        padding: "1px 2px",
        transition: "all 0.2s ease",
    },

    ".cm-note-link-valid": {
        color: "#0066cc",
        backgroundColor: "rgba(0, 102, 204, 0.05)",
    },

    ".cm-note-link-valid:hover, .cm-note-link-valid.cm-note-link-hover": {
        backgroundColor: "rgba(0, 102, 204, 0.15)",
        textDecoration: "underline",
    },

    ".cm-note-link-invalid": {
        color: "#cc6600",
        backgroundColor: "rgba(204, 102, 0, 0.05)",
        textDecoration: "underline",
        textDecorationStyle: "wavy",
    },

    ".cm-note-link-invalid:hover": {
        backgroundColor: "rgba(204, 102, 0, 0.15)",
    },

    ".cm-note-link-broken": {
        color: "#cc6600",
        backgroundColor: "rgba(204, 102, 0, 0.05)",
        textDecoration: "underline wavy",
    },

    ".cm-note-link-broken:hover, .cm-note-link-broken.cm-note-link-hover": {
        backgroundColor: "rgba(204, 102, 0, 0.15)",
    },

    // External link styling
    ".cm-external-link": {
        textDecoration: "underline",
        cursor: "pointer",
        borderRadius: "2px",
        padding: "1px 2px",
        transition: "all 0.2s ease",
    },

    ".cm-external-link-valid": {
        color: "#0066cc",
        backgroundColor: "rgba(0, 102, 204, 0.05)",
    },

    ".cm-external-link-valid:hover, .cm-external-link-valid.cm-external-link-hover": {
        backgroundColor: "rgba(0, 102, 204, 0.15)",
        textDecoration: "underline",
    },

    ".cm-external-link-valid::after": {
        content: '"↗"',
        fontSize: "0.8em",
        marginLeft: "2px",
        opacity: "0.6",
        display: "inline",
    },

    // Wiki link syntax styling (for raw [[noteID]] text)
    ".cm-wiki-link-syntax": {
        color: syntaxComment,
        opacity: "0.7",
        fontStyle: "italic",
    },

    // Autocompletion popup styling
    ".cm-tooltip-autocomplete": {
        backgroundColor: editorBackground,
        border: `1px solid ${editorText}30`,
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        fontSize: "13px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        maxHeight: "200px",
        minWidth: "200px",
    },

    ".cm-tooltip-autocomplete > ul": {
        margin: "0",
        padding: "4px",
        listStyle: "none",
        maxHeight: "180px",
        overflowY: "auto",
    },

    ".cm-tooltip-autocomplete > ul > li": {
        padding: "6px 8px",
        borderRadius: "4px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "background-color 0.15s ease",
    },

    ".cm-tooltip-autocomplete > ul > li:hover": {
        backgroundColor: `${editorText}15`,
    },

    ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
        backgroundColor: `${syntaxKeyword}20`,
        color: editorText,
    },

    ".cm-tooltip-autocomplete .cm-completionLabel": {
        color: editorText,
        fontWeight: "500",
        flex: "1",
    },

    ".cm-tooltip-autocomplete .cm-completionDetail": {
        color: syntaxComment,
        fontSize: "11px",
        fontStyle: "italic",
        marginLeft: "8px",
    },

    ".cm-tooltip-autocomplete .cm-completionInfo": {
        backgroundColor: `${editorBackground}f0`,
        border: `1px solid ${editorText}20`,
        borderRadius: "6px",
        padding: "8px",
        fontSize: "12px",
        color: syntaxComment,
        maxWidth: "250px",
    },

    // Custom styling for note link suggestions
    ".cm-tooltip-autocomplete .cm-completionLabel[data-type='note']": {
        color: syntaxFunction,
    },

    ".cm-tooltip-autocomplete .cm-completionLabel[data-type='note-id']": {
        color: syntaxString,
    },

    // Checkbox styling for live preview
    ".cm-checkbox-widget": {
        display: "inline-block",
        verticalAlign: "middle",
        marginRight: "6px",
        cursor: "pointer",
        position: "relative",
        top: "-1px",
    },

    ".cm-checkbox-widget input[type='checkbox']": {
        width: "16px",
        height: "16px",
        margin: "0",
        cursor: "pointer",
        appearance: "none",
        border: `2px solid ${syntaxComment}`,
        borderRadius: "3px",
        backgroundColor: "transparent",
        transition: "all 0.15s ease",
    },

    ".cm-checkbox-widget input[type='checkbox']:checked": {
        backgroundColor: syntaxKeyword,
        borderColor: syntaxKeyword,
    },

    ".cm-checkbox-widget input[type='checkbox']:checked::before": {
        content: "✓",
        position: "absolute",
        left: "2px",
        top: "-1px",
        fontSize: "11px",
        color: editorBackground,
        fontWeight: "bold",
    },

    ".cm-checkbox-widget input[type='checkbox']:hover": {
        borderColor: syntaxKeyword,
        transform: "scale(1.05)",
    },

    // Hide the markdown checkbox syntax when rendered as widget
    ".cm-checkbox-hidden": {
        display: "none",
    },

    // Style for the checkbox line when checked
    ".cm-checkbox-line-checked": {
        textDecoration: "line-through",
        opacity: "0.6",
        color: syntaxComment,
    },
});

export { markdownHighlightStyle, customTheme };