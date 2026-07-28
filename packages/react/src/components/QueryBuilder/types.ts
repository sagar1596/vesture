export type QueryFieldType = "text" | "number" | "date" | "select";

export interface QueryFieldOption {
  value: string;
  label: string;
}

export interface QueryField {
  key: string;
  label: string;
  type: QueryFieldType;
  /** Required when type is "select". */
  options?: QueryFieldOption[];
}

export type TextOperator = "contains" | "equals" | "startsWith";
export type NumberOperator = "equals" | "gt" | "lt" | "between";
export type DateOperator = "equals" | "before" | "after" | "between";
export type SelectOperator = "equals" | "in";
export type QueryOperator = TextOperator | NumberOperator | DateOperator | SelectOperator;

export interface QueryRule {
  id: string;
  field: string;
  operator: QueryOperator;
  value: unknown;
}

export interface QueryGroup {
  id: string;
  combinator: "and" | "or";
  rules: (QueryRule | QueryGroup)[];
}

export interface QueryBuilderProps {
  fields: QueryField[];
  value: QueryGroup;
  onChange: (group: QueryGroup) => void;
  /**
   * Maximum nesting depth for groups (root counts as depth 1). Unbounded
   * nesting gets unusable fast, so this caps it.
   * @default 3
   */
  maxDepth?: number;
  className?: string;
}

export function isQueryGroup(item: QueryRule | QueryGroup): item is QueryGroup {
  return "combinator" in item;
}
