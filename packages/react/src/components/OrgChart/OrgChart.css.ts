import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  position: "relative",
  overflow: "auto",
  background: vars.color.surface,
  borderRadius: vars.radius.md,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  fontFamily: vars.font.body
});

export const canvas = style({ position: "relative", transformOrigin: "0 0" });

export const edges = style({ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" });
export const edge = style({ fill: "none", stroke: vars.color.borderStrong, strokeWidth: 1.5 });

export const node = style({
  position: "absolute",
  boxSizing: "border-box"
});

export const card = style({
  width: "100%",
  height: "100%",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: vars.space.sm,
  textAlign: "left",
  background: vars.color.surfaceRaised,
  color: vars.color.text,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.sm,
  fontFamily: "inherit",
  cursor: "default",
  selectors: {
    "&:hover": { borderColor: vars.color.borderStrong },
    "&:focus-visible": { outline: "none", boxShadow: vars.shadow.focus },
    "&[data-selected='true']": { borderColor: vars.color.primary, boxShadow: vars.shadow.focus },
    "&[data-clickable='true']": { cursor: "pointer" }
  }
});

export const avatar = style({
  width: 36,
  height: 36,
  flexShrink: 0,
  borderRadius: vars.radius.full,
  objectFit: "cover",
  background: vars.color.border,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: vars.color.textMuted,
  fontSize: vars.font.sizeSm,
  fontWeight: vars.font.weightMedium
});

export const text = style({ minWidth: 0, display: "flex", flexDirection: "column" });
export const name = style({
  fontSize: vars.font.sizeSm,
  fontWeight: vars.font.weightMedium,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
});
export const title = style({
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
});

export const toggle = style({
  position: "absolute",
  width: 20,
  height: 20,
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: vars.radius.full,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.borderStrong,
  background: vars.color.surface,
  color: vars.color.text,
  fontSize: vars.font.sizeXs,
  fontFamily: "inherit",
  cursor: "pointer",
  selectors: {
    "&:hover": { background: vars.color.surfaceRaised },
    "&:focus-visible": { outline: "none", boxShadow: vars.shadow.focus }
  }
});

export const controls = style({
  position: "sticky",
  top: vars.space.sm,
  left: vars.space.sm,
  zIndex: 2,
  display: "inline-flex",
  gap: vars.space.xs,
  margin: vars.space.sm
});

export const controlButton = style({
  minWidth: 28,
  height: 28,
  padding: `0 ${vars.space.sm}`,
  background: vars.color.surfaceRaised,
  color: vars.color.text,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.sm,
  fontFamily: "inherit",
  fontSize: vars.font.sizeSm,
  cursor: "pointer",
  selectors: {
    "&:hover": { borderColor: vars.color.borderStrong },
    "&:focus-visible": { outline: "none", boxShadow: vars.shadow.focus }
  }
});

export const empty = style({
  padding: vars.space.xl,
  textAlign: "center",
  color: vars.color.textMuted,
  fontSize: vars.font.sizeSm
});
