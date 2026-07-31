import DOMPurify from "dompurify";

// Allowlist scoped to what `marked` actually emits for standard markdown —
// deliberately not reusing RichTextEditor's allowlist, since that one is
// shaped by a contentEditable toolbar (execCommand output, inline style for
// color-picker) rather than markdown source. Chat messages are never
// contentEditable, so there's no style/font-size/color surface to allow at
// all — headings, paragraphs, lists, emphasis, code, blockquotes, links,
// and tables (marked's GFM table extension) cover markdown's real output
// shape and nothing more.
const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "br",
  "hr",
  "strong",
  "b",
  "em",
  "i",
  "del",
  "s",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "code",
  "pre",
  "span",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th"
];

const ALLOWED_ATTR = ["href", "target", "rel", "class"];

export function sanitizeChatHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false
  });
}
