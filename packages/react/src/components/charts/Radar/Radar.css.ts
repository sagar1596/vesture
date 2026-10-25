import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export { emptyState, root } from "../internal/chartSurfaces.css";
export { legend, legendItem, swatch } from "../Scatter/Scatter.css";

export const ring = style({ fill: "none", stroke: vars.chart.grid, strokeWidth: 1 });
export const spoke = style({ stroke: vars.chart.grid, strokeWidth: 1 });
export const axisLabel = style({
  fill: vars.color.textMuted,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeXs
});
export const ringLabel = style({
  fill: vars.chart.axis,
  fontFamily: vars.font.body,
  fontSize: 10
});
