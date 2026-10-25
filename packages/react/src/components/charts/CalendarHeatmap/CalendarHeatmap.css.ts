import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export { root } from "../internal/chartSurfaces.css";

export const text = style({
  fill: vars.chart.axis,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeXs
});
export const cell = style({
  outline: "none",
  selectors: {
    "&:hover": { stroke: vars.color.borderStrong, strokeWidth: 1 },
    "&:focus-visible": { stroke: vars.color.focusRing, strokeWidth: 2 }
  }
});
export const legend = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: vars.space.xs,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted,
  paddingTop: vars.space.xs
});
export const legendCell = style({ width: 12, height: 12, display: "inline-block" });
