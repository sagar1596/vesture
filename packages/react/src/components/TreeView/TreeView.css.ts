import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const scroller = style({
  position: "relative",
  overflow: "auto",
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  color: vars.color.text,
  background: vars.color.surfaceRaised,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.md,
});

export const root = style({
  position: "relative",
  width: "100%",
});

export const row = style({
  position: "absolute",
  left: 0,
  right: 0,
  display: "flex",
  alignItems: "stretch",
  outline: "none",
  cursor: "pointer",
  selectors: {
    "&:focus-visible": {
      boxShadow: vars.shadow.focus,
    },
    "&:hover": {
      background: vars.color.surface,
    },
  },
});

export const rowContent = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  width: "100%",
  paddingRight: vars.space.sm,
});

export const chevron = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: vars.space.lg,
  height: vars.space.lg,
  flexShrink: 0,
  border: "none",
  background: "transparent",
  color: vars.color.textMuted,
  cursor: "pointer",
  fontSize: vars.font.sizeMd,
  lineHeight: 1,
  transitionProperty: "transform",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&[data-expanded]": {
      transform: "rotate(90deg)",
    },
  },
});

export const loadingSlot = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: vars.space.lg,
  height: vars.space.lg,
  flexShrink: 0,
});

export const checkboxCell = style({
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
});

export const label = style({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  selectors: {
    "&[data-selected]": {
      fontWeight: vars.font.weightMedium,
    },
  },
});
