import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const overlay = style({
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0, 0, 0, 0.4)",
  padding: vars.space.lg,
  zIndex: 1300
});

export const modal = style({
  position: "relative",
  background: vars.color.surfaceRaised,
  color: vars.color.text,
  fontFamily: vars.font.body,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.lg,
  padding: vars.space.xl,
  width: "100%",
  maxWidth: "480px",
  maxHeight: "90vh",
  overflowY: "auto",
  outline: "none"
});

export const heading = style({
  fontFamily: vars.font.display,
  fontSize: vars.font.sizeLg,
  fontWeight: vars.font.weightBold,
  margin: 0,
  marginBottom: vars.space.md
});

export const closeButton = style({
  position: "absolute",
  top: vars.space.md,
  right: vars.space.md,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  borderRadius: vars.radius.md,
  border: "none",
  background: "transparent",
  color: vars.color.textMuted,
  cursor: "pointer",
  fontSize: vars.font.sizeMd,
  lineHeight: 1,
  selectors: {
    "&:hover": {
      background: vars.color.surface,
      color: vars.color.text
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus
    }
  }
});
