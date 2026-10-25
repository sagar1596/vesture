import { useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { vars } from "@vesture/tokens";
import {
  axisLine,
  axisTitle,
  emptyState,
  gridLine,
  legend,
  legendItem,
  point as pointClass,
  root,
  swatch,
  tick
} from "./Scatter.css";

export interface ScatterPoint {
  x: number;
  y: number;
  /** Bubble size value; mapped onto `sizeRange`. Omit for uniform dots. */
  size?: number;
  label?: string;
}

export interface ScatterSeries {
  key: string;
  label: string;
  color?: string;
  points: ScatterPoint[];
}

export interface ScatterChartProps {
  series: ScatterSeries[];
  width: number;
  height: number;
  /** Fixed [min, max]; defaults to the (nice-rounded) data extent. */
  xDomain?: [number, number];
  yDomain?: [number, number];
  xLabel?: string;
  yLabel?: string;
  formatX?: (v: number) => string;
  formatY?: (v: number) => string;
  /** Radius (px) of dots without a `size`. */
  pointRadius?: number;
  /** [min, max] radius (px) that `point.size` is scaled into. */
  sizeRange?: [number, number];
  pointOpacity?: number;
  showGrid?: boolean;
  /** Draws a least-squares line per series. */
  trendline?: boolean;
  showLegend?: boolean;
  /** Replaces the default circle. Receives the pixel center and radius. */
  renderPoint?: (info: { point: ScatterPoint; series: ScatterSeries; cx: number; cy: number; r: number; color: string }) => ReactNode;
  onPointClick?: (point: ScatterPoint, series: ScatterSeries) => void;
  className?: string;
}

const SERIES = [
  vars.chart.series1,
  vars.chart.series2,
  vars.chart.series3,
  vars.chart.series4,
  vars.chart.series5,
  vars.chart.series6,
  vars.chart.series7,
  vars.chart.series8
];

const MARGIN = { top: 12, right: 16, bottom: 36, left: 48 };

export function niceDomain(min: number, max: number): [number, number] {
  if (min === max) return [min - 1, max + 1];
  const span = max - min;
  const step = Math.pow(10, Math.floor(Math.log10(span)));
  return [Math.floor(min / step) * step, Math.ceil(max / step) * step];
}

export function linearRegression(pts: { x: number; y: number }[]): { slope: number; intercept: number } | null {
  const n = pts.length;
  if (n < 2) return null;
  const sx = pts.reduce((s, p) => s + p.x, 0);
  const sy = pts.reduce((s, p) => s + p.y, 0);
  const sxy = pts.reduce((s, p) => s + p.x * p.y, 0);
  const sxx = pts.reduce((s, p) => s + p.x * p.x, 0);
  const den = n * sxx - sx * sx;
  if (den === 0) return null;
  const slope = (n * sxy - sx * sy) / den;
  return { slope, intercept: (sy - slope * sx) / n };
}

/** Scatter / bubble chart. Legend entries toggle series visibility. */
export function ScatterChart({
  series,
  width,
  height,
  xDomain,
  yDomain,
  xLabel,
  yLabel,
  formatX = String,
  formatY = String,
  pointRadius = 4,
  sizeRange = [4, 18],
  pointOpacity = 0.75,
  showGrid = true,
  trendline = false,
  showLegend = true,
  renderPoint,
  onPointClick,
  className
}: ScatterChartProps): ReactElement {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const visible = series.filter((s) => !hidden.has(s.key));
  const all = series.flatMap((s) => s.points);

  if (all.length === 0) {
    return (
      <div className={[root, className].filter(Boolean).join(" ")} style={{ width, height }}>
        <div className={emptyState} style={{ width, height }}>
          No data
        </div>
      </div>
    );
  }

  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const [x0, x1] = xDomain ?? niceDomain(Math.min(...xs), Math.max(...xs));
  const [y0, y1] = yDomain ?? niceDomain(Math.min(...ys), Math.max(...ys));
  const sizes = all.map((p) => p.size).filter((s): s is number => s !== undefined);
  const sMin = sizes.length ? Math.min(...sizes) : 0;
  const sMax = sizes.length ? Math.max(...sizes) : 0;
  const plotW = Math.max(1, width - MARGIN.left - MARGIN.right);
  const plotH = Math.max(1, height - MARGIN.top - MARGIN.bottom);
  const sx = (v: number) => MARGIN.left + ((v - x0) / (x1 - x0 || 1)) * plotW;
  const sy = (v: number) => MARGIN.top + plotH - ((v - y0) / (y1 - y0 || 1)) * plotH;
  const radius = (p: ScatterPoint) =>
    p.size === undefined
      ? pointRadius
      : sizeRange[0] + (sMax === sMin ? 0.5 : (p.size - sMin) / (sMax - sMin)) * (sizeRange[1] - sizeRange[0]);
  const ticks = (a: number, b: number) => Array.from({ length: 5 }, (_, i) => a + ((b - a) * i) / 4);
  const colorOf = (s: ScatterSeries) => s.color ?? SERIES[series.indexOf(s) % SERIES.length]!;

  return (
    <div className={[root, className].filter(Boolean).join(" ")} style={{ width }}>
      <svg width={width} height={height} role="img" aria-label="Scatter chart">
        {ticks(y0, y1).map((t) => (
          <g key={`y${t}`}>
            {showGrid ? <line className={gridLine} x1={MARGIN.left} x2={width - MARGIN.right} y1={sy(t)} y2={sy(t)} /> : null}
            <text className={tick} x={MARGIN.left - 6} y={sy(t) + 3} textAnchor="end">
              {formatY(t)}
            </text>
          </g>
        ))}
        {ticks(x0, x1).map((t) => (
          <g key={`x${t}`}>
            {showGrid ? <line className={gridLine} y1={MARGIN.top} y2={MARGIN.top + plotH} x1={sx(t)} x2={sx(t)} /> : null}
            <text className={tick} x={sx(t)} y={MARGIN.top + plotH + 16} textAnchor="middle">
              {formatX(t)}
            </text>
          </g>
        ))}
        <line className={axisLine} x1={MARGIN.left} x2={width - MARGIN.right} y1={MARGIN.top + plotH} y2={MARGIN.top + plotH} />
        <line className={axisLine} x1={MARGIN.left} x2={MARGIN.left} y1={MARGIN.top} y2={MARGIN.top + plotH} />
        {xLabel ? (
          <text className={axisTitle} x={MARGIN.left + plotW / 2} y={height - 4} textAnchor="middle">
            {xLabel}
          </text>
        ) : null}
        {yLabel ? (
          <text className={axisTitle} transform={`translate(12 ${MARGIN.top + plotH / 2}) rotate(-90)`} textAnchor="middle">
            {yLabel}
          </text>
        ) : null}
        {visible.map((s) => {
          const color = colorOf(s);
          const reg = trendline ? linearRegression(s.points) : null;
          return (
            <g key={s.key} data-testid="scatter-series">
              {reg ? (
                <line
                  data-testid="scatter-trendline"
                  x1={sx(x0)}
                  y1={sy(reg.slope * x0 + reg.intercept)}
                  x2={sx(x1)}
                  y2={sy(reg.slope * x1 + reg.intercept)}
                  stroke={color}
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                />
              ) : null}
              {s.points.map((p, i) => {
                const cx = sx(p.x);
                const cy = sy(p.y);
                const r = radius(p);
                return (
                  <g
                    key={i}
                    data-testid="scatter-point"
                    style={onPointClick ? { cursor: "pointer" } : undefined}
                    onClick={onPointClick ? () => onPointClick(p, s) : undefined}
                  >
                    <title>{`${p.label ?? s.label}: ${formatX(p.x)}, ${formatY(p.y)}`}</title>
                    {renderPoint ? (
                      renderPoint({ point: p, series: s, cx, cy, r, color })
                    ) : (
                      <circle className={pointClass} cx={cx} cy={cy} r={r} fill={color} opacity={pointOpacity} />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      {showLegend && series.length > 1 ? (
        <div className={legend}>
          {series.map((s) => (
            <button
              key={s.key}
              type="button"
              className={legendItem}
              aria-pressed={!hidden.has(s.key)}
              style={{ opacity: hidden.has(s.key) ? 0.4 : 1 }}
              onClick={() =>
                setHidden((prev) => {
                  const next = new Set(prev);
                  if (next.has(s.key)) next.delete(s.key);
                  else next.add(s.key);
                  return next;
                })
              }
            >
              <span className={swatch} style={{ background: colorOf(s) }} />
              {s.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
