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

    // Get the current line where the cursor is
    const cursorLine = view.state.doc.lineAt(selection.head);

    tree.iterate({
      enter: (node) => {
        // Only hide syntax on lines where the cursor is NOT present
        const nodeStart = node.from;
        const nodeEnd = node.to;
        const nodeLine = view.state.doc.lineAt(nodeStart);

        // If cursor is on the same line as this node, don't hide anything
        if (cursorLine.number === nodeLine.number) {
          return;
        }

        // Hide various markdown syntax markers
        const syntaxNodes = [
          "HeaderMark",     // # ## ### etc.
          "EmphasisMark",   // * ** _ __
          "LinkMark",       // [ ] ( )
          "ListMark",       // - * +
          "CodeMark",       // ` ```
          "QuoteMark",      // >
        ];

        if (syntaxNodes.includes(node.name)) {
          decorations.push(
            Decoration.replace({}).range(nodeStart, nodeEnd)
          );
        }
      }
    });

    return Decoration.set(decorations);
  }
}, {
  decorations: v => v.decorations
});

export { hideMarkdownSyntax };