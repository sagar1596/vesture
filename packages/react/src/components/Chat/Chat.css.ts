import { globalStyle, keyframes, style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
  fontFamily: vars.font.body
});

// Wraps the scroll area (or empty state) + the floating scroll-to-bottom
// button, deliberately excluding the input area below. The button is
// `position: absolute; bottom: <gap>` relative to the nearest positioned
// ancestor — previously that was `root` itself, which spans the *entire*
// component including the input. That meant "bottom: lg" was measured from
// the very bottom of the whole component, below the input, not from the
// bottom of the message list — so as ChatInput's textarea grows past a
// single line, the input area (a flex sibling below this wrapper) gets
// taller, and the button — still anchored a fixed distance from root's
// unchanged bottom edge — ends up positioned *inside* that now-taller input
// area instead of hovering just above it, overlapping the growing textarea.
// Scoping `position: relative` to this narrower wrapper instead makes
// "bottom: lg" mean "just above the input," independent of the input's own
// height.
export const conversationArea = style({
  position: "relative",
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column"
});

export const scrollArea = style({
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: vars.space.md,
  padding: vars.space.lg
});

export const emptyStateWrapper = style({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
});

export const messageGroup = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs
});

export const messageRow = style({
  display: "flex",
  gap: vars.space.sm,
  maxWidth: "100%",
  position: "relative"
});

// Continuation messages within a group hide the avatar visually but keep
// its box (rather than removing it from the DOM) so the bubble column stays
// at the same x-position as the group's first message — using Avatar's own
// rendered size rather than a hardcoded width duplicate that could drift
// out of sync with the real avatar size.
export const avatarHidden = style({
  visibility: "hidden"
});

export const metaRowCompact = style({
  opacity: 0,
  transitionProperty: "opacity",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:focus-within": { opacity: 1 }
  }
});

globalStyle(`${messageRow}:hover ${metaRowCompact}, ${messageRow}:focus-within ${metaRowCompact}`, {
  opacity: 1
});

export const toolCallContainer = style({
  width: "100%"
});

export const messageRowAlign = styleVariants({
  user: { flexDirection: "row-reverse" },
  assistant: { flexDirection: "row" },
  system: { justifyContent: "center" }
});

export const bubbleColumn = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
  maxWidth: "min(640px, 80%)",
  // Containing block for actionsButton below — it used to be positioned
  // relative to messageRow instead, which spans the *entire* row width
  // (needed for messageRowAlign's flex-direction trick to right/left-align
  // messages at all). For an assistant bubble narrower than the full row,
  // that put the button 32px past the row's far edge — off past the visible
  // bubble entirely, and wide enough to push the whole message list into
  // its own unwanted horizontal scrollbar. Relative to bubbleColumn instead,
  // "-space.xl" is measured from the bubble's own actual edge.
  position: "relative"
});

export const bubbleColumnAlign = styleVariants({
  user: { alignItems: "flex-end" },
  assistant: { alignItems: "flex-start" },
  system: { alignItems: "center", maxWidth: "90%" }
});

export const senderName = style({
  fontSize: vars.font.sizeXs,
  fontWeight: vars.font.weightMedium,
  color: vars.color.textMuted
});

export const bubble = style({
  borderRadius: vars.radius.lg,
  paddingTop: vars.space.sm,
  paddingBottom: vars.space.sm,
  paddingLeft: vars.space.md,
  paddingRight: vars.space.md,
  fontSize: vars.font.sizeMd,
  lineHeight: vars.font.lineHeightNormal,
  wordBreak: "break-word"
});

globalStyle(`${bubble} p`, { margin: 0 });
globalStyle(`${bubble} p + p`, { marginTop: vars.space.sm });
globalStyle(`${bubble} ul, ${bubble} ol`, { margin: 0, paddingLeft: vars.space.lg });
globalStyle(`${bubble} pre`, {
  background: "rgba(0, 0, 0, 0.08)",
  borderRadius: vars.radius.sm,
  padding: vars.space.sm,
  overflowX: "auto",
  fontFamily: vars.font.mono,
  fontSize: vars.font.sizeSm
});
globalStyle(`${bubble} code`, {
  fontFamily: vars.font.mono,
  fontSize: vars.font.sizeSm
});
globalStyle(`${bubble} pre code`, { background: "transparent" });
globalStyle(`${bubble} :not(pre) > code`, {
  background: "rgba(0, 0, 0, 0.08)",
  borderRadius: vars.radius.sm,
  paddingLeft: "4px",
  paddingRight: "4px"
});
globalStyle(`${bubble} blockquote`, {
  margin: 0,
  paddingLeft: vars.space.sm,
  borderLeftWidth: vars.border.widthStrong,
  borderLeftStyle: vars.border.style,
  borderLeftColor: vars.color.border,
  color: vars.color.textMuted
});
globalStyle(`${bubble} a`, { color: "inherit" });
globalStyle(`${bubble} table`, { borderCollapse: "collapse" });
globalStyle(`${bubble} th, ${bubble} td`, {
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  padding: vars.space.xs
});

