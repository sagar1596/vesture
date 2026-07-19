"use client";

import { useMemo, useState } from "react";
import type { MouseEvent as ReactMouseEvent, ReactElement } from "react";
import { ParentSize } from "@visx/responsive";
import { TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { LineChart } from "./LineChart";
import { buildLineChartLayout, findNearestDataIndex, getSeriesColor, getXPixel } from "./LineChart.render";
import {
  legend,
  legendItem,
  legendItemHidden,
  legendSwatch,
  overlayRect,
  root,
  tooltip as tooltipClass,
  tooltipRow,
  tooltipSwatch
} from "./LineChart.css";
import type { LineChartBaseProps, LineChartDataPoint, LineChartSeries } from "./types";

interface TooltipDatum {
  dataPoint: LineChartDataPoint;
  visibleSeries: LineChartSeries[];
}

export interface InteractiveLineChartProps extends LineChartBaseProps {
  /** Fixed chart height; width auto-tracks the parent container's size via ResizeObserver. */
  height?: number;
}

/**
 * Client-rendered line chart for dashboards: auto-sizes to its parent (via `@visx/responsive`'s
 * `ParentSize`), and adds a hover tooltip plus a click-to-toggle legend. Requires client-side JS
 * ("use client") — for server components or static output where no interaction is needed, use
 * the static `LineChart` instead.
 */
export function InteractiveLineChart({
  data,
  series,
  margin,
  xScale,
  height = 320
}: InteractiveLineChartProps): ReactElement {
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

  return (
    <div className={root}>
      <ParentSize initialSize={{ width: 600, height }} style={{ height }}>
        {({ width }) => {
          if (width === 0) return null;

          const { scales } = buildLineChartLayout(data, visibleSeries, width, height, margin, xScale);

          function handleMouseMove(event: ReactMouseEvent<SVGRectElement>): void {
            const bounds = event.currentTarget.getBoundingClientRect();
            const pixelX = event.clientX - bounds.left;
            const dataIndex = findNearestDataIndex(data, scales, pixelX);
            if (dataIndex === null) {
              hideTooltip();
              return;
            }
            const dataPoint = data[dataIndex]!;
            const xPixel = getXPixel(scales, dataPoint.x) ?? pixelX;
            showTooltip({
              tooltipData: { dataPoint, visibleSeries },
              tooltipLeft: scales.margin.left + xPixel,
              tooltipTop: 0
            });
          }

          return (
            <div style={{ position: "relative", width, height }}>
              <LineChart
                data={data}
                series={visibleSeries}
                width={width}
                height={height}
                margin={margin}
                xScale={xScale}
              />
              <svg
                width={width}
                height={height}
                style={{ position: "absolute", top: 0, left: 0 }}
                aria-hidden="true"
              >
                <rect
                  className={overlayRect}
                  data-testid="line-chart-overlay"
                  x={scales.margin.left}
                  y={scales.margin.top}
                  width={scales.innerWidth}
                  height={scales.innerHeight}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => hideTooltip()}
                />
              </svg>
              {tooltipOpen && tooltipData ? (
                <TooltipWithBounds left={tooltipLeft} top={tooltipTop} className={tooltipClass}>
                  <div>{String(tooltipData.dataPoint.x)}</div>
                  {tooltipData.visibleSeries.map((s) => (
                    <div key={s.key} className={tooltipRow}>
                      <span className={tooltipSwatch} style={{ background: s.color }} />
                      <span>
                        {s.label}: {String(tooltipData.dataPoint[s.key])}
                      </span>
                    </div>
                  ))}
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
