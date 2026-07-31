/** Strips rendered HTML down to plain text — used for the "Copy" action (never copy raw markdown/HTML) and the streaming-complete aria-live announcement. */
export function htmlToPlainText(html: string): string {
  if (typeof document === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent ?? "").trim();
}

export function truncate(text: string, maxLength: number): string {
  const collapsed = text.replace(/\s+/g, " ");
  return collapsed.length > maxLength ? `${collapsed.slice(0, maxLength)}…` : collapsed;
}
