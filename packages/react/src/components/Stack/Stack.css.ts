import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const stack = style({
  display: "flex"
});

export const direction = styleVariants({
  row: { flexDirection: "row" },
  column: { flexDirection: "column" }
});

export const align = styleVariants({
  start: { alignItems: "flex-start" },
  center: { alignItems: "center" },
  end: { alignItems: "flex-end" },
  stretch: { alignItems: "stretch" }
});

export const justify = styleVariants({
  start: { justifyContent: "flex-start" },
  center: { justifyContent: "center" },
  end: { justifyContent: "flex-end" },
  between: { justifyContent: "space-between" }
});

export const gap = styleVariants({
  xs: { gap: vars.space.xs },
  sm: { gap: vars.space.sm },
  md: { gap: vars.space.md },
  lg: { gap: vars.space.lg },
  xl: { gap: vars.space.xl },
  "2xl": { gap: vars.space["2xl"] }
});

export const wrapStyle = style({
  flexWrap: "wrap"
});
