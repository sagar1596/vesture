import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const overlay = style({
  position: "fixed",
  inset: 0,
  zIndex: 2000,
  pointerEvents: "none"
});

/** A transparent box over the target; its giant box-shadow dims everything else. */
export const spotlight = style({
  position: "fixed",
  pointerEvents: "none",
  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)",
  transition: `top ${vars.motion.durationNormal} ${vars.motion.easing}, left ${vars.motion.durationNormal} ${vars.motion.easing}, width ${vars.motion.durationNormal} ${vars.motion.easing}, height ${vars.motion.durationNormal} ${vars.motion.easing}`
});

export const blocker = style({ position: "fixed", inset: 0, pointerEvents: "auto", background: "transparent" });

export const card = style({
  position: "fixed",
  zIndex: 2001,
  boxSizing: "border-box",
  width: 320,
  maxWidth: "calc(100vw - 24px)",
  padding: vars.space.lg,
  background: vars.color.surfaceRaised,
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.lg,
  pointerEvents: "auto",
  selectors: { "&:focus-visible": { outline: "none" } }
});

export const heading = style({ margin: 0, marginBottom: vars.space.xs, fontSize: vars.font.sizeMd, fontWeight: vars.font.weightBold });
export const body = style({ margin: 0, color: vars.color.textMuted, lineHeight: vars.font.lineHeightNormal });

export const footer = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  marginTop: vars.space.md
});

export const progress = style({ flex: 1, color: vars.color.textMuted, fontSize: vars.font.sizeXs });

export const dots = style({ display: "inline-flex", gap: 4 });
export const dot = style({
  width: 6,
  height: 6,
  borderRadius: vars.radius.full,
  background: vars.color.border,
  selectors: { "&[data-active='true']": { background: vars.color.primary } }
});

export const button = style({
  height: 30,
  padding: `0 ${vars.space.md}`,
  fontFamily: "inherit",
  fontSize: "inherit",
  background: vars.color.surface,
  color: vars.color.text,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.sm,
  cursor: "pointer",
  selectors: {
    "&:hover": { borderColor: vars.color.borderStrong },
    "&:focus-visible": { outline: "none", boxShadow: vars.shadow.focus }
  }
});

export const primary = style({
  background: vars.color.primary,
  color: vars.color.primaryText,
  borderColor: vars.color.primary,
  selectors: { "&:hover": { background: vars.color.primaryHover, borderColor: vars.color.primaryHover } }
});

export const close = style({
  position: "absolute",
  top: vars.space.sm,
  right: vars.space.sm,
  width: 24,
  height: 24,
  background: "none",
  border: 0,
  borderRadius: vars.radius.sm,
  color: vars.color.textMuted,
  fontSize: vars.font.sizeMd,
  cursor: "pointer",
  selectors: {
    "&:hover": { color: vars.color.text },
    "&:focus-visible": { outline: "none", boxShadow: vars.shadow.focus }
  }
});
