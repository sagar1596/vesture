import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const wrapper = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space.sm,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  color: vars.color.text,
  cursor: "pointer",
  selectors: {
    "&:has(input:disabled)": {
      color: vars.color.textMuted,
      cursor: "not-allowed"
    }
  }
});

export const hiddenInput = style({
  position: "absolute",
  width: "36px",
  height: "20px",
  margin: 0,
  opacity: 0,
  cursor: "inherit"
});

export const track = style({
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  width: "36px",
  height: "20px",
  flexShrink: 0,
  borderRadius: vars.radius.full,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  background: vars.color.surface,
  transitionProperty: "background-color, border-color, box-shadow",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&::after": {
      content: "''",
      position: "absolute",
      top: "1px",
      left: "1px",
      width: "16px",
      height: "16px",
      borderRadius: vars.radius.full,
      background: vars.color.textInverse,
      boxShadow: vars.shadow.sm,
      transitionProperty: "transform",
      transitionDuration: vars.motion.durationFast,
      transitionTimingFunction: vars.motion.easing
    },
    "input:checked + &": {
      background: vars.color.primary,
      borderColor: vars.color.primary
    },
    "input:checked + &::after": {
      transform: "translateX(16px)"
    },
    "input:focus-visible + &": {
      boxShadow: vars.shadow.focus
    },
    "input:disabled + &": {
      opacity: 0.5,
      cursor: "not-allowed"
    }
  }
});
