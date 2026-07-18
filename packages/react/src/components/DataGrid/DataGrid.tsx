import { useCallback, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactElement, ReactNode } from "react";
import {
  actionsCell as actionsCellClass,
  body as bodyClass,
  cell as cellClass,
  checkboxCell as checkboxCellClass,
  container as containerClass,
  editInput,
  emptyState as emptyStateClass,
  headerButton,
  headerCell,
  headerRow,
  iconButton,
  pinnedCell,
  pinnedHeaderCell,
  pinnedLeftEdge,
  pinnedRightEdge,
  resizeHandle,
  row as rowClass,
  sortIcon,
  srOnly
} from "./DataGrid.css";
import type { DataGridColumn, SortDirection, SortState } from "./types";

const DEFAULT_COLUMN_WIDTH = 160;
const CHECKBOX_COLUMN_WIDTH = 44;
const ACTIONS_COLUMN_WIDTH = 72;

export interface DataGridProps<T> {
  columns: DataGridColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  rowHeight?: number;
  height?: number;
  overscan?: number;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  sort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
  emptyMessage?: ReactNode;
  /** Enables inline row editing; called when a row's edit is saved. */
  onRowEdit?: (rowId: string, values: Record<string, string>) => void;
}

function compareValues(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  return String(a).localeCompare(String(b));
}

function getCellValue<T>(column: DataGridColumn<T>, row: T): string | number {
  if (column.accessor) {
    return column.accessor(row);
  }
  return (row as Record<string, unknown>)[column.key] as string | number;
}

