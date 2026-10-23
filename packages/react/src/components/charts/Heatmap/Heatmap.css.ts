import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export { emptyState, root } from "../internal/chartSurfaces.css";

export const axisLabel = style({
  fill: vars.chart.axis,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeXs
});

export const cellRect = style({
  selectors: {
    "&:hover": { stroke: vars.color.text, strokeWidth: 2 }
  }
});

export const cellText = style({
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeXs,
  pointerEvents: "none"
});
