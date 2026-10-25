export interface GridItem {
  id: string;
  /** Column / row position in grid cells. */
  x: number;
  y: number;
  /** Size in grid cells. */
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  /** Static items never move on their own and can't be dragged or resized. */
  static?: boolean;
}

export function collides(a: GridItem, b: GridItem): boolean {
  if (a.id === b.id) return false;
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const byPosition = (a: GridItem, b: GridItem) => a.y - b.y || a.x - b.x;

/** Keeps an item inside the grid and within its own size limits. */
export function clampItem(item: GridItem, cols: number): GridItem {
  const minW = item.minW ?? 1;
  const minH = item.minH ?? 1;
  const w = Math.min(cols, Math.max(minW, Math.min(item.maxW ?? cols, item.w)));
  const h = Math.max(minH, Math.min(item.maxH ?? Infinity, item.h));
  return { ...item, w, h, x: Math.max(0, Math.min(cols - w, item.x)), y: Math.max(0, item.y) };
}

/** Vertical gravity: every non-static item floats up until it hits the top or another item. */
export function compact(items: GridItem[]): GridItem[] {
  const placed: GridItem[] = items.filter((i) => i.static);
  const result = new Map<string, GridItem>(placed.map((i) => [i.id, i]));
  for (const item of items.filter((i) => !i.static).sort(byPosition)) {
    let next = { ...item, y: 0 };
    while (placed.some((p) => collides(next, p))) next = { ...next, y: next.y + 1 };
    placed.push(next);
    result.set(item.id, next);
  }
  return items.map((i) => result.get(i.id)!);
}

/** Pushes anything overlapping `moved` downward, cascading. Static items are never moved. */
function resolve(items: GridItem[], movedId: string): GridItem[] {
  const map = new Map(items.map((i) => [i.id, i]));
  const queue = [movedId];
  let guard = 0;
  while (queue.length && guard++ < 2000) {
    const current = map.get(queue.shift()!)!;
    for (const other of [...map.values()].sort(byPosition)) {
      if (other.static || !collides(current, other)) continue;
      map.set(other.id, { ...other, y: current.y + current.h });
      queue.push(other.id);
    }
  }
  return items.map((i) => map.get(i.id)!);
}

function place(items: GridItem[], next: GridItem, cols: number, doCompact: boolean): GridItem[] {
  const clamped = clampItem(next, cols);
  const replaced = items.map((i) => (i.id === clamped.id ? clamped : i));
  const resolved = resolve(replaced, clamped.id);
  return doCompact ? compact(resolved) : resolved;
}

export function moveItem(items: GridItem[], id: string, x: number, y: number, cols: number, doCompact = true): GridItem[] {
  const item = items.find((i) => i.id === id);
  if (!item || item.static) return items;
  return place(items, { ...item, x, y }, cols, doCompact);
}

export function resizeItem(items: GridItem[], id: string, w: number, h: number, cols: number, doCompact = true): GridItem[] {
  const item = items.find((i) => i.id === id);
  if (!item || item.static) return items;
  // A resize may not push the right edge outside the grid.
  return place(items, { ...item, w: Math.min(w, cols - item.x), h }, cols, doCompact);
}

/** Clamps every item and resolves any overlaps already in the input. */
export function normalizeLayout(items: GridItem[], cols: number, doCompact = true): GridItem[] {
  let out = items.map((i) => clampItem(i, cols));
  for (const item of [...out].sort(byPosition)) out = resolve(out, item.id);
  return doCompact ? compact(out) : out;
}

export function layoutHeightInRows(items: GridItem[]): number {
  return items.reduce((m, i) => Math.max(m, i.y + i.h), 0);
}
