import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const textarea = style({
  display: "block",
  // Textareas don't get border-box by default in the browser UA stylesheet
  // the way some other form controls do — with the plain default
  // (content-box), `width: 100%` sets only the *content* width, and the
  // padding/border below are added on top, so the rendered element ends up
  // wider than the 100% a parent flex/grid layout actually allocated to it.
  // Explicit here so `width: 100%` means the full allocated box, border and
  // padding included.
  boxSizing: "border-box",
  width: "100%",
  minHeight: "6em",
  resize: "vertical",
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
  paddingRight: vars.space.md,
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
      cursor: "not-allowed",
      opacity: 0.5,
      resize: "none"
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