export const bubbleVariant = styleVariants({
  user: {
    background: vars.color.primary,
    color: vars.color.primaryText
  },
  assistant: {
    background: vars.color.surface,
    color: vars.color.text
  },
  system: {
    background: "transparent",
    color: vars.color.textMuted,
    fontSize: vars.font.sizeSm,
    fontStyle: "italic"
  }
});

export const bubbleStatus = styleVariants({
  sending: { opacity: 0.6 },
  sent: {},
  error: {
    borderWidth: vars.border.width,
    borderStyle: vars.border.style,
    borderColor: vars.color.danger
  }
});

export const metaRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted
});

export const errorText = style({
  color: vars.color.danger
});

export const actionsButton = style({
  position: "absolute",
  top: 0,
  opacity: 0,
  pointerEvents: "none",
  transitionProperty: "opacity",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&:focus-visible": {
      opacity: 1,
      pointerEvents: "auto"
    }
  }
});

export const actionsButtonAlign = styleVariants({
  user: { left: `calc(-1 * ${vars.space.xl})` },
  assistant: { right: `calc(-1 * ${vars.space.xl})` },
  system: { display: "none" }
});

globalStyle(`${messageRow}:hover ${actionsButton}, ${messageRow}:focus-within ${actionsButton}`, {
  opacity: 1,
  pointerEvents: "auto"
});

const dotPulse = keyframes({
  "0%, 80%, 100%": { opacity: 0.3, transform: "scale(0.8)" },
  "40%": { opacity: 1, transform: "scale(1)" }
});

export const typingIndicator = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: `${vars.space.sm} ${vars.space.md}`,
  background: vars.color.surface,
  borderRadius: vars.radius.lg,
  width: "fit-content"
});

export const typingDot = style({
  width: "6px",
  height: "6px",
  borderRadius: vars.radius.full,
  background: vars.color.textMuted,
  animationName: dotPulse,
  animationDuration: "1.4s",
  animationIterationCount: "infinite",
  animationTimingFunction: "ease-in-out"
});

export const scrollToBottomButton = style({
  position: "absolute",
  bottom: vars.space.lg,
  left: "50%",
  transform: "translateX(-50%)",
  borderRadius: vars.radius.full,
  boxShadow: vars.shadow.md,
  zIndex: 1
});

export const suggestions = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space.xs,
  paddingLeft: vars.space.lg,
  paddingRight: vars.space.lg,
  paddingBottom: vars.space.sm
});

export const suggestionChip = style({
  borderRadius: vars.radius.full,
  fontSize: vars.font.sizeSm
});

// The input's own flex item, one level up from inputArea — explicitly
// flexShrink: 0 so the flex column never tries to compress it to make room
// for a tall (multi-line) textarea. Without this, a consumer giving Chat too
// little total height would squeeze this box below its actual content size;
// since the textarea's grown height is an explicit inline pixel value (not
// something flex-shrink can meaningfully compress), the result wasn't a
// clean shrink but a visual overlap with the message list above it — the
// input area rendering on top of content it should have pushed down instead.
// conversationArea (flex: 1; minHeight: 0) is the intended thing that gives
// up space when room is tight, not this.
export const chatInputRoot = style({
  flexShrink: 0
});

export const inputArea = style({
  display: "flex",
  alignItems: "flex-end",
  gap: vars.space.sm,
  padding: vars.space.lg,
  borderTopWidth: vars.border.width,
  borderTopStyle: vars.border.style,
  borderTopColor: vars.color.border
});

export const textareaWrapper = style({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs
});

