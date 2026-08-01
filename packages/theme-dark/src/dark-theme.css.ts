import { createTheme } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const darkThemeClass = createTheme(vars, {
  color: {
    background: "#0b0b12",
    surface: "#16161f",
    surfaceRaised: "#1e1e2a",
    text: "#eef0f6",
    // 7.5:1 against background — comfortably above AA for secondary text,
    // while staying clearly duller than `text` itself.
    textMuted: "#9aa0b4",
    // NOT literally "white" the way the light default/retro themes use
    // textInverse. Tooltip.css.ts sets its background to `vars.color.text`
    // — in a light theme that's a dark color, so a light textInverse reads
    // on it. Here `text` is near-white, so Tooltip's background resolves to
    // a light surface (a common real dark-mode pattern — macOS/GitHub dark
    // tooltips are lighter than the surrounding chrome, not darker), and
    // textInverse must invert the other way to stay legible on it. Also
    // double-checked against Timeline's marker (background: textMuted) and
    // PieChart/Scheduler's per-series/per-event color fills: the chart
    // palette below was chosen bright enough that this dark textInverse
    // still clears 4.5:1 against every series color, not just textMuted.
    textInverse: "#14141c",
    // Indigo-600 — 6.29:1 with white primaryText, comfortably clears AA
    // (checked via WCAG relative-luminance contrast, not eyeballed).
    primary: "#4f46e5",
    primaryHover: "#6355ea",
    primaryActive: "#4338ca",
    primaryText: "#ffffff",
    // success/warning/danger reuse the same darkened-from-Tailwind values as
    // the default theme (checked independently here since primaryText is
    // shared across all four Badge variants): white text clears 4.5:1 on
    // every one of them (success 5.02:1, warning 5.02:1, danger 4.83:1).
    success: "#15803d",
    warning: "#b45309",
    danger: "#dc2626",
    border: "#26262f",
    borderStrong: "#34343f",
    // Brighter than `primary` on purpose — a focus ring needs to read at a
    // glance against a near-black background, not just pass a contrast
    // formula against the thing it's ringing.
    focusRing: "#818cf8"
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
    md: "10px",
    lg: "20px",
    full: "9999px"
  },
  // Soft blurred shadows still read here because they sit against a
  // component's own (slightly lighter) surface/surfaceRaised tone, not
  // directly against the near-black page background — same reasoning the
  // default theme uses, just re-verified for this palette rather than
  // assumed to transfer.
  shadow: {
    none: "none",
    sm: "0 1px 2px rgba(0, 0, 0, 0.6)",
    md: "0 4px 12px rgba(0, 0, 0, 0.5)",
    lg: "0 16px 32px rgba(0, 0, 0, 0.55)",
    focus: "0 0 0 3px rgba(129, 140, 248, 0.45)"
  },
  border: {
    width: "1px",
    widthStrong: "2px",
    style: "solid"
  },
  font: {
    display: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
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
  },
  chart: {
    // 8-slot categorical palette using vivid/"-400"-weight hues (rather than
    // the darker/"-600"-weight hues a light theme needs) so each series pops
    // against the near-black background instead of washing out. Spread
    // across the hue wheel (blue/green/amber/violet/red/cyan/orange/pink) to
    // keep adjacent slots distinguishable; not run through a formal CVD
    // simulator the way the default/retro palettes' code comments describe,
    // so treat this as a reasonable first pass, not re-validated to the same
    // rigor.
    series1: "#60a5fa",
    series2: "#34d399",
    series3: "#fbbf24",
    series4: "#a78bfa",
    series5: "#f87171",
    series6: "#22d3ee",
    series7: "#fb923c",
    series8: "#f472b6",
    // Chrome, not data — deliberately low-contrast against `background`,
    // same rationale the theming docs give for the default theme's grid/axis.
    grid: "#1f1f2b",
    axis: "#3a3a48",
    // Echoes Popover's floating-surface treatment (surfaceRaised + text + border).
    tooltipBackground: "#1e1e2a",
    tooltipText: "#eef0f6",
    tooltipBorder: "#26262f",
    // Same value as color.textMuted — a muted placeholder, not an unrelated gray.
    emptyState: "#9aa0b4"
  }
});

export const darkThemeVars = vars;
