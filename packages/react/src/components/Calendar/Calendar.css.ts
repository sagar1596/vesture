import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  display: "inline-flex",
  flexDirection: "column",
  gap: vars.space.sm,
  padding: vars.space.md,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  color: vars.color.text,
  background: vars.color.surfaceRaised,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.md,
});

export const header = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space.sm,
});

export const monthLabel = style({
  fontWeight: vars.font.weightMedium,
  fontSize: vars.font.sizeMd,
});

export const navButton = style({
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
  color: vars.color.text,
  cursor: "pointer",
  fontSize: vars.font.sizeMd,
  lineHeight: 1,
  outline: "none",
  transitionProperty: "background-color, box-shadow",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:hover:not(:disabled)": {
      background: vars.color.surface,
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

export const grid = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
});

export const weekRow = style({
  display: "flex",
  gap: vars.space.xs,
});

export const weekdayCell = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: vars.space["2xl"],
  height: vars.space.lg,
  fontSize: vars.font.sizeXs,
  fontWeight: vars.font.weightMedium,
  color: vars.color.textMuted,
  textTransform: "uppercase",
});

export const dayCell = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const dayButton = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: vars.space["2xl"],
  height: vars.space["2xl"],
  borderWidth: vars.border.widthStrong,
  borderStyle: vars.border.style,
  borderColor: "transparent",
  borderRadius: vars.radius.full,
  background: "transparent",
  color: vars.color.text,
  fontFamily: "inherit",
  fontSize: vars.font.sizeSm,
  cursor: "pointer",
  outline: "none",
  transitionProperty: "background-color, border-color, color, box-shadow",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:hover:not(:disabled)": {
      background: vars.color.surface,
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus,
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
    "&[data-outside='true']": {
      color: vars.color.textMuted,
    },
    "&[data-today='true']": {
      borderColor: vars.color.border,
    },
    "&[data-in-range='true']": {
      background: vars.color.surface,
      borderRadius: vars.radius.sm,
    },
    "&[data-selected='true']": {
      background: vars.color.primary,
      borderColor: vars.color.primary,
      color: vars.color.primaryText,
    },
  },
});
