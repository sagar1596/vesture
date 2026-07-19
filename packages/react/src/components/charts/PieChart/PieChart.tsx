import type { ReactElement } from "react";
import { Group } from "@visx/group";
import { Pie } from "@visx/shape";
import { vars } from "@vesture/tokens";
import { isLabelFittable, preparePieSlices } from "./PieChart.render";
import { emptyState, root } from "./PieChart.css";
import type { PieChartBaseProps } from "./types";

export interface PieChartProps extends PieChartBaseProps {
  width: number;
  height: number;
}

/** Padding, in pixels, between the pie's outer edge and the SVG bounds so slice strokes and labels never clip. */
const OUTER_PADDING = 8;

/**
 * Server-safe, zero-JS pie/donut chart. Renders a static SVG with no event handlers — use it
 * in server components, static reports, or anywhere a hover tooltip/legend isn't needed. For a
 * dashboard-style chart with per-slice hover emphasis, a tooltip, and a toggleable legend, use
 * `InteractivePieChart` instead (it wraps this component and requires client-side JS).
 */
export function PieChart({
  data,
  width,
  height,
  innerRadius = 0,
  showLabels = true
}: PieChartProps): ReactElement {
  const slices = preparePieSlices(data);

  if (slices.length === 0) {
    return (
      <div className={root} style={{ width, height }}>
        <div className={emptyState} style={{ width, height }}>
          No data
        </div>
      </div>
    );
  }

  const outerRadius = Math.max(0, Math.min(width, height) / 2 - OUTER_PADDING);
  const pieInnerRadius = outerRadius * innerRadius;

  return (
    <div className={root}>
      <svg width={width} height={height} role="img" aria-label="Pie chart">
        <Group top={height / 2} left={width / 2}>
          <Pie
            data={slices}
            pieValue={(s) => s.value}
            pieSort={null}
            outerRadius={outerRadius}
            innerRadius={pieInnerRadius}
          >
            {(pie) =>
              pie.arcs.map((arc) => {
                const [labelX, labelY] = pie.path.centroid(arc);
                const showLabel = showLabels && isLabelFittable(arc.startAngle, arc.endAngle, outerRadius);
                return (
                  <g key={arc.data.key}>
                    <path d={pie.path(arc) ?? ""} fill={arc.data.color} />
                    {showLabel ? (
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={vars.color.textInverse}
                        fontSize={vars.font.sizeXs}
                        fontFamily={vars.font.body}
                      >
                        {`${Math.round(arc.data.percentage)}%`}
                      </text>
                    ) : null}
                  </g>
                );
              })
            }
          </Pie>
        </Group>
      </svg>
    </div>
  );
}
