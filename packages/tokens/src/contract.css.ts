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
  }
});
