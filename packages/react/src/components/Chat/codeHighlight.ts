import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import cs from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

// `highlight.js/lib/core` + a curated language subset, not the full bundled
// `highlight.js` package — full-language detection support isn't worth
// hand-rolling (same reasoning as pulling in `marked`/DOMPurify rather than
// writing a parser), but shipping all ~190 languages in every consumer's
// bundle for a chat code block is wasteful. This list covers the languages
// an LLM chat response realistically produces; extend it if a real gap
// shows up.
let registered = false;
function ensureLanguagesRegistered(): void {
  if (registered) return;
  hljs.registerLanguage("javascript", javascript);
  hljs.registerLanguage("typescript", typescript);
  hljs.registerLanguage("python", python);
  hljs.registerLanguage("bash", bash);
  hljs.registerLanguage("shell", bash);
  hljs.registerLanguage("json", json);
  hljs.registerLanguage("css", css);
  hljs.registerLanguage("xml", xml);
  hljs.registerLanguage("html", xml);
  hljs.registerLanguage("sql", sql);
  hljs.registerLanguage("go", go);
  hljs.registerLanguage("rust", rust);
  hljs.registerLanguage("java", java);
  hljs.registerLanguage("csharp", cs);
  hljs.registerLanguage("yaml", yaml);
  hljs.registerLanguage("markdown", markdown);
  registered = true;
}

/**
 * Highlights every `<pre><code>` block under `container` in place. Safe to
 * call after every markdown re-render: `Chat.tsx`'s `dangerouslySetInnerHTML`
 * replaces the bubble's DOM subtree wholesale on each change (React doesn't
 * diff into raw HTML), so the `<code>` nodes found here are always freshly
 * inserted and never already-highlighted — no `data-highlighted` bookkeeping
 * needed to avoid highlight.js's "already highlighted" warning.
 */
export function highlightCodeBlocks(container: HTMLElement): void {
  ensureLanguagesRegistered();
  const blocks = container.querySelectorAll<HTMLElement>("pre code");
  blocks.forEach((block) => {
    hljs.highlightElement(block);
  });
}
