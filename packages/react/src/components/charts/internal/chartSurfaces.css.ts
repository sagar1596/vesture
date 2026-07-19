import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

/**
 * Styling shared by every chart component's static + interactive pair (root container, empty
 * state, hover tooltip surface, legend). Chart-type-specific styles (e.g. LineChart's hover
 * overlayRect) stay in that chart's own `<Name>.css.ts` — only import from here what's
 * structurally identical across chart types, so this doesn't become a dumping ground.
 */

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

/** Echoes Popover's floating-surface treatment (surface + border + shadow.md), applied via chart.tooltip* tokens. */
export const tooltip = style({
  position: "absolute",
  pointerEvents: "none",
  background: vars.chart.tooltipBackground,
  color: vars.chart.tooltipText,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeXs,
  lineHeight: vars.font.lineHeightNormal,
  borderRadius: vars.radius.sm,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.chart.tooltipBorder,
  paddingTop: vars.space.xs,
  paddingBottom: vars.space.xs,
  paddingLeft: vars.space.sm,
  paddingRight: vars.space.sm,
  boxShadow: vars.shadow.md,
  zIndex: 1200
});

export const tooltipRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs
});

export const tooltipSwatch = style({
  display: "inline-block",
  width: "8px",
  height: "8px",
  borderRadius: vars.radius.full,
  flexShrink: 0
});

export const legend = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space.md,
  marginTop: vars.space.sm
});

export const legendItem = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space.xs,
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  color: vars.color.text
});

export const legendItemHidden = style({
  color: vars.color.textMuted,
  textDecoration: "line-through"
});

export const legendSwatch = style({
  display: "inline-block",
  width: "10px",
  height: "10px",
  borderRadius: vars.radius.full,
  flexShrink: 0
});
