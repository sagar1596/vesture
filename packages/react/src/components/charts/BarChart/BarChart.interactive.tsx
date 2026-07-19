"use client";

import { useMemo, useState } from "react";
import type { MouseEvent as ReactMouseEvent, ReactElement } from "react";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { Bar, BarGroup, BarStack } from "@visx/shape";
import { TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { vars } from "@vesture/tokens";
import { SERIES_COLOR_CYCLE, buildBarChartLayout, getSeriesColor } from "./BarChart.render";
import {
  emptyState,
  legend,
  legendItem,
  legendItemHidden,
  legendSwatch,
  root,
  tooltip as tooltipClass,
  tooltipRow,
  tooltipSwatch
} from "./BarChart.css";
import type { BarChartBaseProps, BarChartDataPoint, BarChartSeries } from "./types";

interface TooltipDatum {
  category: string;
  series: BarChartSeries;
  value: number;
}

export interface InteractiveBarChartProps extends BarChartBaseProps {
  /** Fixed chart height; width auto-tracks the parent container's size via ResizeObserver. */
  height?: number;
}

/**
 * Client-rendered bar chart for dashboards: auto-sizes to its parent (via `@visx/responsive`'s
 * `ParentSize`), and adds a per-bar hover tooltip plus a click-to-toggle legend. Requires
 * client-side JS ("use client") — for server components or static output where no interaction
 * is needed, use the static `BarChart` instead.
 */
export function InteractiveBarChart({
  data,
  series,
  margin,
  layout = "grouped",
  height = 320
}: InteractiveBarChartProps): ReactElement {
  const [hiddenKeys, setHiddenKeys] = useState<ReadonlySet<string>>(new Set());

  // Colors are assigned once from each series' original position, before any filtering, so a
  // series keeps its color when a sibling is toggled off (the cycle index would otherwise
  // shift for everything after the hidden series).
  const coloredSeries = useMemo(
    () => series.map((s, index) => ({ ...s, color: s.color ?? getSeriesColor(s, index) })),
    [series]
  );
  const visibleSeries = useMemo(
    () => coloredSeries.filter((s) => !hiddenKeys.has(s.key)),
    [coloredSeries, hiddenKeys]
  );

  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<TooltipDatum>();

  function toggleSeries(key: string): void {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  if (data.length === 0) {
    return (
      <div className={root} style={{ height }}>
        <div className={emptyState} style={{ height }}>
          No data
        </div>
      </div>
    );
  }

  return (
    <div className={root}>
      <ParentSize initialSize={{ width: 600, height }} style={{ height }}>
        {({ width }) => {
          if (width === 0) return null;

          const { scales, colorMap } = buildBarChartLayout(data, visibleSeries, width, height, margin, layout);
          const { x0Scale, x1Scale, xScale, yScale, innerWidth, innerHeight, margin: resolvedMargin } = scales;
          const keys = visibleSeries.map((s) => s.key);
          const seriesByKey = new Map(visibleSeries.map((s) => [s.key, s]));
          const color = (key: string, index: number): string => colorMap[key] ?? SERIES_COLOR_CYCLE[index % 8]!;

          function handleBarHover(
            categoryValue: string,
            seriesKey: string,
            value: number,
            event: ReactMouseEvent<SVGRectElement>
          ): void {
            const s = seriesByKey.get(seriesKey);
            if (!s) return;
            const bounds = event.currentTarget as SVGRectElement;
            const x = Number(bounds.getAttribute("x") ?? 0);
            const y = Number(bounds.getAttribute("y") ?? 0);
            const barWidth = Number(bounds.getAttribute("width") ?? 0);
            showTooltip({
              tooltipData: { category: categoryValue, series: s, value },
              tooltipLeft: resolvedMargin.left + x + barWidth / 2,
              tooltipTop: resolvedMargin.top + y
            });
          }

          return (
            <div style={{ position: "relative", width, height }}>
              <svg width={width} height={height} role="img" aria-label="Bar chart">
                <Group left={resolvedMargin.left} top={resolvedMargin.top}>
                  <GridRows scale={yScale} width={innerWidth} height={innerHeight} stroke={vars.chart.grid} />
                  {layout === "stacked" ? (
                    <BarStack<BarChartDataPoint, string>
                      data={data}
                      keys={keys}
                      x={(d) => d.category}
                      xScale={xScale}
                      yScale={yScale}
                      color={color}
                    >
                      {(barStacks) =>
                        barStacks.map((barStack) =>
                          barStack.bars.map((bar) => (
                            <Bar
                              key={`bar-stack-${barStack.index}-${bar.index}`}
                              x={bar.x}
                              y={bar.y}
                              width={bar.width}
                              height={bar.height}
                              fill={bar.color}
                              onMouseEnter={(event) =>
                                handleBarHover(
                                  bar.bar.data.category,
                                  String(barStack.key),
                                  Number(bar.bar.data[barStack.key]),
                                  event
                                )
                              }
                              onMouseLeave={() => hideTooltip()}
                            />
                          ))
                        )
                      }
                    </BarStack>
                  ) : (
                    <BarGroup<BarChartDataPoint, string>
                      data={data}
                      keys={keys}
                      height={innerHeight}
                      x0={(d) => d.category}
                      x0Scale={x0Scale}
                      x1Scale={x1Scale!}
                      yScale={yScale}
                      color={color}
                    >
                      {(barGroups) =>
                        barGroups.map((barGroup) => (
                          <Group key={`bar-group-${barGroup.index}`} left={barGroup.x0}>
                            {barGroup.bars.map((bar) => (
                              <Bar
                                key={`bar-group-bar-${barGroup.index}-${bar.key}`}
                                x={bar.x}
                                y={bar.y}
                                width={bar.width}
                                height={bar.height}
                                fill={bar.color}
                                onMouseEnter={(event) =>
                                  handleBarHover(data[barGroup.index]!.category, String(bar.key), bar.value, event)
                                }
                                onMouseLeave={() => hideTooltip()}
                              />
                            ))}
                          </Group>
                        ))
                      }
                    </BarGroup>
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
                    tickLabelProps={() => ({
                      fill: vars.chart.axis,
                      fontSize: 11,
                      textAnchor: "end",
                      dx: "-0.25em"
                    })}
                  />
                </Group>
              </svg>
              {tooltipOpen && tooltipData ? (
                <TooltipWithBounds left={tooltipLeft} top={tooltipTop} className={tooltipClass}>
                  <div>{tooltipData.category}</div>
                  <div className={tooltipRow}>
                    <span className={tooltipSwatch} style={{ background: tooltipData.series.color }} />
                    <span>
                      {tooltipData.series.label}: {tooltipData.value}
                    </span>
                  </div>
                </TooltipWithBounds>
              ) : null}
            </div>
          );
        }}
      </ParentSize>
      <div className={legend}>
        {coloredSeries.map((s) => {
          const hidden = hiddenKeys.has(s.key);
          return (
            <button
              key={s.key}
              type="button"
              className={[legendItem, hidden ? legendItemHidden : null].filter(Boolean).join(" ")}
              onClick={() => toggleSeries(s.key)}
              aria-pressed={!hidden}
            >
              <span className={legendSwatch} style={{ background: s.color }} />
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
