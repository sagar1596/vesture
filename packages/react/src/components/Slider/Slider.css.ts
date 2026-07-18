import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  display: "inline-flex",
  alignItems: "center",
  width: "100%",
  paddingTop: vars.space.sm,
  paddingBottom: vars.space.sm,
  selectors: {
    "&[data-disabled]": {
      opacity: 0.5,
      cursor: "not-allowed"
    }
  }
});

export const track = style({
  position: "relative",
  width: "100%",
  height: 4,
  borderRadius: vars.radius.full,
  background: vars.color.border,
  cursor: "pointer",
  touchAction: "none"
});

export const range = style({
  position: "absolute",
  top: 0,
  bottom: 0,
  borderRadius: vars.radius.full,
  background: vars.color.primary
});

export const thumb = style({
  position: "absolute",
  top: "50%",
  width: 16,
  height: 16,
  borderRadius: vars.radius.full,
  background: vars.color.surface,
  borderWidth: vars.border.widthStrong,
  borderStyle: vars.border.style,
  borderColor: vars.color.primary,
  transform: "translate(-50%, -50%)",
  cursor: "grab",
  outline: "none",
  transitionProperty: "box-shadow, border-color",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:hover": {
      borderColor: vars.color.primaryHover
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus
    },
    "&:active": {
      cursor: "grabbing"
    },
    "&[aria-disabled='true']": {
      cursor: "not-allowed"
    }
  }
});
