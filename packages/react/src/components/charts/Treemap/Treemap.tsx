import type { ReactElement, ReactNode } from "react";
import { vars } from "@vesture/tokens";
import { squarify } from "./Treemap.render";
import { cell, cellLabel, cellValue, emptyState, root } from "./Treemap.css";
import type { TreemapDatum, TreemapRect } from "./types";

export interface TreemapProps {
  data: TreemapDatum[];
  width: number;
  height: number;
  formatValue?: (value: number) => string;
  onCellClick?: (datum: TreemapDatum) => void;
  /** Colors cycled by index when a datum has no `color`; defaults to the 8 chart series colors. */
  colors?: string[];
  /** Computes each cell's color; takes precedence over `datum.color` and `colors`. */
  getColor?: (datum: TreemapDatum, index: number) => string;
  /** Gap between cells in px. */
  gap?: number;
  /** Corner radius of cells in px. */
  cellRadius?: number;
  /** Smallest cell (px) that still shows a label. */
  minLabelWidth?: number;
  minLabelHeight?: number;
  /** Highlights one cell (others dim). */
  selectedKey?: string;
  /** Replaces the default label + value text. Return null to hide a cell's text. Positioned inside the cell's box. */
  renderLabel?: (rect: TreemapRect, info: { formatted: string; percent: number }) => ReactNode;
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

/** Static SVG treemap: area is proportional to value. Labels are hidden on cells too small to fit them. */
export function Treemap({
  data,
  width,
  height,
  formatValue = String,
  onCellClick,
  colors = SERIES,
  getColor,
  gap = 2,
  cellRadius = 0,
  minLabelWidth = 48,
  minLabelHeight = 22,
  selectedKey,
  renderLabel,
  className
}: TreemapProps): ReactElement {
  const rects = squarify(data, width, height);
  const total = rects.reduce((s, r) => s + r.datum.value, 0);

  if (rects.length === 0) {
    return (
      <div className={[root, className].filter(Boolean).join(" ")} style={{ width, height }}>
        <div className={emptyState} style={{ width, height }}>
          No data
        </div>
      </div>
    );
  }

  return (
    <div className={[root, className].filter(Boolean).join(" ")} style={{ width, height }}>
      <svg width={width} height={height} role="img" aria-label="Treemap">
        {rects.map((r, i) => {
          const { datum, x, y, width: w, height: h } = r;
          const formatted = formatValue(datum.value);
          const showLabel = w >= minLabelWidth && h >= minLabelHeight;
          const showValue = showLabel && h >= 40;
          const dimmed = selectedKey !== undefined && selectedKey !== datum.key;
          const fill = getColor?.(datum, i) ?? datum.color ?? colors[i % colors.length];
          return (
            <g
              key={datum.key}
              data-testid="treemap-cell"
              data-selected={selectedKey === datum.key}
              opacity={dimmed ? 0.45 : 1}
              style={onCellClick ? { cursor: "pointer" } : undefined}
              onClick={onCellClick ? () => onCellClick(datum) : undefined}
            >
              <title>{`${datum.label}: ${formatted}`}</title>
              <rect
                className={cell}
                x={x + gap / 2}
                y={y + gap / 2}
                width={Math.max(0, w - gap)}
                height={Math.max(0, h - gap)}
                rx={cellRadius}
                fill={fill}
                strokeWidth={0}
              />
              {renderLabel ? (
                <g transform={`translate(${x + gap / 2},${y + gap / 2})`}>
                  {renderLabel(r, { formatted, percent: total ? (datum.value / total) * 100 : 0 })}
                </g>
              ) : (
                <>
                  {showLabel ? (
                    <text className={cellLabel} x={x + 8} y={y + 18}>
                      {datum.label}
                    </text>
                  ) : null}
                  {showValue ? (
                    <text className={cellValue} x={x + 8} y={y + 34}>
                      {formatted}
                    </text>
                  ) : null}
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
