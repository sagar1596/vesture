import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const label = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space.xs,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  fontWeight: vars.font.weightMedium,
  lineHeight: vars.font.lineHeightNormal,
  color: vars.color.text,
  selectors: {
    "&[data-disabled]": {
      color: vars.color.textMuted,
      cursor: "not-allowed"
    }
  }
});

export const requiredMark = style({
  color: vars.color.danger
});
