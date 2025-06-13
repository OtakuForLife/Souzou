import { syntaxTree } from "@codemirror/language";
import { ViewPlugin, DecorationSet, EditorView, ViewUpdate, Decoration } from "@codemirror/view";


const hideMarkdownSyntax = ViewPlugin.fromClass(class {
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
    const tree = syntaxTree(view.state);
    const selection = view.state.selection.main;
    const doc = view.state.doc;

    // Get the current line where the cursor is
    const cursorLine = doc.lineAt(selection.head);

    tree.iterate({
      enter: (node) => {
        // Only hide syntax on lines where the cursor is NOT present
        const nodeStart = node.from;
        const nodeLine = doc.lineAt(nodeStart);

        // If cursor is on the same line as this node, don't hide anything
        if (cursorLine.number === nodeLine.number) {
          return;
        }

        // Apply different syntax hiding functions
        this.hideBasicMarkdownSyntax(node, decorations);
        this.hideHeaderSyntax(node, decorations, doc);
        this.hideWikiLinkBrackets(node, decorations, doc);
      }
    });

    return Decoration.set(decorations);
  }

  // Hide basic markdown syntax markers (emphasis, lists, code, quotes)
  private hideBasicMarkdownSyntax(node: any, decorations: any[]) {
    const basicSyntaxNodes = [
      "EmphasisMark",   // * ** _ __
      "ListMark",       // - * +
      "CodeMark",       // ` ```
      "QuoteMark",      // >
    ];

    if (basicSyntaxNodes.includes(node.name)) {
      decorations.push(
        Decoration.replace({}).range(node.from, node.to)
      );
    }
  }

  // Hide header syntax (# symbols and following space)
  private hideHeaderSyntax(node: any, decorations: any[], doc: any) {
    if (node.name === "HeaderMark") {
      // Hide the header mark itself
      decorations.push(
        Decoration.replace({}).range(node.from, node.to)
      );

      // Also hide the space that follows
      const nextChar = doc.sliceString(node.to, node.to + 1);
      if (nextChar === " ") {
        decorations.push(
          Decoration.replace({}).range(node.to, node.to + 1)
        );
      }
    }
  }

  // Hide standard markdown link brackets [ ] ( )
  private hideWikiLinkBrackets(node: any, decorations: any[], doc: any) {
    // Hide LinkMark nodes (standard markdown links only)
    // Wiki links are now handled entirely by wikiLinkDisplay extension
    if (node.name === "LinkMark") {
      // Only hide if it's not part of a wiki link (which starts with [[)
      const lineText = doc.lineAt(node.from).text;
      const isPartOfWikiLink = lineText.includes('[[') && lineText.includes(']]');

      if (!isPartOfWikiLink) {
        decorations.push(
          Decoration.replace({}).range(node.from, node.to)
        );
      }
    }

    // Hide individual bracket characters for non-wiki links
    const nodeText = doc.sliceString(node.from, node.to);
    if ((nodeText === "[" || nodeText === "]") && node.name !== "HeaderMark") {
      // Check if this bracket is part of a wiki link
      const lineText = doc.lineAt(node.from).text;
      const isPartOfWikiLink = lineText.includes('[[') && lineText.includes(']]');

      if (!isPartOfWikiLink) {
        decorations.push(
          Decoration.replace({}).range(node.from, node.to)
        );
      }
    }
  }
}, {
  decorations: v => v.decorations
});

export { hideMarkdownSyntax };