export function DataGrid<T>({
  columns,
  data,
  getRowId,
  rowHeight = 40,
  height = 400,
  overscan = 5,
  selectable = false,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  sort: controlledSort,
  onSortChange,
  emptyMessage = "No data",
  onRowEdit
}: DataGridProps<T>): ReactElement {
  const [uncontrolledSort, setUncontrolledSort] = useState<SortState | null>(null);
  const [uncontrolledSelectedIds, setUncontrolledSelectedIds] = useState<Set<string>>(() => new Set());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(columns.map((c) => [c.key, c.width ?? DEFAULT_COLUMN_WIDTH]))
  );
  const [scrollTop, setScrollTop] = useState(0);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, string>>({});

  const editingEnabled = Boolean(onRowEdit);

  const sort = controlledSort !== undefined ? controlledSort : uncontrolledSort;
  const selectedIds = controlledSelectedIds ?? uncontrolledSelectedIds;

  const setSort = (next: SortState | null) => {
    if (controlledSort === undefined) {
      setUncontrolledSort(next);
    }
    onSortChange?.(next);
  };

  const setSelectedIds = (next: Set<string>) => {
    if (controlledSelectedIds === undefined) {
      setUncontrolledSelectedIds(next);
    }
    onSelectionChange?.(next);
  };

  const handleSortClick = (column: DataGridColumn<T>) => {
    if (!column.sortable) return;
    if (!sort || sort.key !== column.key) {
      setSort({ key: column.key, direction: "asc" });
    } else if (sort.direction === "asc") {
      setSort({ key: column.key, direction: "desc" });
    } else {
      setSort(null);
    }
  };

  const sortedData = useMemo(() => {
    if (!sort || !sort.direction) {
      return data;
    }
    const column = columns.find((c) => c.key === sort.key);
    if (!column) {
      return data;
    }
    const sorted = [...data].sort((a, b) => compareValues(getCellValue(column, a), getCellValue(column, b)));
    return sort.direction === "desc" ? sorted.reverse() : sorted;
  }, [data, sort, columns]);

  const allSelected = sortedData.length > 0 && sortedData.every((r) => selectedIds.has(getRowId(r)));
  const someSelected = !allSelected && sortedData.some((r) => selectedIds.has(getRowId(r)));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedData.map(getRowId)));
    }
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const resizeState = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  const handleResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, column: DataGridColumn<T>) => {
      if (column.resizable === false) return;
      event.preventDefault();
      event.stopPropagation();
      resizeState.current = {
        key: column.key,
        startX: event.clientX,
        startWidth: columnWidths[column.key] ?? DEFAULT_COLUMN_WIDTH
      };
      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);
    },
    [columnWidths]
  );

  const handleResizeMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const state = resizeState.current;
    if (!state) return;
    const delta = event.clientX - state.startX;
    const minWidth = columns.find((c) => c.key === state.key)?.minWidth ?? 60;
    const nextWidth = Math.max(minWidth, state.startWidth + delta);
    setColumnWidths((prev) => ({ ...prev, [state.key]: nextWidth }));
  }, [columns]);

  const handleResizeEnd = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    resizeState.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const widthOf = useCallback(
    (column: DataGridColumn<T>) => columnWidths[column.key] ?? column.width ?? DEFAULT_COLUMN_WIDTH,
    [columnWidths]
  );

  // --- Column layout: split into left-pinned / scrollable / right-pinned
  // groups (preserving each group's declared relative order), and compute a
  // sticky offset for every pinned column plus the checkbox/actions columns.
  const layout = useMemo(() => {
    const leftPinned = columns.filter((c) => c.pinned === "left");
    const rightPinned = columns.filter((c) => c.pinned === "right");
    const middle = columns.filter((c) => !c.pinned);
    const ordered = [...leftPinned, ...middle, ...rightPinned];

    const leftOffsets = new Map<string, number>();
    let leftAcc = selectable ? CHECKBOX_COLUMN_WIDTH : 0;
    for (const column of leftPinned) {
      leftOffsets.set(column.key, leftAcc);
      leftAcc += widthOf(column);
    }

    const rightOffsets = new Map<string, number>();
    let rightAcc = editingEnabled ? ACTIONS_COLUMN_WIDTH : 0;
    for (let i = rightPinned.length - 1; i >= 0; i--) {
      const column = rightPinned[i]!;
      rightOffsets.set(column.key, rightAcc);
      rightAcc += widthOf(column);
    }

    return {
      ordered,
      leftOffsets,
      rightOffsets,
      lastLeftKey: leftPinned[leftPinned.length - 1]?.key,
      firstRightKey: rightPinned[0]?.key
    };
  }, [columns, selectable, editingEnabled, widthOf]);

  const pinnedStyle = (column: DataGridColumn<T>): CSSProperties | undefined => {
    if (column.pinned === "left" && layout.leftOffsets.has(column.key)) {
      return { left: layout.leftOffsets.get(column.key) };
    }
    if (column.pinned === "right" && layout.rightOffsets.has(column.key)) {
      return { right: layout.rightOffsets.get(column.key) };
    }
    return undefined;
  };

  const pinnedClass = (column: DataGridColumn<T>): string => {
    const classes: string[] = [];
    if (column.pinned) {
      classes.push(pinnedCell);
      if (column.key === layout.lastLeftKey) classes.push(pinnedLeftEdge);
      if (column.key === layout.firstRightKey) classes.push(pinnedRightEdge);
    }
    return classes.join(" ");
  };

  const headerPinnedClass = (column: DataGridColumn<T>): string => {
    const classes: string[] = [];
    if (column.pinned) {
      classes.push(pinnedHeaderCell);
      if (column.key === layout.lastLeftKey) classes.push(pinnedLeftEdge);
      if (column.key === layout.firstRightKey) classes.push(pinnedRightEdge);
    }
    return classes.join(" ");
  };

  const startEditing = (rowData: T) => {
    const id = getRowId(rowData);
    const draft: Record<string, string> = {};
    for (const column of columns) {
      if (column.editable) {
        draft[column.key] = String(getCellValue(column, rowData) ?? "");
      }
    }
    setEditDraft(draft);
    setEditingRowId(id);
  };

  const cancelEditing = () => {
    setEditingRowId(null);
    setEditDraft({});
  };

  const saveEditing = () => {
    if (editingRowId) {
      onRowEdit?.(editingRowId, editDraft);
    }
    setEditingRowId(null);
    setEditDraft({});
  };

  const totalHeight = sortedData.length * rowHeight;
  const visibleCount = Math.ceil(height / rowHeight) + overscan * 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(sortedData.length, startIndex + visibleCount);
  const visibleRows = sortedData.slice(startIndex, endIndex);

  const totalWidth =
    (selectable ? CHECKBOX_COLUMN_WIDTH : 0) +
    (editingEnabled ? ACTIONS_COLUMN_WIDTH : 0) +
    columns.reduce((sum, c) => sum + widthOf(c), 0);

  return (
    <div
      className={containerClass}
      style={{ height }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      role="table"
    >
      <div className={headerRow} style={{ width: totalWidth, minWidth: "100%" }} role="row">
        {selectable ? (
          <div className={[checkboxCellClass, pinnedHeaderCell].join(" ")} style={{ left: 0 }} role="columnheader">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={toggleAll}
              aria-label="Select all rows"
            />
          </div>
        ) : null}
        {layout.ordered.map((column) => {
          const width = widthOf(column);
          const isSorted = sort?.key === column.key;
          const direction: SortDirection = isSorted ? sort!.direction : null;
          return (
            <div
              key={column.key}
              className={[headerCell, headerPinnedClass(column)].filter(Boolean).join(" ")}
              style={{ width, ...pinnedStyle(column) }}
              role="columnheader"
              aria-sort={
                direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"
              }
            >
              {column.sortable ? (
                <button type="button" className={headerButton} onClick={() => handleSortClick(column)}>
                  {column.header}
                  <span className={sortIcon} aria-hidden="true">
                    {direction === "asc" ? "▲" : direction === "desc" ? "▼" : ""}
                  </span>
                </button>
              ) : (
                column.header
              )}
              {column.resizable !== false ? (
                <div
                  className={resizeHandle}
                  onPointerDown={(e) => handleResizeStart(e, column)}
                  onPointerMove={handleResizeMove}
                  onPointerUp={handleResizeEnd}
                  role="separator"
                  aria-orientation="vertical"
                  aria-label={`Resize ${String(column.header)} column`}
                />
              ) : null}
            </div>
          );
        })}
        {editingEnabled ? (
          <div
            className={[actionsCellClass, pinnedHeaderCell].join(" ")}
            style={{ right: 0 }}
            role="columnheader"
          >
            <span className={srOnly}>Actions</span>
          </div>
        ) : null}
      </div>

      {sortedData.length === 0 ? (
        <div className={emptyStateClass}>{emptyMessage}</div>
      ) : (
        <div className={bodyClass} style={{ height: totalHeight, width: totalWidth, minWidth: "100%" }}>
          {visibleRows.map((rowData, i) => {
            const index = startIndex + i;
            const id = getRowId(rowData);
            const isSelected = selectedIds.has(id);
            const isEditing = editingRowId === id;
            const style: CSSProperties = { top: index * rowHeight, height: rowHeight, width: totalWidth };

            return (
              <div
                key={id}
                className={rowClass}
                style={style}
                role="row"
                data-selected={isSelected || undefined}
                data-editing={isEditing || undefined}
              >
                {selectable ? (
                  <div className={[checkboxCellClass, pinnedCell].join(" ")} style={{ left: 0 }} role="cell">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(id)}
                      aria-label={`Select row ${index + 1}`}
                    />
                  </div>
                ) : null}
                {layout.ordered.map((column) => (
                  <div
                    key={column.key}
                    className={[cellClass, pinnedClass(column)].filter(Boolean).join(" ")}
                    style={{ width: widthOf(column), ...pinnedStyle(column) }}
                    role="cell"
                  >
                    {isEditing && column.editable ? (
                      <input
                        type="text"
                        className={editInput}
                        value={editDraft[column.key] ?? ""}
                        onChange={(e) =>
                          setEditDraft((prev) => ({ ...prev, [column.key]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditing();
                          if (e.key === "Escape") cancelEditing();
                        }}
                        aria-label={`Edit ${String(column.header)}`}
                        autoFocus={column.key === columns.find((c) => c.editable)?.key}
                      />
                    ) : column.render ? (
                      column.render(rowData)
                    ) : (
                      String(getCellValue(column, rowData) ?? "")
                    )}
                  </div>
                ))}
                {editingEnabled ? (
                  <div
                    className={[actionsCellClass, pinnedCell].join(" ")}
                    style={{ right: 0 }}
                    role="cell"
                  >
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className={iconButton}
                          onClick={saveEditing}
                          aria-label={`Save row ${index + 1}`}
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          className={iconButton}
                          onClick={cancelEditing}
                          aria-label={`Cancel editing row ${index + 1}`}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className={iconButton}
                        onClick={() => startEditing(rowData)}
                        aria-label={`Edit row ${index + 1}`}
                      >
                        ✎
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
