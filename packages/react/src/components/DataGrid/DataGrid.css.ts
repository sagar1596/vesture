import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const container = style({
  position: "relative",
  overflow: "auto",
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  color: vars.color.text
});

export const headerRow = style({
  position: "sticky",
  top: 0,
  display: "flex",
  zIndex: 1,
  background: vars.color.surface,
  borderBottomWidth: vars.border.width,
  borderBottomStyle: vars.border.style,
  borderBottomColor: vars.color.border
});

export const headerCell = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  flexShrink: 0,
  paddingTop: vars.space.sm,
  paddingBottom: vars.space.sm,
  paddingLeft: vars.space.md,
  paddingRight: vars.space.md,
  fontWeight: vars.font.weightMedium,
  color: vars.color.textMuted,
  userSelect: "none",
  boxSizing: "border-box"
});

export const headerButton = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  border: "none",
  background: "transparent",
  color: "inherit",
  font: "inherit",
  padding: 0,
  cursor: "pointer",
  selectors: {
    "&:focus-visible": {
      boxShadow: vars.shadow.focus,
      borderRadius: vars.radius.sm
    }
  }
});

export const sortIcon = style({
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted
});

export const resizeHandle = style({
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  width: "6px",
  cursor: "col-resize",
  touchAction: "none",
  selectors: {
    "&:hover": {
      background: vars.color.borderStrong
    }
  }
});

export const body = style({
  position: "relative"
});

export const row = style({
  position: "absolute",
  left: 0,
  right: 0,
  display: "flex",
  borderBottomWidth: vars.border.width,
  borderBottomStyle: vars.border.style,
  borderBottomColor: vars.color.border,
  selectors: {
    "&:hover": {
      background: vars.color.surface
    },
    "&[data-selected='true']": {
      background: vars.color.surface
    }
  }
});

export const cell = style({
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
  paddingLeft: vars.space.md,
  paddingRight: vars.space.md,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  boxSizing: "border-box"
});

export const checkboxCell = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "44px",
  boxSizing: "border-box"
});

export const emptyState = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: vars.space.xl,
  color: vars.color.textMuted
});
