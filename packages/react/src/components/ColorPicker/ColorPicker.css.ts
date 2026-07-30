import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

// Chrome (padding, borders, swatch sizing, focus rings) is tokens-only per
// convention. The gradient square and hue strip below are the one deliberate
// exception: their backgrounds are inherently raw computed color values
// (they visualize the color space itself), not themed chrome.

export const trigger = style({
  display: "inline-flex",
  width: 32,
  height: 32,
  padding: 0,
  borderRadius: vars.radius.md,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  cursor: "pointer",
  outline: "none",
  transitionProperty: "box-shadow, border-color",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:hover": {
      borderColor: vars.color.primaryHover
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus
    }
  }
});

export const triggerSwatch = style({
  width: "100%",
  height: "100%",
  borderRadius: vars.radius.sm,
  // Checkerboard so a transparent/near-white swatch is still visible.
  backgroundImage:
    "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
  backgroundSize: "8px 8px",
  backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px"
});

export const panel = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
  width: 220
});

export const gradientSquare = style({
  position: "relative",
  width: "100%",
  height: 140,
  borderRadius: vars.radius.sm,
  cursor: "crosshair",
  outline: "none",
  touchAction: "none",
  selectors: {
    "&:focus-visible": {
      boxShadow: vars.shadow.focus
    }
  }
});

export const gradientDot = style({
  position: "absolute",
  width: 14,
  height: 14,
  borderRadius: vars.radius.full,
  border: "2px solid #fff",
  boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.4)",
  transform: "translate(-50%, -50%)",
  pointerEvents: "none"
});

export const hueStrip = style({
  position: "relative",
  width: "100%",
  height: 12,
  borderRadius: vars.radius.full,
  cursor: "pointer",
  outline: "none",
  touchAction: "none",
  background:
    "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
  selectors: {
    "&:focus-visible": {
      boxShadow: vars.shadow.focus
    }
  }
});

export const hueThumb = style({
  position: "absolute",
  top: "50%",
  width: 16,
  height: 16,
  borderRadius: vars.radius.full,
  background: vars.color.surface,
  borderWidth: vars.border.widthStrong,
  borderStyle: vars.border.style,
  borderColor: vars.color.surface,
  boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.3)",
  transform: "translate(-50%, -50%)",
  pointerEvents: "none"
});

export const presetRow = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space.xs
});

export const presetSwatch = style({
  width: 20,
  height: 20,
  padding: 0,
  borderRadius: vars.radius.sm,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  cursor: "pointer",
  outline: "none",
  transitionProperty: "box-shadow, transform",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:hover": {
      transform: "scale(1.1)"
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus
    },
    "&[aria-pressed='true']": {
      boxShadow: `0 0 0 2px ${vars.color.surfaceRaised}, 0 0 0 4px ${vars.color.primary}`
    }
  }
});

export const textInput = style({
  width: "100%",
  boxSizing: "border-box",
  background: vars.color.surface,
  color: vars.color.text,
  fontFamily: vars.font.mono,
  fontSize: vars.font.sizeSm,
  lineHeight: vars.font.lineHeightNormal,
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
    "&:focus": {
      outline: "none",
      borderColor: vars.color.primary,
      boxShadow: vars.shadow.focus
    },
    "&[aria-invalid='true']": {
      borderColor: vars.color.danger
    }
  }
});
