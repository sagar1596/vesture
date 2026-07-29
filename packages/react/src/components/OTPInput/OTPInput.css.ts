import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const group = style({
  display: "flex",
  gap: vars.space.sm,
});

export const box = style({
  width: 44,
  height: 52,
  textAlign: "center",
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeLg,
  fontWeight: vars.font.weightMedium,
  color: vars.color.text,
  background: vars.color.surface,
  borderRadius: vars.radius.md,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  outline: "none",
  transitionProperty: "border-color, box-shadow",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:hover:not(:disabled)": {
      borderColor: vars.color.borderStrong,
    },
    "&:focus-visible": {
      borderColor: vars.color.primary,
      boxShadow: vars.shadow.focus,
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
});
