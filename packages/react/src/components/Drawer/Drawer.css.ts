import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const panel = style({
  position: "fixed",
  background: vars.color.surfaceRaised,
  color: vars.color.text,
  fontFamily: vars.font.body,
  boxShadow: vars.shadow.lg,
  padding: vars.space.xl,
  overflowY: "auto",
  outline: "none",
  transitionProperty: "transform",
  transitionDuration: vars.motion.durationNormal,
  transitionTimingFunction: vars.motion.easing
});

// Per-side edge placement plus the enter/exit slide transform, driven by a
// data-state attribute (rather than the open prop directly) so the panel can
// keep rendering — and transition back off-screen — for the moment after
// `open` goes false, instead of vanishing the instant Modal's `!open` early
// return would.
export const side = styleVariants({
  right: {
    top: 0,
    right: 0,
    bottom: 0,
    maxWidth: "100vw",
    selectors: {
      '&[data-state="open"]': { transform: "translateX(0)" },
      '&[data-state="closed"]': { transform: "translateX(100%)" }
    }
  },
  left: {
    top: 0,
    left: 0,
    bottom: 0,
    maxWidth: "100vw",
    selectors: {
      '&[data-state="open"]': { transform: "translateX(0)" },
      '&[data-state="closed"]': { transform: "translateX(-100%)" }
    }
  },
  top: {
    top: 0,
    left: 0,
    right: 0,
    maxHeight: "100vh",
    selectors: {
      '&[data-state="open"]': { transform: "translateY(0)" },
      '&[data-state="closed"]': { transform: "translateY(-100%)" }
    }
  },
  bottom: {
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "100vh",
    selectors: {
      '&[data-state="open"]': { transform: "translateY(0)" },
      '&[data-state="closed"]': { transform: "translateY(100%)" }
    }
  }
});
