import type { ReactNode } from "react";

export interface DataGridColumn<T> {
  key: string;
  header: ReactNode;
  width?: number;
  minWidth?: number;
  sortable?: boolean;
  resizable?: boolean;
  /** Freeze this column to an edge so it stays visible during horizontal scroll. */
  pinned?: "left" | "right";
  /** Allow this column's cells to be edited when the row is in edit mode. */
  editable?: boolean;
  /** Allow this column to be filtered via the filter row. */
  filterable?: boolean;
  /** Filter input type when filterable is true. Defaults to 'text'. */
  filterType?: "text" | "select";
  accessor?: (row: T) => string | number;
  render?: (row: T) => ReactNode;
  /** Value used when exporting this column; falls back to accessor, then the raw row value. Not derived from render, since render returns a ReactNode. */
  exportValue?: (row: T) => string | number;
}

export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface FilterState {
  key: string;
  value: string;
}
