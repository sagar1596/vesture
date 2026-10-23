export interface SparklinePoint {
  x: number;
  y: number;
}

export type SparklineCurve = "linear" | "smooth" | "step";

export interface SparklineDomain {
  min?: number;
  max?: number;
}

/**
 * Maps values onto a `width` x `height` box (with `pad` inset), higher values toward the top.
 * `domain` pins either end of the y-scale (e.g. `{ min: 0 }` so a bar series starts at zero).
 */
export function computeSparklinePoints(
  values: number[],
  width: number,
  height: number,
  pad = 2,
  domain: SparklineDomain = {}
): SparklinePoint[] {
  if (values.length === 0) return [];
  const min = domain.min ?? Math.min(...values);
  const max = domain.max ?? Math.max(...values);
  const range = max - min || 1;
  const innerW = Math.max(0, width - pad * 2);
  const innerH = Math.max(0, height - pad * 2);
  return values.map((v, i) => ({
    x: pad + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW),
    // A flat series sits mid-height rather than on the floor.
    y:
      max === min
        ? pad + innerH / 2
        : pad + innerH - ((Math.min(max, Math.max(min, v)) - min) / range) * innerH
  }));
}

/** Maps a data value to a y pixel using the same scale as `computeSparklinePoints`. */
export function valueToY(value: number, values: number[], height: number, pad = 2, domain: SparklineDomain = {}): number {
  const [p] = computeSparklinePoints([value, ...values], 1, height, pad, {
    min: domain.min ?? Math.min(...values),
    max: domain.max ?? Math.max(...values)
  });
  return p?.y ?? height / 2;
}

export function pointsToPath(points: SparklinePoint[], curve: SparklineCurve = "linear"): string {
  if (points.length === 0) return "";
  const f = (n: number) => n.toFixed(2);
  const [first, ...rest] = points;
  let d = `M${f(first!.x)},${f(first!.y)}`;
  if (curve === "step") {
    for (const p of rest) d += ` H${f(p.x)} V${f(p.y)}`;
    return d;
  }
  if (curve === "smooth" && points.length > 2) {
    // Catmull-Rom -> cubic Bezier, tension 1/6.
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i]!;
      const p1 = points[i]!;
      const p2 = points[i + 1]!;
      const p3 = points[i + 2] ?? p2;
      d += ` C${f(p1.x + (p2.x - p0.x) / 6)},${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)},${f(
        p2.y - (p3.y - p1.y) / 6
      )} ${f(p2.x)},${f(p2.y)}`;
    }
    return d;
  }
  for (const p of rest) d += ` L${f(p.x)},${f(p.y)}`;
  return d;
}
