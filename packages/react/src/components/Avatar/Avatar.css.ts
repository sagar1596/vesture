import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const wrapper = style({
  position: "relative",
  display: "inline-flex",
  flexShrink: 0
});

export const avatar = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: vars.radius.full,
  background: vars.color.surface,
  color: vars.color.textMuted,
  fontFamily: vars.font.body,
  fontWeight: vars.font.weightMedium,
  overflow: "hidden",
  userSelect: "none"
});

export const size = styleVariants({
  sm: { width: "28px", height: "28px", fontSize: vars.font.sizeXs },
  md: { width: "40px", height: "40px", fontSize: vars.font.sizeSm },
  lg: { width: "56px", height: "56px", fontSize: vars.font.sizeMd }
});

export const image = style({
  width: "100%",
  height: "100%",
  objectFit: "cover"
});

export const statusDot = style({
  position: "absolute",
  bottom: 0,
  right: 0,
  width: "10px",
  height: "10px",
  borderRadius: vars.radius.full,
  borderWidth: vars.border.widthStrong,
  borderStyle: vars.border.style,
  borderColor: vars.color.surfaceRaised
});

export const statusColor = styleVariants({
  online: { background: vars.color.success },
  away: { background: vars.color.warning },
  busy: { background: vars.color.danger },
  offline: { background: vars.color.textMuted }
});
