import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

// Purely CSS-driven responsive treatment (no matchMedia/JS breakpoint
// tracking): the persistent column is `display: none` until the viewport
// is wide enough, and the mobile toggle is the mirror image — visible only
// below that width. Both render the exact same ThreadList content (see
// ChatWithThreads.tsx), so there's no behavior to keep in sync between them,
// just which one is visible.
const WIDE_VIEWPORT = "screen and (min-width: 768px)";

export const layout = style({
  display: "flex",
  height: "100%",
  minHeight: 0,
  fontFamily: vars.font.body
});

export const sidebarColumn = style({
  display: "none",
  flexDirection: "column",
  width: "260px",
  flexShrink: 0,
  borderRightWidth: vars.border.width,
  borderRightStyle: vars.border.style,
  borderRightColor: vars.color.border,
  "@media": {
    [WIDE_VIEWPORT]: {
      display: "flex"
    }
  }
});

export const chatColumn = style({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column"
});

export const mobileHeader = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: vars.space.sm,
  borderBottomWidth: vars.border.width,
  borderBottomStyle: vars.border.style,
  borderBottomColor: vars.color.border,
  "@media": {
    [WIDE_VIEWPORT]: {
      display: "none"
    }
  }
});

export const sidebarHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: vars.space.md,
  borderBottomWidth: vars.border.width,
  borderBottomStyle: vars.border.style,
  borderBottomColor: vars.color.border
});

export const sidebarTitle = style({
  fontFamily: vars.font.display,
  fontSize: vars.font.sizeMd,
  fontWeight: vars.font.weightMedium,
  color: vars.color.text,
  margin: 0
});

export const threadList = style({
  flex: 1,
  overflowY: "auto",
  listStyle: "none",
  margin: 0,
  padding: vars.space.sm
});

export const threadRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  borderRadius: vars.radius.md,
  padding: vars.space.sm,
  cursor: "pointer",
  selectors: {
    "&[data-active='true']": {
      background: vars.color.primary
    },
    "&:hover:not([data-active='true'])": {
      background: vars.color.surface
    }
  }
});

globalStyle(`${threadRow}[data-active='true'] *`, {
  color: vars.color.primaryText
});

export const threadTitle = style({
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: vars.font.sizeSm,
  color: vars.color.text,
  background: "transparent",
  border: "none",
  textAlign: "left",
  padding: 0,
  cursor: "pointer"
});

export const threadRowActions = style({
  display: "flex",
  gap: "2px",
  flexShrink: 0
});

export const threadRenameInput = style({
  flex: 1,
  minWidth: 0,
  fontSize: vars.font.sizeSm,
  boxSizing: "border-box"
});

export const emptyThreadsHint = style({
  padding: vars.space.md,
  fontSize: vars.font.sizeSm,
  color: vars.color.textMuted
});
