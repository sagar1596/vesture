import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const viewport = style({
  position: "fixed",
  bottom: vars.space.lg,
  right: vars.space.lg,
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
  zIndex: 1400,
  width: "320px",
  maxWidth: "calc(100vw - 32px)"
});

export const toast = style({
  display: "flex",
  alignItems: "flex-start",
  gap: vars.space.sm,
  background: vars.color.surfaceRaised,
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  lineHeight: vars.font.lineHeightNormal,
  borderRadius: vars.radius.md,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderLeftWidth: vars.border.widthStrong,
  padding: vars.space.md,
  boxShadow: vars.shadow.lg
});

export const accent = styleVariants({
  default: { borderLeftColor: vars.color.border },
  success: { borderLeftColor: vars.color.success },
  warning: { borderLeftColor: vars.color.warning },
  danger: { borderLeftColor: vars.color.danger }
});

export const title = style({
  fontWeight: vars.font.weightMedium,
  margin: 0
});

export const description = style({
  color: vars.color.textMuted,
  margin: 0,
  marginTop: vars.space.xs
});

export const body = style({
  flex: 1,
  minWidth: 0
});

export const closeButton = style({
  border: "none",
  background: "transparent",
  color: vars.color.textMuted,
  cursor: "pointer",
  fontSize: vars.font.sizeSm,
  lineHeight: 1,
  padding: 0,
  selectors: {
    "&:hover": {
      color: vars.color.text
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus
    }
  }
});
