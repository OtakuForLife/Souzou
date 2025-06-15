/**
 * TanStack Table extension for CodeMirror 6
 *
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
// Interface for table data
interface TableData {
    [key: string]: string;
}

// Simple column definition interface
interface ColumnDef {
    accessorKey: string;
    header: string;
}

// Parse markdown table into structured data
function parseMarkdownTable(tableText: string): { columns: ColumnDef[], data: TableData[] } {
    const lines = tableText.trim().split('\n').filter(line => line.trim());

    if (lines.length < 3) {
        return { columns: [], data: [] };
    }

    // Parse header row
    const headerLine = lines[0];
    let headers = headerLine.split('|').map(cell => cell.trim());

    // Remove empty cells at start/end (common in markdown tables)
    if (headers[0] === '') headers = headers.slice(1);
    if (headers[headers.length - 1] === '') headers = headers.slice(0, -1);

    if (headers.length === 0) {
        return { columns: [], data: [] };
    }

    // Validate separator line (lines[1])
    const separatorLine = lines[1];
    const separators = separatorLine.split('|').map(cell => cell.trim());
    const validSeparator = separators.some(sep => sep.includes('-'));

    if (!validSeparator) {
        return { columns: [], data: [] };
    }

    // Parse data rows
    const dataRows = lines.slice(2).map(line => {
        let cells = line.split('|').map(cell => cell.trim());

        // Remove empty cells at start/end
        if (cells[0] === '') cells = cells.slice(1);
        if (cells[cells.length - 1] === '') cells = cells.slice(0, -1);

        const row: TableData = {};
        headers.forEach((header, index) => {
            row[header] = cells[index] || '';
        });
        return row;
    });

    // Create simple column definitions without TanStack Table complexity
    const columns = headers.map(header => ({
        accessorKey: header,
        header: header,
    }));

    return { columns, data: dataRows };
}

// Function to create HTML table from data
function createTableHTML(columns: ColumnDef[], data: TableData[]): string {
    const headers = columns.map(col => col.accessorKey);

    const headerRow = headers.map(header =>
        `<th class="cm-table-header" data-column="${header}">${header}</th>`
    ).join('');

    const dataRows = data.map((row, rowIndex) => {
        const cells = headers.map(header =>
            `<td class="cm-table-cell">${row[header] || ''}</td>`
        ).join('');
        return `<tr class="cm-table-row" data-row="${rowIndex}">${cells}</tr>`;
    }).join('');

    return `<div class="cm-table-widget"><table class="cm-table"><thead><tr>${headerRow}</tr></thead><tbody>${dataRows}</tbody></table></div>`;
}

// Widget for rendering interactive tables
class TableWidget extends WidgetType {
    private sortColumn: string | null = null;
    private sortDirection: 'asc' | 'desc' = 'asc';

    constructor(
        readonly tableText: string,
        readonly pos: number,
        readonly view: EditorView
    ) {
        super();
    }

    toDOM() {
        const wrapper = document.createElement("div");
        wrapper.className = "cm-table-widget-container";
        wrapper.style.cssText = "margin: 0; padding: 0; display: block; width: 100%; min-height: auto;";

        try {
            const { columns, data } = parseMarkdownTable(this.tableText);

            if (columns.length === 0) {
                wrapper.innerHTML = '<div class="cm-table-error">Invalid table format</div>';
                return wrapper;
            }

            // Create HTML table
            const tableHTML = createTableHTML(columns, data);
            wrapper.innerHTML = tableHTML;

            // Add click handlers for sorting
            this.addSortingHandlers(wrapper, columns, data);

            return wrapper;
        } catch (error) {
            console.error('Error rendering table widget:', error);
            wrapper.innerHTML = '<div class="cm-table-error">Error rendering table</div>';
            return wrapper;
        }
    }

    private addSortingHandlers(wrapper: HTMLElement, columns: ColumnDef[], data: TableData[]) {
        const headers = wrapper.querySelectorAll('.cm-table-header');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const columnName = header.getAttribute('data-column');
                if (!columnName) return;

                // Toggle sort direction
                if (this.sortColumn === columnName) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortColumn = columnName;
                    this.sortDirection = 'asc';
                }

                // Sort data
                const sortedData = [...data].sort((a, b) => {
                    const aVal = a[columnName] || '';
                    const bVal = b[columnName] || '';

                    // Try to parse as numbers
                    const aNum = parseFloat(aVal.replace(/[^0-9.-]/g, ''));
                    const bNum = parseFloat(bVal.replace(/[^0-9.-]/g, ''));

                    let comparison = 0;
                    if (!isNaN(aNum) && !isNaN(bNum)) {
                        comparison = aNum - bNum;
                    } else {
                        comparison = aVal.localeCompare(bVal);
                    }

                    return this.sortDirection === 'asc' ? comparison : -comparison;
                });

                // Update the table display
                this.updateTableDisplay(wrapper, columns, sortedData);

                // Update sort indicators
                this.updateSortIndicators(wrapper, columnName);
            });
        });
    }

    private updateTableDisplay(wrapper: HTMLElement, columns: ColumnDef[], data: TableData[]) {
        const tbody = wrapper.querySelector('tbody');
        if (!tbody) return;

        const headers = columns.map(col => col.accessorKey);
        const dataRows = data.map((row, rowIndex) => {
            const cells = headers.map(header =>
                `<td class="cm-table-cell">${row[header] || ''}</td>`
            ).join('');
            return `<tr class="cm-table-row" data-row="${rowIndex}">${cells}</tr>`;
        }).join('');

        tbody.innerHTML = dataRows;
    }

    private updateSortIndicators(wrapper: HTMLElement, activeColumn: string) {
        const headers = wrapper.querySelectorAll('.cm-table-header');
        headers.forEach(header => {
            const columnName = header.getAttribute('data-column');
            const indicator = header.querySelector('.sort-indicator');

            if (indicator) {
                indicator.remove();
            }

            if (columnName === activeColumn) {
                const sortIndicator = document.createElement('span');
                sortIndicator.className = 'sort-indicator';
                sortIndicator.textContent = this.sortDirection === 'asc' ? ' ↑' : ' ↓';
                header.appendChild(sortIndicator);
            }
        });
    }

    eq(other: TableWidget) {
        return other.tableText === this.tableText && other.pos === this.pos;
    }
}



// Plugin to handle table rendering
const tablePlugin = ViewPlugin.fromClass(
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

            // Iterate through lines to find tables
            for (let pos = 0; pos < doc.length;) {
                const line = doc.lineAt(pos);
                const lineText = line.text;

                // Check if this line starts a table
                if (lineText.includes('|') && lineText.trim().length > 0) {
                    const tableResult = this.findTableAtPosition(doc, line.from);

                    if (tableResult) {
                        const { start, end, content } = tableResult;

                        // Check if cursor is within the table
                        const cursorInTable = (
                            (selection.from >= start && selection.from <= end) ||
                            (selection.to >= start && selection.to <= end)
                        );

                        // Only render as widget if cursor is not in the table
                        if (!cursorInTable) {
                            try {
                                // Add widget decoration for the table
                                builder.add(
                                    start,
                                    start,
                                    Decoration.widget({
                                        widget: new TableWidget(content, start, view),
                                        side: 1,
                                    })
                                );

                                // Hide the original markdown syntax
                                builder.add(
                                    start,
                                    end,
                                    Decoration.mark({
                                        class: "cm-table-hidden",
                                    })
                                );
                            } catch (error) {
                                console.warn('Error creating table decoration:', error);
                            }
                        }

                        // Skip to end of table
                        pos = end + 1;
                        continue;
                    }
                }

                pos = line.to + 1;
            }

            return builder.finish();
        }

        findTableAtPosition(doc: any, startPos: number): { start: number; end: number; content: string } | null {
            const startLine = doc.lineAt(startPos);
            let currentLine = startLine;
            const tableLines: string[] = [];
            let endPos = startLine.to;

            // Collect table lines
            while (currentLine.to <= doc.length) {
                const lineText = currentLine.text;

                if (lineText.includes('|') && lineText.trim().length > 0) {
                    tableLines.push(lineText);
                    endPos = currentLine.to;
                } else {
                    break;
                }

                if (currentLine.to >= doc.length) break;
                try {
                    currentLine = doc.lineAt(currentLine.to + 1);
                } catch {
                    break;
                }
            }

            // Validate table (need at least 3 lines: header, separator, data)
            if (tableLines.length < 3) {
                return null;
            }

            // Check if second line is a separator
            const separatorLine = tableLines[1];
            const hasSeparator = separatorLine.split('|').some(cell =>
                cell.trim().includes('-') || cell.trim().includes(':')
            );

            if (!hasSeparator) {
                return null;
            }

            const content = tableLines.join('\n');

            return {
                start: startLine.from,
                end: endPos,
                content: content
            };
        }
    },
    {
        decorations: (v) => v.decorations,
    }
);

export { tablePlugin };
