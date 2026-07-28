import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  display: "flex",
  flexDirection: "column",
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  color: vars.color.text
});

export const groupContainer = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderLeftWidth: vars.border.widthStrong,
  borderLeftColor: vars.color.borderStrong,
  borderRadius: vars.radius.md,
  padding: vars.space.md
});

// Alternating surface tones per nesting depth (even/odd) keep deeply nested
// groups visually distinguishable from their parent at a glance.
export const surfaceByDepth = styleVariants({
  even: { background: vars.color.surface },
  odd: { background: vars.color.surfaceRaised }
});

export const nestedGroupWrapper = style({
  paddingLeft: vars.space.md
});

export const groupHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space.sm
});

export const combinatorGroup = style({
  display: "inline-flex",
  borderRadius: vars.radius.md,
  overflow: "hidden",
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border
});

export const combinatorButton = style({
  paddingTop: vars.space.xs,
  paddingBottom: vars.space.xs,
  paddingLeft: vars.space.sm,
  paddingRight: vars.space.sm,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeXs,
  fontWeight: vars.font.weightMedium,
  border: "none",
  background: vars.color.surface,
  color: vars.color.textMuted,
  cursor: "pointer",
  selectors: {
    "&[aria-pressed='true']": {
      background: vars.color.primary,
      color: vars.color.primaryText
    },
    "&:not(:last-child)": {
      borderRightWidth: vars.border.width,
      borderRightStyle: vars.border.style,
      borderRightColor: vars.color.border
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus
    }
  }
});

export const rulesList = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm
});

export const ruleRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  flexWrap: "wrap"
});

export const fieldSelect = style({
  minWidth: "140px"
});

export const operatorSelect = style({
  minWidth: "130px"
});

export const valueInput = style({
  minWidth: "140px"
});

export const valuePairInput = style({
  minWidth: "110px"
});

export const removeButton = style({
  border: "none",
  background: "transparent",
  color: vars.color.textMuted,
  cursor: "pointer",
  fontSize: vars.font.sizeSm,
  lineHeight: 1,
  padding: vars.space.xs,
  flexShrink: 0,
  selectors: {
    "&:hover": {
      color: vars.color.danger
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus
    }
  }
});

export const actionsRow = style({
  display: "flex",
  gap: vars.space.xs
});
