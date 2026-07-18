import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  ForwardedRef,
  InputHTMLAttributes,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactElement,
  ReactNode,
} from "react";
import { Button } from "../Button";
import { Pagination } from "../Pagination";
import { Spinner } from "../Spinner";
import {
  actionsCell as actionsCellClass,
  body as bodyClass,
  cell as cellClass,
  checkboxCell as checkboxCellClass,
  container as containerClass,
  editInput,
  emptyState as emptyStateClass,
  filterCell,
  filterInput,
  filterRow,
  gridWrapper,
  headerButton,
  headerCell,
  headerRow,
  iconButton,
  loadingOverlay,
  paginationFooter,
  pinnedCell,
  pinnedHeaderCell,
  pinnedLeftEdge,
  pinnedRightEdge,
  resizeHandle,
  row as rowClass,
  sortIcon,
  srOnly,
  toolbar as toolbarClass,
} from "./DataGrid.css";
import type {
  DataGridColumn,
  FilterState,
  SortDirection,
  SortState,
} from "./types";

const DEFAULT_COLUMN_WIDTH = 160;
const CHECKBOX_COLUMN_WIDTH = 44;
const ACTIONS_COLUMN_WIDTH = 72;
const FILTER_DEBOUNCE_MS = 200;

function useDebouncedValue<V>(value: V, delay: number): V {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

interface FilterTextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

function FilterTextInput({
  value,
  onChange,
  ...rest
}: FilterTextInputProps): ReactElement {
  const [draft, setDraft] = useState(value);
  const debounced = useDebouncedValue(draft, FILTER_DEBOUNCE_MS);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    onChangeRef.current(debounced);
  }, [debounced]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <input
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      {...rest}
    />
  );
}

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
  filters?: FilterState[];
  onFilterChange?: (filters: FilterState[]) => void;
  emptyMessage?: ReactNode;
  /** Enables inline row editing; called when a row's edit is saved. */
  onRowEdit?: (rowId: string, values: Record<string, string>) => void;
  /** When true, `data` is treated as already sorted/filtered/paginated by the caller. */
  serverSide?: boolean;
  /** Shows a loading overlay over the grid without unmounting existing rows. */
  loading?: boolean;
  /** True total row count on the server, used for pagination controls. */
  totalRowCount?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  /** Renders an "Export" button in the grid's toolbar that exports the current view to Excel. */
  enableExport?: boolean;
  onRowClick?: (row: T, event: ReactMouseEvent<HTMLDivElement>) => void;
  onRowDoubleClick?: (row: T, event: ReactMouseEvent<HTMLDivElement>) => void;
  onCellClick?: (
    row: T,
    column: DataGridColumn<T>,
    event: ReactMouseEvent<HTMLDivElement>,
  ) => void;
}

export interface DataGridExportOptions {
  filename?: string;
  sheetName?: string;
}

export interface DataGridHandle<T> {
  exportToExcel: (options?: DataGridExportOptions) => Promise<void>;
}

function getExportValue<T>(column: DataGridColumn<T>, row: T): string | number {
  if (column.exportValue) {
    return column.exportValue(row);
  }
  if (column.accessor) {
    return column.accessor(row);
  }
  return (row as Record<string, unknown>)[column.key] as string | number;
}

