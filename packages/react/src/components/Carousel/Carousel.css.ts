import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  position: "relative",
  width: "100%",
  outline: "none",
});

export const viewport = style({
  overflow: "hidden",
  borderRadius: vars.radius.lg,
});

export const track = style({
  display: "flex",
  transitionProperty: "transform",
  transitionDuration: vars.motion.durationNormal,
  transitionTimingFunction: vars.motion.easing,
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transitionDuration: "0ms",
    },
  },
});

export const slide = style({
  flex: "0 0 100%",
  minWidth: 0,
});

export const arrowButton = style({
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  borderRadius: vars.radius.full,
  border: "none",
  background: vars.color.surfaceRaised,
  color: vars.color.text,
  fontSize: vars.font.sizeLg,
  lineHeight: 1,
  cursor: "pointer",
  boxShadow: vars.shadow.sm,
  transitionProperty: "background-color, box-shadow",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    '&[data-side="prev"]': {
      left: vars.space.sm,
    },
    '&[data-side="next"]': {
      right: vars.space.sm,
    },
    "&:hover:not(:disabled)": {
      background: vars.color.primary,
      color: vars.color.primaryText,
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus,
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.4,
    },
  },
});

export const dots = style({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: vars.space.xs,
  paddingTop: vars.space.sm,
});

export const dot = style({
  width: 8,
  height: 8,
  padding: 0,
  borderRadius: vars.radius.full,
  border: "none",
  background: vars.color.border,
  cursor: "pointer",
  transitionProperty: "background-color, transform",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:hover": {
      background: vars.color.borderStrong,
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus,
    },
    "&[data-active]": {
      background: vars.color.primary,
      transform: "scale(1.25)",
    },
  },
});