// 5 lines of text, in the same units the text itself is sized in (line-height
// × font-size), not a hardcoded pixel guess — so the cap actually tracks 5
// rows regardless of theme font size, and the vertical padding on top/bottom
// is added on top so row 5 doesn't get clipped against the padding edge.
const MAX_VISIBLE_ROWS = 5;
const textareaMaxHeight = `calc(${vars.font.lineHeightNormal} * ${vars.font.sizeMd} * ${MAX_VISIBLE_ROWS} + ${vars.space.sm} * 2)`;

export const textarea = style({
  // Belt-and-suspenders on top of Textarea.css.ts's own border-box fix:
  // this is the property that actually caused the attach button to overlap
  // the input (the textarea painted wider than the width flexbox allocated
  // to its wrapper), so it's asserted explicitly here too rather than
  // relying solely on cascade order between this file and Textarea.css.ts.
  boxSizing: "border-box",
  width: "100%",
  resize: "none",
  maxHeight: textareaMaxHeight,
  overflowY: "auto"
});

export const inputControls = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  // The button row is a fixed-width sibling of the flex:1 textarea, not a
  // competitor for its space — without this, default flex-shrink:1 would
  // let the buttons shrink (and reflow/clip) before the textarea gives up
  // any of its already-minimal allocated width.
  flexShrink: 0
});

export const visuallyHidden = style({
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0
});

export const micActive = style({
  color: vars.color.danger
});

export const speechErrorText = style({
  fontSize: vars.font.sizeXs,
  color: vars.color.danger
});

export const attachmentsPanel = style({
  paddingLeft: vars.space.lg,
  paddingRight: vars.space.lg,
  paddingBottom: vars.space.sm
});

export const messageAttachments = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space.xs
});

export const attachmentImage = style({
  maxWidth: "200px",
  maxHeight: "160px",
  borderRadius: vars.radius.md,
  display: "block"
});

export const attachmentFileChip = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space.xs,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.sm,
  background: "rgba(0, 0, 0, 0.08)",
  fontSize: vars.font.sizeSm,
  color: "inherit",
  textDecoration: "none"
});

// highlight.js's own theme stylesheets hardcode a fixed palette that doesn't
// respond to this library's theme switching — instead of shipping one of
// those, its class names are remapped onto this library's existing vars.*
// color tokens so code blocks stay in sync with light/dark and any custom
// theme package. Limitation: highlight.js emits several dozen fine-grained
// token classes (per-language even), and this library's palette only has a
// handful of semantic colors (text/textMuted/primary/success/warning/danger)
// to spread across them — several distinct token kinds necessarily share a
// color below rather than each getting a unique hue, which a dedicated
// syntax-highlighting palette would avoid.
globalStyle(`${bubble} .hljs`, {
  background: "transparent",
  padding: 0
});
globalStyle(`${bubble} .hljs-comment, ${bubble} .hljs-quote`, {
  color: vars.color.textMuted,
  fontStyle: "italic"
});
globalStyle(
  `${bubble} .hljs-keyword, ${bubble} .hljs-selector-tag, ${bubble} .hljs-subst, ${bubble} .hljs-doctag`,
  { color: vars.color.primary, fontWeight: vars.font.weightMedium }
);
globalStyle(`${bubble} .hljs-string, ${bubble} .hljs-regexp, ${bubble} .hljs-addition`, {
  color: vars.color.success
});
globalStyle(`${bubble} .hljs-number, ${bubble} .hljs-literal, ${bubble} .hljs-symbol`, {
  color: vars.color.warning
});
globalStyle(`${bubble} .hljs-deletion`, { color: vars.color.danger });
globalStyle(
  `${bubble} .hljs-title, ${bubble} .hljs-section, ${bubble} .hljs-name, ${bubble} .hljs-selector-id, ${bubble} .hljs-selector-class`,
  { color: vars.color.text, fontWeight: vars.font.weightBold }
);
globalStyle(`${bubble} .hljs-attr, ${bubble} .hljs-attribute, ${bubble} .hljs-variable, ${bubble} .hljs-template-variable`, {
  color: vars.color.warning
});
globalStyle(`${bubble} .hljs-type, ${bubble} .hljs-built_in, ${bubble} .hljs-class .hljs-title`, {
  color: vars.color.primary
});
globalStyle(`${bubble} .hljs-emphasis`, { fontStyle: "italic" });
globalStyle(`${bubble} .hljs-strong`, { fontWeight: vars.font.weightBold });
