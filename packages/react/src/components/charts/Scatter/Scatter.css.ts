import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export { emptyState, root } from "../internal/chartSurfaces.css";

export const axisLine = style({ stroke: vars.chart.axis, strokeWidth: 1 });
export const gridLine = style({ stroke: vars.chart.grid, strokeWidth: 1 });
export const tick = style({
  fill: vars.chart.axis,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeXs
});
export const axisTitle = style({
  fill: vars.color.textMuted,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeXs
});
export const point = style({
  transition: `opacity ${vars.motion.durationFast} ${vars.motion.easing}`,
  selectors: { "&:hover": { opacity: 1 } }
});
export const legend = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space.md,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted,
  paddingTop: vars.space.xs
});
export const legendItem = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space.xs,
  background: "none",
  border: 0,
  padding: 0,
  font: "inherit",
  color: "inherit",
  cursor: "pointer"
});
export const swatch = style({ width: 10, height: 10, borderRadius: vars.radius.full });
