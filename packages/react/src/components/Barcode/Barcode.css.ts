import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  display: "inline-block",
  lineHeight: 0
});

export const errorText = style({
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  color: vars.color.danger
});
