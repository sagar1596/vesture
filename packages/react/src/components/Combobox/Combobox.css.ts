import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const wrapper = style({
  position: "relative",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: vars.space.xs,
  width: "100%",
  background: vars.color.surface,
  borderRadius: vars.radius.md,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  paddingTop: vars.space.xs,
  paddingBottom: vars.space.xs,
  paddingLeft: vars.space.sm,
  paddingRight: vars.space.sm,
  transitionProperty: "border-color, box-shadow",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:focus-within": {
      borderColor: vars.color.primary,
      boxShadow: vars.shadow.focus
    },
    "&[data-disabled]": {
      cursor: "not-allowed",
      opacity: 0.5
    }
  }
});

export const chipsWrapper = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space.xs
});

export const chip = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  background: vars.color.surfaceRaised,
  color: vars.color.text,
  fontSize: vars.font.sizeSm,
  borderRadius: vars.radius.sm,
  paddingTop: "2px",
  paddingBottom: "2px",
  paddingLeft: vars.space.xs,
  paddingRight: vars.space.xs
});

export const chipRemove = style({
  border: "none",
  background: "transparent",
  color: vars.color.textMuted,
  cursor: "pointer",
  lineHeight: 1,
  padding: 0,
  fontSize: vars.font.sizeMd,
  selectors: {
    "&:hover:not(:disabled)": {
      color: vars.color.text
    },
    "&:disabled": {
      cursor: "not-allowed"
    }
  }
});

export const inputEl = style({
  flex: "1 1 auto",
  minWidth: "60px",
  border: "none",
  outline: "none",
  background: "transparent",
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeMd,
  lineHeight: vars.font.lineHeightNormal,
  color: vars.color.text,
  paddingTop: vars.space.sm,
  paddingBottom: vars.space.sm,
  selectors: {
    "&::placeholder": {
      color: vars.color.textMuted
    },
    "&:disabled": {
      cursor: "not-allowed"
    }
  }
});

export const listbox = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  background: vars.color.surfaceRaised,
  borderRadius: vars.radius.lg,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  padding: vars.space.xs,
  boxShadow: vars.shadow.lg,
  minWidth: "180px",
  maxHeight: "280px",
  overflowY: "auto",
  outline: "none",
  zIndex: 1100
});

export const option = style({
  display: "block",
  width: "100%",
  textAlign: "left",
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  borderRadius: vars.radius.sm,
  paddingTop: vars.space.sm,
  paddingBottom: vars.space.sm,
  paddingLeft: vars.space.sm,
  paddingRight: vars.space.sm,
  cursor: "pointer",
  selectors: {
    "&[data-active]": {
      background: vars.color.surface
    },
    "&[aria-selected='true']": {
      color: vars.color.primary,
      fontWeight: vars.font.weightMedium
    },
    "&[aria-disabled='true']": {
      color: vars.color.textMuted,
      cursor: "not-allowed"
    }
  }
});

export const emptyState = style({
  paddingTop: vars.space.sm,
  paddingBottom: vars.space.sm,
  paddingLeft: vars.space.sm,
  paddingRight: vars.space.sm,
  color: vars.color.textMuted,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm
});
