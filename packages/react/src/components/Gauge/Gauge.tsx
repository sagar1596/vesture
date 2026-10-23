import type { CSSProperties, ReactElement, ReactNode } from "react";
import { vars } from "@vesture/tokens";
import {
  GAUGE_START_ANGLE,
  GAUGE_SWEEP,
  colorForValue,
  describeArc,
  fractionToAngle,
  polarToCartesian,
  tickValues,
  valueToFraction,
  type GaugeRange
} from "./Gauge.render";
import {
  arcTransition,
  linearFill,
  linearHeader,
  linearRoot,
  linearScale,
  linearTrack,
  radialReadout,
  radialRoot,
  readoutLabel,
  readoutValue
} from "./Gauge.css";

export type { GaugeRange } from "./Gauge.render";

interface GaugeBaseProps {
  value: number;
  min?: number;
  max?: number;
  /** Color bands; the fill takes the color of the band the value falls in. */
  ranges?: GaugeRange[];
  label?: string;
  /** Formats the displayed value; defaults to the raw number. */
  formatValue?: (value: number) => string;
  /** Fill color when no range matches; defaults to the theme primary. */
  color?: string;
  /** Color of the unfilled track. */
  trackColor?: string;
  /** Draws a marker at this value (e.g. a goal or SLA threshold). */
  target?: number;
  className?: string;
  style?: CSSProperties;
}

export interface RadialGaugeProps extends GaugeBaseProps {
  /** Outer diameter in px. */
  size?: number;
  /** Where the dial begins, in degrees clockwise from 3 o'clock. Default 135 (bottom-left). */
  startAngle?: number;
  /** Total degrees the dial spans. Default 270; use 180 for a half-dial, 360 for a full ring. */
  sweep?: number;
  /** Stroke width in px; defaults to 9% of `size`. */
  thickness?: number;
  /** Flat ends instead of rounded. */
  squareCaps?: boolean;
  /** Number of tick marks around the dial (including both ends); 0 for none. */
  ticks?: number;
  /** Prints the tick values beside the ticks. */
  showTickLabels?: boolean;
  /** Replaces the default value + label readout in the dial's center. */
  renderCenter?: (info: { value: number; fraction: number; color: string; formatted: string }) => ReactNode;
}

export interface LinearGaugeProps extends GaugeBaseProps {
  /** Bar thickness in px. */
  thickness?: number;
  /** Shows the min/max scale beneath the bar. */
  showScale?: boolean;
  /** Replaces the right-hand value text in the header. */
  renderValue?: (info: { value: number; fraction: number; formatted: string }) => ReactNode;
  /** Flat ends instead of rounded. */
  squareCaps?: boolean;
}

