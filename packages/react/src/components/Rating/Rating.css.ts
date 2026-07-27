import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const group = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space.xs,
  selectors: {
    "&[aria-disabled='true']": {
      opacity: 0.5,
      cursor: "not-allowed"
    }
  }
});

export const starWrapper = style({
  position: "relative",
  display: "inline-flex",
  lineHeight: 0,
  cursor: "pointer",
  selectors: {
    "[aria-disabled='true'] &": {
      cursor: "not-allowed"
    }
  }
});

export const hiddenInput = style({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  margin: 0,
  opacity: 0,
  cursor: "inherit"
});

// Fixed pixel size — stars are a small self-contained icon, not a
// token-driven surface, so there's no vars.* equivalent to read here.
export const starShape = style({
  position: "relative",
  display: "inline-block",
  width: "24px",
  height: "24px",
  flexShrink: 0
});

export const starOutline = style({
  display: "block",
  width: "100%",
  height: "100%",
  color: vars.color.border
});

export const starFillClip = style({
  position: "absolute",
  top: 0,
  left: 0,
  height: "100%",
  overflow: "hidden"
});

// Rating fill uses vars.color.primary rather than a dedicated gold/amber
// token: the token contract has no such color, and reusing vars.color.warning
// (amber by default) would borrow a semantic that means "caution" everywhere
// else in the library (Alert, Badge) — a theme is free to make its warning
// color anything, e.g. red, which would misread on a rating. primary is the
// library's existing "selected/active" treatment (Radio, Checkbox, Slider),
// which is what a filled star actually represents here.
export const starFilled = style({
  display: "block",
  width: "24px",
  height: "24px",
  color: vars.color.primary
});

export const starFocusRing = style({
  position: "relative",
  display: "inline-block",
  width: "24px",
  height: "24px",
  borderRadius: vars.radius.sm,
  selectors: {
    "input:focus-visible + &": {
      boxShadow: vars.shadow.focus
    }
  }
});

export const readOnlyGroup = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space.xs
});
