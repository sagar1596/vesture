import DOMPurify from "dompurify";

// Allow exactly what this editor's toolbar can produce, and nothing broader —
// an overly permissive allowlist here defeats the point of sanitizing at all.
// No script, no event-handler attributes, no iframes/svg. table/img were
// added in phase 2; style (color/background-color only, via the
// uponSanitizeAttribute hook below) was added in phase 3 for the color
// picker — both are deliberately narrow additions, not a general loosening.
const ALLOWED_TAGS = [
  "b",
  "strong",
  "i",
  "em",
  "u",
  "s",
  "strike",
  "h1",
  "h2",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "br",
  "p",
  "div",
  "span",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
  "img",
  "pre",
  "code"
];

const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "width", "height", "colspan", "rowspan", "style"];

// DOMPurify's default URI-safety check (blocking javascript:, data: on
// non-image contexts, etc.) already applies to href/src automatically since
// those are recognized URI attributes — no extra handling needed for the
// "javascript: in img src" vector specifically, it's covered by the library
// itself as long as `src` stays in ALLOWED_ATTR.

// style is only ever needed for text/highlight color, font-size, and
// alignment (execCommand's justify* commands apply text-align as an inline
// style, not an attribute, once styleWithCSS is on) — allowing it
// unrestricted would open a real CSS-injection surface (background-image:
// url(), position tricks, etc.), so every style attribute DOMPurify emits is
// rewritten here to keep only these properties, dropping everything else,
// including any property this allowlist doesn't know about.
const ALLOWED_STYLE_PROPERTIES = new Set(["color", "background-color", "font-size", "text-align"]);

// Property-name filtering alone isn't enough: a legacy IE CSS attack like
// `color: expression(alert(1))` uses an *allowed* property name with a
// dangerous value. Reject the whole declaration if its value contains any
// of these regardless of which property it's attached to.
const DANGEROUS_VALUE_PATTERN = /expression\s*\(|javascript:|url\s*\(/i;

function filterStyleAttribute(value: string): string {
  return value
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .filter((declaration) => {
      const [property, ...rest] = declaration.split(":");
      if (property === undefined || !ALLOWED_STYLE_PROPERTIES.has(property.trim().toLowerCase())) return false;
      const propertyValue = rest.join(":");
      return !DANGEROUS_VALUE_PATTERN.test(propertyValue);
    })
    .join("; ");
}

DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
  if (data.attrName !== "style") return;
  const filtered = filterStyleAttribute(data.attrValue);
  if (filtered) {
    data.attrValue = filtered;
  } else {
    data.keepAttr = false;
  }
});

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false
  });
}
