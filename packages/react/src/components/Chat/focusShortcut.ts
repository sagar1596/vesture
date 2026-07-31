const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** True while focus is already on something the shortcut shouldn't hijack keystrokes from — including Chat's own input, so typing "/" as message content isn't intercepted. */
export function isEditableElementFocused(): boolean {
  const active = document.activeElement;
  if (!active) return false;
  if (EDITABLE_TAGS.has(active.tagName)) return true;
  if (!(active instanceof HTMLElement)) return false;
  // `isContentEditable` is the real check real browsers implement fully;
  // the attribute fallback covers jsdom (used by this component's tests),
  // whose isContentEditable getter isn't implemented and always reads back
  // `undefined` regardless of the actual contenteditable state.
  if (active.isContentEditable) return true;
  return active.getAttribute("contenteditable") === "true" || active.getAttribute("contenteditable") === "";
}

/**
 * Parses a shortcut string like "/", "mod+k", "ctrl+shift+k" and checks it
 * against a KeyboardEvent. "mod" matches Cmd on macOS and Ctrl elsewhere —
 * the common convention for a single cross-platform "primary" modifier.
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return false;

  const key = parts[parts.length - 1];
  const modifiers = new Set(parts.slice(0, -1));

  const wantMod = modifiers.has("mod");
  const wantCtrl = modifiers.has("ctrl") || modifiers.has("control");
  const wantMeta = modifiers.has("cmd") || modifiers.has("meta");
  const wantShift = modifiers.has("shift");
  const wantAlt = modifiers.has("alt");

  if (wantMod) {
    if (!(event.ctrlKey || event.metaKey)) return false;
  } else {
    if (wantCtrl !== event.ctrlKey) return false;
    if (wantMeta !== event.metaKey) return false;
  }
  if (wantShift !== event.shiftKey) return false;
  if (wantAlt !== event.altKey) return false;

  return event.key.toLowerCase() === key;
}
