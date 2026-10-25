import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  color: vars.color.text
});

export const row = style({ display: "flex", flexWrap: "wrap", alignItems: "center", gap: vars.space.sm });

export const chip = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space.xs,
  paddingLeft: vars.space.sm,
  background: vars.color.surfaceRaised,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.full,
  selectors: {
    "&[data-editing='true']": { borderColor: vars.color.primary }
  }
});

export const chipLabel = style({
  background: "none",
  border: 0,
  padding: `${vars.space.xs} 0`,
  font: "inherit",
  color: "inherit",
  cursor: "pointer",
  selectors: {
    "&:focus-visible": { outline: "none", boxShadow: vars.shadow.focus, borderRadius: vars.radius.sm }
  }
});

export const chipField = style({ color: vars.color.textMuted });
export const chipValue = style({ fontWeight: vars.font.weightMedium });

export const chipRemove = style({
  width: 22,
  height: 22,
  marginRight: 2,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "none",
  border: 0,
  borderRadius: vars.radius.full,
  color: vars.color.textMuted,
  font: "inherit",
  cursor: "pointer",
  selectors: {
    "&:hover": { background: vars.color.border, color: vars.color.text },
    "&:focus-visible": { outline: "none", boxShadow: vars.shadow.focus }
  }
});

export const control = style({
  height: 30,
  boxSizing: "border-box",
  padding: `0 ${vars.space.sm}`,
  background: vars.color.surface,
  color: vars.color.text,
  fontFamily: "inherit",
  fontSize: "inherit",
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.sm,
  selectors: {
    "&:focus-visible": { outline: "none", boxShadow: vars.shadow.focus, borderColor: vars.color.primary }
  }
});

export const button = style({
  height: 30,
  padding: `0 ${vars.space.md}`,
  fontFamily: "inherit",
  fontSize: "inherit",
  background: vars.color.surface,
  color: vars.color.text,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.sm,
  cursor: "pointer",
  selectors: {
    "&:hover:not(:disabled)": { borderColor: vars.color.borderStrong },
    "&:focus-visible": { outline: "none", boxShadow: vars.shadow.focus },
    "&:disabled": { opacity: 0.5, cursor: "not-allowed" }
  }
});

export const primaryButton = style({
  background: vars.color.primary,
  color: vars.color.primaryText,
  borderColor: vars.color.primary,
  selectors: {
    "&:hover:not(:disabled)": { background: vars.color.primaryHover, borderColor: vars.color.primaryHover }
  }
});

export const editor = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: vars.space.sm,
  padding: vars.space.sm,
  background: vars.color.surface,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.md
});

export const muted = style({ color: vars.color.textMuted });
