import { keyframes, style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

const spin = keyframes({
  "0%": { transform: "rotate(0deg)" },
  "100%": { transform: "rotate(360deg)" }
});

export const spinner = style({
  display: "inline-block",
  borderRadius: vars.radius.full,
  borderStyle: "solid",
  borderColor: vars.color.border,
  borderTopColor: vars.color.primary,
  animationName: spin,
  animationDuration: "0.7s",
  animationIterationCount: "infinite",
  animationTimingFunction: "linear"
});

export const size = styleVariants({
  sm: { width: "16px", height: "16px", borderWidth: "2px" },
  md: { width: "24px", height: "24px", borderWidth: "3px" },
  lg: { width: "36px", height: "36px", borderWidth: "4px" }
});

export const srOnly = style({
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0
});
