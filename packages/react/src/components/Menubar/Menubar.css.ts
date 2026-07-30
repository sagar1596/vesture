import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const menubar = style({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: vars.space.xs,
  padding: vars.space.xs,
  background: vars.color.surfaceRaised,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.md,
  width: "fit-content"
});

export const trigger = style({
  display: "inline-flex",
  alignItems: "center",
  border: "none",
  background: "transparent",
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  borderRadius: vars.radius.sm,
  paddingTop: vars.space.xs,
  paddingBottom: vars.space.xs,
  paddingLeft: vars.space.sm,
  paddingRight: vars.space.sm,
  cursor: "pointer",
  outline: "none",
  selectors: {
    "&:hover": {
      background: vars.color.surface
    },
    "&[data-open='true']": {
      background: vars.color.surface
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus
    }
  }
});
