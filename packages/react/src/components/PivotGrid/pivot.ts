export type PivotBuiltinAggregate = "sum" | "count" | "avg" | "min" | "max";
/** A built-in aggregate, or your own reducer over every numeric value in the group (e.g. median, distinct count). */
export type PivotAggregate = PivotBuiltinAggregate | ((values: number[]) => number);

interface Acc {
  sum: number;
  count: number;
  min: number;
  max: number;
  /** Only collected for custom aggregates. */
  values?: number[];
}

const emptyAcc = (keepValues: boolean): Acc => ({
  sum: 0,
  count: 0,
  min: Infinity,
  max: -Infinity,
  values: keepValues ? [] : undefined
});

function add(acc: Acc, n: number) {
  acc.values?.push(n);
  acc.sum += n;
  acc.count += 1;
  if (n < acc.min) acc.min = n;
  if (n > acc.max) acc.max = n;
}

function finish(acc: Acc | undefined, agg: PivotAggregate): number | null {
  if (!acc || acc.count === 0) return null;
  if (typeof agg === "function") return agg(acc.values ?? []);
  switch (agg) {
    case "sum": return acc.sum;
    case "count": return acc.count;
    case "avg": return acc.sum / acc.count;
    case "min": return acc.min;
    case "max": return acc.max;
  }
}

export interface PivotRow {
  /** One label per row field, outermost first. */
  path: string[];
  cells: (number | null)[];
  total: number | null;
}

export interface PivotResult {
  columnKeys: string[];
  rows: PivotRow[];
  columnTotals: (number | null)[];
  grandTotal: number | null;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

export interface PivotOptions<T> {
  rows: (keyof T)[];
  columns?: keyof T;
  value?: keyof T;
  aggregate: PivotAggregate;
  /** Orders row groups; receives two row paths. Defaults to natural (numeric-aware) ordering. */
  sortRows?: (a: string[], b: string[]) => number;
  /** Orders column keys. Defaults to natural ordering. */
  sortColumns?: (a: string, b: string) => number;
  /** Explicit column order; keys not listed follow, sorted. */
  columnOrder?: string[];
}

/**
 * Cross-tabulates flat records. Totals are aggregated from the underlying records, not from the
 * displayed cells, so an `avg` total is a true average rather than an average of averages.
 * Records whose value isn't numeric still count toward `count` but are skipped by other aggregates.
 */
export function buildPivot<T extends Record<string, unknown>>(data: T[], opts: PivotOptions<T>): PivotResult {
  const { rows: rowFields, columns: colField, value: valueField, aggregate, sortRows, sortColumns, columnOrder } = opts;
  const keep = typeof aggregate === "function";
  const label = (v: unknown) => (v === null || v === undefined || v === "" ? "(blank)" : String(v));

  const distinct = colField ? [...new Set(data.map((d) => label(d[colField])))] : ["Value"];
  const columnKeys = colField
    ? [
        ...(columnOrder ?? []).filter((k) => distinct.includes(k)),
        ...distinct.filter((k) => !columnOrder?.includes(k)).sort(sortColumns ?? collator.compare)
      ]
    : distinct;
  const colIndex = new Map(columnKeys.map((k, i) => [k, i]));

  const rowMap = new Map<string, { path: string[]; cells: Map<number, Acc>; total: Acc }>();
  const colTotals = columnKeys.map(() => emptyAcc(keep));
  const grand = emptyAcc(keep);

  for (const rec of data) {
    let n: number;
    if (aggregate === "count") n = 1;
    else {
      const raw = valueField ? rec[valueField] : undefined;
      n = typeof raw === "number" ? raw : Number(raw);
      if (raw === null || raw === undefined || raw === "" || Number.isNaN(n)) continue;
    }
    const path = rowFields.map((f) => label(rec[f]));
    const rowKey = JSON.stringify(path);
    let row = rowMap.get(rowKey);
    if (!row) {
      row = { path, cells: new Map(), total: emptyAcc(keep) };
      rowMap.set(rowKey, row);
    }
    const ci = colField ? colIndex.get(label(rec[colField]))! : 0;
    let cell = row.cells.get(ci);
    if (!cell) {
      cell = emptyAcc(keep);
      row.cells.set(ci, cell);
    }
    add(cell, n);
    add(row.total, n);
    add(colTotals[ci]!, n);
    add(grand, n);
  }

  const rows = [...rowMap.values()]
    .sort((a, b) => {
      if (sortRows) return sortRows(a.path, b.path);
      for (let i = 0; i < a.path.length; i++) {
        const c = collator.compare(a.path[i]!, b.path[i]!);
        if (c !== 0) return c;
      }
      return 0;
    })
    .map<PivotRow>((r) => ({
      path: r.path,
      cells: columnKeys.map((_, i) => finish(r.cells.get(i), aggregate)),
      total: finish(r.total, aggregate)
    }));

  return {
    columnKeys,
    rows,
    columnTotals: colTotals.map((a) => finish(a, aggregate)),
    grandTotal: finish(grand, aggregate)
  };
}
