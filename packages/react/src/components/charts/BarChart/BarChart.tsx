import type { ReactElement } from "react";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { BarGroup, BarStack } from "@visx/shape";
import { vars } from "@vesture/tokens";
import { buildBarChartLayout, SERIES_COLOR_CYCLE } from "./BarChart.render";
import { emptyState, root } from "./BarChart.css";
import type { BarChartBaseProps } from "./types";

export interface BarChartProps extends BarChartBaseProps {
  width: number;
  height: number;
}

/**
 * Server-safe, zero-JS bar chart. Renders a static SVG with no event handlers — use it in
 * server components, static reports, or anywhere a hover tooltip/legend isn't needed. For a
 * dashboard-style chart with hover tooltips and a toggleable legend, use `InteractiveBarChart`
 * instead (it wraps this component and requires client-side JS).
 */
export function BarChart({
  data,
  series,
  width,
  height,
  margin,
  layout = "grouped"
}: BarChartProps): ReactElement {
  if (data.length === 0) {
    return (
      <div className={root} style={{ width, height }}>
        <div className={emptyState} style={{ width, height }}>
          No data
        </div>
      </div>
    );
  }

  const { scales, colorMap } = buildBarChartLayout(data, series, width, height, margin, layout);
  const { x0Scale, x1Scale, xScale, yScale, innerWidth, innerHeight, margin: resolvedMargin } = scales;
  const keys = series.map((s) => s.key);
  const color = (key: string, index: number): string => colorMap[key] ?? SERIES_COLOR_CYCLE[index % 8]!;

  return (
    <div className={root}>
      <svg width={width} height={height} role="img" aria-label="Bar chart">
        <Group left={resolvedMargin.left} top={resolvedMargin.top}>
          <GridRows scale={yScale} width={innerWidth} height={innerHeight} stroke={vars.chart.grid} />
          {layout === "stacked" ? (
            <BarStack data={data} keys={keys} x={(d) => d.category} xScale={xScale} yScale={yScale} color={color} />
          ) : (
            <BarGroup
              data={data}
              keys={keys}
              height={innerHeight}
              x0={(d) => d.category}
              x0Scale={x0Scale}
              x1Scale={x1Scale!}
              yScale={yScale}
              color={color}
            />
          )}
          <AxisBottom
            top={innerHeight}
            scale={x0Scale}
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
