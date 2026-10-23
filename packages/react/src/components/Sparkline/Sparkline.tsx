import type { ReactElement, SVGAttributes } from "react";
import { vars } from "@vesture/tokens";
import {
  computeSparklinePoints,
  pointsToPath,
  valueToY,
  type SparklineCurve,
  type SparklineDomain
} from "./Sparkline.render";
import { root } from "./Sparkline.css";

export type { SparklineCurve } from "./Sparkline.render";

export interface SparklineProps extends Omit<SVGAttributes<SVGSVGElement>, "values" | "width" | "height"> {
  values: number[];
  type?: "line" | "area" | "bar";
  width?: number;
  height?: number;
  /** Any CSS color; defaults to the first chart series color. */
  color?: string;
  /** Bar color for values below `baseline` (bar type only); defaults to `color`. */
  negativeColor?: string;
  /** Line/area interpolation. */
  curve?: SparklineCurve;
  strokeWidth?: number;
  /** Fill opacity of the area under an `area` sparkline. */
  areaOpacity?: number;
  /** Pins either end of the y-scale; handy to anchor bars at zero or compare sparklines on one scale. */
  domain?: SparklineDomain;
  /** Draws a dashed horizontal reference line (and splits bar colors) at this value. */
  baseline?: number;
  /** Which points get a dot (line/area only). `showLastPoint` is shorthand for `"last"`. */
  highlight?: "none" | "last" | "min" | "max" | "minmax" | "all";
  /** Marks the final value with a dot (line/area only). Ignored when `highlight` is set. */
  showLastPoint?: boolean;
  /** Gap between bars in px (bar type only). */
  barGap?: number;
  /** Overrides the default accessible label. */
  label?: string;
}

/** Tiny axis-less chart for dense places like table cells and stat tiles. */
export function Sparkline({
  values,
  type = "line",
  width = 120,
  height = 32,
  color = vars.chart.series1,
  negativeColor,
  curve = "linear",
  strokeWidth = 1.5,
  areaOpacity = 0.2,
  domain,
  baseline,
  highlight,
  showLastPoint = true,
  barGap = 1,
  label,
  className,
  ...rest
}: SparklineProps): ReactElement {
  const pad = Math.max(2, strokeWidth);
  // A baseline must stay inside the scale so the reference line is drawn.
  const resolvedDomain: SparklineDomain = {
    min: domain?.min ?? (baseline !== undefined && values.length ? Math.min(baseline, ...values) : undefined),
    max: domain?.max ?? (baseline !== undefined && values.length ? Math.max(baseline, ...values) : undefined)
  };
  const points = computeSparklinePoints(values, width, height, pad, resolvedDomain);
  const baseY = baseline === undefined ? undefined : valueToY(baseline, values, height, pad, resolvedDomain);

  const mode = highlight ?? (showLastPoint ? "last" : "none");
  const minIdx = values.indexOf(Math.min(...values));
  const maxIdx = values.indexOf(Math.max(...values));
  const dotIdx = new Set<number>();
  if (mode === "last") dotIdx.add(values.length - 1);
  if (mode === "min" || mode === "minmax") dotIdx.add(minIdx);
  if (mode === "max" || mode === "minmax") dotIdx.add(maxIdx);
  if (mode === "all") values.forEach((_, i) => dotIdx.add(i));

  const linePath = pointsToPath(points, curve);

  return (
    <svg
      role="img"
      aria-label={label ?? `Sparkline of ${values.length} values`}
      {...rest}
      className={[root, className].filter(Boolean).join(" ")}
      width={width}
      height={height}
    >
      {baseY !== undefined ? (
        <line
          data-testid="sparkline-baseline"
          x1={pad}
          x2={width - pad}
          y1={baseY}
          y2={baseY}
          stroke={vars.chart.axis}
          strokeDasharray="3 3"
          strokeWidth={1}
        />
      ) : null}
      {type === "bar" ? (
        points.map((p, i) => {
          const barW = Math.max(1, (width - pad * 2) / values.length - barGap);
          const zeroY = baseY ?? height - pad;
          const negative = baseline !== undefined && values[i]! < baseline;
          return (
            <rect
              key={i}
              data-testid="sparkline-bar"
              x={p.x - barW / 2}
              y={Math.min(p.y, zeroY)}
              width={barW}
              height={Math.max(1, Math.abs(zeroY - p.y))}
              fill={negative && negativeColor ? negativeColor : color}
            />
          );
        })
      ) : (
        <>
          {type === "area" && points.length > 1 ? (
            <path
              d={`${linePath} L${points[points.length - 1]!.x},${height - pad} L${points[0]!.x},${height - pad} Z`}
              fill={color}
              fillOpacity={areaOpacity}
            />
          ) : null}
          <path d={linePath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
          {[...dotIdx].map((i) =>
            points[i] ? <circle key={i} data-testid="sparkline-dot" cx={points[i]!.x} cy={points[i]!.y} r={strokeWidth + 1} fill={color} /> : null
          )}
        </>
      )}
    </svg>
  );
}
