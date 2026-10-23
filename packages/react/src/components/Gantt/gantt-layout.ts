import type { GanttTask } from "./types";

const MS_PER_DAY = 86_400_000;

/** ISO `YYYY-MM-DD` -> whole days since the Unix epoch (UTC, so DST never shifts a day). */
export function parseDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round(Date.UTC(y!, (m ?? 1) - 1, d ?? 1) / MS_PER_DAY);
}

export function formatDay(day: number): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

export interface GanttRow {
  task: GanttTask;
  depth: number;
  hasChildren: boolean;
  /** Day numbers; for summary rows these span the children. */
  start: number;
  end: number;
}

/** Flattens the task tree depth-first, skipping descendants of collapsed tasks. */
export function buildRows(tasks: GanttTask[], collapsed: ReadonlySet<string>): GanttRow[] {
  const byParent = new Map<string | undefined, GanttTask[]>();
  const ids = new Set(tasks.map((t) => t.id));
  for (const t of tasks) {
    // An unknown parent is treated as top-level rather than hiding the task.
    const key = t.parentId && ids.has(t.parentId) ? t.parentId : undefined;
    byParent.set(key, [...(byParent.get(key) ?? []), t]);
  }

  const span = (t: GanttTask): [number, number] => {
    const kids = byParent.get(t.id);
    if (!kids?.length) return [parseDay(t.start), t.type === "milestone" ? parseDay(t.start) : parseDay(t.end)];
    const spans = kids.map(span);
    return [Math.min(...spans.map((s) => s[0])), Math.max(...spans.map((s) => s[1]))];
  };

  const rows: GanttRow[] = [];
  const walk = (parent: string | undefined, depth: number, seen: Set<string>) => {
    for (const task of byParent.get(parent) ?? []) {
      if (seen.has(task.id)) continue; // guards against parentId cycles
      const kids = byParent.get(task.id) ?? [];
      const [start, end] = span(task);
      rows.push({ task, depth, hasChildren: kids.length > 0, start, end });
      if (kids.length > 0 && !collapsed.has(task.id)) walk(task.id, depth + 1, new Set(seen).add(task.id));
    }
  };
  walk(undefined, 0, new Set());
  return rows;
}

/** Inclusive day range to render, padded so bars never touch the edges. */
export function computeRange(rows: GanttRow[], today: number): [number, number] {
  if (rows.length === 0) return [today - 3, today + 20];
  return [Math.min(...rows.map((r) => r.start)) - 2, Math.max(...rows.map((r) => r.end)) + 3];
}

export type DragMode = "move" | "resize-start" | "resize-end";

/** Applies a whole-day delta to a task's span, never letting end precede start. */
export function applyDelta(mode: DragMode, start: number, end: number, delta: number): [number, number] {
  if (mode === "move") return [start + delta, end + delta];
  if (mode === "resize-end") return [start, Math.max(start, end + delta)];
  return [Math.min(end, start + delta), end];
}

export function pixelsToDays(px: number, dayWidth: number): number {
  return Math.round(px / dayWidth);
}

export interface DependencyEdge {
  fromId: string;
  toId: string;
}

/** Edges whose both endpoints are currently visible rows. */
export function collectDependencies(rows: GanttRow[]): DependencyEdge[] {
  const visible = new Set(rows.map((r) => r.task.id));
  return rows.flatMap((r) =>
    (r.task.dependsOn ?? []).filter((id) => visible.has(id)).map((fromId) => ({ fromId, toId: r.task.id }))
  );
}

/** Elbow path from the right edge of one bar to the left edge of another. */
export function dependencyPath(x1: number, y1: number, x2: number, y2: number): string {
  const jog = 8;
  if (x2 >= x1 + jog * 2) return `M${x1},${y1} H${x1 + jog} V${y2} H${x2}`;
  // Target starts before the source ends: detour around via the row gap.
  const midY = y2 > y1 ? y2 - 14 : y2 + 14;
  return `M${x1},${y1} H${x1 + jog} V${midY} H${x2 - jog} V${y2} H${x2}`;
}
