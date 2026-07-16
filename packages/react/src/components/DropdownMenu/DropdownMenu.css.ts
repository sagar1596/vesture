import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const menu = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  background: vars.color.surfaceRaised,
  borderRadius: vars.radius.lg,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  padding: vars.space.xs,
  boxShadow: vars.shadow.lg,
  minWidth: "180px",
  outline: "none",
  zIndex: 1100
});

export const item = style({
  display: "block",
  width: "100%",
  textAlign: "left",
  border: "none",
  background: "transparent",
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  borderRadius: vars.radius.sm,
  paddingTop: vars.space.sm,
  paddingBottom: vars.space.sm,
  paddingLeft: vars.space.sm,
  paddingRight: vars.space.sm,
  cursor: "pointer",
  outline: "none",
  selectors: {
    "&[data-active='true']": {
      background: vars.color.surface
    },
    "&:disabled": {
      color: vars.color.textMuted,
      cursor: "not-allowed"
    }
  }
});
