import type { TreemapDatum, TreemapRect } from "./types";

/** Worst aspect ratio of a row of areas laid along a side of length `side`. */
function worstRatio(areas: number[], side: number): number {
  const sum = areas.reduce((a, b) => a + b, 0);
  const max = Math.max(...areas);
  const min = Math.min(...areas);
  return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
}

/**
 * Squarified treemap layout (Bruls et al.). Non-positive values are dropped; the remaining
 * rectangles tile the width x height box exactly, sorted by descending value.
 */
export function squarify(data: TreemapDatum[], width: number, height: number): TreemapRect[] {
  const items = data.filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const total = items.reduce((s, d) => s + d.value, 0);
  if (items.length === 0 || width <= 0 || height <= 0) return [];

  const scale = (width * height) / total;
  const rects: TreemapRect[] = [];
  let x = 0;
  let y = 0;
  let w = width;
  let h = height;
  let i = 0;

  while (i < items.length) {
    const side = Math.min(w, h);
    const row: TreemapDatum[] = [items[i]!];
    let areas = [items[i]!.value * scale];
    i++;
    while (i < items.length) {
      const next = items[i]!.value * scale;
      if (worstRatio([...areas, next], side) <= worstRatio(areas, side)) {
        row.push(items[i]!);
        areas = [...areas, next];
        i++;
      } else {
        break;
      }
    }
    const rowArea = areas.reduce((a, b) => a + b, 0);
    if (w >= h) {
      // Lay the row as a column on the left edge.
      const colW = rowArea / h;
      let cy = y;
      row.forEach((datum, j) => {
        const rh = areas[j]! / colW;
        rects.push({ datum, x, y: cy, width: colW, height: rh });
        cy += rh;
      });
      x += colW;
      w -= colW;
    } else {
      const rowH = rowArea / w;
      let cx = x;
      row.forEach((datum, j) => {
        const rw = areas[j]! / rowH;
        rects.push({ datum, x: cx, y, width: rw, height: rowH });
        cx += rw;
      });
      y += rowH;
      h -= rowH;
    }
  }
  return rects;
}
