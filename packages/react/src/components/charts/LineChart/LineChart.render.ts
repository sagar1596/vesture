import { scaleBand, scaleLinear, scaleTime } from "@visx/scale";
import { line as d3Line } from "@visx/vendor/d3-shape";
import type { ScaleBand, ScaleLinear, ScaleTime } from "@visx/vendor/d3-scale";
import { vars } from "@vesture/tokens";
import type {
  LineChartDataPoint,
  LineChartMargin,
  LineChartSeries,
  LineChartXScaleType
} from "./types";

export const DEFAULT_MARGIN: LineChartMargin = { top: 16, right: 16, bottom: 32, left: 48 };

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

export function getSeriesColor(series: LineChartSeries, index: number): string {
  return series.color ?? SERIES_COLOR_CYCLE[index % SERIES_COLOR_CYCLE.length]!;
}

export function resolveMargin(margin?: Partial<LineChartMargin>): LineChartMargin {
  return { ...DEFAULT_MARGIN, ...margin };
}

export function inferXScaleType(data: LineChartDataPoint[]): LineChartXScaleType {
  const first = data[0]?.x;
  if (first instanceof Date) return "time";
  if (typeof first === "number") return "linear";
  return "band";
}

export function numericValue(value: string | number | Date | undefined): number | undefined {
  if (value === undefined) return undefined;
  const n = value instanceof Date ? value.getTime() : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export type LineChartXScale =
  | ScaleTime<number, number>
  | ScaleLinear<number, number>
  | ScaleBand<string>;

export interface LineChartScales {
  xScale: LineChartXScale;
  yScale: ScaleLinear<number, number>;
  xScaleType: LineChartXScaleType;
  innerWidth: number;
  innerHeight: number;
  margin: LineChartMargin;
}

export function buildScales(
  data: LineChartDataPoint[],
  series: LineChartSeries[],
  width: number,
  height: number,
  margin: LineChartMargin,
  xScaleType: LineChartXScaleType,
  /** When true, the y domain is computed from each data point's cumulative series sum rather
   * than the per-series max — used by AreaChart's stacked mode, which reuses this function
   * directly rather than re-deriving y-domain logic. LineChart itself never passes this. */
  stacked = false
): LineChartScales {
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  let xScale: LineChartXScale;
  if (xScaleType === "time") {
    const xValues = data.map((d) => new Date(d.x as string | number | Date).getTime());
    xScale = scaleTime({
      domain: [Math.min(...xValues), Math.max(...xValues)],
      range: [0, innerWidth]
    });
  } else if (xScaleType === "linear") {
    const xValues = data.map((d) => Number(d.x));
    xScale = scaleLinear({
      domain: [Math.min(...xValues), Math.max(...xValues)],
      range: [0, innerWidth]
    });
  } else {
    xScale = scaleBand({
      domain: data.map((d) => String(d.x)),
      range: [0, innerWidth],
      padding: 0.2
    });
  }

  const yValues = stacked
    ? data.map((d) => series.reduce((sum, s) => sum + (numericValue(d[s.key]) ?? 0), 0))
    : data.flatMap((d) =>
        series
          .map((s) => numericValue(d[s.key]))
          .filter((v): v is number => v !== undefined)
      );
  const yMin = stacked ? 0 : yValues.length > 0 ? Math.min(0, ...yValues) : 0;
  const yMax = yValues.length > 0 ? Math.max(...yValues) : 1;
  const yScale = scaleLinear({
    domain: [yMin, yMax],
    range: [innerHeight, 0],
    nice: true
  });

  return { xScale, yScale, xScaleType, innerWidth, innerHeight, margin };
}

export function getXPixel(scales: LineChartScales, x: LineChartDataPoint["x"]): number | undefined {
  const { xScale, xScaleType } = scales;
  if (xScaleType === "band") {
    const pos = (xScale as ScaleBand<string>)(String(x));
    if (pos === undefined) return undefined;
    return pos + (xScale as ScaleBand<string>).bandwidth() / 2;
  }
  if (xScaleType === "time") {
    return (xScale as ScaleTime<number, number>)(new Date(x as string | number | Date));
  }
  return (xScale as ScaleLinear<number, number>)(Number(x));
}

export function getYPixel(scales: LineChartScales, value: string | number | Date | undefined): number | undefined {
  const n = numericValue(value);
  if (n === undefined) return undefined;
  return scales.yScale(n);
}

export interface LineChartSeriesPoint {
  dataIndex: number;
  x: number;
  y: number;
}

export interface LineChartSeriesLayout {
  key: string;
  label: string;
  color: string;
  /** Pixel-space points, already positioned within the scales' inner plot area. Points whose value is missing/non-numeric are omitted, which splits the line into gapped segments. */
  points: LineChartSeriesPoint[];
  /** SVG path `d` attribute for this series' points, generated with a linear curve. Empty string when fewer than 2 points are defined. */
  path: string;
}

const pathGenerator = d3Line<LineChartSeriesPoint>()
  .x((p) => p.x)
  .y((p) => p.y);

/**
 * The shared entry point: given data/series/dimensions, computes scales and per-series
 * pixel-space geometry once. Both the static `LineChart` (feeding this into visx's
 * `LinePath`) and `InteractiveLineChart` (feeding this into hover hit-testing) call this
 * same function rather than re-deriving scales/points independently.
 */
export function buildLineChartLayout(
  data: LineChartDataPoint[],
  series: LineChartSeries[],
  width: number,
  height: number,
  margin?: Partial<LineChartMargin>,
  xScaleType?: LineChartXScaleType
): { scales: LineChartScales; seriesLayouts: LineChartSeriesLayout[] } {
  const resolvedMargin = resolveMargin(margin);
  const resolvedXScaleType = xScaleType ?? inferXScaleType(data);
  const scales = buildScales(data, series, width, height, resolvedMargin, resolvedXScaleType);

  const seriesLayouts: LineChartSeriesLayout[] = series.map((s, index) => {
    const points: LineChartSeriesPoint[] = [];
    data.forEach((d, dataIndex) => {
      const x = getXPixel(scales, d.x);
      const y = getYPixel(scales, d[s.key]);
      if (x !== undefined && y !== undefined) {
        points.push({ dataIndex, x, y });
      }
    });
    return {
      key: s.key,
      label: s.label,
      color: getSeriesColor(s, index),
      points,
      path: points.length >= 2 ? pathGenerator(points) ?? "" : ""
    };
  });

  return { scales, seriesLayouts };
}

/** Finds the data point whose x position is closest to `pixelX` (an offset within the plot's inner area, e.g. from a mousemove event minus the left margin). Used by the interactive hover overlay. */
export function findNearestDataIndex(
  data: LineChartDataPoint[],
  scales: LineChartScales,
  pixelX: number
): number | null {
  if (data.length === 0) return null;

  let nearestIndex = 0;
  let nearestDistance = Infinity;
  data.forEach((d, index) => {
    const x = getXPixel(scales, d.x);
    if (x === undefined) return;
    const distance = Math.abs(x - pixelX);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestDistance === Infinity ? null : nearestIndex;
}
