import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  display: "flex",
  flexDirection: "column",
  fontFamily: vars.font.body,
  borderRadius: vars.radius.md,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  background: vars.color.surface,
  overflow: "hidden",
  selectors: {
    "&:focus-within": {
      borderColor: vars.color.primary,
      boxShadow: vars.shadow.focus
    },
    "&[data-disabled='true']": {
      opacity: 0.6
    }
  }
});

export const toolbar = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: vars.space.xs,
  padding: vars.space.xs,
  borderBottomWidth: vars.border.width,
  borderBottomStyle: vars.border.style,
  borderBottomColor: vars.color.border,
  background: vars.color.surfaceRaised
});

export const toolbarDivider = style({
  width: vars.border.width,
  alignSelf: "stretch",
  background: vars.color.border,
  marginTop: vars.space.xs,
  marginBottom: vars.space.xs
});

// Small ghost-style buttons — deliberately not importing Button here, since
// Button's padding/font-size are tuned for standalone actions, not a dense
// icon toolbar; this echoes Button's states (hover/active/focus/disabled)
// at a tighter scale instead.
export const toolbarButton = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "28px",
  height: "28px",
  paddingLeft: vars.space.xs,
  paddingRight: vars.space.xs,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeXs,
  fontWeight: vars.font.weightMedium,
  color: vars.color.text,
  background: "transparent",
  border: "none",
  borderRadius: vars.radius.sm,
  cursor: "pointer",
  selectors: {
    "&:hover:not(:disabled)": {
      background: vars.color.surface
    },
    "&[aria-pressed='true']": {
      background: vars.color.primary,
      color: vars.color.primaryText
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.5
    }
  }
});

// Echoes Textarea.css.ts's bordered/padded editing-surface treatment — this
// is conceptually a richer Textarea, so it should feel like a sibling, not a
// different component family.
export const editor = style({
  display: "block",
  width: "100%",
  minHeight: "8em",
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeMd,
  lineHeight: vars.font.lineHeightNormal,
  color: vars.color.text,
  background: vars.color.surface,
  paddingTop: vars.space.sm,
  paddingBottom: vars.space.sm,
  paddingLeft: vars.space.md,
  paddingRight: vars.space.md,
  outline: "none",
  selectors: {
    "&:empty::before": {
      content: "attr(data-placeholder)",
      color: vars.color.textMuted
    }
  }
});

// Descendant selectors (formatting produced inside the editable surface)
// can't live in `editor`'s own selectors — vanilla-extract requires a
// style block's selectors to target the class itself, not its descendants.
globalStyle(`${editor} h1`, {
  fontFamily: vars.font.display,
  fontSize: vars.font.sizeXl,
  margin: 0,
  marginTop: vars.space.sm,
  marginBottom: vars.space.sm
});

globalStyle(`${editor} h2`, {
  fontFamily: vars.font.display,
  fontSize: vars.font.sizeLg,
  margin: 0,
  marginTop: vars.space.sm,
  marginBottom: vars.space.sm
});

globalStyle(`${editor} blockquote`, {
  margin: 0,
  paddingLeft: vars.space.md,
  borderLeftWidth: vars.border.widthStrong,
  borderLeftStyle: vars.border.style,
  borderLeftColor: vars.color.border,
  color: vars.color.textMuted
});

globalStyle(`${editor} ul, ${editor} ol`, {
  margin: 0,
  paddingLeft: vars.space.lg
});

globalStyle(`${editor} a`, {
  color: vars.color.primary
});

globalStyle(`${editor} p`, {
  margin: 0
});

globalStyle(`${editor} table`, {
  borderCollapse: "collapse",
  margin: `${vars.space.sm} 0`
});

globalStyle(`${editor} td, ${editor} th`, {
  border: `${vars.border.width} ${vars.border.style} ${vars.color.border}`,
  padding: vars.space.xs,
  minWidth: "60px",
  verticalAlign: "top"
});

globalStyle(`${editor} th`, {
  background: vars.color.surfaceRaised,
  fontWeight: vars.font.weightMedium
});

