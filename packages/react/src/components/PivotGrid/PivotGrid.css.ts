import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  overflow: "auto",
  border: `${vars.border.width} ${vars.border.style} ${vars.color.border}`,
  borderRadius: vars.radius.md,
  background: vars.color.surface,
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm
});

export const table = style({
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0
});

export const headCell = style({
  position: "sticky",
  top: 0,
  zIndex: 1,
  padding: `${vars.space.sm} ${vars.space.md}`,
  textAlign: "right",
  fontWeight: vars.font.weightMedium,
  background: vars.color.surfaceRaised,
  borderBottom: `${vars.border.widthStrong} ${vars.border.style} ${vars.color.borderStrong}`,
  whiteSpace: "nowrap",
  selectors: {
    '&[data-align="left"]': { textAlign: "left" },
    '&[data-total="true"]': { borderLeft: `${vars.border.width} ${vars.border.style} ${vars.color.border}` }
  }
});

export const rowLabel = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  textAlign: "left",
  fontWeight: vars.font.weightMedium,
  whiteSpace: "nowrap",
  borderBottom: `${vars.border.width} ${vars.border.style} ${vars.color.border}`,
  selectors: {
    '&[data-repeat="true"]': { color: "transparent", userSelect: "none" }
  }
});

export const valueCell = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
  borderBottom: `${vars.border.width} ${vars.border.style} ${vars.color.border}`,
  selectors: {
    '&[data-empty="true"]': { color: vars.color.textMuted },
    '&[data-total="true"]': {
      fontWeight: vars.font.weightMedium,
      background: vars.color.background,
      borderLeft: `${vars.border.width} ${vars.border.style} ${vars.color.border}`
    }
  }
});

export const totalRow = style({
  fontWeight: vars.font.weightBold,
  background: vars.color.background
});

export const emptyState = style({
  padding: vars.space.xl,
  textAlign: "center",
  color: vars.color.textMuted
});
