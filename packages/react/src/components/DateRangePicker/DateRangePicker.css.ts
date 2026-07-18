import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const wrapper = style({
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  width: "100%",
  gap: vars.space.xs,
  background: vars.color.surface,
  borderRadius: vars.radius.md,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  paddingLeft: vars.space.md,
  paddingRight: vars.space.xs,
  outline: "none",
  transitionProperty: "border-color, box-shadow",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:hover": {
      borderColor: vars.color.borderStrong,
    },
    "&:focus-within": {
      borderColor: vars.color.primary,
      boxShadow: vars.shadow.focus,
    },
    "&[data-disabled='true']": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
});

export const dateInput = style({
  flex: 1,
  minWidth: 0,
  border: "none",
  background: "transparent",
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeMd,
  lineHeight: vars.font.lineHeightNormal,
  color: vars.color.text,
  paddingTop: vars.space.sm,
  paddingBottom: vars.space.sm,
  outline: "none",
  selectors: {
    "&::placeholder": {
      color: vars.color.textMuted,
    },
    "&:disabled": {
      cursor: "not-allowed",
    },
  },
});

export const separator = style({
  flexShrink: 0,
  color: vars.color.textMuted,
  fontSize: vars.font.sizeSm,
});

export const iconButton = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
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
