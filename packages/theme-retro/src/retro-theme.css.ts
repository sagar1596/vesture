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
  // Sharper than the default theme's sm:4/md:8/lg:12, not softer. Heavy
  // rounding reads as "modern SaaS" (think current-day mobile app icons);
  // vintage/poster/diner-sign design references (postcards, matchbooks,
  // enamel signage) skew toward crisp or only lightly eased corners. Paired
  // with the hard offset shadows below, sharp corners sell the "printed
  // card/sticker" read — a soft-rounded card with a hard drop shadow looks
  // like a bug, not an aesthetic.
  radius: {
    none: "0px",
    sm: "2px",
    md: "4px",
    lg: "8px",
    full: "9999px"
  },
  // Hard, solid-edged "poster/sticker" offset shadows (no blur, high
  // opacity) instead of the soft blurred rgba shadows other themes use —
  // offset scales sm→lg the same relative way the old blur radii did.
  // `focus` stays a soft blurred ring on purpose: its job is accessibility
  // signaling, not aesthetic consistency with the other shadows.
  shadow: {
    none: "none",
    sm: "2px 2px 0 0 rgba(59, 42, 26, 0.85)",
    md: "4px 4px 0 0 rgba(59, 42, 26, 0.85)",
    lg: "8px 8px 0 0 rgba(59, 42, 26, 0.85)",
    focus: "0 0 0 3px rgba(193, 80, 46, 0.35)"
  },
  border: {
    width: "2px",
    // 3px read as thin rather than "chunky" next to the new hard-offset
    // shadows once checked against Toast/Alert's left accent border and
    // Avatar's ring (the actual widthStrong consumers) — 4px reads as a
    // deliberate bold accent instead of an incremental bump.
    widthStrong: "4px",
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
