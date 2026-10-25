import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export { emptyState, root } from "../internal/chartSurfaces.css";

export const link = style({
  fill: "none",
  transition: `opacity ${vars.motion.durationFast} ${vars.motion.easing}`
});
export const node = style({ outline: "none" });
export const nodeRect = style({
  selectors: { [`${node}:focus-visible &`]: { stroke: vars.color.focusRing, strokeWidth: 2 } }
});
export const label = style({
  fill: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  pointerEvents: "none"
});
export const labelValue = style({ fill: vars.color.textMuted, fontSize: vars.font.sizeXs });
