import type { LineChartDataPoint, LineChartMargin, LineChartSeries, LineChartXScaleType } from "../LineChart/types";

// AreaChart's data/series shape is identical to LineChart's (a row keyed by `x` plus one
// numeric value per series key) — aliased rather than redefined.
export type AreaChartDataPoint = LineChartDataPoint;
export type AreaChartSeries = LineChartSeries;
export type AreaChartMargin = LineChartMargin;
export type AreaChartXScaleType = LineChartXScaleType;

/** Props shared by the static `AreaChart` and the client-only `InteractiveAreaChart`. */
export interface AreaChartBaseProps {
  data: AreaChartDataPoint[];
  series: AreaChartSeries[];
  /** Defaults to inferring from the first data point's `x` type (Date -> time, number -> linear, string -> band). */
  xScale?: AreaChartXScaleType;
  margin?: Partial<AreaChartMargin>;
  /** When true, series stack cumulatively into one filled region per x. When false (default), series overlap with partial opacity so all remain visible. */
  stacked?: boolean;
}
