import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const wrapper = style({
  position: "relative",
  display: "block",
  width: "100%"
});

// Mirrors Textarea.css.ts's field chrome (border/radius/padding/focus ring)
// so a MentionsInput reads as "the same kind of input" next to a Textarea,
// swapped onto a contentEditable div instead of a native <textarea> — the
// contentEditable surface is required so mention chips can render as real
// inline, non-editable DOM elements (see RichTextEditor's editor class for
// the same contentEditable-styled-as-a-field precedent).
export const editor = style({
  display: "block",
  width: "100%",
  minHeight: "6em",
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeMd,
  lineHeight: vars.font.lineHeightNormal,
  color: vars.color.text,
  background: vars.color.surface,
  borderRadius: vars.radius.md,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  paddingTop: vars.space.sm,
  paddingBottom: vars.space.sm,
  paddingLeft: vars.space.md,
  paddingRight: vars.space.md,
  outline: "none",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  transitionProperty: "border-color, box-shadow",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:empty::before": {
      content: "attr(data-placeholder)",
      color: vars.color.textMuted
    },
    "&:hover:not([aria-disabled='true'])": {
      borderColor: vars.color.borderStrong
    },
    "&:focus-visible": {
      borderColor: vars.color.primary,
      boxShadow: vars.shadow.focus
    },
    "&[aria-disabled='true']": {
      cursor: "not-allowed",
      opacity: 0.5
    },
    "&[aria-invalid='true']": {
      borderColor: vars.color.danger
    },
    "&[aria-invalid='true']:focus-visible": {
      borderColor: vars.color.danger,
      boxShadow: vars.shadow.focus
    }
  }
});

// Mention chips are inserted as plain `<span data-mention-id>` elements (see
// MentionsInput.tsx's `selectMention`) rather than carrying a vanilla-extract
// class name, since that class name is stripped by sanitize.ts on every
// emitChange round-trip (it's not in the sanitizer's ALLOWED_ATTR — see that
// file for why) and a hashed class name isn't meaningful content to persist
// in `value` anyway. Styling instead targets the stable data attribute
// directly, scoped under the editor root the same way RichTextEditor scopes
// its own descendant styles (h1/blockquote/table/etc. in RichTextEditor.css.ts).
globalStyle(`${editor} span[data-mention-id]`, {
  display: "inline",
  borderRadius: vars.radius.full,
  paddingLeft: vars.space.xs,
  paddingRight: vars.space.xs,
  background: vars.color.primary,
  color: vars.color.primaryText,
  fontWeight: vars.font.weightMedium,
  whiteSpace: "nowrap"
});

export const listbox = style({
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

export const option = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
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

export const optionAvatar = style({
  width: "20px",
  height: "20px",
  borderRadius: vars.radius.full,
  objectFit: "cover",
  flexShrink: 0
});

export const optionAvatarFallback = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "20px",
  height: "20px",
  borderRadius: vars.radius.full,
  background: vars.color.surface,
  color: vars.color.textMuted,
  fontSize: vars.font.sizeXs,
  fontWeight: vars.font.weightMedium,
  flexShrink: 0
});

export const emptyState = style({
  padding: `${vars.space.xs} ${vars.space.sm}`,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  color: vars.color.textMuted
});
