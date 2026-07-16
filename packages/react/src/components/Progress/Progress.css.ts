import { keyframes, style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const track = style({
  position: "relative",
  width: "100%",
  height: "8px",
  borderRadius: vars.radius.full,
  background: vars.color.surface,
  overflow: "hidden"
});

export const fill = style({
  height: "100%",
  borderRadius: vars.radius.full,
  background: vars.color.primary,
  transitionProperty: "width",
  transitionDuration: vars.motion.durationNormal,
  transitionTimingFunction: vars.motion.easing
});

const indeterminateSlide = keyframes({
  "0%": { transform: "translateX(-100%)" },
  "100%": { transform: "translateX(250%)" }
});

export const indeterminateFill = style({
  position: "absolute",
  top: 0,
  left: 0,
  height: "100%",
  width: "40%",
  borderRadius: vars.radius.full,
  background: vars.color.primary,
  animationName: indeterminateSlide,
  animationDuration: "1.2s",
  animationIterationCount: "infinite",
  animationTimingFunction: vars.motion.easing
});

export const label = style({
  display: "flex",
  justifyContent: "space-between",
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted,
  marginBottom: vars.space.xs
});
