import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const button = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space.xs,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeMd,
  fontWeight: vars.font.weightMedium,
  lineHeight: vars.font.lineHeightTight,
  borderRadius: vars.radius.md,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: "transparent",
  paddingTop: vars.space.sm,
  paddingBottom: vars.space.sm,
  paddingLeft: vars.space.md,
  paddingRight: vars.space.md,
  cursor: "pointer",
  transitionProperty: "background-color, border-color, color, box-shadow",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  outline: "none",
  selectors: {
    "&:focus-visible": {
      boxShadow: vars.shadow.focus
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.5
    }
  }
});

export const variant = styleVariants({
  primary: {
    backgroundColor: vars.color.primary,
    color: vars.color.primaryText,
    selectors: {
      [`&:hover:not(:disabled)`]: {
        backgroundColor: vars.color.primaryHover
      },
      [`&:active:not(:disabled)`]: {
        backgroundColor: vars.color.primaryActive
      }
    }
  },
  secondary: {
    backgroundColor: vars.color.surface,
    borderColor: vars.color.border,
    color: vars.color.text,
    selectors: {
      [`&:hover:not(:disabled)`]: {
        borderColor: vars.color.borderStrong
      }
    }
  },
  ghost: {
    backgroundColor: "transparent",
    color: vars.color.text,
    selectors: {
      [`&:hover:not(:disabled)`]: {
        backgroundColor: vars.color.surface
      }
    }
  }
});
