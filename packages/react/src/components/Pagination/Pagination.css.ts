import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const list = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  margin: 0,
  padding: 0,
  listStyle: "none"
});

export const pageButton = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "36px",
  height: "36px",
  paddingLeft: vars.space.xs,
  paddingRight: vars.space.xs,
  border: "none",
  borderRadius: vars.radius.md,
  background: "transparent",
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  cursor: "pointer",
  selectors: {
    "&:hover:not(:disabled)": {
      background: vars.color.surface
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus
    },
    "&:disabled": {
      color: vars.color.textMuted,
      cursor: "not-allowed"
    },
    "&[aria-current='page']": {
      background: vars.color.primary,
      color: vars.color.primaryText
    }
  }
});

export const ellipsis = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "36px",
  height: "36px",
  color: vars.color.textMuted
});
