import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export { emptyState, root } from "../internal/chartSurfaces.css";

export const segment = style({
  transition: `opacity ${vars.motion.durationFast} ${vars.motion.easing}`,
  selectors: {
    "&:hover": { opacity: 0.85 }
  }
});

export const segmentLabel = style({
  fill: vars.color.textInverse,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  fontWeight: vars.font.weightMedium,
  pointerEvents: "none"
});

export const segmentMeta = style({
  fill: vars.color.textInverse,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeXs,
  opacity: 0.85,
  pointerEvents: "none"
});
