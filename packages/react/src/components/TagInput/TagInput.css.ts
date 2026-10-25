import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({ position: "relative", fontFamily: vars.font.body, fontSize: vars.font.sizeSm });

export const field = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: vars.space.xs,
  minHeight: 38,
  boxSizing: "border-box",
  padding: `${vars.space.xs} ${vars.space.sm}`,
  background: vars.color.surface,
  color: vars.color.text,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.md,
  cursor: "text",
  selectors: {
    "&:focus-within": { borderColor: vars.color.primary, boxShadow: vars.shadow.focus },
    "&[data-invalid='true']": { borderColor: vars.color.danger },
    "&[data-disabled='true']": { opacity: 0.6, cursor: "not-allowed" }
  }
});

export const tag = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space.xs,
  paddingLeft: vars.space.sm,
  background: vars.color.surfaceRaised,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.sm,
  selectors: {
    "&[data-active='true']": { borderColor: vars.color.primary }
  }
});

export const tagRemove = style({
  width: 20,
  height: 20,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "none",
  border: 0,
  borderRadius: vars.radius.sm,
  color: vars.color.textMuted,
  font: "inherit",
  cursor: "pointer",
  selectors: {
    "&:hover": { color: vars.color.text, background: vars.color.border },
    "&:focus-visible": { outline: "none", boxShadow: vars.shadow.focus }
  }
});

export const input = style({
  flex: 1,
  minWidth: 80,
  border: 0,
  outline: "none",
  background: "transparent",
  color: "inherit",
  font: "inherit",
  padding: `${vars.space.xs} 0`
});

export const list = style({
  position: "absolute",
  zIndex: 20,
  left: 0,
  right: 0,
  top: "calc(100% + 4px)",
  margin: 0,
  padding: vars.space.xs,
  listStyle: "none",
  maxHeight: 200,
  overflowY: "auto",
  background: vars.color.surfaceRaised,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.md
});

export const option = style({
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.sm,
  cursor: "pointer",
  selectors: {
    "&[aria-selected='true']": { background: vars.color.primary, color: vars.color.primaryText }
  }
});

export const hint = style({ marginTop: vars.space.xs, color: vars.color.textMuted, fontSize: vars.font.sizeXs });
