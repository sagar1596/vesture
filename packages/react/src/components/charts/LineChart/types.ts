/** A single row of chart data. `x` is the shared category/position for every series; each series' value is looked up by its `key` on this object. */
export interface LineChartDataPoint {
  x: string | number | Date;
  [seriesKey: string]: string | number | Date;
}

export interface LineChartSeries {
  key: string;
  label: string;
  /** Overrides the auto-assigned series1-8 token color for this series. */
  color?: string;
}

export type LineChartXScaleType = "linear" | "time" | "band";

export interface LineChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Props shared by the static `LineChart` and the client-only `InteractiveLineChart`. */
export interface LineChartBaseProps {
  data: LineChartDataPoint[];
  series: LineChartSeries[];
  /** Defaults to inferring from the first data point's `x` type (Date -> time, number -> linear, string -> band). */
  xScale?: LineChartXScaleType;
  margin?: Partial<LineChartMargin>;
}
