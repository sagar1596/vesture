import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export {
  emptyState,
  legend,
  legendItem,
  legendItemHidden,
  legendSwatch,
  root,
  tooltip,
  tooltipRow,
  tooltipSwatch
} from "../internal/chartSurfaces.css";

/** PieChart-specific: the muted percentage figure appended after each legend item's label. */
export const legendPercentage = style({
  color: vars.color.textMuted,
  fontSize: vars.font.sizeXs
});

/** PieChart-specific: wraps each arc `<path>` + its label so hover can offset both together. */
export const sliceGroup = style({
  cursor: "pointer",
  transition: `transform ${vars.motion.durationFast} ${vars.motion.easing}`
});
