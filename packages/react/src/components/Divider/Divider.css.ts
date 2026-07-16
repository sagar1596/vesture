import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const base = style({
  border: "none",
  background: "none",
  margin: 0,
  flexShrink: 0
});

export const orientation = styleVariants({
  horizontal: {
    width: "100%",
    height: vars.border.width,
    background: vars.color.border
  },
  vertical: {
    width: vars.border.width,
    alignSelf: "stretch",
    background: vars.color.border
  }
});
