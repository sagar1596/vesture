import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: vars.space["2xl"],
  fontFamily: vars.font.body
});

export const icon = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "48px",
  color: vars.color.textMuted,
  marginBottom: vars.space.lg
});

export const title = style({
  fontSize: vars.font.sizeLg,
  fontWeight: vars.font.weightMedium,
  color: vars.color.text
});

export const description = style({
  marginTop: vars.space.xs,
  fontSize: vars.font.sizeSm,
  color: vars.color.textMuted,
  maxWidth: "32ch"
});

export const action = style({
  marginTop: vars.space.lg
});
