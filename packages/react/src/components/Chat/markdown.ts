import { Marked } from "marked";
import { sanitizeChatHtml } from "./sanitize";

// A dedicated Marked instance (not the module-level default export) so this
// renderer customization can't leak into or be affected by any other
// component that might also import `marked` in the future.
const marked = new Marked({
  gfm: true,
  breaks: true
});

// Links open in a new tab with noopener/noreferrer — DOMPurify's default
// URI-safety check still applies to `href` afterwards (javascript: etc. get
// stripped), this only adds the safe target/rel attributes marked doesn't
// set on its own.
marked.use({
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${title}"` : "";
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
    // Left as a plain <pre><code class="language-x"> here — phase 3 attaches
    // a syntax highlighter as a post-processing pass over class="language-*"
    // blocks (see highlightCodeBlocks in codeHighlight.ts) rather than this
    // renderer, so the markdown parse itself stays fast and highlighter-agnostic.
    code({ text, lang }) {
      const langClass = lang ? ` class="language-${lang.split(/\s/)[0]}"` : "";
      const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<pre><code${langClass}>${escaped}</code></pre>`;
    }
  }
});

/** Parses markdown to sanitized HTML. Synchronous — no async marked extensions are registered. */
export function renderMarkdown(source: string): string {
  const html = marked.parse(source, { async: false }) as string;
  return sanitizeChatHtml(html);
}
