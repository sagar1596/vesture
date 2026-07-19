import type { ReactElement } from "react";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { LinePath } from "@visx/shape";
import { vars } from "@vesture/tokens";
import { buildLineChartLayout } from "./LineChart.render";
import { emptyState, root } from "./LineChart.css";
import type { LineChartBaseProps } from "./types";

export interface LineChartProps extends LineChartBaseProps {
  width: number;
  height: number;
}

/**
 * Server-safe, zero-JS line chart. Renders a static SVG with no event handlers — use it in
 * server components, static reports, or anywhere a hover tooltip/legend isn't needed. For a
 * dashboard-style chart with hover tooltips and a toggleable legend, use `InteractiveLineChart`
 * instead (it wraps this component and requires client-side JS).
 */
export function LineChart({
  data,
  series,
  width,
  height,
  margin,
  xScale
}: LineChartProps): ReactElement {
  if (data.length === 0) {
    return (
      <div className={root} style={{ width, height }}>
        <div className={emptyState} style={{ width, height }}>
          No data
        </div>
      </div>
    );
  }

  const { scales, seriesLayouts } = buildLineChartLayout(data, series, width, height, margin, xScale);
  const { xScale: scaleX, yScale, innerWidth, innerHeight, margin: resolvedMargin } = scales;

  return (
    <div className={root}>
      <svg width={width} height={height} role="img" aria-label="Line chart">
        <Group left={resolvedMargin.left} top={resolvedMargin.top}>
          <GridRows scale={yScale} width={innerWidth} height={innerHeight} stroke={vars.chart.grid} />
          {seriesLayouts.map((s) => (
            <LinePath
              key={s.key}
              data={s.points}
              x={(p) => p.x}
              y={(p) => p.y}
              stroke={s.color}
              strokeWidth={2}
              fill="none"
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
