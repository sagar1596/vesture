import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const card = style({
  background: vars.color.surface,
  borderRadius: vars.radius.lg,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  padding: vars.space.lg
});

export const elevation = styleVariants({
  flat: { boxShadow: vars.shadow.none },
  raised: { boxShadow: vars.shadow.sm, background: vars.color.surfaceRaised },
  overlay: { boxShadow: vars.shadow.lg, background: vars.color.surfaceRaised }
});
