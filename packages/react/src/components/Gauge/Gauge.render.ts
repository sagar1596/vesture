export const GAUGE_START_ANGLE = 135;
export const GAUGE_SWEEP = 270;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 0..1 position of `value` within [min, max]; a degenerate range maps to 0. */
export function valueToFraction(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return (clamp(value, min, max) - min) / (max - min);
}

export function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** SVG arc path between two angles (degrees, clockwise from 3 o'clock). */
export function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M${start.x.toFixed(2)},${start.y.toFixed(2)} A${r},${r} 0 ${largeArc} 1 ${end.x.toFixed(2)},${end.y.toFixed(2)}`;
}

export interface GaugeRange {
  from: number;
  to: number;
  /** Any CSS color. */
  color: string;
}

/** The color of the first range containing `value`, if any. */
export function colorForValue(value: number, ranges: GaugeRange[] | undefined): string | undefined {
  return ranges?.find((r) => value >= r.from && value <= r.to)?.color;
}

/** Angle in degrees for `fraction` of the way along a dial that starts at `startAngle` and sweeps `sweep`. */
export function fractionToAngle(fraction: number, startAngle = GAUGE_START_ANGLE, sweep = GAUGE_SWEEP): number {
  return startAngle + sweep * fraction;
}

/** Evenly spaced tick values from min to max, `count` ticks inclusive of both ends. */
export function tickValues(min: number, max: number, count: number): number[] {
  if (count < 2) return [min];
  return Array.from({ length: count }, (_, i) => min + ((max - min) * i) / (count - 1));
}
