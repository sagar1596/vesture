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
  width: "18px",
  height: "18px",
  margin: 0,
  opacity: 0,
  cursor: "inherit"
});

export const box = style({
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "18px",
  height: "18px",
  flexShrink: 0,
  borderRadius: vars.radius.sm,
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
      width: "5px",
      height: "9px",
      borderBottom: `2px solid ${vars.color.primaryText}`,
      borderRight: `2px solid ${vars.color.primaryText}`,
      transform: "rotate(45deg) translate(-1px, -1px)",
      opacity: 0
    },
    "input:checked + &": {
      background: vars.color.primary,
      borderColor: vars.color.primary
    },
    "input:checked + &::after": {
      opacity: 1
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