/** Dial gauge with a value readout in the center. Angles, thickness, ticks, target and center content are configurable. */
export function RadialGauge({
  value,
  min = 0,
  max = 100,
  ranges,
  label,
  formatValue = String,
  color,
  trackColor = vars.color.border,
  target,
  size = 160,
  startAngle = GAUGE_START_ANGLE,
  sweep = GAUGE_SWEEP,
  thickness,
  squareCaps = false,
  ticks = 0,
  showTickLabels = false,
  renderCenter,
  className,
  style
}: RadialGaugeProps): ReactElement {
  const stroke = thickness ?? Math.max(8, size * 0.09);
  const labelRoom = showTickLabels ? 14 : 0;
  const r = size / 2 - stroke / 2 - labelRoom;
  const c = size / 2;
  const fraction = valueToFraction(value, min, max);
  // A full ring can't be one SVG arc (start == end), so stop a hair short.
  const fullSweep = Math.min(sweep, 359.99);
  const endAngle = fractionToAngle(fraction, startAngle, fullSweep);
  const fillColor = colorForValue(value, ranges) ?? color ?? vars.color.primary;
  const formatted = formatValue(value);
  const cap = squareCaps ? "butt" : "round";

  return (
    <div
      className={[radialRoot, className].filter(Boolean).join(" ")}
      style={{ width: size, height: size, ...style }}
      role="meter"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={formatted}
      aria-label={label ?? "Gauge"}
    >
      <svg width={size} height={size} aria-hidden="true">
        <path d={describeArc(c, c, r, startAngle, startAngle + fullSweep)} fill="none" stroke={trackColor} strokeWidth={stroke} strokeLinecap={cap} />
        {fraction > 0 ? (
          <path
            data-testid="gauge-fill"
            className={arcTransition}
            d={describeArc(c, c, r, startAngle, Math.max(endAngle, startAngle + 0.01))}
            fill="none"
            stroke={fillColor}
            strokeWidth={stroke}
            strokeLinecap={cap}
          />
        ) : null}
        {ticks > 0
          ? tickValues(min, max, ticks).map((tv, i) => {
              const a = fractionToAngle(valueToFraction(tv, min, max), startAngle, fullSweep);
              const inner = polarToCartesian(c, c, r - stroke / 2 - 2, a);
              const outer = polarToCartesian(c, c, r - stroke / 2 - 7, a);
              const text = polarToCartesian(c, c, r + stroke / 2 + 9, a);
              return (
                <g key={i} data-testid="gauge-tick">
                  <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={vars.chart.axis} strokeWidth={1} />
                  {showTickLabels ? (
                    <text x={text.x} y={text.y} textAnchor="middle" dominantBaseline="middle" fill={vars.chart.axis} fontSize={vars.font.sizeXs} fontFamily={vars.font.body}>
                      {formatValue(tv)}
                    </text>
                  ) : null}
                </g>
              );
            })
          : null}
        {target !== undefined ? (
          (() => {
            const a = fractionToAngle(valueToFraction(target, min, max), startAngle, fullSweep);
            const p1 = polarToCartesian(c, c, r - stroke / 2 - 1, a);
            const p2 = polarToCartesian(c, c, r + stroke / 2 + 1, a);
            return <line data-testid="gauge-target" x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={vars.color.text} strokeWidth={2.5} />;
          })()
        ) : null}
      </svg>
      <div className={radialReadout}>
        {renderCenter ? (
          renderCenter({ value, fraction, color: fillColor, formatted })
        ) : (
          <>
            <span className={readoutValue}>{formatted}</span>
            {label ? <span className={readoutLabel}>{label}</span> : null}
          </>
        )}
      </div>
    </div>
  );
}

/** Horizontal bar gauge with optional scale, target marker, and custom value rendering. */
export function LinearGauge({
  value,
  min = 0,
  max = 100,
  ranges,
  label,
  formatValue = String,
  color,
  trackColor = vars.color.border,
  target,
  thickness = 10,
  showScale = true,
  squareCaps = false,
  renderValue,
  className,
  style
}: LinearGaugeProps): ReactElement {
  const fraction = valueToFraction(value, min, max);
  const fillColor = colorForValue(value, ranges) ?? color ?? vars.color.primary;
  const formatted = formatValue(value);
  const radius = squareCaps ? 0 : thickness;

  return (
    <div className={[linearRoot, className].filter(Boolean).join(" ")} style={style}>
      <div className={linearHeader}>
        <span>{label}</span>
        {renderValue ? renderValue({ value, fraction, formatted }) : <strong>{formatted}</strong>}
      </div>
      <div
        className={linearTrack}
        style={{ height: thickness, background: trackColor, borderRadius: radius, overflow: target !== undefined ? "visible" : "hidden" }}
        role="meter"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={formatted}
        aria-label={label ?? "Gauge"}
      >
        <div data-testid="gauge-fill" className={linearFill} style={{ width: `${fraction * 100}%`, background: fillColor, borderRadius: radius }} />
        {target !== undefined ? (
          <div
            data-testid="gauge-target"
            style={{
              position: "absolute",
              top: -3,
              bottom: -3,
              left: `${valueToFraction(target, min, max) * 100}%`,
              width: 2,
              background: vars.color.text
            }}
          />
        ) : null}
      </div>
      {showScale ? (
        <div className={linearScale}>
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      ) : null}
    </div>
  );
}
