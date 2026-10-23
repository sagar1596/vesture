import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  display: "flex",
  flexDirection: "column",
  border: `${vars.border.width} ${vars.border.style} ${vars.color.border}`,
  borderRadius: vars.radius.md,
  background: vars.color.surface,
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  overflow: "hidden"
});

export const formulaBar = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: vars.space.xs,
  borderBottom: `${vars.border.width} ${vars.border.style} ${vars.color.border}`,
  background: vars.color.surfaceRaised
});

export const nameBox = style({
  minWidth: 48,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  textAlign: "center",
  fontWeight: vars.font.weightMedium,
  borderRight: `${vars.border.width} ${vars.border.style} ${vars.color.border}`
});

export const formulaText = style({
  flex: 1,
  minWidth: 0,
  fontFamily: vars.font.mono,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  color: vars.color.textMuted
});

export const scroller = style({
  overflow: "auto"
});

export const table = style({
  borderCollapse: "separate",
  borderSpacing: 0,
  tableLayout: "fixed"
});

export const cornerCell = style({
  position: "sticky",
  top: 0,
  left: 0,
  zIndex: 3,
  width: 44,
  background: vars.color.surfaceRaised,
  borderRight: `${vars.border.width} ${vars.border.style} ${vars.color.border}`,
  borderBottom: `${vars.border.width} ${vars.border.style} ${vars.color.border}`
});

export const colHeader = style({
  position: "sticky",
  top: 0,
  zIndex: 2,
  padding: vars.space.xs,
  background: vars.color.surfaceRaised,
  color: vars.color.textMuted,
  fontWeight: vars.font.weightMedium,
  borderRight: `${vars.border.width} ${vars.border.style} ${vars.color.border}`,
  borderBottom: `${vars.border.width} ${vars.border.style} ${vars.color.border}`,
  selectors: {
    '&[data-active="true"]': { color: vars.color.primary, background: vars.color.background }
  }
});

export const rowHeader = style({
  position: "sticky",
  left: 0,
  zIndex: 1,
  padding: vars.space.xs,
  textAlign: "center",
  background: vars.color.surfaceRaised,
  color: vars.color.textMuted,
  fontWeight: vars.font.weightMedium,
  borderRight: `${vars.border.width} ${vars.border.style} ${vars.color.border}`,
  borderBottom: `${vars.border.width} ${vars.border.style} ${vars.color.border}`,
  selectors: {
    '&[data-active="true"]': { color: vars.color.primary, background: vars.color.background }
  }
});

export const cell = style({
  position: "relative",
  height: 28,
  padding: `0 ${vars.space.sm}`,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  borderRight: `${vars.border.width} ${vars.border.style} ${vars.color.border}`,
  borderBottom: `${vars.border.width} ${vars.border.style} ${vars.color.border}`,
  cursor: "cell",
  selectors: {
    '&[data-numeric="true"]': { textAlign: "right", fontVariantNumeric: "tabular-nums" },
    '&[data-error="true"]': { color: vars.color.danger },
    '&[data-active="true"]': {
      outline: `2px solid ${vars.color.primary}`,
      outlineOffset: -2
    },
    "&:focus-visible": { outline: `2px solid ${vars.color.focusRing}`, outlineOffset: -2 }
  }
});

export const editor = style({
  position: "absolute",
  inset: 0,
  width: "100%",
  boxSizing: "border-box",
  padding: `0 ${vars.space.sm}`,
  border: `2px solid ${vars.color.primary}`,
  background: vars.color.surface,
  color: vars.color.text,
  font: "inherit",
  outline: "none"
});

export const visuallyHidden = style({
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap"
});
