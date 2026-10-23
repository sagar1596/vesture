import { useMemo } from "react";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { buildPivot, type PivotAggregate } from "./pivot";
import { emptyState, headCell, root, rowLabel, table, totalRow, valueCell } from "./PivotGrid.css";

export type { PivotAggregate } from "./pivot";

export type PivotCellKind = "cell" | "rowTotal" | "columnTotal" | "grandTotal";

export interface PivotCellInfo {
  kind: PivotCellKind;
  /** Aggregated number, or null when no records fall in this cell. */
  value: number | null;
  /** Row path (outermost first); empty for column/grand totals. */
  rowPath: string[];
  /** Column key; empty for row/grand totals. */
  columnKey: string;
  /** `value` after `formatValue`, or empty-string for null. */
  formatted: string;
}

export interface PivotGridProps<T extends Record<string, unknown>> {
  data: T[];
  /** Fields that become row groups, outermost first. */
  rows: (keyof T & string)[];
  /** Field whose distinct values become columns; omit for a single value column. */
  columns?: keyof T & string;
  /** Numeric field to aggregate; not needed for `count`. */
  value?: keyof T & string;
  /** Built-in aggregate name, or a function reducing each group's numeric values (median, distinct count, ...). */
  aggregate?: PivotAggregate;
  /** Header text for each row field, parallel to `rows`; defaults to the field names. */
  rowHeaders?: string[];
  formatValue?: (value: number) => string;
  /** Shorthand for both `rowTotals` and `columnTotals`. */
  showTotals?: boolean;
  /** Show the right-hand "Total" column (needs 2+ columns to be meaningful). Defaults to `showTotals`. */
  rowTotals?: boolean;
  /** Show the bottom totals row. Defaults to `showTotals`. */
  columnTotals?: boolean;
  totalLabel?: string;
  /** Shown for cells with no records. */
  emptyValue?: ReactNode;
  sortRows?: (a: string[], b: string[]) => number;
  sortColumns?: (a: string, b: string) => number;
  /** Explicit column order; unlisted keys follow, sorted. */
  columnOrder?: string[];
  /** Customizes how a group label displays (e.g. add an icon or translate a code). */
  renderRowLabel?: (label: string, level: number, path: string[]) => ReactNode;
  renderColumnLabel?: (key: string) => ReactNode;
  /** Replaces the content of a value cell. Return `undefined` to keep the default content, `null` to render nothing. */
  renderCell?: (info: PivotCellInfo) => ReactNode;
  /** Inline style per value cell, e.g. conditional coloring / data bars. */
  getCellStyle?: (info: PivotCellInfo) => CSSProperties | undefined;
  /** Makes value cells clickable (drill-down). */
  onCellClick?: (info: PivotCellInfo) => void;
  /** Table caption for assistive tech. */
  caption?: string;
  className?: string;
}

/** Pivot table: cross-tabulates flat records into row groups x column values with totals. */
export function PivotGrid<T extends Record<string, unknown>>({
  data,
  rows,
  columns,
  value,
  aggregate = "sum",
  rowHeaders,
  formatValue = (n) => (Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 2 })),
  showTotals = true,
  rowTotals,
  columnTotals,
  totalLabel = "Total",
  emptyValue = "–",
  sortRows,
  sortColumns,
  columnOrder,
  renderRowLabel,
  renderColumnLabel,
  renderCell,
  getCellStyle,
  onCellClick,
  caption,
  className
}: PivotGridProps<T>): ReactElement {
  const pivot = useMemo(
    () => buildPivot(data, { rows, columns, value, aggregate, sortRows, sortColumns, columnOrder }),
    [data, rows, columns, value, aggregate, sortRows, sortColumns, columnOrder]
  );

  if (pivot.rows.length === 0) {
    return (
      <div className={[root, className].filter(Boolean).join(" ")}>
        <div className={emptyState}>No data</div>
      </div>
    );
  }

  const showRowTotal = (rowTotals ?? showTotals) && pivot.columnKeys.length > 1;
  const showColumnTotal = columnTotals ?? showTotals;

  const renderValue = (kind: PivotCellKind, v: number | null, rowPath: string[], columnKey: string, extraProps: { "data-total"?: boolean; "data-grand"?: boolean } = {}) => {
    const info: PivotCellInfo = { kind, value: v, rowPath, columnKey, formatted: v === null ? "" : formatValue(v) };
    // Returning undefined from renderCell falls back to the default content; null renders nothing.
    const custom = renderCell?.(info);
    const clickable = onCellClick && v !== null;
    return (
      <td
        className={valueCell}
        data-empty={v === null}
        data-kind={kind}
        {...extraProps}
        style={getCellStyle?.(info)}
        onClick={clickable ? () => onCellClick(info) : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onCellClick(info);
                }
              }
            : undefined
        }
        {...(clickable ? { "data-clickable": true } : {})}
      >
        {custom !== undefined ? custom : v === null ? emptyValue : info.formatted}
      </td>
    );
  };

  return (
    <div className={[root, className].filter(Boolean).join(" ")}>
      <table className={table}>
        {caption ? <caption style={{ captionSide: "top", textAlign: "left", padding: 8 }}>{caption}</caption> : null}
        <thead>
          <tr>
            {rows.map((field, i) => (
              <th key={field} scope="col" className={headCell} data-align="left">
                {rowHeaders?.[i] ?? field}
              </th>
            ))}
            {pivot.columnKeys.map((k) => (
              <th key={k} scope="col" className={headCell}>
                {renderColumnLabel ? renderColumnLabel(k) : k}
              </th>
            ))}
            {showRowTotal ? (
              <th scope="col" className={headCell} data-total="true">
                {totalLabel}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {pivot.rows.map((row, ri) => {
            const prev = pivot.rows[ri - 1];
            // A label repeats visually (hidden, but kept for copy/paste and a11y) while it and every outer level match the previous row.
            let sameSoFar = Boolean(prev);
            return (
              <tr key={row.path.join("\u0000")}>
                {row.path.map((label, li) => {
                  sameSoFar = sameSoFar && prev!.path[li] === label;
                  return (
                    <th key={li} scope="row" className={rowLabel} data-repeat={sameSoFar}>
                      {renderRowLabel ? renderRowLabel(label, li, row.path) : label}
                    </th>
                  );
                })}
                {row.cells.map((c, ci) => (
                  <PivotTd key={ci}>{renderValue("cell", c, row.path, pivot.columnKeys[ci]!)}</PivotTd>
                ))}
                {showRowTotal ? renderValue("rowTotal", row.total, row.path, "", { "data-total": true }) : null}
              </tr>
            );
          })}
        </tbody>
        {showColumnTotal ? (
          <tfoot>
            <tr className={totalRow}>
              <th scope="row" className={rowLabel} colSpan={rows.length}>
                {totalLabel}
              </th>
              {pivot.columnTotals.map((t, i) => (
                <PivotTd key={i}>{renderValue("columnTotal", t, [], pivot.columnKeys[i]!)}</PivotTd>
              ))}
              {showRowTotal ? renderValue("grandTotal", pivot.grandTotal, [], "", { "data-total": true, "data-grand": true }) : null}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}

/** Keyed passthrough so a list of already-built <td> elements gets stable React keys. */
function PivotTd({ children }: { children: ReactNode }): ReactElement {
  return <>{children}</>;
}
