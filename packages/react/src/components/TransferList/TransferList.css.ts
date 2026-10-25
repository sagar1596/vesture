import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  display: "flex",
  alignItems: "stretch",
  gap: vars.space.md,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  color: vars.color.text
});

export const panel = style({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  background: vars.color.surface,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.md,
  overflow: "hidden"
});

export const header = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: `${vars.space.sm} ${vars.space.md}`,
  background: vars.color.surfaceRaised,
  borderBottomWidth: vars.border.width,
  borderBottomStyle: vars.border.style,
  borderBottomColor: vars.color.border
});

export const headerTitle = style({ fontWeight: vars.font.weightMedium, flex: 1 });
export const count = style({ color: vars.color.textMuted, fontSize: vars.font.sizeXs });

export const search = style({
  margin: vars.space.sm,
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
    "&:focus-visible": { outline: "none", borderColor: vars.color.primary, boxShadow: vars.shadow.focus }
  }
});

export const list = style({ listStyle: "none", margin: 0, padding: 0, overflowY: "auto", flex: 1 });

export const row = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: `${vars.space.xs} ${vars.space.md}`,
  cursor: "pointer",
  selectors: {
    "&:hover": { background: vars.color.surfaceRaised },
    "&[data-disabled='true']": { opacity: 0.5, cursor: "not-allowed" },
    "&[data-checked='true']": { background: vars.color.surfaceRaised }
  }
});

export const groupLabel = style({
  padding: `${vars.space.xs} ${vars.space.md}`,
  color: vars.color.textMuted,
  fontSize: vars.font.sizeXs,
  textTransform: "uppercase",
  letterSpacing: "0.04em"
});

export const empty = style({ padding: vars.space.lg, textAlign: "center", color: vars.color.textMuted });

export const actions = style({ display: "flex", flexDirection: "column", justifyContent: "center", gap: vars.space.xs });

export const actionButton = style({
  width: 36,
  height: 30,
  fontFamily: "inherit",
  fontSize: vars.font.sizeSm,
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
    "&:disabled": { opacity: 0.4, cursor: "not-allowed" }
  }
});
