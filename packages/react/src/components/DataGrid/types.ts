import type { ReactNode } from "react";

export interface DataGridColumn<T> {
  key: string;
  header: ReactNode;
  width?: number;
  minWidth?: number;
  sortable?: boolean;
  resizable?: boolean;
  accessor?: (row: T) => string | number;
  render?: (row: T) => ReactNode;
}

export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  key: string;
  direction: SortDirection;
}
