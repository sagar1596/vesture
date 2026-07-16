import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const tooltip = style({
  background: vars.color.text,
  color: vars.color.textInverse,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeXs,
  lineHeight: vars.font.lineHeightNormal,
  borderRadius: vars.radius.sm,
  paddingTop: vars.space.xs,
  paddingBottom: vars.space.xs,
  paddingLeft: vars.space.sm,
  paddingRight: vars.space.sm,
  boxShadow: vars.shadow.md,
  maxWidth: "260px",
  zIndex: 1200
});
