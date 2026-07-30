import DOMPurify from "dompurify";

// Mirrors RichTextEditor/sanitize.ts's philosophy: allow exactly what this
// component's own DOM manipulation can produce, nothing broader. The
// contentEditable surface here only ever contains plain text, line breaks,
// and non-editable mention chip spans (see MentionsInput.tsx's
// `selectMention`) — no formatting, links, images, or tables, so the
// allowlist is much narrower than RichTextEditor's.
const ALLOWED_TAGS = ["span", "br"];

// Mention chips are styled purely via an attribute selector
// (`span[data-mention-id]` in MentionsInput.css.ts), not a persisted class
// name, so `class` deliberately isn't in this allowlist — one less attribute
// surface to sanitize, and it sidesteps vanilla-extract's hashed class names
// not being stable/meaningful content to round-trip through `value` anyway.
const ALLOWED_ATTR = ["contenteditable", "data-mention-id", "data-mention-label", "data-mention-avatar"];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false
  });
}
