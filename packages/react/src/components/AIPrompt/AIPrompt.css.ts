import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.lg,
  fontFamily: vars.font.body,
  width: "100%"
});

export const cardsGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: vars.space.md
});

export const suggestionCard = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
  textAlign: "left",
  padding: vars.space.md,
  borderRadius: vars.radius.lg,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  background: vars.color.surface,
  cursor: "pointer",
  transitionProperty: "border-color, box-shadow",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  outline: "none",
  selectors: {
    "&:hover": { borderColor: vars.color.borderStrong },
    "&:focus-visible": { boxShadow: vars.shadow.focus }
  }
});

export const suggestionCardTitle = style({
  fontSize: vars.font.sizeMd,
  fontWeight: vars.font.weightMedium,
  color: vars.color.text
});

export const suggestionCardDescription = style({
  fontSize: vars.font.sizeSm,
  color: vars.color.textMuted
});

export const inputRow = style({
  position: "relative",
  display: "flex",
  alignItems: "flex-end",
  gap: vars.space.sm,
  padding: vars.space.md,
  borderRadius: vars.radius.lg,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  background: vars.color.surface
});

export const textarea = style({
  resize: "none",
  maxHeight: "200px",
  overflowY: "auto",
  border: "none",
  background: "transparent",
  flex: 1
});

export const commandMenu = style({
  display: "flex",
  flexDirection: "column",
  minWidth: "220px",
  maxHeight: "260px",
  overflowY: "auto",
  padding: vars.space.xs,
  borderRadius: vars.radius.md,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  background: vars.color.surfaceRaised,
  boxShadow: vars.shadow.md,
  zIndex: 10
});

export const commandMenuItem = style({
  display: "flex",
  flexDirection: "column",
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.sm,
  cursor: "pointer",
  selectors: {
    "&[data-active='true']": {
      background: vars.color.primary,
      color: vars.color.primaryText
    }
  }
});

export const commandMenuItemLabel = style({
  fontSize: vars.font.sizeSm,
  fontWeight: vars.font.weightMedium
});

export const commandMenuEmpty = style({
  padding: `${vars.space.xs} ${vars.space.sm}`,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  color: vars.color.textMuted
});
