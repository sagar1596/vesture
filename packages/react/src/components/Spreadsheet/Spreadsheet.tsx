import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, ReactElement, ReactNode } from "react";
import { evaluateGrid, indexToCol, type CellValue, type SheetFunction } from "./spreadsheet-formula";

export type { SheetFunction, CellValue } from "./spreadsheet-formula";
import {
  cell as cellClass,
  colHeader,
  cornerCell,
  editor,
  formulaBar,
  formulaText,
  nameBox,
  root,
  rowHeader,
  scroller,
  table
} from "./Spreadsheet.css";

export interface SpreadsheetProps {
  /** Raw cell text, `value[row][col]`. A string starting with `=` is a formula. */
  value?: string[][];
  defaultValue?: string[][];
  onChange?: (value: string[][]) => void;
  /** Grid size; defaults to the data's size (min 10x6). Rows/cols beyond the data are empty cells. */
  rows?: number;
  columns?: number;
  /** Default column width in px. */
  columnWidth?: number;
  /** Per-column widths in px; missing entries use `columnWidth`. */
  columnWidths?: number[];
  rowHeight?: number;
  /** Caps the grid's height (px or CSS length); it scrolls beyond that. */
  maxHeight?: number | string;
  /** Labels replacing A, B, C... in the header row (the cell names in the formula bar stay A1-style). */
  columnHeaders?: string[];
  showHeaders?: boolean;
  showFormulaBar?: boolean;
  /** Blocks all editing. */
  readOnly?: boolean;
  /** Blocks editing for specific cells (e.g. locked headers or computed columns). */
  isCellEditable?: (pos: CellPosition) => boolean;
  /** Extra formula functions, e.g. `{ TAX: ([n]) => n * 0.2 }`. Names are case-insensitive. */
  functions?: Record<string, SheetFunction>;
  /** Display text for a computed value (currency, percent, dates...). Editing still shows the raw text. */
  formatCell?: (value: CellValue, pos: CellPosition) => string;
  /** Replaces a cell's content entirely. Return `undefined` to keep the default. */
  renderCell?: (info: { value: CellValue; raw: string; pos: CellPosition; isActive: boolean }) => ReactNode;
  /** Inline style per cell, for conditional formatting. */
  getCellStyle?: (value: CellValue, pos: CellPosition) => CSSProperties | undefined;
  getCellClassName?: (value: CellValue, pos: CellPosition) => string | undefined;
  onActiveCellChange?: (pos: CellPosition) => void;
  className?: string;
}

export interface CellPosition {
  row: number;
  col: number;
}

interface Pos {
  row: number;
  col: number;
}

/**
 * Editable grid with formulas (`+ - * /`, parentheses, cell refs like `B3`, ranges like `A1:A5`,
 * and SUM / AVERAGE / MIN / MAX / COUNT). Controlled/uncontrolled via `value` / `defaultValue` /
 * `onChange`. Keyboard: arrows move, Enter/F2/typing edit, Tab/Enter commit, Escape cancels,
 * Delete clears.
 */
