import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const popover = style({
  background: vars.color.surfaceRaised,
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  lineHeight: vars.font.lineHeightNormal,
  borderRadius: vars.radius.lg,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  padding: vars.space.md,
  boxShadow: vars.shadow.lg,
  minWidth: "200px",
  maxWidth: "320px",
  outline: "none",
  zIndex: 1100
});
