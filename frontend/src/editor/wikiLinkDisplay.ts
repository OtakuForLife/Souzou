/**
 * CodeMirror 6 extension for displaying wiki-style links with note titles instead of IDs
 */

import { ViewPlugin, DecorationSet, EditorView, ViewUpdate, Decoration, WidgetType } from "@codemirror/view";
import { Entity } from "@/models/Entity";
import { linkParsingService } from "@/services/linkParsingService";

/**
 * Widget that displays note title instead of note ID in wiki links
 */
class WikiLinkWidget extends WidgetType {
  constructor(
    private noteTitle: string,
    private noteId: string,
    private isValid: boolean,
    private onLinkClick?: (noteId: string) => void
  ) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = this.isValid
      ? "cm-note-link cm-note-link-valid"
      : "cm-note-link cm-note-link-invalid";
    span.textContent = this.noteTitle;
    span.setAttribute("data-note-id", this.noteId);
    span.setAttribute("title", this.isValid ? `Link to: ${this.noteTitle}` : `Broken link: ${this.noteId}`);

    // Add click handler for valid links
    if (this.isValid && this.onLinkClick) {
      span.style.cursor = "pointer";
      span.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.onLinkClick!(this.noteId);
      });
    }

    return span;
  }

  eq(other: WikiLinkWidget) {
    return this.noteTitle === other.noteTitle &&
           this.noteId === other.noteId &&
           this.isValid === other.isValid;
  }
}

/**
 * Create wiki link display extension
 */
export function createWikiLinkDisplay(
  getNotesData: () => Record<string, Entity>,
  onLinkClick?: (noteId: string) => void
) {
  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const decorations: any[] = [];
      const content = view.state.doc.toString();
      const selection = view.state.selection.main;

      // Get the current line where the cursor is
      const cursorLine = view.state.doc.lineAt(selection.head);

      // Get current notes data
      const allNotes = getNotesData();

      // Parse all wiki links in the content
      const { links, brokenLinks } = linkParsingService.parseLinks(content, allNotes);
      
      // Only process wiki-style links
      const wikiLinks = [...links, ...brokenLinks].filter(link => link.type === 'wiki');

      wikiLinks.forEach(link => {
        const linkLine = view.state.doc.lineAt(link.from);

        // Only replace links on lines where cursor is NOT present
        if (cursorLine.number !== linkLine.number) {
          // All wiki links are now ID-based, so replace with title display
          const linkContent = content.slice(link.from + 2, link.to - 2); // Remove [[ and ]]
          const noteTitle = link.isValid ? link.displayText : `Unknown Note (${linkContent})`;
          // Use the resolved target note ID for click handling, fallback to linkContent for broken links
          const targetNoteId = link.targetNoteId || linkContent;

          decorations.push(
            Decoration.replace({
              widget: new WikiLinkWidget(noteTitle, targetNoteId, link.isValid, onLinkClick)
            }).range(link.from, link.to)
          );
        }
      });

      return Decoration.set(decorations);
    }
  }, {
    decorations: v => v.decorations
  });
}
