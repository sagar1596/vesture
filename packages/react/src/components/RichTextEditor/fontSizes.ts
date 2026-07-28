import { vars } from "@vesture/tokens";

export interface FontSizeOption {
  label: string;
  /** A vanilla-extract CSS var reference, e.g. "var(--vesture-font-sizeMd)". */
  tokenValue: string;
}

// A small size-select mapped to token names, not arbitrary pixel input —
// keeps font sizing on the same scale as every other component instead of
// letting the document accumulate one-off pixel values.
export const FONT_SIZE_OPTIONS: FontSizeOption[] = [
  { label: "Small", tokenValue: vars.font.sizeXs },
  { label: "Normal", tokenValue: vars.font.sizeSm },
  { label: "Medium", tokenValue: vars.font.sizeMd },
  { label: "Large", tokenValue: vars.font.sizeLg },
  { label: "Extra large", tokenValue: vars.font.sizeXl }
];

// execCommand('fontSize', ...) always emits a legacy <font size="N"> wrapper
// (1-7 numeric scale) regardless of styleWithCSS mode — there is no
// execCommand path to a real CSS size. "7" is used here purely as a unique,
// addressable marker: applying it, then immediately finding every
// <font size="7"> it just created and replacing each with a
// <span style="font-size: Xpx"> using an actual resolved token value, is
// the standard workaround for execCommand's font-size limitations.
export const FONT_SIZE_MARKER = "7";

/**
 * Resolves a vanilla-extract CSS var reference (e.g. "var(--vesture-font-
 * sizeMd)") to its current computed pixel value (e.g. "16px"), by measuring
 * a throwaway probe element rather than parsing the var() string — this
 * output is meant to be portable HTML that can be stored/displayed outside
 * the app's own theme context, so it embeds a resolved pixel value rather
 * than a token reference that would only render correctly inside a
 * Vesture-themed page.
 */
export function resolveFontSizePx(tokenValue: string, contextEl: HTMLElement): string {
  const probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.fontSize = tokenValue;
  contextEl.appendChild(probe);
  const resolved = getComputedStyle(probe).fontSize;
  probe.remove();
  return resolved || "16px";
}
