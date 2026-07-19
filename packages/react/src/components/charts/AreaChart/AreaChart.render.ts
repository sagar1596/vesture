import { area as d3Area } from "@visx/vendor/d3-shape";
import {
  SERIES_COLOR_CYCLE,
  buildScales,
  findNearestDataIndex,
  getSeriesColor,
  getXPixel,
  inferXScaleType,
  numericValue,
  resolveMargin
} from "../LineChart/LineChart.render";
import type { LineChartScales } from "../LineChart/LineChart.render";
import type { AreaChartDataPoint, AreaChartMargin, AreaChartSeries, AreaChartXScaleType } from "./types";

// AreaChart shares LineChart's scale/margin/color/hover-lookup logic wholesale — the x/y
// scale math, series color cycling, and nearest-point hit-testing are identical between the
// two chart types (LineChart.render.ts's `buildScales` grew an optional `stacked` param for
// exactly this reuse). Only area-specific geometry (baseline + stacking accumulation, area
// path generation) is new here.
export { SERIES_COLOR_CYCLE, findNearestDataIndex, getSeriesColor, getXPixel, resolveMargin };
export type AreaChartScales = LineChartScales;

/**
 * Fill opacity for overlapping (non-stacked) series, so every series' area remains visible
 * where they intersect rather than fully occluding one another. No existing component in this
 * library uses a semi-transparent fill (the closest precedent, disabled-state opacity, is a
 * different affordance), so this is a chart-specific constant rather than a token reference.
 */
export const OVERLAP_FILL_OPACITY = 0.35;

export interface AreaChartSeriesPoint {
  dataIndex: number;
  x: number;
  /** Pixel y of the filled region's bottom edge (baseline). */
  y0: number;
  /** Pixel y of the filled region's top edge (the series' value, or cumulative value when stacked). */
  y1: number;
}

export interface AreaChartSeriesLayout {
  key: string;
  label: string;
  color: string;
  opacity: number;
  /** Pixel-space points, already positioned within the scales' inner plot area. */
  points: AreaChartSeriesPoint[];
  /** SVG path `d` attribute for this series' filled region. Empty string when fewer than 2 points are defined. */
  path: string;
}

const areaGenerator = d3Area<AreaChartSeriesPoint>()
  .x((p) => p.x)
  .y0((p) => p.y0)
  .y1((p) => p.y1);

/**
 * The shared entry point: given data/series/dimensions, computes scales (via LineChart's
 * `buildScales`, in stacked or overlapping y-domain mode) and per-series filled-region
 * geometry once. Both the static `AreaChart` (feeding this into visx's `AreaClosed`/`Area`)
 * and `InteractiveAreaChart` (feeding this into hover hit-testing) call this same function.
 */
export function buildAreaChartLayout(
  data: AreaChartDataPoint[],
  series: AreaChartSeries[],
  width: number,
  height: number,
  margin?: Partial<AreaChartMargin>,
  xScaleType?: AreaChartXScaleType,
  stacked = false
): { scales: AreaChartScales; seriesLayouts: AreaChartSeriesLayout[] } {
  const resolvedMargin = resolveMargin(margin);
  const resolvedXScaleType = xScaleType ?? inferXScaleType(data);
  const scales = buildScales(data, series, width, height, resolvedMargin, resolvedXScaleType, stacked);

  // Running per-row cumulative total, only meaningful (and only mutated) in stacked mode: each
  // series' baseline is the sum of every series stacked below it, and its top becomes the next
  // series' baseline — the same "first key at the bottom" order @visx/shape's BarStack uses.
  const cumulative = data.map(() => 0);

  const seriesLayouts: AreaChartSeriesLayout[] = series.map((s, index) => {
    const points: AreaChartSeriesPoint[] = [];
    data.forEach((d, dataIndex) => {
      const rawValue = numericValue(d[s.key]);
      if (!stacked && rawValue === undefined) return;

      const x = getXPixel(scales, d.x);
      if (x === undefined) return;

      const baseline = stacked ? cumulative[dataIndex]! : 0;
      const top = stacked ? baseline + (rawValue ?? 0) : rawValue!;
      if (stacked) cumulative[dataIndex] = top;

      points.push({ dataIndex, x, y0: scales.yScale(baseline), y1: scales.yScale(top) });
    });

    return {
      key: s.key,
      label: s.label,
      color: getSeriesColor(s, index),
      opacity: stacked ? 1 : OVERLAP_FILL_OPACITY,
      points,
      path: points.length >= 2 ? areaGenerator(points) ?? "" : ""
    };
  });

  return { scales, seriesLayouts };
}
