/**
 * CodeMirror 6 extension for decorating and handling note links
 */

import { ViewPlugin, DecorationSet, EditorView, ViewUpdate, Decoration, WidgetType } from "@codemirror/view";
import { Entity } from "@/models/Entity";
import { linkParsingService } from "@/services/linkParsingService";

/**
 * Widget that displays external links with proper styling and indicator
 */
class ExternalLinkWidget extends WidgetType {
  constructor(
    private displayText: string,
    private externalUrl: string
  ) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-external-link cm-external-link-valid";
    span.textContent = this.displayText;
    span.setAttribute("data-external-url", this.externalUrl);
    span.setAttribute("title", `External link: ${this.externalUrl}`);
    span.style.cursor = "pointer";

    // Add click handler
    span.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      window.open(this.externalUrl, '_blank', 'noopener,noreferrer');
    });

    return span;
  }

  eq(other: ExternalLinkWidget) {
    return this.displayText === other.displayText &&
           this.externalUrl === other.externalUrl;
  }
}

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
      const selection = view.state.selection.main;

      // Get the current line where the cursor is
      const cursorLine = view.state.doc.lineAt(selection.head);

      // Get current notes data
      const allNotes = getNotesData();

      // Parse all links in the content
      const { links, brokenLinks } = linkParsingService.parseLinks(content, allNotes);

      // Decorate valid links (exclude wiki links as they are handled by wikiLinkDisplay)
      links.filter(link => link.type !== 'wiki').forEach(link => {
        const isExternal = link.type === 'external';

        if (isExternal && link.externalUrl) {
          // Check if cursor is on the same line as this external link
          const linkLine = view.state.doc.lineAt(link.from);

          // Only replace with widget if cursor is NOT on the same line
          if (cursorLine.number !== linkLine.number) {
            decorations.push(
              Decoration.replace({
                widget: new ExternalLinkWidget(link.displayText, link.externalUrl)
              }).range(link.from, link.to)
            );
          } else {
            // When cursor is on the same line, just apply styling without replacing
            decorations.push(
              Decoration.mark({
                class: "cm-external-link cm-external-link-valid",
                attributes: {
                  title: `External link: ${link.externalUrl}`,
                  "data-external-url": link.externalUrl,
                  "data-link-type": link.type
                }
              }).range(link.from, link.to)
            );
          }
        } else {
          // Use mark decoration for internal links
          const className = "cm-note-link cm-note-link-valid";
          const title = `Link to: ${linkParsingService.resolveNoteTitle(link.targetNoteId!, allNotes)}`;

          decorations.push(
            Decoration.mark({
              class: className,
              attributes: {
                title,
                "data-note-id": link.targetNoteId || "",
                "data-link-type": link.type
              }
            }).range(link.from, link.to)
          );
        }
      });

      // Decorate broken links (exclude wiki links as they are handled by wikiLinkDisplay)
      brokenLinks.filter(link => link.type !== 'wiki').forEach(link => {
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

        // Check if clicked element or its parent is a note link or external link
        const noteLinkElement = target.closest('.cm-note-link');
        const externalLinkElement = target.closest('.cm-external-link');

        if (externalLinkElement) {
          const externalUrl = externalLinkElement.getAttribute('data-external-url');
          if (externalUrl && externalLinkElement.classList.contains('cm-external-link-valid')) {
            window.open(externalUrl, '_blank', 'noopener,noreferrer');
            event.preventDefault();
            return true;
          }
        } else if (noteLinkElement) {
          const noteId = noteLinkElement.getAttribute('data-note-id');
          if (noteId && noteLinkElement.classList.contains('cm-note-link-valid')) {
            onLinkClick(noteId);
            event.preventDefault();
            return true;
          }
        }

        return false;
      },

      // Add hover effect for better UX
      mouseover: (event) => {
        const target = event.target as HTMLElement;
        const noteLinkElement = target.closest('.cm-note-link');
        const externalLinkElement = target.closest('.cm-external-link');

        if (noteLinkElement) {
          noteLinkElement.classList.add('cm-note-link-hover');
        } else if (externalLinkElement) {
          externalLinkElement.classList.add('cm-external-link-hover');
        }

        return false;
      },

      mouseout: (event) => {
        const target = event.target as HTMLElement;
        const noteLinkElement = target.closest('.cm-note-link');
        const externalLinkElement = target.closest('.cm-external-link');

        if (noteLinkElement) {
          noteLinkElement.classList.remove('cm-note-link-hover');
        } else if (externalLinkElement) {
          externalLinkElement.classList.remove('cm-external-link-hover');
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

        // Find if click position is within any link (exclude wiki links as they're handled by widgets)
        const clickedLink = links.find(link =>
          link.type !== 'wiki' && pos >= link.from && pos <= link.to
        );

        if (clickedLink) {
          if (clickedLink.type === 'external' && clickedLink.externalUrl) {
            // Open external link in new tab
            window.open(clickedLink.externalUrl, '_blank', 'noopener,noreferrer');
            event.preventDefault();
            return true;
          } else if (clickedLink.targetNoteId) {
            // Handle internal note link
            onLinkClick(clickedLink.targetNoteId);
            event.preventDefault();
            return true;
          }
        }

        return false;
      }
    }
  });
}
