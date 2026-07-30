import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  display: "inline-flex",
  flexDirection: "column",
  gap: vars.space.sm
});

// position: relative + overflow: hidden is what makes the crop rect's
// giant box-shadow spread (the dim-outside-crop trick, see cropRect below)
// clip cleanly to exactly the displayed image's bounds instead of the whole
// page.
export const imageWrapper = style({
  position: "relative",
  display: "inline-block",
  overflow: "hidden",
  lineHeight: 0,
  touchAction: "none"
});

export const image = style({
  display: "block",
  maxWidth: "100%",
  height: "auto",
  userSelect: "none"
});

// Same "0 0 0 9999px" trick Modal.css.ts's backdrop conceptually achieves
// with a full-viewport overlay element, applied via box-shadow spread
// instead so a single absolutely-positioned rect can both dim everything
// outside the crop area and draw its own focus-ring border, without a
// second overlay element competing for pointer events.
export const cropRect = style({
  position: "absolute",
  boxSizing: "border-box",
  cursor: "move",
  touchAction: "none"
});

export const handle = style({
  position: "absolute",
  width: 12,
  height: 12,
  borderRadius: vars.radius.sm,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.focusRing,
  backgroundColor: vars.color.surfaceRaised,
  boxShadow: vars.shadow.sm,
  transform: "translate(-50%, -50%)",
  touchAction: "none",
  selectors: {
    '&[data-cursor="nwse-resize"]': { cursor: "nwse-resize" },
    '&[data-cursor="nesw-resize"]': { cursor: "nesw-resize" },
    '&[data-cursor="ns-resize"]': { cursor: "ns-resize" },
    '&[data-cursor="ew-resize"]': { cursor: "ew-resize" }
  }
});

export const visuallyHidden = style({
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
