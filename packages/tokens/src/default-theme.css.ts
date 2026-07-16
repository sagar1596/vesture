import { createTheme } from "@vanilla-extract/css";
import { vars } from "./contract.css";

export const defaultThemeClass = createTheme(vars, {
  color: {
    background: "#ffffff",
    surface: "#f7f7f8",
    surfaceRaised: "#ffffff",
    text: "#18181b",
    textMuted: "#6b7280",
    textInverse: "#ffffff",
    primary: "#18181b",
    primaryHover: "#27272a",
    primaryActive: "#3f3f46",
    primaryText: "#ffffff",
    // Darkened from Tailwind's green-600/amber-600 so white text on a solid
    // success/warning background (e.g. Badge) meets WCAG AA (4.5:1).
    success: "#15803d",
    warning: "#b45309",
    danger: "#dc2626",
    border: "#e4e4e7",
    borderStrong: "#d4d4d8",
    focusRing: "#2563eb"
  },
  space: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px"
  },
  radius: {
    none: "0px",
    sm: "4px",
    md: "8px",
    lg: "16px",
    full: "9999px"
  },
  shadow: {
    none: "none",
    sm: "0 1px 2px rgba(0, 0, 0, 0.06)",
    md: "0 4px 8px rgba(0, 0, 0, 0.08)",
    lg: "0 12px 24px rgba(0, 0, 0, 0.12)",
    focus: "0 0 0 3px rgba(37, 99, 235, 0.4)"
  },
  border: {
    width: "1px",
    widthStrong: "2px",
    style: "solid"
  },
  font: {
    display:
      '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
    body: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
    mono: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    sizeXs: "12px",
    sizeSm: "14px",
    sizeMd: "16px",
    sizeLg: "20px",
    sizeXl: "24px",
    weightRegular: "400",
    weightMedium: "500",
    weightBold: "700",
    lineHeightTight: "1.2",
    lineHeightNormal: "1.5"
  },
  motion: {
    durationFast: "100ms",
    durationNormal: "200ms",
    easing: "cubic-bezier(0.4, 0, 0.2, 1)"
  }
});

export const defaultThemeVars = vars;
