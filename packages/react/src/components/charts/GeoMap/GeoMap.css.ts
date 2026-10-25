import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export { emptyState, root } from "../internal/chartSurfaces.css";

export const surface = style({
  position: "relative",
  overflow: "hidden",
  outline: "none",
  touchAction: "none",
  cursor: "grab",
  background: vars.color.surface,
  borderRadius: vars.radius.md,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  selectors: {
    "&:focus-visible": { boxShadow: vars.shadow.focus },
    "&:active": { cursor: "grabbing" }
  }
});

export const region = style({
  stroke: vars.color.surface,
  strokeWidth: 0.75,
  strokeLinejoin: "round",
  transition: `opacity ${vars.motion.durationFast} ${vars.motion.easing}`,
  outline: "none",
  selectors: {
    "&:hover": { opacity: 0.8 },
    "&:focus-visible": { stroke: vars.color.focusRing, strokeWidth: 2 }
  }
});

export const marker = style({
  stroke: vars.color.surface,
  strokeWidth: 1,
  fillOpacity: 0.7
});

export const controls = style({
  position: "absolute",
  top: vars.space.sm,
  right: vars.space.sm,
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs
});

export const controlButton = style({
  width: 28,
  height: 28,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: vars.color.surfaceRaised,
  color: vars.color.text,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.sm,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeMd,
  cursor: "pointer",
  selectors: {
    "&:hover": { borderColor: vars.color.borderStrong },
    "&:focus-visible": { boxShadow: vars.shadow.focus, outline: "none" }
  }
});

export const legend = style({
  position: "absolute",
  left: vars.space.sm,
  bottom: vars.space.sm,
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  padding: vars.space.xs,
  background: vars.color.surfaceRaised,
  borderRadius: vars.radius.sm,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted
});

export const legendCell = style({ width: 14, height: 10, display: "inline-block" });
