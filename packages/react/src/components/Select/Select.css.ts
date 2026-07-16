import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const wrapper = style({
  position: "relative",
  display: "inline-block",
  width: "100%"
});

export const select = style({
  display: "block",
  width: "100%",
  appearance: "none",
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
  cursor: "pointer",
  transitionProperty: "border-color, box-shadow",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:hover:not(:disabled)": {
      borderColor: vars.color.borderStrong
    },
    "&:focus-visible": {
      borderColor: vars.color.primary,
      boxShadow: vars.shadow.focus
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.5
    },
    "&[aria-invalid='true']": {
      borderColor: vars.color.danger
    },
    "&[aria-invalid='true']:focus-visible": {
      borderColor: vars.color.danger,
      boxShadow: vars.shadow.focus
    }
  }
});

export const chevron = style({
  position: "absolute",
  top: "50%",
  right: vars.space.md,
  width: 0,
  height: 0,
  pointerEvents: "none",
  transform: "translateY(-25%)",
  borderLeft: "4px solid transparent",
  borderRight: "4px solid transparent",
  borderTop: `5px solid ${vars.color.textMuted}`
});
