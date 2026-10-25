import type { ReactElement } from "react";
import { vars } from "@vesture/tokens";
import { axisLine, barLabel, connector, emptyState, gridLine, root, tick } from "./Waterfall.css";

export interface WaterfallDatum {
  key: string;
  label: string;
  value: number;
  /** `delta` (default) floats from the running total; `total` is anchored at 0 and, if `value` is 0, shows the running total. */
  type?: "delta" | "total";
}

export interface WaterfallBar {
  datum: WaterfallDatum;
  start: number;
  end: number;
}

export interface WaterfallChartProps {
  data: WaterfallDatum[];
  width: number;
  height: number;
  formatValue?: (v: number) => string;
  /** Colors by kind. Default to success / danger / primary tokens. */
  positiveColor?: string;
  negativeColor?: string;
  totalColor?: string;
  showConnectors?: boolean;
  showLabels?: boolean;
  /** Inner padding between bars, 0–1 of the band width. */
  barGap?: number;
  barRadius?: number;
  onBarClick?: (datum: WaterfallDatum) => void;
  className?: string;
}

/** Turns deltas/totals into floating bars with start/end positions. */
export function buildWaterfall(data: WaterfallDatum[]): WaterfallBar[] {
  let running = 0;
  return data.map((d) => {
    if (d.type === "total") {
      const end = d.value === 0 ? running : d.value;
      running = end;
      return { datum: d, start: 0, end };
    }
    const start = running;
    running += d.value;
    return { datum: d, start, end: running };
  });
}

export function WaterfallChart({
  data,
  width,
  height,
  formatValue = String,
  positiveColor = vars.color.success,
  negativeColor = vars.color.danger,
  totalColor = vars.color.primary,
  showConnectors = true,
  showLabels = true,
  barGap = 0.3,
  barRadius = 2,
  onBarClick,
  className
}: WaterfallChartProps): ReactElement {
  if (data.length === 0) {
    return (
      <div className={[root, className].filter(Boolean).join(" ")} style={{ width, height }}>
        <div className={emptyState} style={{ width, height }}>
          No data
        </div>
      </div>
    );
  }
  const bars = buildWaterfall(data);
  const m = { top: 20, right: 12, bottom: 28, left: 48 };
  const values = bars.flatMap((b) => [b.start, b.end]).concat(0);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const plotW = Math.max(1, width - m.left - m.right);
  const plotH = Math.max(1, height - m.top - m.bottom);
  const sy = (v: number) => m.top + plotH - ((v - lo) / (hi - lo || 1)) * plotH;
  const band = plotW / bars.length;
  const bw = band * (1 - barGap);
  const gridTicks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);

  return (
    <div className={[root, className].filter(Boolean).join(" ")} style={{ width }}>
      <svg width={width} height={height} role="img" aria-label="Waterfall chart">
        {gridTicks.map((t) => (
          <g key={t}>
            <line className={gridLine} x1={m.left} x2={width - m.right} y1={sy(t)} y2={sy(t)} />
            <text className={tick} x={m.left - 6} y={sy(t) + 3} textAnchor="end">
              {formatValue(Math.round(t * 100) / 100)}
            </text>
          </g>
        ))}
        <line className={axisLine} x1={m.left} x2={width - m.right} y1={sy(0)} y2={sy(0)} />
        {bars.map((b, i) => {
          const x = m.left + i * band + (band - bw) / 2;
          const top = Math.min(sy(b.start), sy(b.end));
          const h = Math.max(1, Math.abs(sy(b.start) - sy(b.end)));
          const kind = b.datum.type === "total" ? "total" : b.end >= b.start ? "up" : "down";
          const fill = kind === "total" ? totalColor : kind === "up" ? positiveColor : negativeColor;
          const next = bars[i + 1];
          const delta = b.end - b.start;
          return (
            <g
              key={b.datum.key}
              data-testid="waterfall-bar"
              data-kind={kind}
              style={onBarClick ? { cursor: "pointer" } : undefined}
              onClick={onBarClick ? () => onBarClick(b.datum) : undefined}
            >
              <title>{`${b.datum.label}: ${formatValue(kind === "total" ? b.end : delta)}`}</title>
              <rect x={x} y={top} width={bw} height={h} rx={barRadius} fill={fill} />
              {showConnectors && next ? (
                <line className={connector} x1={x + bw} x2={x + band} y1={sy(b.end)} y2={sy(b.end)} />
              ) : null}
              {showLabels ? (
                <text className={barLabel} x={x + bw / 2} y={top - 4} textAnchor="middle">
                  {kind === "total" ? formatValue(b.end) : `${delta > 0 ? "+" : ""}${formatValue(delta)}`}
                </text>
              ) : null}
              <text className={tick} x={x + bw / 2} y={height - 10} textAnchor="middle">
                {b.datum.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
