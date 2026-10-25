import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent, ReactElement } from "react";
import { vars } from "@vesture/tokens";
import { clampRange, ema, sma } from "./candlestick.math";
import type { Candle } from "./candlestick.math";
import { axisLine, crosshair, emptyState, gridLine, readout, root, surface, tick } from "./Candlestick.css";

export type CandlestickType = "candle" | "ohlc" | "line";

export interface CandlestickIndicator {
  kind: "sma" | "ema";
  period: number;
  color?: string;
}

export interface CandlestickChartProps {
  data: Candle[];
  width: number;
  height: number;
  /** Candle bodies, OHLC ticks, or a close-price line. */
  type?: CandlestickType;
  upColor?: string;
  downColor?: string;
  /** Draw up-candles hollow (outline only). */
  hollowUp?: boolean;
  showVolume?: boolean;
  /** Fraction of the height reserved for volume bars. */
  volumeRatio?: number;
  indicators?: CandlestickIndicator[];
  showCrosshair?: boolean;
  /** Show the OHLC readout row above the chart. */
  showReadout?: boolean;
  formatPrice?: (v: number) => string;
  formatVolume?: (v: number) => string;
  /** Controlled visible window `[start, end)` as candle indices. */
  visibleRange?: [number, number];
  defaultVisibleRange?: [number, number];
  onVisibleRangeChange?: (range: [number, number]) => void;
  /** Smallest number of candles zoom can reach. */
  minVisible?: number;
  className?: string;
}

const INDICATOR_COLORS = [vars.chart.series3, vars.chart.series4, vars.chart.series5, vars.chart.series6];
const M = { top: 8, right: 56, bottom: 22, left: 8 };

