import { scaleBand, scaleLinear } from "@visx/scale";
import type { ScaleBand, ScaleLinear } from "@visx/vendor/d3-scale";
import { vars } from "@vesture/tokens";
import type { BarChartDataPoint, BarChartLayout, BarChartMargin, BarChartSeries } from "./types";

export const DEFAULT_MARGIN: BarChartMargin = { top: 16, right: 16, bottom: 32, left: 48 };

/**
 * Fixed-order categorical cycle backing every chart component. A series index beyond 8
 * wraps back around to series1 — with more than 8 series, colors repeat and the legend
 * label becomes the only reliable way to tell those series apart.
 */
export const SERIES_COLOR_CYCLE: readonly string[] = [
  vars.chart.series1,
  vars.chart.series2,
  vars.chart.series3,
  vars.chart.series4,
  vars.chart.series5,
  vars.chart.series6,
  vars.chart.series7,
  vars.chart.series8
];

export function getSeriesColor(series: BarChartSeries, index: number): string {
  return series.color ?? SERIES_COLOR_CYCLE[index % SERIES_COLOR_CYCLE.length]!;
}

/** A `(key) => color` lookup, in the shape `@visx/shape`'s `BarGroup`/`BarStack` expect for their `color` prop. */
export function buildSeriesColorMap(series: BarChartSeries[]): Record<string, string> {
  const map: Record<string, string> = {};
  series.forEach((s, index) => {
    map[s.key] = getSeriesColor(s, index);
  });
  return map;
}

export function resolveMargin(margin?: Partial<BarChartMargin>): BarChartMargin {
  return { ...DEFAULT_MARGIN, ...margin };
}

function numericValue(value: string | number | undefined): number {
  if (value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export interface BarChartScales {
  /** Category (band) scale — positions each category's bar/bar-group along x. */
  x0Scale: ScaleBand<string>;
  /** Per-series position within a category's group. Only set for `layout: "grouped"`. */
  x1Scale?: ScaleBand<string>;
  /** Alias for `x0Scale` — the scale `AxisBottom` and `BarStack`'s `xScale` prop consume. */
  xScale: ScaleBand<string>;
  yScale: ScaleLinear<number, number>;
  layout: BarChartLayout;
  innerWidth: number;
  innerHeight: number;
  margin: BarChartMargin;
}

/**
 * Computes the category/value scales for a bar chart. Bar *position* math (grouped
 * side-by-side offsets, stacked cumulative heights) is intentionally left to `@visx/shape`'s
 * `BarGroup`/`BarStack` components in the `.tsx` files, which already solve it correctly from
 * these scales — this only derives the scales and the color-per-series lookup, which both the
 * static `BarChart` and `InteractiveBarChart` consume identically.
 */
export function buildScales(
  data: BarChartDataPoint[],
  series: BarChartSeries[],
  width: number,
  height: number,
  margin: BarChartMargin,
  layout: BarChartLayout
): BarChartScales {
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  const x0Scale = scaleBand<string>({
    domain: data.map((d) => d.category),
    range: [0, innerWidth],
    padding: 0.2
  });

  const x1Scale =
    layout === "grouped"
      ? scaleBand<string>({
          domain: series.map((s) => s.key),
          range: [0, x0Scale.bandwidth()],
          padding: 0.1
        })
      : undefined;

  const yMax =
    layout === "stacked"
      ? Math.max(0, ...data.map((d) => series.reduce((sum, s) => sum + numericValue(d[s.key]), 0)))
      : Math.max(0, ...data.flatMap((d) => series.map((s) => numericValue(d[s.key]))));

  const yScale = scaleLinear<number>({
    domain: [0, yMax > 0 ? yMax : 1],
    range: [innerHeight, 0],
    nice: true
  });

  return { x0Scale, x1Scale, xScale: x0Scale, yScale, layout, innerWidth, innerHeight, margin };
}

/**
 * The shared entry point: given data/series/dimensions, resolves the margin and computes
 * scales + the series color map once. Both the static `BarChart` (feeding these into visx's
 * `BarGroup`/`BarStack`) and `InteractiveBarChart` (feeding these into per-bar hover handlers)
 * call this same function rather than re-deriving scales/colors independently.
 */
export function buildBarChartLayout(
  data: BarChartDataPoint[],
  series: BarChartSeries[],
  width: number,
  height: number,
  margin?: Partial<BarChartMargin>,
  layout: BarChartLayout = "grouped"
): { scales: BarChartScales; colorMap: Record<string, string> } {
  const resolvedMargin = resolveMargin(margin);
  const scales = buildScales(data, series, width, height, resolvedMargin, layout);
  const colorMap = buildSeriesColorMap(series);
  return { scales, colorMap };
}
