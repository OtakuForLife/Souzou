/**
 * CodeMirror 6 extension for styling wiki link syntax [[noteID]]
 */

import { ViewPlugin, DecorationSet, EditorView, ViewUpdate, Decoration } from "@codemirror/view";
import { Entity } from "@/models/Entity";
import { linkParsingService } from "@/services/linkParsingService";

/**
 * Create wiki link syntax styling extension
 */
export function createWikiLinkSyntax(
  getNotesData: () => Record<string, Entity>
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

        // Only style links on lines where cursor IS present (opposite of wikiLinkDisplay)
        if (cursorLine.number === linkLine.number) {
          // Style the entire wiki link with comment style
          decorations.push(
            Decoration.mark({
              class: "cm-wiki-link-syntax"
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
