/** Min/max over every finite cell; null when the matrix has none. */
export function matrixExtent(values: (number | null)[][]): [number, number] | null {
  let min = Infinity;
  let max = -Infinity;
  for (const row of values) {
    for (const v of row) {
      if (v === null || !Number.isFinite(v)) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  return min === Infinity ? null : [min, max];
}

/** 0..1 intensity of `value` within `extent`; a constant matrix renders at full intensity. */
export function intensity(value: number, extent: [number, number]): number {
  const [min, max] = extent;
  if (max === min) return 1;
  return (value - min) / (max - min);
}

/** Linearly interpolates the opacity of a single color; the default `colorScale`. */
export function defaultOpacity(t: number): number {
  return 0.08 + t * 0.92;
}
