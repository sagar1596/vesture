import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const badge = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space.xs,
  borderRadius: vars.radius.full,
  paddingTop: "2px",
  paddingBottom: "2px",
  paddingLeft: vars.space.sm,
  paddingRight: vars.space.sm,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeXs,
  fontWeight: vars.font.weightMedium,
  lineHeight: vars.font.lineHeightTight,
  whiteSpace: "nowrap"
});

export const variant = styleVariants({
  default: {
    background: vars.color.surface,
    color: vars.color.text
  },
  primary: {
    background: vars.color.primary,
    color: vars.color.primaryText
  },
  success: {
    background: vars.color.success,
    color: vars.color.primaryText
  },
  warning: {
    background: vars.color.warning,
    color: vars.color.primaryText
  },
  danger: {
    background: vars.color.danger,
    color: vars.color.primaryText
  }
});
