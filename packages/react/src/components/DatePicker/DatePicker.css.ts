import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const wrapper = style({
  position: "relative",
  display: "inline-flex",
  width: "100%",
});

export const dateInput = style({
  display: "block",
  width: "100%",
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeMd,
  lineHeight: vars.font.lineHeightNormal,
  color: vars.color.text,
  background: vars.color.surface,
  borderRadius: vars.radius.md,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  paddingTop: vars.space.sm,
  paddingBottom: vars.space.sm,
  paddingLeft: vars.space.md,
  paddingRight: vars.space.xl,
  outline: "none",
  transitionProperty: "border-color, box-shadow",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&::placeholder": {
      color: vars.color.textMuted,
    },
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
    "&[aria-invalid='true']": {
      borderColor: vars.color.danger,
    },
    "&[aria-invalid='true']:focus-visible": {
      borderColor: vars.color.danger,
      boxShadow: vars.shadow.focus,
    },
  },
});

export const iconButton = style({
  position: "absolute",
  top: "50%",
  right: vars.space.xs,
  transform: "translateY(-50%)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: vars.space.xl,
  height: vars.space.xl,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: "transparent",
  borderRadius: vars.radius.sm,
  background: "transparent",
  color: vars.color.textMuted,
  cursor: "pointer",
  outline: "none",
  transitionProperty: "background-color, color, box-shadow",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:hover:not(:disabled)": {
      background: vars.color.surfaceRaised,
      color: vars.color.text,
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus,
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
});

export const popover = style({
  background: vars.color.surfaceRaised,
  borderRadius: vars.radius.lg,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  boxShadow: vars.shadow.lg,
  outline: "none",
  zIndex: 1100,
});
