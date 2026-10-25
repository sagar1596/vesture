import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export { emptyState, root } from "../internal/chartSurfaces.css";
export { axisLine, gridLine, tick, legend, legendItem, swatch } from "../Scatter/Scatter.css";

export const surface = style({
  position: "relative",
  outline: "none",
  touchAction: "none",
  cursor: "crosshair",
  selectors: {
    "&:focus-visible": { boxShadow: vars.shadow.focus, borderRadius: vars.radius.sm }
  }
});

export const crosshair = style({
  stroke: vars.chart.axis,
  strokeWidth: 1,
  strokeDasharray: "3 3",
  pointerEvents: "none"
});

export const readout = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space.md,
  minHeight: 20,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted,
  paddingBottom: vars.space.xs
});
