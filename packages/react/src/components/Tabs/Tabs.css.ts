import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const list = style({
  display: "flex",
  gap: vars.space.xs,
  borderBottomWidth: vars.border.width,
  borderBottomStyle: vars.border.style,
  borderBottomColor: vars.color.border
});

export const trigger = style({
  position: "relative",
  border: "none",
  background: "transparent",
  color: vars.color.textMuted,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  fontWeight: vars.font.weightMedium,
  padding: `${vars.space.sm} ${vars.space.md}`,
  cursor: "pointer",
  selectors: {
    "&:hover": {
      color: vars.color.text
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus,
      borderRadius: vars.radius.sm
    },
    "&[aria-selected='true']": {
      color: vars.color.text
    },
    "&[aria-selected='true']::after": {
      content: "''",
      position: "absolute",
      left: 0,
      right: 0,
      bottom: "-1px",
      height: "2px",
      background: vars.color.primary
    }
  }
});

export const panel = style({
  paddingTop: vars.space.md,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  color: vars.color.text,
  selectors: {
    "&:focus-visible": {
      boxShadow: vars.shadow.focus
    }
  }
});
