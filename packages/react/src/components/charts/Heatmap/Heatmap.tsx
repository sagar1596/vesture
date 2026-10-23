import type { ReactElement, ReactNode } from "react";
import { vars } from "@vesture/tokens";
import { defaultOpacity, intensity, matrixExtent } from "./Heatmap.render";
import { axisLabel, cellRect, cellText, emptyState, root } from "./Heatmap.css";

export interface HeatmapProps {
  /** Row labels, top to bottom. */
  rows: string[];
  /** Column labels, left to right. */
  columns: string[];
  /** `values[row][column]`; `null` leaves the cell empty. */
  values: (number | null)[][];
  width: number;
  height: number;
  /** Any CSS color for the high end of the scale; low values fade toward transparent. */
  color?: string;
  /** Prints the value inside each cell when there's room for it. */
  showValues?: boolean;
  formatValue?: (value: number) => string;
  /**
   * Maps a normalized 0..1 intensity to a fill color, for diverging or multi-hue scales. When set,
   * `color` is ignored and cells render at full opacity.
   */
  colorScale?: (t: number, value: number) => string;
  /** Pins the value range that maps to 0..1 (e.g. `[0, 100]`); defaults to the matrix's own min/max. */
  domain?: [number, number];
  /** Fill for `null` cells; they're left empty if omitted. */
  emptyColor?: string;
  /** Gap between cells in px. */
  gap?: number;
  cellRadius?: number;
  /** Width reserved for row labels, and height for column labels. */
  rowLabelWidth?: number;
  columnLabelHeight?: number;
  /** Replaces the printed value; return null to hide it for a cell. Receives the cell's pixel size. */
  renderCell?: (info: { row: string; column: string; value: number; t: number; width: number; height: number }) => ReactNode;
  onCellClick?: (info: { row: string; column: string; value: number | null; rowIndex: number; columnIndex: number }) => void;
  className?: string;
}

/** Matrix heatmap: cell fill opacity encodes value within the matrix's own min..max. */
export function Heatmap({
  rows,
  columns,
  values,
  width,
  height,
  color = vars.chart.series1,
  showValues = true,
  formatValue = String,
  colorScale,
  domain,
  emptyColor,
  gap = 2,
  cellRadius = 0,
  rowLabelWidth: LEFT_GUTTER = 72,
  columnLabelHeight: TOP_GUTTER = 28,
  renderCell,
  onCellClick,
  className
}: HeatmapProps): ReactElement {
  const extent = domain ?? matrixExtent(values);

  if (!extent || rows.length === 0 || columns.length === 0) {
    return (
      <div className={[root, className].filter(Boolean).join(" ")} style={{ width, height }}>
        <div className={emptyState} style={{ width, height }}>
          No data
        </div>
      </div>
    );
  }

  const cellW = (width - LEFT_GUTTER) / columns.length;
  const cellH = (height - TOP_GUTTER) / rows.length;
  const canPrint = showValues && cellW >= 36 && cellH >= 18;

  return (
    <div className={[root, className].filter(Boolean).join(" ")} style={{ width, height }}>
      <svg width={width} height={height} role="img" aria-label="Heatmap">
        {columns.map((c, ci) => (
          <text
            key={c}
            className={axisLabel}
            x={LEFT_GUTTER + ci * cellW + cellW / 2}
            y={TOP_GUTTER - 10}
            textAnchor="middle"
          >
            {c}
          </text>
        ))}
        {rows.map((r, ri) => (
          <text key={r} className={axisLabel} x={LEFT_GUTTER - 8} y={TOP_GUTTER + ri * cellH + cellH / 2} textAnchor="end" dominantBaseline="middle">
            {r}
          </text>
        ))}
        {rows.map((r, ri) =>
          columns.map((c, ci) => {
            const v = values[ri]?.[ci] ?? null;
            const x = LEFT_GUTTER + ci * cellW;
            const y = TOP_GUTTER + ri * cellH;
            const clickProps = onCellClick
              ? {
                  style: { cursor: "pointer" },
                  onClick: () => onCellClick({ row: r, column: c, value: v, rowIndex: ri, columnIndex: ci })
                }
              : {};
            if (v === null || !Number.isFinite(v)) {
              if (!emptyColor) return null;
              return (
                <rect key={`${r}:${c}`} data-testid="heatmap-empty" x={x + gap / 2} y={y + gap / 2} width={Math.max(0, cellW - gap)} height={Math.max(0, cellH - gap)} rx={cellRadius} fill={emptyColor} {...clickProps} />
              );
            }
            const t = Math.min(1, Math.max(0, intensity(v, extent)));
            const fill = colorScale ? colorScale(t, v) : color;
            const darkFill = colorScale ? false : t > 0.55;
            return (
              <g key={`${r}:${c}`} data-testid="heatmap-cell" {...clickProps}>
                <title>{`${r} / ${c}: ${formatValue(v)}`}</title>
                <rect
                  className={cellRect}
                  x={x + gap / 2}
                  y={y + gap / 2}
                  width={Math.max(0, cellW - gap)}
                  height={Math.max(0, cellH - gap)}
                  rx={cellRadius}
                  fill={fill}
                  fillOpacity={colorScale ? 1 : defaultOpacity(t)}
                  strokeWidth={0}
                />
                {renderCell ? (
                  <g transform={`translate(${x},${y})`}>
                    {renderCell({ row: r, column: c, value: v, t, width: cellW, height: cellH })}
                  </g>
                ) : canPrint ? (
                  <text
                    className={cellText}
                    x={x + cellW / 2}
                    y={y + cellH / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={darkFill ? vars.color.textInverse : colorScale ? vars.color.textInverse : vars.color.text}
                  >
                    {formatValue(v)}
                  </text>
                ) : null}
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}
