import { isQueryGroup } from "./types";
import type { QueryGroup, QueryRule } from "./types";

function isDateRangeValue(value: unknown): value is { start: unknown; end: unknown } {
  return typeof value === "object" && value !== null && ("start" in value || "end" in value);
}

function formatScalar(value: unknown): string {
  if (value === null || value === undefined || value === "") return "?";
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === "string") return `'${value}'`;
  return String(value);
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(formatScalar).join(" and ");
  if (isDateRangeValue(value)) return `${formatScalar(value.start)} and ${formatScalar(value.end)}`;
  return formatScalar(value);
}

function ruleToString(rule: QueryRule): string {
  return `${rule.field} ${rule.operator} ${formatValue(rule.value)}`;
}

/** Serializes a QueryGroup into a human-readable string, e.g. "(status equals 'Active' AND age gt 25) OR department equals 'Engineering'". */
export function queryToString(group: QueryGroup): string {
  if (group.rules.length === 0) return "";
  const parts = group.rules.map((item) =>
    isQueryGroup(item) ? `(${queryToString(item)})` : ruleToString(item)
  );
  return parts.join(` ${group.combinator.toUpperCase()} `);
}
