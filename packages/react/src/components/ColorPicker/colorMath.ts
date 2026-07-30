// Pure color-conversion math for ColorPicker, kept independent of any DOM/React
// concerns so it can be unit tested directly (see colorMath.test.ts) and reused
// by both the gradient square (HSL) and the hue strip.

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value);
}

/** Normalizes any hex string (`#abc`, `#aabbcc`, with or without `#`) to lowercase `#rrggbb`, or null if invalid. */
export function normalizeHex(hex: string): string | null {
  const trimmed = hex.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
    const expanded = trimmed
      .split("")
      .map((c) => c + c)
      .join("");
    return `#${expanded.toLowerCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed.toLowerCase()}`;
  }
  return null;
}

export function isValidHex(hex: string): boolean {
  return normalizeHex(hex) !== null;
}

export function hexToRgb(hex: string): RGB | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  return { r, g, b };
}

function componentToHex(value: number): string {
  const clamped = clamp(round(value), 0, 255);
  return clamped.toString(16).padStart(2, "0");
}

export function rgbToHex({ r, g, b }: RGB): string {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rN) {
      h = 60 * (((gN - bN) / delta) % 6);
    } else if (max === gN) {
      h = 60 * ((bN - rN) / delta + 2);
    } else {
      h = 60 * ((rN - gN) / delta + 4);
    }
  }
  if (h < 0) h += 360;

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return { h: round(h), s: round(s * 100), l: round(l * 100) };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const hN = ((h % 360) + 360) % 360;
  const sN = clamp(s, 0, 100) / 100;
  const lN = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((hN / 60) % 2) - 1));
  const m = lN - c / 2;

  let rP = 0;
  let gP = 0;
  let bP = 0;

  if (hN < 60) {
    rP = c;
    gP = x;
  } else if (hN < 120) {
    rP = x;
    gP = c;
  } else if (hN < 180) {
    gP = c;
    bP = x;
  } else if (hN < 240) {
    gP = x;
    bP = c;
  } else if (hN < 300) {
    rP = x;
    bP = c;
  } else {
    rP = c;
    bP = x;
  }

  return {
    r: round((rP + m) * 255),
    g: round((gP + m) * 255),
    b: round((bP + m) * 255)
  };
}

export function hexToHsl(hex: string): HSL | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb) : null;
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

/** Formats a hex color for display in the given text format. Returns "" for an invalid hex. */
export function formatColor(hex: string, format: "hex" | "rgb" | "hsl"): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";
  if (format === "hex") {
    return normalizeHex(hex) ?? "";
  }
  if (format === "rgb") {
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }
  const hsl = rgbToHsl(rgb);
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/**
 * Parses a color string typed by the user (in any supported format, not just
 * the currently-configured one — e.g. pasting a hex value while in "rgb" mode
 * still works) into a normalized `#rrggbb` hex string, or null if unparsable.
 */
export function parseColorString(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;

  const hex = normalizeHex(trimmed);
  if (hex) return hex;

  const rgbMatch = trimmed.match(
    /^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*[\d.]+\s*)?\)$/i
  );
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return rgbToHex({ r: Number(r), g: Number(g), b: Number(b) });
  }

  const hslMatch = trimmed.match(
    /^hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*(?:,\s*[\d.]+\s*)?\)$/i
  );
  if (hslMatch) {
    const [, h, s, l] = hslMatch;
    return hslToHex({ h: Number(h), s: Number(s), l: Number(l) });
  }

  return null;
}
