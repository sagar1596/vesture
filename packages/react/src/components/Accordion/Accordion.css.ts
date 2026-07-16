import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  display: "flex",
  flexDirection: "column",
  borderRadius: vars.radius.lg,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  borderColor: vars.color.border,
  overflow: "hidden"
});

export const item = style({
  borderBottomWidth: vars.border.width,
  borderBottomStyle: vars.border.style,
  borderBottomColor: vars.color.border,
  selectors: {
    "&:last-child": {
      borderBottomWidth: 0
    }
  }
});

export const trigger = style({
  display: "flex",
  width: "100%",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space.sm,
  border: "none",
  background: vars.color.surface,
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeMd,
  fontWeight: vars.font.weightMedium,
  padding: vars.space.md,
  cursor: "pointer",
  textAlign: "left",
  selectors: {
    "&:hover": {
      background: vars.color.surfaceRaised
    },
    "&:focus-visible": {
      boxShadow: vars.shadow.focus
    }
  }
});

export const icon = style({
  flexShrink: 0,
  transitionProperty: "transform",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "[data-open='true'] > &": {
      transform: "rotate(180deg)"
    }
  }
});

export const contentWrapper = style({
  display: "grid",
  gridTemplateRows: "0fr",
  transitionProperty: "grid-template-rows",
  transitionDuration: vars.motion.durationNormal,
  transitionTimingFunction: vars.motion.easing,
  selectors: {
    "&[data-open='true']": {
      gridTemplateRows: "1fr"
    }
  }
});

export const contentInner = style({
  overflow: "hidden",
  minHeight: 0
});

export const contentBody = style({
  padding: vars.space.md,
  paddingTop: 0,
  color: vars.color.textMuted,
  fontFamily: vars.font.body,
  fontSize: vars.font.sizeSm,
  lineHeight: vars.font.lineHeightNormal
});
