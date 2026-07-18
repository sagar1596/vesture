import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const srOnly = style({
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
});

export const container = style({
  position: "relative",
  overflow: "auto",
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  color: vars.color.text,
});

export const headerRow = style({
  position: "sticky",
  top: 0,
  display: "flex",
  zIndex: 2,
  background: vars.color.surface,
  borderBottomWidth: vars.border.width,
  borderBottomStyle: vars.border.style,
  borderBottomColor: vars.color.border,
});

export const headerCell = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  flexShrink: 0,
  paddingTop: vars.space.sm,
  paddingBottom: vars.space.sm,
  paddingLeft: vars.space.md,
  paddingRight: vars.space.md,
  fontWeight: vars.font.weightMedium,
  color: vars.color.textMuted,
  userSelect: "none",
  boxSizing: "border-box",
  background: vars.color.surface,
});

export const headerButton = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  border: "none",
  background: "transparent",
  color: "inherit",
  font: "inherit",
  padding: 0,
  cursor: "pointer",
  selectors: {
    "&:focus-visible": {
      boxShadow: vars.shadow.focus,
      borderRadius: vars.radius.sm,
    },
  },
});

export const sortIcon = style({
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted,
});

export const resizeHandle = style({
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  width: "6px",
  cursor: "col-resize",
  touchAction: "none",
  selectors: {
    "&:hover": {
      background: vars.color.borderStrong,
    },
  },
});

export const body = style({
  position: "relative",
});

export const row = style({
  position: "absolute",
  left: 0,
  right: 0,
  display: "flex",
  borderBottomWidth: vars.border.width,
  borderBottomStyle: vars.border.style,
  borderBottomColor: vars.color.border,
  selectors: {
    "&:hover": {
      background: vars.color.surface,
    },
    "&[data-selected='true']": {
      background: vars.color.surface,
    },
    "&[data-editing='true']": {
      background: vars.color.surface,
    },
  },
});

export const cell = style({
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
  paddingLeft: vars.space.md,
  paddingRight: vars.space.md,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  boxSizing: "border-box",
});

export const checkboxCell = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "44px",
  boxSizing: "border-box",
});

export const emptyState = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: vars.space.xl,
  color: vars.color.textMuted,
});

// --- Pinned (frozen) columns ---

export const pinnedCell = style({
  position: "sticky",
  zIndex: 1,
  background: vars.color.surfaceRaised,
  selectors: {
    [`${row}:hover &`]: {
      background: vars.color.surface,
    },
    [`${row}[data-selected='true'] &`]: {
      background: vars.color.surface,
    },
    [`${row}[data-editing='true'] &`]: {
      background: vars.color.surface,
    },
  },
});

export const pinnedHeaderCell = style({
  position: "sticky",
  zIndex: 1,
  background: vars.color.surface,
});

export const pinnedLeftEdge = style({
  boxShadow: "2px 0 4px -2px rgba(0, 0, 0, 0.15)",
});

export const pinnedRightEdge = style({
  boxShadow: "-2px 0 4px -2px rgba(0, 0, 0, 0.15)",
});

// --- Inline row editing ---

export const actionsCell = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space.xs,
  flexShrink: 0,
  width: "72px",
  boxSizing: "border-box",
});

export const iconButton = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "26px",
  height: "26px",
  border: "none",
  borderRadius: vars.radius.sm,
  background: "transparent",
  color: vars.color.textMuted,
  cursor: "pointer",
  fontSize: vars.font.sizeSm,
  lineHeight: 1,
  selectors: {
    "&:hover": {
      background: vars.color.border,
      color: vars.color.text,
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus,
    },
  },
});

// --- Column filtering ---

export const filterRow = style({
  position: "sticky",
  top: 0,
  display: "flex",
  zIndex: 2,
  background: vars.color.surface,
  borderBottomWidth: vars.border.width,
  borderBottomStyle: vars.border.style,
  borderBottomColor: vars.color.border,
});

export const filterCell = style({
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
  paddingTop: vars.space.xs,
  paddingBottom: vars.space.xs,
  paddingLeft: vars.space.md,
  paddingRight: vars.space.md,
  boxSizing: "border-box",
  background: vars.color.surface,
});

export const filterInput = style({
  width: "100%",
  fontFamily: "inherit",
  fontSize: vars.font.sizeSm,
  color: vars.color.text,
  background: vars.color.surfaceRaised,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  borderRadius: vars.radius.sm,
  paddingTop: vars.space.xs,
  paddingBottom: vars.space.xs,
  paddingLeft: vars.space.sm,
  paddingRight: vars.space.sm,
  outline: "none",
  selectors: {
    "&:focus-visible": {
      boxShadow: vars.shadow.focus,
    },
  },
});

// --- Toolbar ---

export const toolbar = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: vars.space.sm,
  paddingTop: vars.space.sm,
  paddingBottom: vars.space.sm,
  paddingLeft: vars.space.md,
  paddingRight: vars.space.md,
  background: vars.color.surface,
  borderBottomWidth: vars.border.width,
  borderBottomStyle: vars.border.style,
  borderBottomColor: vars.color.border,
});

// --- Server-side loading overlay ---

export const gridWrapper = style({
  position: "relative",
});

export const loadingOverlay = style({
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 3,
  background: vars.color.surface,
  opacity: 0.85,
  boxShadow: vars.shadow.focus,
});

// --- Pagination footer ---

export const paginationFooter = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  paddingTop: vars.space.sm,
  paddingBottom: vars.space.sm,
  paddingLeft: vars.space.md,
  paddingRight: vars.space.md,
  borderTopWidth: vars.border.width,
  borderTopStyle: vars.border.style,
  borderTopColor: vars.color.border,
});

// --- Row grouping ---

export const groupRow = style({
  position: "absolute",
  left: 0,
  right: 0,
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  paddingLeft: vars.space.md,
  paddingRight: vars.space.md,
  boxSizing: "border-box",
  background: vars.color.surface,
  borderBottomWidth: vars.border.width,
  borderBottomStyle: vars.border.style,
  borderBottomColor: vars.color.border,
  fontWeight: vars.font.weightMedium,
});

export const groupChevron = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: vars.space.lg,
  height: vars.space.lg,
  flexShrink: 0,
  border: "none",
  background: "transparent",
  color: vars.color.textMuted,
  cursor: "pointer",
  fontSize: vars.font.sizeMd,
  lineHeight: 1,
  transitionProperty: "transform",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&[data-expanded]": {
      transform: "rotate(90deg)",
    },
  },
});

export const groupLabel = style({
  color: vars.color.text,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const groupCount = style({
  color: vars.color.textMuted,
  fontWeight: vars.font.weightRegular,
  fontSize: vars.font.sizeXs,
  flexShrink: 0,
});

export const groupAggregates = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.md,
  marginLeft: "auto",
  fontWeight: vars.font.weightRegular,
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted,
});

export const groupAggregateItem = style({
  whiteSpace: "nowrap",
});

export const editInput = style({
  width: "100%",
  fontFamily: "inherit",
  fontSize: "inherit",
  color: vars.color.text,
  background: vars.color.surfaceRaised,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.primary,
  borderRadius: vars.radius.sm,
  paddingTop: vars.space.xs,
  paddingBottom: vars.space.xs,
  paddingLeft: vars.space.sm,
  paddingRight: vars.space.sm,
  outline: "none",
  selectors: {
    "&:focus-visible": {
      boxShadow: vars.shadow.focus,
    },
  },
});
