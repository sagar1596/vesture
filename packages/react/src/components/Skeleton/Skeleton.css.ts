import { keyframes, style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const base = style({
  display: "block",
  position: "relative",
  overflow: "hidden",
  background: vars.color.surface
});

export const variant = styleVariants({
  text: { borderRadius: vars.radius.sm, height: vars.font.sizeMd, width: "100%" },
  circular: { borderRadius: vars.radius.full, width: "40px", height: "40px" },
  rectangular: { borderRadius: vars.radius.md, width: "100%", height: "100px" }
});

export const linesContainer = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs
});

export const lastLine = style({
  width: "68%"
});

// Mirrors Progress's indeterminateSlide (translateX-based keyframes driving a
// moving element) rather than a background-position sweep.
const shimmerSlide = keyframes({
  "0%": { transform: "translateX(-100%)" },
  "100%": { transform: "translateX(100%)" }
});

const pulseOpacity = keyframes({
  "0%": { opacity: 1 },
  "50%": { opacity: 0.5 },
  "100%": { opacity: 1 }
});

// No dedicated "skeleton highlight" token exists, so the shimmer highlight is
// derived from surfaceRaised (already lighter than surface in every theme)
// via color-mix rather than adding a new contract field for one component's
// internal animation detail.
export const shimmerOverlay = style({
  position: "absolute",
  inset: 0,
  background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${vars.color.surfaceRaised} 60%, transparent), transparent)`,
  animationName: shimmerSlide,
  animationDuration: "1.6s",
  animationIterationCount: "infinite",
  animationTimingFunction: vars.motion.easing,
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      animation: "none",
      background: "none"
    }
  }
});

// Pulse is an ambient loading state, not instant UI feedback, so it runs far
// slower than durationNormal (tuned for transitions) — 8x reads as a natural
// breathing cadence rather than a flicker.
export const pulse = style({
  animationName: pulseOpacity,
  animationDuration: `calc(${vars.motion.durationNormal} * 8)`,
  animationIterationCount: "infinite",
  animationTimingFunction: vars.motion.easing,
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      animation: "none",
      opacity: 1
    }
  }
});
