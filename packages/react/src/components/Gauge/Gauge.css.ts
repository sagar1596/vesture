import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const radialRoot = style({
  position: "relative",
  display: "inline-block",
  fontFamily: vars.font.body,
  color: vars.color.text
});

export const radialReadout = style({
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none"
});

export const readoutValue = style({
  fontSize: vars.font.sizeXl,
  fontWeight: vars.font.weightBold,
  lineHeight: vars.font.lineHeightTight
});

export const readoutLabel = style({
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted
});

export const arcTransition = style({
  transition: `stroke ${vars.motion.durationNormal} ${vars.motion.easing}`
});

export const linearRoot = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
  width: "100%",
  fontFamily: vars.font.body,
  color: vars.color.text
});

export const linearHeader = style({
  display: "flex",
  justifyContent: "space-between",
  fontSize: vars.font.sizeSm
});

export const linearTrack = style({
  position: "relative",
  height: 10,
  borderRadius: vars.radius.full,
  background: vars.color.border,
  overflow: "hidden"
});

export const linearFill = style({
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  borderRadius: vars.radius.full,
  transition: `width ${vars.motion.durationNormal} ${vars.motion.easing}`
});

export const linearScale = style({
  display: "flex",
  justifyContent: "space-between",
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted
});
