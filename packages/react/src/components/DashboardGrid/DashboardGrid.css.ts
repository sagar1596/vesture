import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({ position: "relative", width: "100%", fontFamily: vars.font.body });

export const item = style({
  position: "absolute",
  boxSizing: "border-box",
  transition: `left ${vars.motion.durationFast} ${vars.motion.easing}, top ${vars.motion.durationFast} ${vars.motion.easing}, width ${vars.motion.durationFast} ${vars.motion.easing}, height ${vars.motion.durationFast} ${vars.motion.easing}`,
  selectors: {
    "&[data-editable='true']": { cursor: "grab", touchAction: "none" },
    "&[data-editable='true']:focus-visible": { outline: "none", boxShadow: vars.shadow.focus, borderRadius: vars.radius.md },
    "&[data-dragging='true']": {
      transition: "none",
      cursor: "grabbing",
      zIndex: 5,
      boxShadow: vars.shadow.lg,
      opacity: 0.92
    }
  }
});

export const placeholder = style({
  position: "absolute",
  boxSizing: "border-box",
  borderRadius: vars.radius.md,
  borderWidth: 2,
  borderStyle: "dashed",
  borderColor: vars.color.primary,
  background: vars.color.surfaceRaised,
  opacity: 0.6,
  pointerEvents: "none",
  transition: `left ${vars.motion.durationFast} ${vars.motion.easing}, top ${vars.motion.durationFast} ${vars.motion.easing}, width ${vars.motion.durationFast} ${vars.motion.easing}, height ${vars.motion.durationFast} ${vars.motion.easing}`
});

export const resizeHandle = style({
  position: "absolute",
  right: 2,
  bottom: 2,
  width: 16,
  height: 16,
  padding: 0,
  border: 0,
  background: "transparent",
  cursor: "nwse-resize",
  touchAction: "none",
  selectors: {
    "&::after": {
      content: '""',
      position: "absolute",
      right: 3,
      bottom: 3,
      width: 7,
      height: 7,
      borderRight: `2px solid ${vars.color.borderStrong}`,
      borderBottom: `2px solid ${vars.color.borderStrong}`
    },
    "&:focus-visible": { outline: "none", boxShadow: vars.shadow.focus, borderRadius: vars.radius.sm }
  }
});

export const visuallyHidden = style({
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap"
});
