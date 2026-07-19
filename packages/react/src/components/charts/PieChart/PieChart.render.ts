import { pie as d3Pie } from "@visx/vendor/d3-shape";
import { vars } from "@vesture/tokens";
import type { PieChartDataPoint } from "./types";

// PieChart has no x/y scales or axes — nothing here shares LineChart.render.ts's machinery,
// so unlike AreaChart, this is a standalone render module with its own color cycle.

/**
 * Fixed-order categorical cycle backing every chart component. A slice index beyond 8 wraps
 * back around to series1 — with more than 8 slices, colors repeat and the legend label
 * becomes the only reliable way to tell those slices apart.
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

export function getSeriesColor(slice: PieChartDataPoint, index: number): string {
  return slice.color ?? SERIES_COLOR_CYCLE[index % SERIES_COLOR_CYCLE.length]!;
}

export interface PieChartSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

export interface PieChartSliceWithPercentage extends PieChartSlice {
  /** This slice's share of the total, as a 0-100 percentage of the slices passed in (not of the original, unfiltered data). */
  percentage: number;
}

/**
 * Recomputes each slice's percentage of the given set's total. Shared by the initial static
 * layout and by `InteractivePieChart`'s legend-toggle handler, which calls this again over
 * only the still-visible slices — hiding a slice redistributes the remaining percentages
 * rather than leaving them summing to less than 100.
 */
export function computePercentages(slices: PieChartSlice[]): PieChartSliceWithPercentage[] {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  return slices.map((s) => ({ ...s, percentage: total > 0 ? (s.value / total) * 100 : 0 }));
}

/**
 * Assigns each slice a stable color from its position in the original (unfiltered) `data`
 * array, so a slice keeps its color if a sibling is later hidden by the legend or excluded for
 * being zero/negative — the same stability rule Line/Bar/AreaChart use for series colors.
 */
export function colorSlices(data: PieChartDataPoint[]): PieChartSlice[] {
  return data.map((d, index) => ({ key: d.key, label: d.label, value: d.value, color: getSeriesColor(d, index) }));
}

/**
 * Filters out zero/negative values (a zero-width arc has nothing to render) and computes each
 * remaining slice's percentage of the visible total.
 */
export function preparePieSlices(data: PieChartDataPoint[]): PieChartSliceWithPercentage[] {
  const positive = colorSlices(data).filter((s) => s.value > 0);
  return computePercentages(positive);
}

export interface PieChartArc extends PieChartSliceWithPercentage {
  startAngle: number;
  endAngle: number;
}

/**
 * Computes each slice's [startAngle, endAngle) via the same d3 `pie()` generator
 * `@visx/shape`'s `<Pie>` component uses internally ("Pie utilities") — exposed as a pure,
 * testable function independent of rendering. Preserves input order (no descending-by-value
 * sort), matching the order `<Pie>` produces when it's given `pieSort={null}` and this same
 * prepared data, so legend order and slice order stay predictable and in sync.
 */
export function computeArcAngles(slices: PieChartSliceWithPercentage[]): PieChartArc[] {
  const pieGenerator = d3Pie<PieChartSliceWithPercentage>()
    .value((s) => s.value)
    .sort(null);
  return pieGenerator(slices).map((arc) => ({ ...arc.data, startAngle: arc.startAngle, endAngle: arc.endAngle }));
}

/**
 * Minimum arc length (in pixels, measured along the outer radius) for an in-slice percentage
 * label to plausibly fit. A percentage label is at most 4 characters ("100%") set at
 * `vars.font.sizeXs` (12px); a proportional sans averages roughly 0.55em per glyph, so
 * 4 * 12 * 0.55 ≈ 26px — rounded up to 28px for a little breathing room.
 */
export const MIN_LABEL_ARC_LENGTH_PX = 28;

/** True when a slice's angular span, at the given outer radius, is wide enough for a label per `MIN_LABEL_ARC_LENGTH_PX`. */
export function isLabelFittable(startAngle: number, endAngle: number, outerRadius: number): boolean {
  return (endAngle - startAngle) * outerRadius >= MIN_LABEL_ARC_LENGTH_PX;
}

/** Outward unit-direction `[dx, dy]` along a slice's angle bisector, using d3's arc angle convention (0 at -y/12 o'clock, clockwise positive). Used to offset a hovered slice outward. */
export function arcBisectorDirection(startAngle: number, endAngle: number): [number, number] {
  const bisector = (startAngle + endAngle) / 2;
  return [Math.sin(bisector), -Math.cos(bisector)];
}
