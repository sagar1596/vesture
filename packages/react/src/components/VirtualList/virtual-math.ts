/** offsets[i] = top of item i; offsets[n] = total content height. */
export function buildOffsets(sizes: number[], gap: number): number[] {
  const offsets = new Array<number>(sizes.length + 1);
  offsets[0] = 0;
  for (let i = 0; i < sizes.length; i++) offsets[i + 1] = offsets[i]! + sizes[i]! + (i < sizes.length - 1 ? gap : 0);
  return offsets;
}

/** Index of the item that contains `y` (clamped). */
export function findIndex(offsets: number[], y: number): number {
  const n = offsets.length - 1;
  if (n <= 0) return 0;
  let lo = 0;
  let hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (offsets[mid]! <= y) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function visibleRange(offsets: number[], scrollTop: number, viewport: number, overscan: number): [number, number] {
  const n = offsets.length - 1;
  if (n <= 0) return [0, 0];
  const first = findIndex(offsets, scrollTop);
  const last = findIndex(offsets, scrollTop + viewport);
  return [Math.max(0, first - overscan), Math.min(n, last + 1 + overscan)];
}

export function scrollTopFor(
  offsets: number[],
  index: number,
  viewport: number,
  align: "start" | "center" | "end" | "auto",
  current: number
): number {
  const top = offsets[index] ?? 0;
  const size = (offsets[index + 1] ?? top) - top;
  const total = offsets[offsets.length - 1] ?? 0;
  const max = Math.max(0, total - viewport);
  let target = top;
  if (align === "center") target = top - (viewport - size) / 2;
  else if (align === "end") target = top - (viewport - size);
  else if (align === "auto") {
    if (top < current) target = top;
    else if (top + size > current + viewport) target = top - (viewport - size);
    else target = current;
  }
  return Math.min(max, Math.max(0, target));
}
