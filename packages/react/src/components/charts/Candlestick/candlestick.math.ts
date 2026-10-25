export interface Candle {
  /** Any sortable label shown on the x axis / crosshair (ISO date recommended). */
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/** Simple moving average; entries before the window fills are null. */
export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i]!;
    if (i >= period) sum -= values[i - period]!;
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}

/** Exponential moving average seeded with the SMA of the first window. */
export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(null);
    } else if (i === period - 1) {
      prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
      out.push(prev);
    } else {
      prev = values[i]! * k + prev! * (1 - k);
      out.push(prev);
    }
  }
  return out;
}

/** Clamps a [start, end) window into [0, length] keeping at least `min` candles. */
export function clampRange(range: [number, number], length: number, min: number): [number, number] {
  const size = Math.min(length, Math.max(Math.min(min, length), Math.round(range[1] - range[0])));
  const start = Math.max(0, Math.min(length - size, Math.round(range[0])));
  return [start, start + size];
}
