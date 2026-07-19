import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const overlay = style({
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  background: "rgba(0, 0, 0, 0.4)",
  paddingTop: "15vh",
  paddingLeft: vars.space.lg,
  paddingRight: vars.space.lg,
  paddingBottom: vars.space.lg,
  zIndex: 1300
});

export const palette = style({
  display: "flex",
  flexDirection: "column",
  background: vars.color.surfaceRaised,
  color: vars.color.text,
  fontFamily: vars.font.body,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.lg,
  width: "100%",
  maxWidth: "560px",
  maxHeight: "70vh",
  overflow: "hidden",
  outline: "none"
});

export const inputEl = style({
  width: "100%",
  boxSizing: "border-box",
  border: "none",
  outline: "none",
  background: "transparent",
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeLg,
  color: vars.color.text,
  paddingTop: vars.space.lg,
  paddingBottom: vars.space.lg,
  paddingLeft: vars.space.lg,
  paddingRight: vars.space.lg,
  borderBottomWidth: vars.border.width,
  borderBottomStyle: vars.border.style,
  borderBottomColor: vars.color.border,
  selectors: {
    "&::placeholder": {
      color: vars.color.textMuted
    }
  }
});

export const list = style({
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  padding: vars.space.xs
});

export const virtualSpacer = style({
  position: "relative",
  width: "100%"
});

export const groupHeader = style({
  display: "flex",
  alignItems: "center",
  boxSizing: "border-box",
  paddingTop: vars.space.sm,
  paddingBottom: vars.space.sm,
  paddingLeft: vars.space.sm,
  paddingRight: vars.space.sm,
  color: vars.color.textMuted,
  fontSize: vars.font.sizeXs,
  fontWeight: vars.font.weightMedium,
  textTransform: "uppercase",
  letterSpacing: "0.04em"
});

export const option = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  width: "100%",
  boxSizing: "border-box",
  textAlign: "left",
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  lineHeight: vars.font.lineHeightNormal,
  borderRadius: vars.radius.sm,
  paddingTop: vars.space.sm,
  paddingBottom: vars.space.sm,
  paddingLeft: vars.space.sm,
  paddingRight: vars.space.sm,
  cursor: "pointer",
  selectors: {
    "&[data-active]": {
      background: vars.color.surface
    },
    "&[aria-disabled='true']": {
      color: vars.color.textMuted,
      cursor: "not-allowed"
    }
  }
});

export const optionIcon = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0
});

export const optionLabel = style({
  display: "flex",
  flexDirection: "column",
  flex: "1 1 auto",
  minWidth: 0
});

export const optionDescription = style({
  color: vars.color.textMuted,
  fontSize: vars.font.sizeXs
});

export const shortcut = style({
  flexShrink: 0,
  color: vars.color.textMuted,
  fontFamily: vars.font.mono,
  fontSize: vars.font.sizeXs
});

export const emptyState = style({
  paddingTop: vars.space.md,
  paddingBottom: vars.space.md,
  paddingLeft: vars.space.sm,
  paddingRight: vars.space.sm,
  color: vars.color.textMuted,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  textAlign: "center"
});
