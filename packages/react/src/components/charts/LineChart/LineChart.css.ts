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

/** LineChart-specific: the transparent hit-target rect driving nearest-point hover tracking. */
export const overlayRect = style({
  fill: "transparent",
  cursor: "crosshair"
});
