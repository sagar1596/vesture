import type { QueryFieldType, QueryOperator } from "./types";

interface OperatorOption {
  value: QueryOperator;
  label: string;
}

/** Which operators are valid for each field type — e.g. "contains" never applies to a number field. */
export const OPERATORS_BY_TYPE: Record<QueryFieldType, OperatorOption[]> = {
  text: [
    { value: "contains", label: "contains" },
    { value: "equals", label: "equals" },
    { value: "startsWith", label: "starts with" }
  ],
  number: [
    { value: "equals", label: "equals" },
    { value: "gt", label: "greater than" },
    { value: "lt", label: "less than" },
    { value: "between", label: "between" }
  ],
  date: [
    { value: "equals", label: "equals" },
    { value: "before", label: "before" },
    { value: "after", label: "after" },
    { value: "between", label: "between" }
  ],
  select: [
    { value: "equals", label: "equals" },
    { value: "in", label: "in" }
  ]
};

export function defaultOperatorForType(type: QueryFieldType): QueryOperator {
  return OPERATORS_BY_TYPE[type][0]!.value;
}

export function isOperatorValidForType(type: QueryFieldType, operator: QueryOperator): boolean {
  return OPERATORS_BY_TYPE[type].some((o) => o.value === operator);
}

/** A sensible empty value for a fresh field/operator combination. */
export function defaultValueForOperator(type: QueryFieldType, operator: QueryOperator): unknown {
  if (operator === "between") {
    return type === "date" ? { start: null, end: null } : [null, null];
  }
  if (operator === "in") return [];
  if (type === "number") return null;
  if (type === "date") return null;
  return "";
}
