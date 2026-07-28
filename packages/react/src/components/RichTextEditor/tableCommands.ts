// execCommand has no table-editing commands at all, so every function here
// mutates the table's actual DOM structure directly instead.

const EMPTY_CELL_HTML = "<p><br></p>";

export function generateTableHtml(rows: number, columns: number): string {
  const cell = `<td>${EMPTY_CELL_HTML}</td>`;
  const row = `<tr>${cell.repeat(columns)}</tr>`;
  return `<table><tbody>${row.repeat(rows)}</tbody></table>`;
}

export function findEnclosingCell(node: Node | null): HTMLTableCellElement | null {
  let current: Node | null = node;
  while (current) {
    if (current.nodeType === 1) {
      const tag = (current as Element).tagName;
      if (tag === "TD" || tag === "TH") return current as HTMLTableCellElement;
    }
    current = current.parentNode;
  }
  return null;
}

export function findEnclosingTable(node: Node | null): HTMLTableElement | null {
  let current: Node | null = node;
  while (current) {
    if (current.nodeType === 1 && (current as Element).tagName === "TABLE") {
      return current as HTMLTableElement;
    }
    current = current.parentNode;
  }
  return null;
}

export function insertRow(table: HTMLTableElement, cell: HTMLTableCellElement, position: "above" | "below"): void {
  const row = cell.parentElement as HTMLTableRowElement;
  const columnCount = row.cells.length;
  const insertIndex = position === "above" ? row.rowIndex : row.rowIndex + 1;
  const newRow = table.insertRow(insertIndex);
  for (let i = 0; i < columnCount; i++) {
    newRow.insertCell().innerHTML = EMPTY_CELL_HTML;
  }
}

export function insertColumn(table: HTMLTableElement, cell: HTMLTableCellElement, position: "left" | "right"): void {
  const insertIndex = position === "left" ? cell.cellIndex : cell.cellIndex + 1;
  for (const row of Array.from(table.rows)) {
    row.insertCell(insertIndex).innerHTML = EMPTY_CELL_HTML;
  }
}

/** Returns true if the table was deleted (its last row was removed). */
export function deleteRow(table: HTMLTableElement, cell: HTMLTableCellElement): boolean {
  const row = cell.parentElement as HTMLTableRowElement;
  if (table.rows.length <= 1) {
    table.remove();
    return true;
  }
  table.deleteRow(row.rowIndex);
  return false;
}

/** Returns true if the table was deleted (its last column was removed). */
export function deleteColumn(table: HTMLTableElement, cell: HTMLTableCellElement): boolean {
  if ((table.rows[0]?.cells.length ?? 0) <= 1) {
    table.remove();
    return true;
  }
  const columnIndex = cell.cellIndex;
  for (const row of Array.from(table.rows)) {
    if (row.cells[columnIndex]) row.deleteCell(columnIndex);
  }
  return false;
}

export function deleteTable(table: HTMLTableElement): void {
  table.remove();
}
