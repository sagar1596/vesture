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
  accessor?: (row: T) => string | number;
  render?: (row: T) => ReactNode;
}

export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  key: string;
  direction: SortDirection;
}
