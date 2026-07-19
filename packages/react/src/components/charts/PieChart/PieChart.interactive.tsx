"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { Pie } from "@visx/shape";
import { TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { vars } from "@vesture/tokens";
import { arcBisectorDirection, colorSlices, computePercentages, isLabelFittable } from "./PieChart.render";
import {
  emptyState,
  legend,
  legendItem,
  legendItemHidden,
  legendPercentage,
  legendSwatch,
  root,
  sliceGroup,
  tooltip as tooltipClass,
  tooltipRow,
  tooltipSwatch
} from "./PieChart.css";
import type { PieChartBaseProps } from "./types";

const OUTER_PADDING = 8;
/** How far a hovered slice offsets outward along its angle bisector, in pixels. */
const HOVER_OFFSET_PX = 8;

interface TooltipDatum {
  key: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface InteractivePieChartProps extends PieChartBaseProps {
  /** Fixed chart height; width auto-tracks the parent container's size via ResizeObserver. */
  height?: number;
}

/**
 * Client-rendered pie/donut chart for dashboards: auto-sizes to its parent (via
 * `@visx/responsive`'s `ParentSize`), and adds per-slice hover emphasis, a tooltip, and a
 * click-to-toggle legend. Requires client-side JS ("use client") — for server components or
 * static output where no interaction is needed, use the static `PieChart` instead.
 *
 * Unlike Line/Bar/AreaChart's legend toggle (which just removes a series), hiding a slice here
 * *redistributes* the remaining slices' percentages, since a pie's slices must sum to 100 — see
 * `computePercentages` in `PieChart.render.ts`, re-run over only the still-visible slices.
 */
export function InteractivePieChart({
  data,
  innerRadius = 0,
  showLabels = true,
  height = 320
}: InteractivePieChartProps): ReactElement {
  const [hiddenKeys, setHiddenKeys] = useState<ReadonlySet<string>>(new Set());
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Colors are assigned once from each slice's original position, before any filtering, so a
  // slice keeps its color when a sibling is hidden or excluded for being zero/negative.
  const coloredSlices = useMemo(() => colorSlices(data), [data]);
  const visibleSlices = useMemo(
    () => coloredSlices.filter((s) => s.value > 0 && !hiddenKeys.has(s.key)),
    [coloredSlices, hiddenKeys]
  );
  const slices = useMemo(() => computePercentages(visibleSlices), [visibleSlices]);
  const percentageByKey = useMemo(() => new Map(slices.map((s) => [s.key, s.percentage])), [slices]);

  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<TooltipDatum>();

  function toggleSlice(key: string): void {
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

  if (slices.length === 0) {
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

          const outerRadius = Math.max(0, Math.min(width, height) / 2 - OUTER_PADDING);
          const pieInnerRadius = outerRadius * innerRadius;

          function handleSliceHover(datum: TooltipDatum, centroidX: number, centroidY: number): void {
            showTooltip({
              tooltipData: datum,
              tooltipLeft: width / 2 + centroidX,
              tooltipTop: height / 2 + centroidY
            });
            setHoveredKey(datum.key);
          }

          function handleSliceLeave(): void {
            hideTooltip();
            setHoveredKey(null);
          }

          return (
            <div style={{ position: "relative", width, height }}>
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
                        const [centroidX, centroidY] = pie.path.centroid(arc);
                        const showLabel = showLabels && isLabelFittable(arc.startAngle, arc.endAngle, outerRadius);
                        const isHovered = hoveredKey === arc.data.key;
                        const [dx, dy] = arcBisectorDirection(arc.startAngle, arc.endAngle);
                        const transform = isHovered
                          ? `translate(${dx * HOVER_OFFSET_PX}px, ${dy * HOVER_OFFSET_PX}px)`
                          : undefined;
                        return (
                          <g key={arc.data.key} className={sliceGroup} style={{ transform }}>
                            <path
                              d={pie.path(arc) ?? ""}
                              fill={arc.data.color}
                              data-testid={`pie-slice-${arc.data.key}`}
                              onMouseEnter={() => handleSliceHover(arc.data, centroidX, centroidY)}
                              onMouseLeave={handleSliceLeave}
                            />
                            {showLabel ? (
                              <text
                                x={centroidX}
                                y={centroidY}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill={vars.color.textInverse}
                                fontSize={vars.font.sizeXs}
                                fontFamily={vars.font.body}
                                style={{ pointerEvents: "none" }}
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
              {tooltipOpen && tooltipData ? (
                <TooltipWithBounds left={tooltipLeft} top={tooltipTop} className={tooltipClass}>
                  <div className={tooltipRow}>
                    <span className={tooltipSwatch} style={{ background: tooltipData.color }} />
                    <span>
                      {tooltipData.label}: {tooltipData.value} ({Math.round(tooltipData.percentage)}%)
                    </span>
                  </div>
                </TooltipWithBounds>
              ) : null}
            </div>
          );
        }}
      </ParentSize>
      <div className={legend}>
        {coloredSlices
          .filter((s) => s.value > 0)
          .map((s) => {
            const hidden = hiddenKeys.has(s.key);
            const percentage = percentageByKey.get(s.key);
            return (
              <button
                key={s.key}
                type="button"
                className={[legendItem, hidden ? legendItemHidden : null].filter(Boolean).join(" ")}
                onClick={() => toggleSlice(s.key)}
                aria-pressed={!hidden}
              >
                <span className={legendSwatch} style={{ background: s.color }} />
                {s.label}
                {!hidden && percentage !== undefined ? (
                  <span className={legendPercentage}>{Math.round(percentage)}%</span>
                ) : null}
              </button>
            );
          })}
      </div>
    </div>
  );
}
