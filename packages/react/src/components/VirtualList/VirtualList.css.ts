import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  position: "relative",
  overflowY: "auto",
  overflowX: "hidden",
  background: vars.color.surface,
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.md,
  selectors: {
    "&:focus-visible": { outline: "none", boxShadow: vars.shadow.focus }
  }
});

export const inner = style({ position: "relative", width: "100%" });

export const item = style({ position: "absolute", left: 0, right: 0, boxSizing: "border-box" });

export const status = style({
  position: "absolute",
  left: 0,
  right: 0,
  padding: vars.space.md,
  textAlign: "center",
  color: vars.color.textMuted
});

export const empty = style({ padding: vars.space.xl, textAlign: "center", color: vars.color.textMuted });
