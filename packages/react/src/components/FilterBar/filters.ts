export type FilterFieldType = "text" | "number" | "select" | "date" | "boolean";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterField {
  key: string;
  label: string;
  type: FilterFieldType;
  /** Required for `select`. */
  options?: FilterOption[];
  /** Restrict the operators offered for this field. */
  operators?: string[];
}

export interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface FilterOperator {
  key: string;
  label: string;
}

export const OPERATORS: Record<FilterFieldType, FilterOperator[]> = {
  text: [
    { key: "contains", label: "contains" },
    { key: "notContains", label: "does not contain" },
    { key: "equals", label: "is" },
    { key: "startsWith", label: "starts with" },
    { key: "endsWith", label: "ends with" }
  ],
  number: [
    { key: "eq", label: "=" },
    { key: "neq", label: "≠" },
    { key: "gt", label: ">" },
    { key: "gte", label: "≥" },
    { key: "lt", label: "<" },
    { key: "lte", label: "≤" }
  ],
  select: [
    { key: "is", label: "is" },
    { key: "isNot", label: "is not" }
  ],
  date: [
    { key: "on", label: "is" },
    { key: "before", label: "is before" },
    { key: "after", label: "is after" }
  ],
  boolean: [{ key: "is", label: "is" }]
};

export function operatorsFor(field: FilterField): FilterOperator[] {
  const all = OPERATORS[field.type];
  return field.operators ? all.filter((o) => field.operators!.includes(o.key)) : all;
}

export function defaultOperator(field: FilterField): string {
  return operatorsFor(field)[0]?.key ?? "";
}

/** Tests one cell value against a condition. Empty condition values never filter anything out. */
export function matches(cell: unknown, field: FilterField, operator: string, value: string): boolean {
  if (value === "" && field.type !== "boolean") return true;
  switch (field.type) {
    case "text": {
      const a = String(cell ?? "").toLowerCase();
      const b = value.toLowerCase();
      if (operator === "contains") return a.includes(b);
      if (operator === "notContains") return !a.includes(b);
      if (operator === "equals") return a === b;
      if (operator === "startsWith") return a.startsWith(b);
      if (operator === "endsWith") return a.endsWith(b);
      return true;
    }
    case "number": {
      const a = Number(cell);
      const b = Number(value);
      if (Number.isNaN(a) || Number.isNaN(b)) return false;
      if (operator === "eq") return a === b;
      if (operator === "neq") return a !== b;
      if (operator === "gt") return a > b;
      if (operator === "gte") return a >= b;
      if (operator === "lt") return a < b;
      if (operator === "lte") return a <= b;
      return true;
    }
    case "select":
      return operator === "isNot" ? String(cell) !== value : String(cell) === value;
    case "boolean":
      return String(Boolean(cell)) === (value || "true");
    case "date": {
      const a = String(cell ?? "").slice(0, 10);
      if (operator === "on") return a === value;
      if (operator === "before") return a !== "" && a < value;
      if (operator === "after") return a !== "" && a > value;
      return true;
    }
  }
}

/** Filters rows so they satisfy every condition (AND). Conditions referencing unknown fields are ignored. */
export function applyFilters<T extends Record<string, unknown>>(rows: T[], conditions: FilterCondition[], fields: FilterField[]): T[] {
  const byKey = new Map(fields.map((f) => [f.key, f]));
  return rows.filter((row) =>
    conditions.every((c) => {
      const field = byKey.get(c.field);
      return field ? matches(row[c.field], field, c.operator, c.value) : true;
    })
  );
}

export function describeValue(field: FilterField, value: string): string {
  if (field.type === "select") return field.options?.find((o) => o.value === value)?.label ?? value;
  if (field.type === "boolean") return value === "false" ? "No" : "Yes";
  return value;
}
