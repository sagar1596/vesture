import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

// Content always sits on one side of the marker (right for vertical, below
// for horizontal) rather than alternating — simpler to scan for a list of
// events, and avoids the extra even/odd layout branch alternating would need.
export const list = style({
  display: "flex",
  margin: 0,
  padding: 0,
  listStyle: "none",
  selectors: {
    '&[data-orientation="vertical"]': {
      flexDirection: "column",
    },
    '&[data-orientation="horizontal"]': {
      flexDirection: "row",
      overflowX: "auto",
    },
  },
});

export const row = style({
  display: "flex",
  selectors: {
    '&[data-orientation="vertical"]': {
      flexDirection: "row",
    },
    '&[data-orientation="horizontal"]': {
      flexDirection: "column",
      minWidth: 160,
    },
  },
});

export const markerColumn = style({
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
  selectors: {
    '&[data-orientation="vertical"]': {
      flexDirection: "column",
    },
    '&[data-orientation="horizontal"]': {
      flexDirection: "row",
    },
  },
});

export const marker = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  flexShrink: 0,
  borderRadius: vars.radius.full,
  background: vars.color.textMuted,
  color: vars.color.textInverse,
  fontSize: vars.font.sizeXs,
  selectors: {
    '&[data-status="success"]': {
      background: vars.color.success,
    },
    '&[data-status="warning"]': {
      background: vars.color.warning,
    },
    '&[data-status="danger"]': {
      background: vars.color.danger,
    },
  },
});

export const connector = style({
  background: vars.color.border,
  flexShrink: 0,
  selectors: {
    '&[data-orientation="vertical"]': {
      width: 2,
      flexGrow: 1,
      minHeight: vars.space.md,
    },
    '&[data-orientation="horizontal"]': {
      height: 2,
      flexGrow: 1,
      minWidth: vars.space.md,
    },
  },
});

globalStyle(`${row}:last-child ${connector}`, {
  visibility: "hidden",
});

export const content = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
  paddingLeft: vars.space.sm,
  paddingBottom: vars.space.lg,
  paddingRight: vars.space.sm,
});

export const header = style({
  display: "flex",
  alignItems: "baseline",
  gap: vars.space.sm,
  flexWrap: "wrap",
});

export const title = style({
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  fontWeight: vars.font.weightMedium,
  color: vars.color.text,
});

export const timestamp = style({
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted,
});

export const description = style({
  margin: 0,
  fontSize: vars.font.sizeSm,
  color: vars.color.textMuted,
});
