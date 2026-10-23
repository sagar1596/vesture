import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  position: "relative",
  overflow: "auto",
  maxHeight: "100%",
  border: `${vars.border.width} ${vars.border.style} ${vars.color.border}`,
  borderRadius: vars.radius.md,
  background: vars.color.surface,
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm
});

export const header = style({
  position: "sticky",
  top: 0,
  zIndex: 3,
  display: "flex",
  background: vars.color.surfaceRaised,
  borderBottom: `${vars.border.width} ${vars.border.style} ${vars.color.border}`
});

export const headerCorner = style({
  position: "sticky",
  left: 0,
  zIndex: 4,
  flexShrink: 0,
  display: "flex",
  alignItems: "flex-end",
  padding: vars.space.sm,
  background: vars.color.surfaceRaised,
  borderRight: `${vars.border.width} ${vars.border.style} ${vars.color.border}`,
  fontWeight: vars.font.weightMedium
});

export const scale = style({
  position: "relative",
  flexShrink: 0
});

export const monthCell = style({
  position: "absolute",
  top: 0,
  height: 24,
  display: "flex",
  alignItems: "center",
  paddingLeft: vars.space.sm,
  fontWeight: vars.font.weightMedium,
  borderLeft: `${vars.border.width} ${vars.border.style} ${vars.color.border}`,
  boxSizing: "border-box",
  whiteSpace: "nowrap"
});

export const dayCell = style({
  position: "absolute",
  top: 24,
  height: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted,
  boxSizing: "border-box",
  selectors: {
    '&[data-weekend="true"]': { background: vars.color.background },
    '&[data-today="true"]': { color: vars.color.primary, fontWeight: vars.font.weightBold }
  }
});

export const row = style({
  display: "flex",
  borderBottom: `${vars.border.width} ${vars.border.style} ${vars.color.border}`
});

export const nameCell = style({
  position: "sticky",
  left: 0,
  zIndex: 2,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  paddingRight: vars.space.sm,
  background: vars.color.surface,
  borderRight: `${vars.border.width} ${vars.border.style} ${vars.color.border}`,
  boxSizing: "border-box",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis"
});

export const toggle = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 20,
  height: 20,
  flexShrink: 0,
  padding: 0,
  border: "none",
  background: "transparent",
  color: vars.color.textMuted,
  cursor: "pointer",
  borderRadius: vars.radius.sm,
  selectors: {
    "&:focus-visible": { outline: "none", boxShadow: vars.shadow.focus }
  }
});

export const toggleSpacer = style({ display: "inline-block", width: 20, flexShrink: 0 });

export const taskName = style({
  overflow: "hidden",
  textOverflow: "ellipsis",
  fontWeight: vars.font.weightRegular,
  selectors: {
    '&[data-summary="true"]': { fontWeight: vars.font.weightBold }
  }
});

export const lane = style({
  position: "relative",
  flexShrink: 0
});

export const gridLine = style({
  position: "absolute",
  top: 0,
  bottom: 0,
  width: 1,
  background: vars.color.border,
  opacity: 0.5
});

export const weekendShade = style({
  position: "absolute",
  top: 0,
  bottom: 0,
  background: vars.color.background,
  opacity: 0.6
});

export const todayLine = style({
  position: "absolute",
  top: 0,
  bottom: 0,
  width: 2,
  background: vars.color.primary,
  opacity: 0.6,
  zIndex: 1,
  pointerEvents: "none"
});

export const bar = style({
  position: "absolute",
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
  background: vars.color.primary,
  borderRadius: vars.radius.sm,
  boxSizing: "border-box",
  touchAction: "none",
  userSelect: "none",
  selectors: {
    '&[data-editable="true"]': { cursor: "grab" },
    '&[data-dragging="true"]': { cursor: "grabbing", boxShadow: vars.shadow.md },
    '&[data-summary="true"]': { background: vars.color.text, opacity: 0.8, cursor: "default" },
    "&:focus-visible": { outline: "none", boxShadow: vars.shadow.focus }
  }
});

export const barProgress = style({
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  // A translucent shade works over any bar color (task.color / getBarColor), unlike a fixed fill.
  background: vars.color.text,
  opacity: 0.3,
  pointerEvents: "none"
});

export const barLabel = style({
  position: "relative",
  padding: `0 ${vars.space.sm}`,
  color: vars.color.primaryText,
  fontSize: vars.font.sizeXs,
  whiteSpace: "nowrap",
  pointerEvents: "none"
});

export const handle = style({
  position: "absolute",
  top: 0,
  bottom: 0,
  width: 6,
  cursor: "ew-resize",
  selectors: {
    '&[data-edge="start"]': { left: 0 },
    '&[data-edge="end"]': { right: 0 }
  }
});

export const arrows = style({
  position: "absolute",
  pointerEvents: "none",
  zIndex: 1,
  overflow: "visible"
});

export const arrowPath = style({
  fill: "none",
  stroke: vars.color.textMuted,
  strokeWidth: 1.5
});

export const visuallyHidden = style({
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap"
});
