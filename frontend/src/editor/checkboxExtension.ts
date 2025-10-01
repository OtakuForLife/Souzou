/**
 * Obsidian-style live preview checkbox extension for CodeMirror 6
 *
 * Features:
 * - Renders [ ] and [x] as interactive checkboxes
 * - Clicking checkboxes toggles their state
 * - Shows raw markdown syntax only when cursor is near the checkbox
 * - Applies strikethrough styling to checked items
 */

import {
    Decoration,
    DecorationSet,
    EditorView,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

// Widget for rendering interactive checkboxes
class CheckboxWidget extends WidgetType {
    constructor(
        readonly checked: boolean,
        readonly pos: number,
        readonly view: EditorView
    ) {
        super();
    }

    toDOM() {
        const wrapper = document.createElement("span");
        wrapper.className = "cm-checkbox-widget";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = this.checked;
        checkbox.tabIndex = -1; // Prevent tab focus
        
        // Handle checkbox toggle
        checkbox.addEventListener("mousedown", (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        checkbox.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleCheckbox();
        });

        wrapper.appendChild(checkbox);
        return wrapper;
    }

    private toggleCheckbox() {
        const doc = this.view.state.doc;
        const line = doc.lineAt(this.pos);
        const lineText = line.text;
        
        // Find the checkbox pattern in the line
        const checkboxMatch = lineText.match(/^(\s*[-*+]?\s*)\[([x\s])\]/);
        if (!checkboxMatch) return;

        const [, prefix, currentState] = checkboxMatch;
        const newState = currentState.trim() === 'x' ? ' ' : 'x';
        const newText = lineText.replace(/^(\s*[-*+]?\s*)\[([x\s])\]/, `${prefix}[${newState}]`);

        // Apply the change
        this.view.dispatch({
            changes: {
                from: line.from,
                to: line.to,
                insert: newText
            }
        });
    }

    eq(other: CheckboxWidget) {
        return other.checked === this.checked && other.pos === this.pos;
    }

    ignoreEvent(event: Event) {
        // Allow click events on the checkbox to be handled by our widget
        return event.type === "mousedown" || event.type === "click";
    }
}

// Plugin to handle checkbox rendering
const checkboxPlugin = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = this.buildDecorations(view);
        }

        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged || update.selectionSet) {
                this.decorations = this.buildDecorations(update.view);
            }
        }

        buildDecorations(view: EditorView) {
            const builder = new RangeSetBuilder<Decoration>();
            const doc = view.state.doc;
            const selection = view.state.selection.main;

            // Iterate through visible lines
            for (let pos = 0; pos < doc.length;) {
                const line = doc.lineAt(pos);
                const lineText = line.text;
                
                // Check if line contains a checkbox
                const checkboxMatch = lineText.match(/^(\s*[-*+]?\s*)\[([x\s])\](.*)$/);
                if (checkboxMatch) {
                    const [, prefix, state, rest] = checkboxMatch;
                    const isChecked = state.trim() === 'x';
                    const checkboxStart = line.from + prefix.length;
                    const checkboxEnd = checkboxStart + 3; // "[x]" or "[ ]"
                    
                    // Only show text mode if cursor is specifically within or immediately adjacent to the checkbox syntax
                    // AND the cursor is on the same line as the checkbox
                    const cursorOnSameLine = selection.from >= line.from && selection.from <= line.to;
                    const cursorNearCheckbox = cursorOnSameLine && (
                        (selection.from >= checkboxStart && selection.from <= checkboxEnd) ||
                        (selection.to >= checkboxStart && selection.to <= checkboxEnd) ||
                        (selection.from === checkboxStart - 1) ||
                        (selection.from === checkboxEnd)
                    );
                    
                    if (!cursorNearCheckbox) {
                        // Add widget decoration for the checkbox
                        builder.add(
                            checkboxStart,
                            checkboxStart,
                            Decoration.widget({
                                widget: new CheckboxWidget(isChecked, line.from, view),
                                side: 1,
                            })
                        );

                        // Hide the original markdown syntax
                        builder.add(
                            checkboxStart,
                            checkboxEnd,
                            Decoration.mark({
                                class: "cm-checkbox-hidden",
                            })
                        );

                        // If checked, style the rest of the line
                        if (isChecked && rest.trim()) {
                            const restStart = checkboxEnd;
                            const restEnd = line.to;
                            builder.add(
                                restStart,
                                restEnd,
                                Decoration.mark({
                                    class: "cm-checkbox-line-checked",
                                })
                            );
                        }
                    }
                }

                pos = line.to + 1;
            }

            return builder.finish();
        }
    },
    {
        decorations: (v) => v.decorations,
    }
);

export { checkboxPlugin };