function getExportHeader<T>(column: DataGridColumn<T>): string {
  return typeof column.header === "string" ? column.header : column.key;
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

function DataGridInner<T>(
  {
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
    filters: controlledFilters,
    onFilterChange,
    emptyMessage = "No data",
    onRowEdit,
    serverSide = false,
    loading = false,
    totalRowCount,
    page,
    pageSize,
    onPageChange,
    enableExport = false,
    onRowClick,
    onRowDoubleClick,
    onCellClick,
  }: DataGridProps<T>,
  ref: ForwardedRef<DataGridHandle<T>>
): ReactElement {
  const [uncontrolledSort, setUncontrolledSort] = useState<SortState | null>(
    null
  );
  const [uncontrolledFilters, setUncontrolledFilters] = useState<FilterState[]>(
    []
  );
  const [uncontrolledSelectedIds, setUncontrolledSelectedIds] = useState<
    Set<string>
  >(() => new Set());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      columns.map((c) => [c.key, c.width ?? DEFAULT_COLUMN_WIDTH])
    )
  );
  const [scrollTop, setScrollTop] = useState(0);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, string>>({});

  const editingEnabled = Boolean(onRowEdit);

  const sort = controlledSort !== undefined ? controlledSort : uncontrolledSort;
  const filters =
    controlledFilters !== undefined ? controlledFilters : uncontrolledFilters;
  const selectedIds = controlledSelectedIds ?? uncontrolledSelectedIds;

  const setSort = (next: SortState | null) => {
    if (controlledSort === undefined) {
      setUncontrolledSort(next);
    }
    onSortChange?.(next);
  };

  const setFilters = (next: FilterState[]) => {
    if (controlledFilters === undefined) {
      setUncontrolledFilters(next);
    }
    onFilterChange?.(next);
  };

  const handleFilterChange = (key: string, value: string) => {
    const next = value
      ? [...filters.filter((f) => f.key !== key), { key, value }]
      : filters.filter((f) => f.key !== key);
    setFilters(next);
  };

  const getFilterValue = (key: string): string =>
    filters.find((f) => f.key === key)?.value ?? "";

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

  const filteredData = useMemo(() => {
    if (serverSide || filters.length === 0) {
      return data;
    }
    return data.filter((row) =>
      filters.every((f) => {
        if (!f.value) return true;
        const column = columns.find((c) => c.key === f.key);
        if (!column) return true;
        const cellValue = String(getCellValue(column, row) ?? "").toLowerCase();
        return cellValue.includes(f.value.toLowerCase());
      })
    );
  }, [data, filters, columns, serverSide]);

  const sortedData = useMemo(() => {
    if (serverSide) {
      return data;
    }
    if (!sort || !sort.direction) {
      return filteredData;
    }
    const column = columns.find((c) => c.key === sort.key);
    if (!column) {
      return filteredData;
    }
    const sorted = [...filteredData].sort((a, b) =>
      compareValues(getCellValue(column, a), getCellValue(column, b))
    );
    return sort.direction === "desc" ? sorted.reverse() : sorted;
  }, [filteredData, sort, columns, serverSide, data]);

  const exportToExcel = useCallback(
    async (options?: DataGridExportOptions) => {
      const XLSX = await import("xlsx");
      const headerRowValues = columns.map((column) => getExportHeader(column));
      const rows = sortedData.map((row) =>
        columns.map((column) => getExportValue(column, row))
      );
      const worksheet = XLSX.utils.aoa_to_sheet([headerRowValues, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        options?.sheetName ?? "Sheet1"
      );
      XLSX.writeFile(workbook, options?.filename ?? "export.xlsx");
    },
    [columns, sortedData]
  );

  useImperativeHandle(ref, () => ({ exportToExcel }), [exportToExcel]);

  const selectFilterOptions = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const column of columns) {
      if (!column.filterable || column.filterType !== "select") continue;
      const values = new Set<string>();
      for (const row of data) {
        values.add(String(getCellValue(column, row) ?? ""));
      }
      map[column.key] = Array.from(values).sort();
    }
    return map;
  }, [columns, data]);

  const hasFilterableColumns = columns.some((c) => c.filterable);
  const showPagination =
    page !== undefined && pageSize !== undefined && onPageChange !== undefined;

  const allSelected =
    sortedData.length > 0 &&
    sortedData.every((r) => selectedIds.has(getRowId(r)));
  const someSelected =
    !allSelected && sortedData.some((r) => selectedIds.has(getRowId(r)));

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

  const resizeState = useRef<{
    key: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const handleResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, column: DataGridColumn<T>) => {
      if (column.resizable === false) return;
      event.preventDefault();
      event.stopPropagation();
      resizeState.current = {
        key: column.key,
        startX: event.clientX,
        startWidth: columnWidths[column.key] ?? DEFAULT_COLUMN_WIDTH,
      };
      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);
    },
    [columnWidths]
  );

  const handleResizeMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const state = resizeState.current;
      if (!state) return;
      const delta = event.clientX - state.startX;
      const minWidth = columns.find((c) => c.key === state.key)?.minWidth ?? 60;
      const nextWidth = Math.max(minWidth, state.startWidth + delta);
      setColumnWidths((prev) => ({ ...prev, [state.key]: nextWidth }));
    },
    [columns]
  );

  const handleResizeEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      resizeState.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
    []
  );

  const widthOf = useCallback(
    (column: DataGridColumn<T>) =>
      columnWidths[column.key] ?? column.width ?? DEFAULT_COLUMN_WIDTH,
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
      firstRightKey: rightPinned[0]?.key,
    };
  }, [columns, selectable, editingEnabled, widthOf]);

  const pinnedStyle = (
    column: DataGridColumn<T>
  ): CSSProperties | undefined => {
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
    <>
      <div className={gridWrapper}>
        {enableExport ? (
          <div className={toolbarClass}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void exportToExcel();
              }}
            >
              Export
            </Button>
          </div>
        ) : null}
        <div
          className={containerClass}
          style={{ height }}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          role="table"
        >
          <div
            className={headerRow}
            style={{ width: totalWidth, minWidth: "100%" }}
            role="row"
          >
            {selectable ? (
              <div
                className={[checkboxCellClass, pinnedHeaderCell].join(" ")}
                style={{ left: 0 }}
                role="columnheader"
              >
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
              const direction: SortDirection = isSorted
                ? sort!.direction
                : null;
              return (
                <div
                  key={column.key}
                  className={[headerCell, headerPinnedClass(column)]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ width, ...pinnedStyle(column) }}
                  role="columnheader"
                  aria-sort={
                    direction === "asc"
                      ? "ascending"
                      : direction === "desc"
                      ? "descending"
                      : "none"
                  }
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      className={headerButton}
                      onClick={() => handleSortClick(column)}
                    >
                      {column.header}
                      <span className={sortIcon} aria-hidden="true">
                        {direction === "asc"
                          ? "▲"
                          : direction === "desc"
                          ? "▼"
                          : ""}
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

          {hasFilterableColumns ? (
            <div
              className={filterRow}
              style={{ width: totalWidth, minWidth: "100%" }}
              role="row"
            >
              {selectable ? (
                <div
                  className={[checkboxCellClass, pinnedHeaderCell].join(" ")}
                  style={{ left: 0 }}
                  role="cell"
                />
              ) : null}
              {layout.ordered.map((column) => {
                const width = widthOf(column);
                return (
                  <div
                    key={column.key}
                    className={[filterCell, headerPinnedClass(column)]
                      .filter(Boolean)
                      .join(" ")}
                    style={{ width, ...pinnedStyle(column) }}
                    role="cell"
                  >
                    {column.filterable ? (
                      column.filterType === "select" ? (
                        <select
                          className={filterInput}
                          value={getFilterValue(column.key)}
                          onChange={(e) =>
                            handleFilterChange(column.key, e.target.value)
                          }
                          aria-label={`Filter ${String(column.header)}`}
                        >
                          <option value="">All</option>
                          {(selectFilterOptions[column.key] ?? []).map(
                            (value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            )
                          )}
                        </select>
                      ) : (
                        <FilterTextInput
                          className={filterInput}
                          value={getFilterValue(column.key)}
                          onChange={(value) =>
                            handleFilterChange(column.key, value)
                          }
                          placeholder={`Filter ${String(column.header)}`}
                          aria-label={`Filter ${String(column.header)}`}
                        />
                      )
                    ) : null}
                  </div>
                );
              })}
              {editingEnabled ? (
                <div
                  className={[actionsCellClass, pinnedHeaderCell].join(" ")}
                  style={{ right: 0 }}
                  role="cell"
                />
              ) : null}
            </div>
          ) : null}

          {sortedData.length === 0 ? (
            <div className={emptyStateClass}>{emptyMessage}</div>
          ) : (
            <div
              className={bodyClass}
              style={{
                height: totalHeight,
                width: totalWidth,
                minWidth: "100%",
              }}
            >
              {visibleRows.map((rowData, i) => {
                const index = startIndex + i;
                const id = getRowId(rowData);
                const isSelected = selectedIds.has(id);
                const isEditing = editingRowId === id;
                const style: CSSProperties = {
                  top: index * rowHeight,
                  height: rowHeight,
                  width: totalWidth,
                };

                return (
                  <div
                    key={id}
                    className={rowClass}
                    style={style}
                    role="row"
                    data-selected={isSelected || undefined}
                    data-editing={isEditing || undefined}
                    onClick={
                      onRowClick ? (e) => onRowClick(rowData, e) : undefined
                    }
                    onDoubleClick={
                      onRowDoubleClick
                        ? (e) => onRowDoubleClick(rowData, e)
                        : undefined
                    }
                  >
                    {selectable ? (
                      <div
                        className={[checkboxCellClass, pinnedCell].join(" ")}
                        style={{ left: 0 }}
                        role="cell"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                        className={[cellClass, pinnedClass(column)]
                          .filter(Boolean)
                          .join(" ")}
                        style={{
                          width: widthOf(column),
                          ...pinnedStyle(column),
                        }}
                        role="cell"
                        onClick={
                          onCellClick
                            ? (e) => onCellClick(rowData, column, e)
                            : undefined
                        }
                      >
                        {isEditing && column.editable ? (
                          <input
                            type="text"
                            className={editInput}
                            value={editDraft[column.key] ?? ""}
                            onChange={(e) =>
                              setEditDraft((prev) => ({
                                ...prev,
                                [column.key]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditing();
                              if (e.key === "Escape") cancelEditing();
                            }}
                            aria-label={`Edit ${String(column.header)}`}
                            autoFocus={
                              column.key ===
                              columns.find((c) => c.editable)?.key
                            }
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
                        onClick={(e) => e.stopPropagation()}
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
        {loading ? (
          <div className={loadingOverlay}>
            <Spinner size="md" />
          </div>
        ) : null}
      </div>
      {showPagination ? (
        <div className={paginationFooter}>
          <Pagination
            page={page!}
            totalPages={Math.max(
              1,
              Math.ceil((totalRowCount ?? data.length) / pageSize!)
            )}
            onPageChange={onPageChange!}
          />
        </div>
      ) : null}
    </>
  );
}

export const DataGrid = forwardRef(DataGridInner) as <T>(
  props: DataGridProps<T> & { ref?: ForwardedRef<DataGridHandle<T>> }
) => ReactElement;
