import { style } from "@vanilla-extract/css";

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

/** AreaChart-specific: the transparent hit-target rect driving nearest-point hover tracking (same technique as LineChart's overlayRect). */
export const overlayRect = style({
  fill: "transparent",
  cursor: "crosshair"
});
