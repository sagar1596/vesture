import { createTheme } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const retroThemeClass = createTheme(vars, {
  color: {
    background: "#faf3e8",
    surface: "#f2e6d3",
    surfaceRaised: "#fffdf8",
    text: "#3b2a1a",
    textMuted: "#8a7561",
    textInverse: "#fffdf8",
    primary: "#c1502e",
    primaryHover: "#a8431f",
    primaryActive: "#8f3818",
    primaryText: "#fffdf8",
    success: "#4c7a4c",
    // Darkened so white text on a solid warning background (e.g. Badge)
    // meets WCAG AA (4.5:1) — the lighter ochre failed at ~2.9:1.
    warning: "#8f5f1f",
    danger: "#b13c30",
    border: "#e2d3ba",
    borderStrong: "#cbb590",
    focusRing: "#c1502e"
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
    sm: "6px",
    md: "12px",
    lg: "20px",
    full: "9999px"
  },
  shadow: {
    none: "none",
    sm: "0 1px 2px rgba(59, 42, 26, 0.12)",
    md: "0 4px 10px rgba(59, 42, 26, 0.16)",
    lg: "0 14px 28px rgba(59, 42, 26, 0.22)",
    focus: "0 0 0 3px rgba(193, 80, 46, 0.35)"
  },
  border: {
    width: "2px",
    widthStrong: "3px",
    style: "solid"
  },
  font: {
    display: '"Georgia", "Times New Roman", serif',
    body: '"Verdana", "Geneva", sans-serif',
    mono: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    sizeXs: "12px",
    sizeSm: "14px",
    sizeMd: "16px",
    sizeLg: "20px",
    sizeXl: "24px",
    weightRegular: "400",
    weightMedium: "600",
    weightBold: "700",
    lineHeightTight: "1.2",
    lineHeightNormal: "1.5"
  },
  motion: {
    durationFast: "120ms",
    durationNormal: "220ms",
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)"
  },
  chart: {
    // Warm/vintage 8-slot categorical palette, colorblind-validated the same
    // way as the default theme's (worst adjacent ΔE 18.4 against this
    // theme's #faf3e8 surface). Distinct from primary/success/warning/danger
    // above so a series never reads as a status indicator.
    series1: "#1f6fa8",
    series2: "#1f8a6f",
    series3: "#d1a125",
    series4: "#7a8f2e",
    series5: "#8a4a82",
    series6: "#c0567a",
    series7: "#cf7a2e",
    series8: "#4f4f96",
    grid: "#e2d3ba",
    axis: "#b5a487",
    // Echoes Popover's floating-surface treatment (surfaceRaised + text + border).
    tooltipBackground: "#fffdf8",
    tooltipText: "#3b2a1a",
    tooltipBorder: "#e2d3ba",
    // Same value as color.textMuted — a muted placeholder, not an unrelated gray.
    emptyState: "#8a7561"
  }
});

export const retroThemeVars = vars;
