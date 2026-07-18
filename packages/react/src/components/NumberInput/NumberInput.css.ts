import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const wrapper = style({
  position: "relative",
  display: "inline-flex",
  alignItems: "stretch",
  width: "100%",
  selectors: {
    "&[data-disabled]": {
      opacity: 0.5,
      cursor: "not-allowed"
    }
  }
});

export const input = style({
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
      color: vars.color.textMuted
    },
    "&:hover:not(:disabled)": {
      borderColor: vars.color.borderStrong
    },
    "&:focus-visible": {
      borderColor: vars.color.primary,
      boxShadow: vars.shadow.focus
    },
    "&:disabled": {
      cursor: "not-allowed"
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

export const stepperGroup = style({
  position: "absolute",
  top: 1,
  right: 1,
  bottom: 1,
  display: "flex",
  flexDirection: "column",
  width: 20
});

export const stepButton = style({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  border: "none",
  background: "transparent",
  color: vars.color.textMuted,
  cursor: "pointer",
  borderRadius: vars.radius.sm,
  selectors: {
    "&:hover:not(:disabled)": {
      background: vars.color.surfaceRaised,
      color: vars.color.text
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.4
    },
    "&:focus-visible": {
      outline: "none",
      boxShadow: vars.shadow.focus
    }
  }
});
