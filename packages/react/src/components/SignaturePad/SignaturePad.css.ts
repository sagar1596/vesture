import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  display: "inline-flex",
  flexDirection: "column",
  gap: vars.space.sm
});

// Echoes Input.css.ts's bordered-surface treatment — conceptually this is
// still a bounded form input, just one that happens to render a canvas.
export const canvasWrapper = style({
  display: "inline-block",
  borderRadius: vars.radius.md,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  overflow: "hidden",
  lineHeight: 0,
  selectors: {
    "&[data-disabled='true']": {
      opacity: 0.6
    }
  }
});

export const canvas = style({
  display: "block",
  touchAction: "none",
  cursor: "crosshair",
  selectors: {
    "[data-disabled='true'] &": {
      cursor: "not-allowed"
    }
  }
});
