import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const alert = style({
  display: "flex",
  alignItems: "flex-start",
  gap: vars.space.sm,
  borderRadius: vars.radius.md,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderLeftWidth: vars.border.widthStrong,
  background: vars.color.surface,
  padding: vars.space.md,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  color: vars.color.text
});

export const accent = styleVariants({
  info: { borderLeftColor: vars.color.focusRing },
  success: { borderLeftColor: vars.color.success },
  warning: { borderLeftColor: vars.color.warning },
  danger: { borderLeftColor: vars.color.danger }
});

export const body = style({
  flex: 1,
  minWidth: 0
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