export function Spreadsheet({
  value: controlledValue,
  defaultValue = [],
  onChange,
  rows: rowsProp,
  columns: columnsProp,
  columnWidth = 110,
  columnWidths,
  rowHeight,
  maxHeight,
  columnHeaders,
  showHeaders = true,
  showFormulaBar = true,
  readOnly = false,
  isCellEditable,
  functions,
  formatCell,
  renderCell,
  getCellStyle,
  getCellClassName,
  onActiveCellChange,
  className
}: SpreadsheetProps): ReactElement {
  const [uncontrolledValue, setUncontrolledValue] = useState<string[][]>(defaultValue);
  const raw = controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const rowCount = Math.max(rowsProp ?? 0, raw.length, 10);
  const colCount = Math.max(columnsProp ?? 0, ...raw.map((r) => r.length), 6);

  // Pad to the full rectangle so evaluation and editing never hit holes.
  const grid = useMemo(
    () => Array.from({ length: rowCount }, (_, r) => Array.from({ length: colCount }, (_, c) => raw[r]?.[c] ?? "")),
    [raw, rowCount, colCount]
  );
  const computed = useMemo(() => evaluateGrid(grid, functions), [grid, functions]);

  const [active, setActive] = useState<Pos>({ row: 0, col: 0 });
  const [editing, setEditing] = useState<string | null>(null);
  const cellRefs = useRef(new Map<string, HTMLTableCellElement>());
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingFocus = useRef(false);
  // Mirrors `editing` synchronously: finishing an edit moves focus, which fires the input's blur
  // before React re-renders, and that blur must not commit (or re-commit after Escape) stale text.
  const editingRef = useRef<string | null>(null);
  const setEditingText = (text: string | null) => {
    editingRef.current = text;
    setEditing(text);
  };

  const key = (p: Pos) => `${p.row}:${p.col}`;

  useEffect(() => {
    onActiveCellChange?.(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- notify on position change only, not on a new callback identity
  }, [active.row, active.col]);

  useEffect(() => {
    if (editing !== null) inputRef.current?.focus();
    else if (pendingFocus.current) {
      pendingFocus.current = false;
      cellRefs.current.get(key(active))?.focus();
    }
  }, [editing, active]);

  const canEdit = (pos: Pos) => !readOnly && (isCellEditable?.(pos) ?? true);
  const widthOf = (c: number) => columnWidths?.[c] ?? columnWidth;
  const totalWidth = (showHeaders ? 44 : 0) + Array.from({ length: colCount }, (_, c) => widthOf(c)).reduce((a, b) => a + b, 0);

  const commit = (pos: Pos, text: string) => {
    if (!canEdit(pos)) return;
    if ((grid[pos.row]?.[pos.col] ?? "") === text) return;
    const next = grid.map((r) => [...r]);
    next[pos.row]![pos.col] = text;
    if (controlledValue === undefined) setUncontrolledValue(next);
    onChange?.(next);
  };

  const moveTo = (row: number, col: number) => {
    const next = { row: Math.min(rowCount - 1, Math.max(0, row)), col: Math.min(colCount - 1, Math.max(0, col)) };
    pendingFocus.current = true;
    setActive(next);
    // The effect only runs on state change; focus directly when the target is already active.
    cellRefs.current.get(key(next))?.focus();
  };

  const startEdit = (initial?: string) => {
    if (!canEdit(active)) return;
    setEditingText(initial ?? grid[active.row]![active.col]!);
  };

  const finishEdit = (save: boolean, dRow: number, dCol: number) => {
    if (editingRef.current === null) return;
    if (save) commit(active, editingRef.current);
    pendingFocus.current = true;
    setEditingText(null);
    moveTo(active.row + dRow, active.col + dCol);
  };

  const onCellKeyDown = (e: KeyboardEvent<HTMLTableCellElement>) => {
    if (editing !== null) return;
    const { row, col } = active;
    switch (e.key) {
      case "ArrowUp": e.preventDefault(); moveTo(row - 1, col); return;
      case "ArrowDown": e.preventDefault(); moveTo(row + 1, col); return;
      case "ArrowLeft": e.preventDefault(); moveTo(row, col - 1); return;
      case "ArrowRight": e.preventDefault(); moveTo(row, col + 1); return;
      case "Home": e.preventDefault(); moveTo(row, 0); return;
      case "End": e.preventDefault(); moveTo(row, colCount - 1); return;
      case "Tab": e.preventDefault(); moveTo(row, col + (e.shiftKey ? -1 : 1)); return;
      case "Enter":
      case "F2": e.preventDefault(); startEdit(); return;
      case "Delete":
      case "Backspace": e.preventDefault(); commit(active, ""); return;
    }
    // A printable character starts editing with that character replacing the contents.
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      startEdit(e.key);
    }
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); finishEdit(true, e.shiftKey ? -1 : 1, 0); }
    else if (e.key === "Tab") { e.preventDefault(); finishEdit(true, 0, e.shiftKey ? -1 : 1); }
    else if (e.key === "Escape") { e.preventDefault(); finishEdit(false, 0, 0); }
  };

  const shown = (v: string | number) => (typeof v === "number" ? String(v) : v);

  return (
    <div className={[root, className].filter(Boolean).join(" ")}>
      {showFormulaBar ? (
      <div className={formulaBar}>
        <span className={nameBox} data-testid="spreadsheet-name-box">
          {indexToCol(active.col)}
          {active.row + 1}
        </span>
        <span className={formulaText}>{editing ?? grid[active.row]?.[active.col] ?? ""}</span>
      </div>
      ) : null}
      <div className={scroller} style={{ maxHeight }}>
        <table className={table} role="grid" aria-rowcount={rowCount} aria-colcount={colCount} aria-readonly={readOnly || undefined} style={{ width: totalWidth }}>
          {showHeaders ? (
          <thead>
            <tr>
              <th className={cornerCell} />
              {Array.from({ length: colCount }, (_, c) => (
                <th key={c} scope="col" className={colHeader} style={{ width: widthOf(c) }} data-active={c === active.col}>
                  {columnHeaders?.[c] ?? indexToCol(c)}
                </th>
              ))}
            </tr>
          </thead>
          ) : (
            <colgroup>
              {Array.from({ length: colCount }, (_, c) => (
                <col key={c} style={{ width: widthOf(c) }} />
              ))}
            </colgroup>
          )}
          <tbody>
            {Array.from({ length: rowCount }, (_, r) => (
              <tr key={r}>
                {showHeaders ? (
                  <th scope="row" className={rowHeader} data-active={r === active.row}>
                    {r + 1}
                  </th>
                ) : null}
                {Array.from({ length: colCount }, (_, c) => {
                  const pos = { row: r, col: c };
                  const isActive = r === active.row && c === active.col;
                  const value = computed[r]![c]!;
                  const isError = typeof value === "string" && value.startsWith("#");
                  return (
                    <td
                      key={c}
                      ref={(el) => {
                        if (el) cellRefs.current.set(key(pos), el);
                        else cellRefs.current.delete(key(pos));
                      }}
                      role="gridcell"
                      aria-selected={isActive}
                      aria-label={`${indexToCol(c)}${r + 1}`}
                      tabIndex={isActive ? 0 : -1}
                      className={[cellClass, getCellClassName?.(value, pos)].filter(Boolean).join(" ")}
                      style={{ ...(rowHeight ? { height: rowHeight } : null), ...getCellStyle?.(value, pos) }}
                      data-readonly={!canEdit(pos) || undefined}
                      data-active={isActive}
                      data-numeric={typeof value === "number"}
                      data-error={isError}
                      onFocus={() => {
                        if (!isActive) setActive(pos);
                      }}
                      onMouseDown={() => {
                        if (editingRef.current !== null && !isActive) finishEdit(true, 0, 0);
                      }}
                      onClick={() => setActive(pos)}
                      onDoubleClick={() => {
                        setActive(pos);
                        if (canEdit(pos)) setEditingText(grid[r]![c]!);
                      }}
                      onKeyDown={onCellKeyDown}
                    >
                      {isActive && editing !== null ? (
                        <input
                          ref={inputRef}
                          className={editor}
                          value={editing}
                          aria-label={`Edit ${indexToCol(c)}${r + 1}`}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={onInputKeyDown}
                          onBlur={() => {
                            if (editingRef.current !== null) {
                              commit(active, editingRef.current);
                              setEditingText(null);
                            }
                          }}
                        />
                      ) : (
                        (renderCell?.({ value, raw: grid[r]![c]!, pos, isActive }) ??
                        (formatCell ? formatCell(value, pos) : shown(value)))
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
