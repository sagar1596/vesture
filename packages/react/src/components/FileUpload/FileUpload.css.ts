import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.md,
  fontFamily: vars.font.body
});

// Dropzones conventionally use a dashed border to signal "drop target here" —
// a near-universal UI convention rather than a themeable stylistic choice, so
// it's hardcoded rather than reading border.style (which a theme like
// theme-retro sets to "solid" for every other bordered surface).
export const dropzone = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space.xs,
  borderWidth: vars.border.widthStrong,
  borderStyle: "dashed",
  borderColor: vars.color.border,
  borderRadius: vars.radius.lg,
  background: vars.color.surface,
  padding: vars.space["2xl"],
  textAlign: "center",
  cursor: "pointer",
  outline: "none",
  transitionProperty: "border-color, background-color",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:hover:not([aria-disabled='true'])": {
      borderColor: vars.color.borderStrong
    },
    "&:focus-visible": {
      borderColor: vars.color.primary,
      boxShadow: vars.shadow.focus
    },
    "&[aria-disabled='true']": {
      cursor: "not-allowed",
      opacity: 0.5
    }
  }
});

export const dropzoneActive = style({
  borderColor: vars.color.primary,
  background: vars.color.surfaceRaised
});

export const dropzoneLabel = style({
  fontSize: vars.font.sizeSm,
  color: vars.color.text
});

export const dropzoneHint = style({
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted
});

export const hiddenInput = style({
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0
});

export const queue = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm
});

export const row = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.md,
  background: vars.color.surface,
  padding: vars.space.sm
});

// Same danger-border treatment Input.css.ts uses for aria-invalid, applied to
// a rejected/failed row instead of a form field — same underlying concept.
export const rowError = style({
  borderColor: vars.color.danger
});

export const rowInfo = style({
  display: "flex",
  flexDirection: "column",
  minWidth: "120px",
  maxWidth: "220px"
});

export const fileName = style({
  fontSize: vars.font.sizeSm,
  color: vars.color.text,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
});

export const fileSize = style({
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted
});

export const rowProgress = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  flex: 1,
  minWidth: 0
});

export const progressBar = style({
  flex: 1,
  minWidth: 0
});

export const errorText = style({
  fontSize: vars.font.sizeXs,
  color: vars.color.danger,
  margin: 0
});

export const successIcon = style({
  color: vars.color.success,
  fontSize: vars.font.sizeSm,
  flexShrink: 0
});

export const removeButton = style({
  border: "none",
  background: "transparent",
  color: vars.color.textMuted,
  cursor: "pointer",
  fontSize: vars.font.sizeSm,
  lineHeight: 1,
  padding: vars.space.xs,
  flexShrink: 0,
  selectors: {
    "&:hover": {
      color: vars.color.text
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus
    }
  }
});