globalStyle(`${editor} img`, {
  maxWidth: "100%"
});

// --- Table insert grid-picker ---

export const gridPicker = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
  padding: vars.space.sm
});

export const gridPickerRows = style({
  display: "grid",
  gridTemplateColumns: "repeat(8, 20px)",
  gridTemplateRows: "repeat(6, 20px)",
  gap: "2px"
});

export const gridPickerCell = style({
  width: "100%",
  height: "100%",
  padding: 0,
  border: `${vars.border.width} ${vars.border.style} ${vars.color.border}`,
  background: vars.color.surface,
  cursor: "pointer",
  selectors: {
    "&[data-active='true']": {
      background: vars.color.primary,
      borderColor: vars.color.primary
    }
  }
});

export const gridPickerLabel = style({
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted,
  textAlign: "center"
});

// --- Table cell context menu handle ---

export const tableCellHandle = style({
  position: "fixed",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "18px",
  height: "18px",
  fontSize: vars.font.sizeXs,
  lineHeight: 1,
  border: `${vars.border.width} ${vars.border.style} ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  background: vars.color.surfaceRaised,
  color: vars.color.textMuted,
  cursor: "pointer",
  zIndex: 1,
  selectors: {
    "&:hover": {
      background: vars.color.surface,
      color: vars.color.text
    }
  }
});

// --- Image insertion popover ---

export const imagePopover = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
  padding: vars.space.sm,
  width: "280px"
});

export const imagePopoverDivider = style({
  height: vars.border.width,
  background: vars.color.border
});

export const imageUrlForm = style({
  display: "flex",
  gap: vars.space.xs
});

// --- Image resize overlay ---

export const imageResizeOverlay = style({
  position: "fixed",
  border: `${vars.border.widthStrong} ${vars.border.style} ${vars.color.primary}`,
  pointerEvents: "none",
  zIndex: 1
});

export const imageResizeHandle = style({
  position: "fixed",
  width: "10px",
  height: "10px",
  marginLeft: "-5px",
  marginTop: "-5px",
  borderRadius: vars.radius.full,
  background: vars.color.primary,
  border: `${vars.border.width} ${vars.border.style} ${vars.color.primaryText}`,
  cursor: "nwse-resize",
  pointerEvents: "auto",
  zIndex: 2
});

export const linkForm = style({
  display: "flex",
  gap: vars.space.xs,
  padding: vars.space.sm,
  alignItems: "center"
});

export const linkInput = style({
  width: "220px"
});

// --- Color / highlight swatch popover ---

export const colorPopover = style({
  display: "grid",
  gridTemplateColumns: "repeat(4, 28px)",
  gap: vars.space.xs,
  padding: vars.space.sm
});

export const colorSwatch = style({
  width: "28px",
  height: "28px",
  padding: 0,
  borderRadius: vars.radius.sm,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  cursor: "pointer",
  selectors: {
    "&:hover": {
      borderColor: vars.color.borderStrong
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus
    }
  }
});

// --- Font size popover ---

export const fontSizePopover = style({
  display: "flex",
  flexDirection: "column",
  padding: vars.space.xs
});

export const fontSizeOption = style({
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: `${vars.space.xs} ${vars.space.sm}`,
  border: "none",
  background: "transparent",
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  cursor: "pointer",
  borderRadius: vars.radius.sm,
  selectors: {
    "&:hover": {
      background: vars.color.surfaceRaised
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus
    }
  }
});

// --- Inline slash command menu ---

export const slashMenu = style({
  display: "flex",
  flexDirection: "column",
  minWidth: "180px",
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

export const slashMenuItem = style({
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.sm,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  color: vars.color.text,
  cursor: "pointer",
  selectors: {
    "&[data-active='true']": {
      background: vars.color.primary,
      color: vars.color.primaryText
    }
  }
});

export const slashMenuEmpty = style({
  padding: `${vars.space.xs} ${vars.space.sm}`,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  color: vars.color.textMuted
});