const niceCompact = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}k` : String(v));

/**
 * OHLC / candlestick chart with volume, SMA/EMA overlays, a crosshair readout and pan/zoom
 * (drag, wheel, ←/→ to pan, +/− to zoom).
 */
export function CandlestickChart({
  data,
  width,
  height,
  type = "candle",
  upColor = vars.color.success,
  downColor = vars.color.danger,
  hollowUp = false,
  showVolume = true,
  volumeRatio = 0.22,
  indicators = [],
  showCrosshair = true,
  showReadout = true,
  formatPrice = (v) => v.toFixed(2),
  formatVolume = niceCompact,
  visibleRange,
  defaultVisibleRange,
  onVisibleRangeChange,
  minVisible = 10,
  className
}: CandlestickChartProps): ReactElement {
  const n = data.length;
  const [uncontrolled, setUncontrolled] = useState<[number, number]>(defaultVisibleRange ?? [0, n]);
  const rawRange = visibleRange ?? uncontrolled;
  const range = clampRange(rawRange[1] === 0 && n > 0 ? [0, n] : rawRange, n, minVisible);
  const [hover, setHover] = useState<number | null>(null);
  const drag = useRef<{ x: number; start: number } | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const latest = useRef({ range, n, minVisible });
  latest.current = { range, n, minVisible };

  const setRange = (next: [number, number]) => {
    const c = clampRange(next, n, minVisible);
    if (visibleRange === undefined) setUncontrolled(c);
    onVisibleRangeChange?.(c);
  };
  const setRangeRef = useRef(setRange);
  setRangeRef.current = setRange;

  // Wheel needs a non-passive listener so we can stop the page from scrolling while zooming.
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const { range: r, n: len } = latest.current;
      if (len === 0) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const frac = Math.min(1, Math.max(0, (e.clientX - rect.left - M.left) / Math.max(1, rect.width - M.left - M.right)));
      const size = r[1] - r[0];
      const nextSize = size * (e.deltaY > 0 ? 1.15 : 1 / 1.15);
      const anchor = r[0] + size * frac;
      const start = anchor - nextSize * frac;
      setRangeRef.current([start, start + nextSize]);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  if (n === 0) {
    return (
      <div className={[root, className].filter(Boolean).join(" ")} style={{ width, height }}>
        <div className={emptyState} style={{ width, height }}>
          No data
        </div>
      </div>
    );
  }

  const [from, to] = range;
  const slice = data.slice(from, to);
  const count = slice.length;
  const plotW = Math.max(1, width - M.left - M.right);
  const totalH = Math.max(1, height - M.top - M.bottom);
  const volH = showVolume ? totalH * volumeRatio : 0;
  const priceH = totalH - volH - (showVolume ? 6 : 0);
  const lo = Math.min(...slice.map((c) => c.low));
  const hi = Math.max(...slice.map((c) => c.high));
  const pad = (hi - lo || 1) * 0.06;
  const p0 = lo - pad;
  const p1 = hi + pad;
  const maxVol = Math.max(1, ...slice.map((c) => c.volume ?? 0));
  const band = plotW / count;
  const bodyW = Math.max(1, Math.min(18, band * 0.7));
  const xAt = (i: number) => M.left + band * (i + 0.5);
  const yAt = (v: number) => M.top + priceH - ((v - p0) / (p1 - p0)) * priceH;
  const volY = (v: number) => M.top + totalH - (v / maxVol) * volH;
  const closes = data.map((c) => c.close);
  const overlays = indicators.map((ind, k) => ({
    ind,
    color: ind.color ?? INDICATOR_COLORS[k % INDICATOR_COLORS.length]!,
    values: (ind.kind === "sma" ? sma : ema)(closes, ind.period).slice(from, to)
  }));
  const gridTicks = Array.from({ length: 5 }, (_, i) => p0 + ((p1 - p0) * i) / 4);
  const labelEvery = Math.max(1, Math.ceil(count / Math.max(2, Math.floor(plotW / 90))));
  const active = hover !== null && hover < count ? slice[hover]! : slice[count - 1]!;
  const colorFor = (c: Candle) => (c.close >= c.open ? upColor : downColor);

  const indexFromEvent = (e: { clientX: number; currentTarget: HTMLElement }) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return Math.min(count - 1, Math.max(0, Math.floor((e.clientX - rect.left - M.left) / band)));
  };
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.focus();
    drag.current = { x: e.clientX, start: range[0] };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* not implemented in every DOM env */
    }
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    setHover(indexFromEvent(e));
    if (drag.current) {
      const shift = Math.round((drag.current.x - e.clientX) / band);
      const size = range[1] - range[0];
      setRange([drag.current.start + shift, drag.current.start + shift + size]);
    }
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const size = range[1] - range[0];
    const step = Math.max(1, Math.round(size / 10));
    if (e.key === "ArrowLeft") setRange([range[0] - step, range[1] - step]);
    else if (e.key === "ArrowRight") setRange([range[0] + step, range[1] + step]);
    else if (e.key === "+" || e.key === "=") setRange([range[0] + step, range[1] - step]);
    else if (e.key === "-") setRange([range[0] - step, range[1] + step]);
    else return;
    e.preventDefault();
  };

  const linePath = slice.map((c, i) => `${i ? "L" : "M"}${xAt(i)},${yAt(c.close)}`).join("");

  return (
    <div className={[root, className].filter(Boolean).join(" ")} style={{ width }}>
      {showReadout ? (
        <div className={readout} data-testid="candlestick-readout">
          <span>{active.time}</span>
          <span>O {formatPrice(active.open)}</span>
          <span>H {formatPrice(active.high)}</span>
          <span>L {formatPrice(active.low)}</span>
          <span style={{ color: colorFor(active) }}>C {formatPrice(active.close)}</span>
          {active.volume !== undefined ? <span>Vol {formatVolume(active.volume)}</span> : null}
        </div>
      ) : null}
      <div
        ref={surfaceRef}
        className={surface}
        tabIndex={0}
        role="group"
        aria-label="Price chart. Arrow keys pan, plus and minus zoom."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKeyDown}
        style={{ width, height }}
      >
        <svg width={width} height={height}>
          {gridTicks.map((t) => (
            <g key={t}>
              <line className={gridLine} x1={M.left} x2={width - M.right} y1={yAt(t)} y2={yAt(t)} />
              <text className={tick} x={width - M.right + 6} y={yAt(t) + 3}>
                {formatPrice(t)}
              </text>
            </g>
          ))}
          <line className={axisLine} x1={M.left} x2={width - M.right} y1={M.top + totalH} y2={M.top + totalH} />
          {slice.map((c, i) =>
            i % labelEvery === 0 ? (
              <text key={c.time} className={tick} x={xAt(i)} y={height - 6} textAnchor="middle">
                {c.time}
              </text>
            ) : null
          )}
          {showVolume
            ? slice.map((c, i) => (
                <rect
                  key={`v${c.time}`}
                  x={xAt(i) - bodyW / 2}
                  y={volY(c.volume ?? 0)}
                  width={bodyW}
                  height={Math.max(0, M.top + totalH - volY(c.volume ?? 0))}
                  fill={colorFor(c)}
                  opacity={0.35}
                />
              ))
            : null}
          {type === "line" ? (
            <path d={linePath} fill="none" stroke={upColor} strokeWidth={2} strokeLinejoin="round" />
          ) : (
            slice.map((c, i) => {
              const color = colorFor(c);
              const x = xAt(i);
              const up = c.close >= c.open;
              if (type === "ohlc") {
                return (
                  <g key={c.time} data-testid="candlestick-candle" stroke={color} strokeWidth={1.5}>
                    <line x1={x} x2={x} y1={yAt(c.high)} y2={yAt(c.low)} />
                    <line x1={x - bodyW / 2} x2={x} y1={yAt(c.open)} y2={yAt(c.open)} />
                    <line x1={x} x2={x + bodyW / 2} y1={yAt(c.close)} y2={yAt(c.close)} />
                  </g>
                );
              }
              const top = yAt(Math.max(c.open, c.close));
              const h = Math.max(1, Math.abs(yAt(c.open) - yAt(c.close)));
              return (
                <g key={c.time} data-testid="candlestick-candle" data-direction={up ? "up" : "down"}>
                  <line x1={x} x2={x} y1={yAt(c.high)} y2={yAt(c.low)} stroke={color} strokeWidth={1} />
                  <rect
                    x={x - bodyW / 2}
                    y={top}
                    width={bodyW}
                    height={h}
                    fill={hollowUp && up ? "none" : color}
                    stroke={color}
                    strokeWidth={1}
                  />
                </g>
              );
            })
          )}
          {overlays.map(({ ind, color, values }) => {
            let d = "";
            values.forEach((v, i) => {
              if (v === null) return;
              d += `${d ? "L" : "M"}${xAt(i)},${yAt(v)}`;
            });
            return d ? (
              <path
                key={`${ind.kind}${ind.period}`}
                data-testid="candlestick-indicator"
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
              />
            ) : null;
          })}
          {showCrosshair && hover !== null && hover < count ? (
            <g data-testid="candlestick-crosshair">
              <line className={crosshair} x1={xAt(hover)} x2={xAt(hover)} y1={M.top} y2={M.top + totalH} />
              <line className={crosshair} x1={M.left} x2={width - M.right} y1={yAt(slice[hover]!.close)} y2={yAt(slice[hover]!.close)} />
            </g>
          ) : null}
        </svg>
      </div>
    </div>
  );
}
