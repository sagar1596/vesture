import { createThemeContract } from "@vanilla-extract/css";

export const vars = createThemeContract({
  color: {
    background: null,
    surface: null,
    surfaceRaised: null,
    text: null,
    textMuted: null,
    textInverse: null,
    primary: null,
    primaryHover: null,
    primaryActive: null,
    primaryText: null,
    success: null,
    warning: null,
    danger: null,
    border: null,
    borderStrong: null,
    focusRing: null
  },
  space: {
    xs: null,
    sm: null,
    md: null,
    lg: null,
    xl: null,
    "2xl": null
  },
  radius: {
    none: null,
    sm: null,
    md: null,
    lg: null,
    full: null
  },
  shadow: {
    none: null,
    sm: null,
    md: null,
    lg: null,
    focus: null
  },
  border: {
    width: null,
    widthStrong: null,
    style: null
  },
  font: {
    display: null,
    body: null,
    mono: null,
    sizeXs: null,
    sizeSm: null,
    sizeMd: null,
    sizeLg: null,
    sizeXl: null,
    weightRegular: null,
    weightMedium: null,
    weightBold: null,
    lineHeightTight: null,
    lineHeightNormal: null
  },
  motion: {
    durationFast: null,
    durationNormal: null,
    easing: null
  },
  // Tokens consumed by future Chart components. series1-8 is a fixed-order
  // categorical palette (createThemeContract has no array support, hence the
  // numbered keys) — assign by slot index, never cycle or reassign on filter.
  // grid/axis are chrome and should recede against the background. The
  // tooltip* trio styles the chart's floating tooltip layer. Every theme
  // package must implement all of these fields or createTheme() will fail
  // to compile.
  chart: {
    series1: null,
    series2: null,
    series3: null,
    series4: null,
    series5: null,
    series6: null,
    series7: null,
    series8: null,
    grid: null,
    axis: null,
    tooltipBackground: null,
    tooltipText: null,
    tooltipBorder: null,
    emptyState: null
  }
});
