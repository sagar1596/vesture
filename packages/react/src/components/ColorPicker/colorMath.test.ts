import { describe, expect, it } from "vitest";
import {
  formatColor,
  hexToHsl,
  hexToRgb,
  hslToHex,
  hslToRgb,
  isValidHex,
  normalizeHex,
  parseColorString,
  rgbToHex,
  rgbToHsl
} from "./colorMath";

describe("normalizeHex / isValidHex", () => {
  it("normalizes 3-digit hex to 6-digit lowercase", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("abc")).toBe("#aabbcc");
  });

  it("normalizes 6-digit hex", () => {
    expect(normalizeHex("#2A78D6")).toBe("#2a78d6");
  });

  it("rejects invalid hex", () => {
    expect(normalizeHex("#12345")).toBeNull();
    expect(normalizeHex("not-a-color")).toBeNull();
    expect(isValidHex("#zzzzzz")).toBe(false);
    expect(isValidHex("#2a78d6")).toBe(true);
  });
});

describe("hex <-> rgb round trip", () => {
  const cases = ["#2a78d6", "#000000", "#ffffff", "#eb6834", "#1baf7a"];

  it.each(cases)("round-trips %s through rgb", (hex) => {
    const rgb = hexToRgb(hex);
    expect(rgb).not.toBeNull();
    const backToHex = rgbToHex(rgb!);
    expect(backToHex).toBe(hex);
  });
});

describe("hex <-> hsl round trip", () => {
  const cases = ["#2a78d6", "#000000", "#ffffff", "#eb6834", "#1baf7a", "#808080"];

  it.each(cases)("round-trips %s through hsl within rounding tolerance", (hex) => {
    const hsl = hexToHsl(hex);
    expect(hsl).not.toBeNull();
    const backToHex = hslToHex(hsl!);

    const original = hexToRgb(hex)!;
    const roundTripped = hexToRgb(backToHex)!;
    // Allow +/-2 per channel for HSL rounding error.
    expect(Math.abs(original.r - roundTripped.r)).toBeLessThanOrEqual(2);
    expect(Math.abs(original.g - roundTripped.g)).toBeLessThanOrEqual(2);
    expect(Math.abs(original.b - roundTripped.b)).toBeLessThanOrEqual(2);
  });
});

describe("rgbToHsl / hslToRgb known values", () => {
  it("pure red", () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("pure white", () => {
    expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 });
  });

  it("pure black", () => {
    expect(rgbToHsl({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, l: 0 });
  });
});

describe("formatColor", () => {
  it("formats hex", () => {
    expect(formatColor("#2a78d6", "hex")).toBe("#2a78d6");
  });

  it("formats rgb", () => {
    expect(formatColor("#ff0000", "rgb")).toBe("rgb(255, 0, 0)");
  });

  it("formats hsl", () => {
    expect(formatColor("#ff0000", "hsl")).toBe("hsl(0, 100%, 50%)");
  });

  it("returns empty string for invalid hex", () => {
    expect(formatColor("not-a-color", "hex")).toBe("");
  });
});

describe("parseColorString", () => {
  it("parses hex", () => {
    expect(parseColorString("#2a78d6")).toBe("#2a78d6");
    expect(parseColorString("#abc")).toBe("#aabbcc");
  });

  it("parses rgb()", () => {
    expect(parseColorString("rgb(255, 0, 0)")).toBe("#ff0000");
    expect(parseColorString("rgba(0, 255, 0, 0.5)")).toBe("#00ff00");
  });

  it("parses hsl()", () => {
    expect(parseColorString("hsl(0, 100%, 50%)")).toBe("#ff0000");
  });

  it("returns null for garbage input", () => {
    expect(parseColorString("banana")).toBeNull();
    expect(parseColorString("")).toBeNull();
  });
});
