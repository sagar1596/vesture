import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";
import { SLOT_HEIGHT_PX } from "./scheduler-layout";

export const root = style({
  display: "flex",
  flexDirection: "column",
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  color: vars.color.text,
  background: vars.color.surfaceRaised,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.md,
  overflow: "hidden",
});

export const header = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space.sm,
  padding: vars.space.sm,
  borderBottomWidth: vars.border.width,
  borderBottomStyle: vars.border.style,
  borderBottomColor: vars.color.border,
});

export const headerNav = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
});

export const navButton = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: vars.space.xl,
  height: vars.space.xl,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: "transparent",
  borderRadius: vars.radius.sm,
  background: "transparent",
  color: vars.color.text,
  cursor: "pointer",
  fontSize: vars.font.sizeMd,
  lineHeight: 1,
  outline: "none",
  transitionProperty: "background-color, box-shadow",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:hover:not(:disabled)": {
      background: vars.color.surface,
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus,
    },
  },
});

export const todayButton = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: vars.space.xl,
  paddingLeft: vars.space.sm,
  paddingRight: vars.space.sm,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.sm,
  background: "transparent",
  color: vars.color.text,
  cursor: "pointer",
  fontSize: vars.font.sizeSm,
  outline: "none",
  transitionProperty: "background-color, box-shadow",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:hover:not(:disabled)": {
      background: vars.color.surface,
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus,
    },
  },
});

export const rangeLabel = style({
  fontWeight: vars.font.weightMedium,
  fontSize: vars.font.sizeMd,
});

export const dayHeaderRow = style({
  display: "grid",
  gridTemplateColumns: "var(--vesture-scheduler-gutter-width, 56px) repeat(7, 1fr)",
  borderBottomWidth: vars.border.width,
  borderBottomStyle: vars.border.style,
  borderBottomColor: vars.color.border,
});

export const dayHeaderGutter = style({});

export const dayHeaderCell = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
  paddingTop: vars.space.xs,
  paddingBottom: vars.space.xs,
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted,
  textTransform: "uppercase",
  selectors: {
    "&[data-today='true']": {
      color: vars.color.primary,
      fontWeight: vars.font.weightMedium,
    },
  },
});

export const dayHeaderDateNumber = style({
  fontSize: vars.font.sizeMd,
  color: vars.color.text,
  textTransform: "none",
  selectors: {
    "&[data-today='true']": {
      color: vars.color.primary,
      fontWeight: vars.font.weightBold,
    },
  },
});

export const allDayRow = style({
  display: "grid",
  gridTemplateColumns: "var(--vesture-scheduler-gutter-width, 56px) repeat(7, 1fr)",
  borderBottomWidth: vars.border.width,
  borderBottomStyle: vars.border.style,
  borderBottomColor: vars.color.border,
});

export const allDayGutter = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted,
});

export const allDayCell = style({
  display: "flex",
  flexDirection: "column",
  gap: 2,
  padding: vars.space.xs,
  minHeight: vars.space.xl,
  borderLeftWidth: vars.border.width,
  borderLeftStyle: vars.border.style,
  borderLeftColor: vars.color.border,
});

export const scrollArea = style({
  display: "grid",
  gridTemplateColumns: "var(--vesture-scheduler-gutter-width, 56px) repeat(7, 1fr)",
  overflowY: "auto",
  maxHeight: "640px",
});

export const timeGutter = style({
  position: "relative",
});

export const hourLabel = style({
  position: "absolute",
  right: vars.space.xs,
  transform: "translateY(-50%)",
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted,
  whiteSpace: "nowrap",
});

export const dayColumn = style({
  position: "relative",
  borderLeftWidth: vars.border.width,
  borderLeftStyle: vars.border.style,
  borderLeftColor: vars.color.border,
  backgroundImage: `linear-gradient(to bottom, ${vars.chart.grid} 1px, transparent 1px)`,
  backgroundRepeat: "repeat-y",
  backgroundSize: `100% ${SLOT_HEIGHT_PX}px`,
});

export const nowLine = style({
  position: "absolute",
  left: 0,
  right: 0,
  height: 0,
  borderTopWidth: 2,
  borderTopStyle: "solid",
  borderTopColor: vars.color.danger,
  zIndex: 2,
  pointerEvents: "none",
});

export const nowLineDot = style({
  position: "absolute",
  left: -4,
  top: -4,
  width: 8,
  height: 8,
  borderRadius: vars.radius.full,
  background: vars.color.danger,
});

export const eventBlock = style({
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  borderRadius: vars.radius.sm,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: "transparent",
  padding: "2px 4px",
  textAlign: "left",
  cursor: "pointer",
  color: vars.color.textInverse,
  outline: "none",
  transitionProperty: "box-shadow",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:focus-visible": {
      boxShadow: vars.shadow.focus,
    },
    "&[data-selected='true']": {
      boxShadow: vars.shadow.focus,
    },
    "&[data-editable='true']": {
      cursor: "grab",
      touchAction: "none",
    },
    "&[data-dragging='true']": {
      opacity: 0.4,
      cursor: "grabbing",
    },
  },
});

export const resizeHandle = style({
  position: "absolute",
  left: 0,
  right: 0,
  bottom: -4,
  height: 12,
  cursor: "ns-resize",
  touchAction: "none",
});

export const dragPreview = style({
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  borderRadius: vars.radius.sm,
  borderWidth: 2,
  borderStyle: "dashed",
  borderColor: vars.color.primary,
  background: vars.color.primary,
  opacity: 0.3,
  padding: "2px 4px",
  pointerEvents: "none",
  zIndex: 3,
});

export const dragPreviewLabel = style({
  fontWeight: vars.font.weightMedium,
  fontSize: vars.font.sizeXs,
  lineHeight: vars.font.lineHeightTight,
  color: vars.color.text,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const visuallyHidden = style({
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
});

export const allDayEventBlock = style({
  display: "block",
  width: "100%",
  borderRadius: vars.radius.sm,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: "transparent",
  padding: "2px 6px",
  textAlign: "left",
  cursor: "pointer",
  color: vars.color.textInverse,
  outline: "none",
  fontSize: vars.font.sizeXs,
  transitionProperty: "box-shadow",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:focus-visible": {
      boxShadow: vars.shadow.focus,
    },
    "&[data-selected='true']": {
      boxShadow: vars.shadow.focus,
    },
  },
});

export const eventTitle = style({
  fontWeight: vars.font.weightMedium,
  fontSize: vars.font.sizeXs,
  lineHeight: vars.font.lineHeightTight,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const eventTime = style({
  fontSize: vars.font.sizeXs,
  lineHeight: vars.font.lineHeightTight,
  opacity: 0.85,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
