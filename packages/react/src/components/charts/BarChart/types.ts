/** A single category's row of chart data. Each series' value is looked up by its `key` on this object. */
export interface BarChartDataPoint {
  category: string;
  [seriesKey: string]: string | number;
}

export interface BarChartSeries {
  key: string;
  label: string;
  /** Overrides the auto-assigned series1-8 token color for this series. */
  color?: string;
}

/** 'grouped': series render as side-by-side bars per category. 'stacked': series stack into one bar per category. */
export type BarChartLayout = "grouped" | "stacked";

export interface BarChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Props shared by the static `BarChart` and the client-only `InteractiveBarChart`. */
export interface BarChartBaseProps {
  data: BarChartDataPoint[];
  series: BarChartSeries[];
  /** Defaults to 'grouped'. */
  layout?: BarChartLayout;
  margin?: Partial<BarChartMargin>;
}
