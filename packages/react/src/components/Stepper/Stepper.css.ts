import { style } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const root = style({
  display: "flex",
  fontFamily: vars.font.body,
  selectors: {
    '&[data-orientation="horizontal"]': {
      flexDirection: "row",
      alignItems: "flex-start"
    },
    '&[data-orientation="vertical"]': {
      flexDirection: "column"
    }
  }
});

export const step = style({
  display: "flex",
  selectors: {
    [`${root}[data-orientation="horizontal"] &`]: {
      flexDirection: "column",
      alignItems: "center",
      flex: 1
    },
    [`${root}[data-orientation="vertical"] &`]: {
      flexDirection: "row",
      alignItems: "flex-start"
    }
  }
});

export const nodeLine = style({
  display: "flex",
  alignItems: "center",
  selectors: {
    [`${root}[data-orientation="horizontal"] &`]: {
      flexDirection: "row",
      width: "100%"
    },
    [`${root}[data-orientation="vertical"] &`]: {
      flexDirection: "column",
      alignSelf: "stretch"
    }
  }
});

export const node = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "32px",
  height: "32px",
  borderRadius: vars.radius.full,
  fontSize: vars.font.sizeSm,
  fontWeight: vars.font.weightMedium,
  borderWidth: vars.border.width,
  borderStyle: vars.border.style,
  background: "none",
  cursor: "default",
  padding: 0,
  fontFamily: "inherit",
  selectors: {
    '&[data-state="completed"]': {
      background: vars.color.primary,
      borderColor: vars.color.primary,
      color: vars.color.primaryText
    },
    '&[data-state="active"]': {
      background: vars.color.background,
      borderColor: vars.color.primary,
      borderWidth: vars.border.widthStrong,
      color: vars.color.primary
    },
    '&[data-state="upcoming"]': {
      background: vars.color.background,
      borderColor: vars.color.border,
      color: vars.color.textMuted
    },
    "button&:focus-visible": {
      boxShadow: vars.shadow.focus
    },
    "button&": {
      cursor: "pointer"
    }
  }
});

export const connector = style({
  background: vars.color.border,
  flexShrink: 0,
  selectors: {
    [`${root}[data-orientation="horizontal"] &`]: {
      height: "2px",
      flex: 1,
      marginLeft: vars.space.xs,
      marginRight: vars.space.xs
    },
    [`${root}[data-orientation="vertical"] &`]: {
      width: "2px",
      flex: 1,
      minHeight: vars.space.lg,
      marginTop: vars.space.xs,
      marginBottom: vars.space.xs
    },
    '&[data-filled="true"]': {
      background: vars.color.primary
    }
  }
});

export const content = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
  selectors: {
    [`${root}[data-orientation="horizontal"] &`]: {
      alignItems: "center",
      textAlign: "center",
      marginTop: vars.space.sm,
      paddingBottom: vars.space.md
    },
    [`${root}[data-orientation="vertical"] &`]: {
      marginLeft: vars.space.sm,
      paddingBottom: vars.space.lg
    }
  }
});

export const label = style({
  fontSize: vars.font.sizeSm,
  fontWeight: vars.font.weightMedium,
  color: vars.color.text
});

export const description = style({
  fontSize: vars.font.sizeXs,
  color: vars.color.textMuted
});
