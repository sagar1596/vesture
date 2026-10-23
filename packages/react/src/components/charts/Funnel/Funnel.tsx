import type { ReactElement, ReactNode } from "react";
import { vars } from "@vesture/tokens";
import { buildFunnelSegments, type FunnelSegment, type FunnelStage } from "./Funnel.render";
import { emptyState, root, segment, segmentLabel, segmentMeta } from "./Funnel.css";

export type { FunnelStage } from "./Funnel.render";

export interface FunnelChartProps {
  stages: FunnelStage[];
  width: number;
  height: number;
  formatValue?: (value: number) => string;
  /** `"tapered"` (default) slopes each stage into the next; `"stepped"` draws flat-sided bars. */
  shape?: "tapered" | "stepped";
  /** Vertical gap between stages in px. */
  gap?: number;
  /** Colors cycled by index when a stage has no `color`; defaults to the 8 chart series colors. */
  colors?: string[];
  /** Which secondary figure appears under each label. */
  metric?: "previous" | "total" | "none";
  /** Replaces the default label text for a stage. Positioned at the stage's center-line. */
  renderLabel?: (segment: FunnelSegment, geometry: { x: number; y: number; width: number; height: number }) => ReactNode;
  onStageClick?: (stage: FunnelStage, index: number) => void;
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

/** Conversion funnel: stages stack top to bottom, narrowing in proportion to value. */
export function FunnelChart({
  stages,
  width,
  height,
  formatValue = String,
  shape = "tapered",
  gap = 2,
  colors = SERIES,
  metric = "previous",
  renderLabel,
  onStageClick,
  className
}: FunnelChartProps): ReactElement {
  const segments = buildFunnelSegments(stages);

  if (segments.length === 0) {
    return (
      <div className={[root, className].filter(Boolean).join(" ")} style={{ width, height }}>
        <div className={emptyState} style={{ width, height }}>
          No data
        </div>
      </div>
    );
  }

  const rowH = height / segments.length;
  const cx = width / 2;

  return (
    <div className={[root, className].filter(Boolean).join(" ")} style={{ width, height }}>
      <svg width={width} height={height} role="img" aria-label="Funnel chart">
        {segments.map((s, i) => {
          const y0 = i * rowH + gap / 2;
          const y1 = (i + 1) * rowH - gap / 2;
          const bottomHalf = shape === "stepped" ? s.topHalf : s.bottomHalf;
          const points = [
            [cx - s.topHalf * width, y0],
            [cx + s.topHalf * width, y0],
            [cx + bottomHalf * width, y1],
            [cx - bottomHalf * width, y1]
          ]
            .map(([x, y]) => `${x!.toFixed(2)},${y!.toFixed(2)}`)
            .join(" ");
          const meta =
            metric === "none"
              ? formatValue(s.stage.value)
              : metric === "total" || s.percentOfPrevious === null
                ? `${formatValue(s.stage.value)}${metric === "total" && i > 0 ? ` · ${Math.round(s.percentOfTotal)}% of total` : ""}`
                : `${formatValue(s.stage.value)} · ${Math.round(s.percentOfPrevious)}% of previous`;
          const mid = (y0 + y1) / 2;
          return (
            <g
              key={s.stage.key}
              data-testid="funnel-segment"
              style={onStageClick ? { cursor: "pointer" } : undefined}
              onClick={onStageClick ? () => onStageClick(s.stage, i) : undefined}
            >
              <title>{`${s.stage.label}: ${formatValue(s.stage.value)} (${Math.round(s.percentOfTotal)}%)`}</title>
              <polygon className={segment} points={points} fill={s.stage.color ?? colors[i % colors.length]} />
              {renderLabel ? (
                renderLabel(s, { x: cx - s.topHalf * width, y: y0, width: s.topHalf * width * 2, height: y1 - y0 })
              ) : (
                <>
                  <text className={segmentLabel} x={cx} y={mid - 2} textAnchor="middle">
                    {s.stage.label}
                  </text>
                  <text className={segmentMeta} x={cx} y={mid + 14} textAnchor="middle">
                    {meta}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
