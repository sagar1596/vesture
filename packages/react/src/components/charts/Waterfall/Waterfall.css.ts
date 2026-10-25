import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export { emptyState, root } from "../internal/chartSurfaces.css";
export { axisLine, gridLine, tick } from "../Scatter/Scatter.css";

export const barLabel = style({
  fill: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeXs,
  fontWeight: vars.font.weightMedium
});
export const connector = style({ stroke: vars.chart.axis, strokeWidth: 1, strokeDasharray: "3 3" });
