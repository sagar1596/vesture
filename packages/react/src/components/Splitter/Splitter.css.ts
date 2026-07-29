import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const container = style({
  display: "flex",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  selectors: {
    '&[data-direction="vertical"]': {
      flexDirection: "column",
    },
  },
});

export const panel = style({
  overflow: "auto",
  minWidth: 0,
  minHeight: 0,
});

export const divider = style({
  flexShrink: 0,
  background: vars.color.border,
  outline: "none",
  transitionProperty: "background-color",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    '&[data-direction="horizontal"]': {
      width: 5,
      cursor: "col-resize",
    },
    '&[data-direction="vertical"]': {
      height: 5,
      cursor: "row-resize",
    },
    "&:hover": {
      background: vars.color.primary,
    },
    "&:active": {
      background: vars.color.primaryActive,
    },
    "&:focus-visible": {
      background: vars.color.primary,
      boxShadow: vars.shadow.focus,
    },
  },
});
