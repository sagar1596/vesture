import { useState } from "react";
import type { ReactElement } from "react";
import { vars } from "@vesture/tokens";
import { axisLabel, emptyState, legend, legendItem, ring, ringLabel, root, spoke, swatch } from "./Radar.css";

export interface RadarAxis {
  key: string;
  label: string;
  /** Per-axis maximum; falls back to `max` then the data maximum. */
  max?: number;
}

export interface RadarSeries {
  key: string;
  label: string;
  color?: string;
  /** One value per axis, in axis order. */
  values: number[];
}

export interface RadarChartProps {
  axes: RadarAxis[];
  series: RadarSeries[];
  /** Outer size (px) of the square drawing area. */
  size?: number;
  /** Shared maximum for every axis without its own `max`. */
  max?: number;
  /** Number of concentric rings. */
  rings?: number;
  /** Ring/outline geometry. */
  shape?: "polygon" | "circle";
  fillOpacity?: number;
  strokeWidth?: number;
  showDots?: boolean;
  showRingLabels?: boolean;
  showLegend?: boolean;
  formatValue?: (v: number) => string;
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

/** Angle for axis `i` of `n`, starting at 12 o'clock and going clockwise. */
export function radarAngle(i: number, n: number): number {
  return -Math.PI / 2 + (i / n) * Math.PI * 2;
}

export function RadarChart({
  axes,
  series,
  size = 360,
  max,
  rings = 4,
  shape = "polygon",
  fillOpacity = 0.2,
  strokeWidth = 2,
  showDots = true,
  showRingLabels = false,
  showLegend = true,
  formatValue = String,
  className
}: RadarChartProps): ReactElement {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const n = axes.length;

  if (n < 3) {
    return (
      <div className={[root, className].filter(Boolean).join(" ")} style={{ width: size }}>
        <div className={emptyState} style={{ width: size, height: size }}>
          Radar needs at least 3 axes
        </div>
      </div>
    );
  }

  const dataMax = Math.max(0, ...series.flatMap((s) => s.values));
  const globalMax = max ?? (dataMax || 1);
  const maxOf = (i: number) => axes[i]!.max ?? globalMax;
  const labelPad = 44;
  const radius = size / 2 - labelPad;
  const c = size / 2;
  const pt = (i: number, frac: number) => {
    const a = radarAngle(i, n);
    return { x: c + Math.cos(a) * radius * frac, y: c + Math.sin(a) * radius * frac };
  };
  const polygon = (frac: number) =>
    axes.map((_, i) => pt(i, frac)).map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join("") + "Z";
  const colorOf = (s: RadarSeries) => s.color ?? SERIES[series.indexOf(s) % SERIES.length]!;

  return (
    <div className={[root, className].filter(Boolean).join(" ")} style={{ width: size }}>
      <svg width={size} height={size} role="img" aria-label="Radar chart">
        {Array.from({ length: rings }, (_, k) => (k + 1) / rings).map((f) =>
          shape === "circle" ? (
            <circle key={f} className={ring} cx={c} cy={c} r={radius * f} />
          ) : (
            <path key={f} className={ring} d={polygon(f)} />
          )
        )}
        {showRingLabels
          ? Array.from({ length: rings }, (_, k) => (k + 1) / rings).map((f) => (
              <text key={`l${f}`} className={ringLabel} x={c + 3} y={c - radius * f - 2}>
                {formatValue(globalMax * f)}
              </text>
            ))
          : null}
        {axes.map((a, i) => {
          const end = pt(i, 1);
          const lab = pt(i, 1.14);
          const cos = Math.cos(radarAngle(i, n));
          return (
            <g key={a.key}>
              <line className={spoke} x1={c} y1={c} x2={end.x} y2={end.y} />
              <text
                className={axisLabel}
                x={lab.x}
                y={lab.y + 4}
                textAnchor={Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end"}
              >
                {a.label}
              </text>
            </g>
          );
        })}
        {series
          .filter((s) => !hidden.has(s.key))
          .map((s) => {
            const color = colorOf(s);
            const pts = axes.map((_, i) => pt(i, Math.max(0, Math.min(1, (s.values[i] ?? 0) / (maxOf(i) || 1)))));
            return (
              <g key={s.key} data-testid="radar-series">
                <path
                  d={pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join("") + "Z"}
                  fill={color}
                  fillOpacity={fillOpacity}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeLinejoin="round"
                />
                {showDots
                  ? pts.map((p, i) => (
                      <circle key={i} data-testid="radar-dot" cx={p.x} cy={p.y} r={3} fill={color}>
                        <title>{`${s.label} · ${axes[i]!.label}: ${formatValue(s.values[i] ?? 0)}`}</title>
                      </circle>
                    ))
                  : null}
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
