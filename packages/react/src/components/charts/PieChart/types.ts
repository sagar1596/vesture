export interface PieChartDataPoint {
  key: string;
  label: string;
  value: number;
  /** Overrides the auto-assigned series1-8 token color for this slice. */
  color?: string;
}

/** Props shared by the static `PieChart` and the client-only `InteractivePieChart`. */
export interface PieChartBaseProps {
  data: PieChartDataPoint[];
  /** Fraction of outerRadius carved out as a center hole: 0 (default) = full pie, e.g. 0.6 = donut. */
  innerRadius?: number;
  /** Whether to render in-slice percentage labels on slices wide enough to fit one. Defaults to true. */
  showLabels?: boolean;
}
