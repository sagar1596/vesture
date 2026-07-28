import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  position: "relative",
  width: "100%"
});

export const emptyState = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: vars.chart.emptyState,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm
});

/** Node shape fill is a neutral surface so arbitrary label content stays legible regardless of
 * which series color the node's border is assigned — the series palette drives the border only. */
export const nodeShape = style({
  fill: vars.color.surface,
  strokeWidth: 2,
  vectorEffect: "non-scaling-stroke"
});

export const nodeShapeInteractive = style({
  cursor: "pointer"
});

/** Selection highlight ring: `box-shadow` doesn't reliably render on SVG shape elements across
 * browsers, so the focus treatment is drawn as an extra stroked shape (same geometry as the
 * node, slightly larger) behind the node itself, using the same focusRing color `shadow.focus`
 * is built from. */
export const nodeSelectionRing = style({
  fill: "none",
  stroke: vars.color.focusRing,
  strokeWidth: 3,
  pointerEvents: "none"
});

export const nodeLabel = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  textAlign: "center",
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  color: vars.color.text,
  overflow: "hidden",
  padding: vars.space.xs,
  boxSizing: "border-box"
});

export const edgePath = style({
  fill: "none",
  strokeWidth: 2
});

export const edgeLabelBackground = style({
  fill: vars.chart.tooltipBackground
});

export const edgeLabel = style({
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeXs,
  color: vars.chart.tooltipText
});

export const arrowMarkerPath = style({
  fill: vars.chart.axis
});

export const canvas = style({
  fill: "transparent",
  cursor: "grab",
  selectors: {
    "&:active": {
      cursor: "grabbing"
    }
  }
});

export const edgePathInteractive = style({
  cursor: "pointer"
});

/** Thicker overlay stroke for a selected edge — drawn as a second path behind the real one,
 * same "extra shape behind" technique `nodeSelectionRing` uses since `box-shadow` doesn't apply. */
export const edgeSelectionRing = style({
  fill: "none",
  stroke: vars.color.focusRing,
  strokeWidth: 6,
  strokeOpacity: 0.4,
  pointerEvents: "none"
});

/** Small connection-drawing handle at a node's cardinal edge point. Shown on hover/selection/drag. */
export const nodeHandle = style({
  fill: vars.color.surface,
  stroke: vars.color.primary,
  strokeWidth: 1.5,
  cursor: "crosshair"
});

/** Highlight ring on a node currently hovered as a valid connection drop target. */
export const nodeDropTargetRing = style({
  fill: "none",
  stroke: vars.color.success,
  strokeWidth: 3,
  strokeDasharray: "4 2",
  pointerEvents: "none"
});

/** Live preview line while drawing a new connection (pointer or keyboard-driven). */
export const connectPreviewPath = style({
  fill: "none",
  stroke: vars.color.primary,
  strokeWidth: 2,
  strokeDasharray: "6 4",
  pointerEvents: "none"
});

/** Identical to Scheduler/KanbanBoard's `visuallyHidden` — backs the aria-live move/connect/delete announcer. */
export const visuallyHidden = style({
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0
});
