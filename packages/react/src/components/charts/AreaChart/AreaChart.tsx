import type { ReactElement } from "react";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { Area } from "@visx/shape";
import { vars } from "@vesture/tokens";
import { buildAreaChartLayout } from "./AreaChart.render";
import { emptyState, root } from "./AreaChart.css";
import type { AreaChartBaseProps } from "./types";

export interface AreaChartProps extends AreaChartBaseProps {
  width: number;
  height: number;
}

/**
 * Server-safe, zero-JS area chart. Renders a static SVG with no event handlers — use it in
 * server components, static reports, or anywhere a hover tooltip/legend isn't needed. For a
 * dashboard-style chart with hover tooltips and a toggleable legend, use `InteractiveAreaChart`
 * instead (it wraps this component and requires client-side JS).
 */
export function AreaChart({
  data,
  series,
  width,
  height,
  margin,
  xScale,
  stacked = false
}: AreaChartProps): ReactElement {
  if (data.length === 0) {
    return (
      <div className={root} style={{ width, height }}>
        <div className={emptyState} style={{ width, height }}>
          No data
        </div>
      </div>
    );
  }

  const { scales, seriesLayouts } = buildAreaChartLayout(data, series, width, height, margin, xScale, stacked);
  const { xScale: scaleX, yScale, innerWidth, innerHeight, margin: resolvedMargin } = scales;

  return (
    <div className={root}>
      <svg width={width} height={height} role="img" aria-label="Area chart">
        <Group left={resolvedMargin.left} top={resolvedMargin.top}>
          <GridRows scale={yScale} width={innerWidth} height={innerHeight} stroke={vars.chart.grid} />
          {seriesLayouts.map((s) => (
            <Area
              key={s.key}
              data={s.points}
              x={(p) => p.x}
              y0={(p) => p.y0}
              y1={(p) => p.y1}
              fill={s.color}
              fillOpacity={s.opacity}
              stroke={s.color}
              strokeWidth={1.5}
            />
          ))}
          <AxisBottom
            top={innerHeight}
            scale={scaleX}
            stroke={vars.chart.axis}
            tickStroke={vars.chart.axis}
            tickLabelProps={() => ({ fill: vars.chart.axis, fontSize: 11, textAnchor: "middle" })}
          />
          <AxisLeft
            scale={yScale}
            stroke={vars.chart.axis}
            tickStroke={vars.chart.axis}
            tickLabelProps={() => ({ fill: vars.chart.axis, fontSize: 11, textAnchor: "end", dx: "-0.25em" })}
          />
        </Group>
      </svg>
    </div>
  );
}
