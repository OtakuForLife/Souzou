/**
 * CodeMirror 6 extension for decorating and handling note links
 */

import { ViewPlugin, DecorationSet, EditorView, ViewUpdate, Decoration } from "@codemirror/view";
import { Entity } from "@/models/Entity";
import { linkParsingService } from "@/services/linkParsingService";

/**
 * Create link decorations extension
 */
export function createLinkDecorations(
  getNotesData: () => Record<string, Entity>,
  onLinkClick: (noteId: string) => void
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

      // Get current notes data
      const allNotes = getNotesData();

      // Parse all links in the content
      const { links, brokenLinks } = linkParsingService.parseLinks(content, allNotes);

      // Decorate valid links
      links.forEach(link => {
        decorations.push(
          Decoration.mark({
            class: "cm-note-link cm-note-link-valid",
            attributes: {
              title: `Link to: ${linkParsingService.resolveNoteTitle(link.targetNoteId!, allNotes)}`,
              "data-note-id": link.targetNoteId || "",
              "data-link-type": link.type
            }
          }).range(link.from, link.to)
        );
      });

      // Decorate broken links
      brokenLinks.forEach(link => {
        decorations.push(
          Decoration.mark({
            class: "cm-note-link cm-note-link-broken",
            attributes: {
              title: `Broken link: ${link.targetIdentifier}`,
              "data-target-identifier": link.targetIdentifier,
              "data-link-type": link.type
            }
          }).range(link.from, link.to)
        );
      });

      return Decoration.set(decorations);
    }
  }, {
    decorations: v => v.decorations,
    eventHandlers: {
      click: (event) => {
        const target = event.target as HTMLElement;

        // Check if clicked element or its parent is a note link
        const linkElement = target.closest('.cm-note-link');
        if (!linkElement) return false;

        const noteId = linkElement.getAttribute('data-note-id');

        // Only handle valid links with note IDs
        if (noteId && linkElement.classList.contains('cm-note-link-valid')) {
          onLinkClick(noteId);
          event.preventDefault();
          return true;
        }

        return false;
      },

      // Add hover effect for better UX
      mouseover: (event) => {
        const target = event.target as HTMLElement;
        const linkElement = target.closest('.cm-note-link');

        if (linkElement) {
          linkElement.classList.add('cm-note-link-hover');
        }

        return false;
      },

      mouseout: (event) => {
        const target = event.target as HTMLElement;
        const linkElement = target.closest('.cm-note-link');

        if (linkElement) {
          linkElement.classList.remove('cm-note-link-hover');
        }

        return false;
      }
    }
  });
}

/**
 * Create a simpler version that only handles click events without decorations
 * Useful if you want to handle styling via CSS only
 */
export function createLinkClickHandler(
  getNotesData: () => Record<string, Entity>,
  onLinkClick: (noteId: string) => void
) {
  return ViewPlugin.fromClass(class {
    constructor(_view: EditorView) {}

    update(_update: ViewUpdate) {}
  }, {
    eventHandlers: {
      click: (event, view) => {
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos === null) return false;

        const content = view.state.doc.toString();
        const allNotes = getNotesData();
        const { links } = linkParsingService.parseLinks(content, allNotes);

        // Find if click position is within any link
        const clickedLink = links.find(link => pos >= link.from && pos <= link.to);

        if (clickedLink && clickedLink.targetNoteId) {
          onLinkClick(clickedLink.targetNoteId);
          event.preventDefault();
          return true;
        }

        return false;
      }
    }
  });
}
