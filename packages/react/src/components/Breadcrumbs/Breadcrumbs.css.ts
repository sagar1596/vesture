import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const list = style({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: vars.space.xs,
  margin: 0,
  padding: 0,
  listStyle: "none",
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm
});

export const item = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs
});

export const link = style({
  color: vars.color.textMuted,
  textDecoration: "none",
  borderRadius: vars.radius.sm,
  selectors: {
    "&:hover": {
      color: vars.color.text,
      textDecoration: "underline"
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus
    }
  }
});

export const current = style({
  color: vars.color.text,
  fontWeight: vars.font.weightMedium
});

export const separator = style({
  color: vars.color.textMuted
});
