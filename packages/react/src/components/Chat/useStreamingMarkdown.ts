import { useEffect, useRef, useState } from "react";
import { renderMarkdown } from "./markdown";

const STREAM_PARSE_INTERVAL_MS = 80;

/**
 * Re-parsing markdown (marked + DOMPurify) on every single token appended by
 * a consumer's SSE/stream handler can fire many times a second for a fast
 * model response — janky for no visual benefit at that rate. While
 * `streaming` is true this throttles re-parses to roughly once per
 * STREAM_PARSE_INTERVAL_MS (schedule-if-none-pending, not a resetting
 * debounce, so a continuous stream of updates still gets flushed
 * periodically instead of only once at the very end). Once streaming ends,
 * the final content is parsed immediately so nothing is left stale.
 */
export function useStreamingMarkdown(content: string, streaming: boolean | undefined): string {
  const [html, setHtml] = useState(() => renderMarkdown(content));
  const latestContent = useRef(content);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  latestContent.current = content;

  useEffect(() => {
    if (!streaming) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setHtml(renderMarkdown(content));
      return;
    }

    if (timerRef.current) return;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setHtml(renderMarkdown(latestContent.current));
    }, STREAM_PARSE_INTERVAL_MS);
    // Deliberately no cleanup clearing this timeout on every content change —
    // that would turn the throttle into a resetting debounce that never
    // fires during a continuous stream. Only unmount (below) clears it.
  }, [content, streaming]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return html;
}
