import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const board = style({
  display: "flex",
  alignItems: "flex-start",
  gap: vars.space.md,
  overflowX: "auto",
  padding: vars.space.md,
  background: vars.color.background,
});

export const column = style({
  display: "flex",
  flexDirection: "column",
  flexShrink: 0,
  width: 280,
  maxHeight: "100%",
  background: vars.color.surface,
  borderRadius: vars.radius.lg,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  transitionProperty: "opacity, border-color",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&[data-dragging]": {
      opacity: 0.4,
    },
    "&[data-wip-warning]": {
      borderColor: vars.color.warning,
    },
  },
});

export const columnHeader = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  padding: vars.space.md,
  borderBottomWidth: vars.border.width,
  borderBottomStyle: vars.border.style,
  borderBottomColor: vars.color.border,
  cursor: "grab",
  outline: "none",
  selectors: {
    "&:focus-visible": {
      boxShadow: vars.shadow.focus,
    },
  },
});

export const columnTitle = style({
  flex: 1,
  fontFamily: vars.font.display,
  fontSize: vars.font.sizeMd,
  fontWeight: vars.font.weightMedium,
  color: vars.color.text,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const countBadge = style({
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted,
});

export const removeButton = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: vars.space.lg,
  height: vars.space.lg,
  flexShrink: 0,
  border: "none",
  background: "transparent",
  color: vars.color.textMuted,
  cursor: "pointer",
  borderRadius: vars.radius.sm,
  fontSize: vars.font.sizeSm,
  lineHeight: 1,
  selectors: {
    "&:hover": {
      background: vars.color.surfaceRaised,
      color: vars.color.text,
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus,
    },
  },
});

export const cardHeader = style({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: vars.space.xs,
});

export const cardList = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
  padding: vars.space.md,
  overflowY: "auto",
  flex: 1,
  minHeight: 0,
});

export const cardItem = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
  textAlign: "left",
  cursor: "grab",
  width: "100%",
  outline: "none",
  touchAction: "none",
  transitionProperty: "opacity, box-shadow",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:focus-visible": {
      boxShadow: vars.shadow.focus,
    },
    "&[data-dragging]": {
      opacity: 0.4,
      cursor: "grabbing",
    },
  },
});

export const cardTitle = style({
  fontSize: vars.font.sizeSm,
  fontWeight: vars.font.weightMedium,
  color: vars.color.text,
});

export const cardDescription = style({
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted,
});

export const cardTags = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space.xs,
});

export const cardFooter = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
});

export const emptyColumn = style({
  fontSize: vars.font.sizeSm,
  color: vars.color.textMuted,
  padding: vars.space.sm,
  textAlign: "center",
});

export const addCardButton = style({
  width: "100%",
  justifyContent: "flex-start",
});

export const addCardSlot = style({
  padding: vars.space.sm,
  paddingTop: 0,
});

export const addColumn = style({
  flexShrink: 0,
  width: 280,
});

export const cardDropIndicator = style({
  height: 3,
  borderRadius: vars.radius.full,
  background: vars.color.primary,
  flexShrink: 0,
});

export const columnDropIndicator = style({
  width: 3,
  alignSelf: "stretch",
  borderRadius: vars.radius.full,
  background: vars.color.primary,
  flexShrink: 0,
});

export const dragPreview = style({
  position: "fixed",
  pointerEvents: "none",
  zIndex: 10,
  display: "flex",
  flexDirection: "column",
  gap: 2,
  borderRadius: vars.radius.md,
  borderWidth: 2,
  borderStyle: "dashed",
  borderColor: vars.color.primary,
  background: vars.color.surfaceRaised,
  boxShadow: vars.shadow.lg,
  padding: vars.space.sm,
  opacity: 0.9,
});

export const dragPreviewTitle = style({
  fontSize: vars.font.sizeSm,
  fontWeight: vars.font.weightMedium,
  color: vars.color.text,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const dragPreviewMeta = style({
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted,
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
