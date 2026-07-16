# @vesture/tokens

The design token **contract** for Vesture. This package defines the shape every
theme must implement, and ships one reference implementation (`defaultThemeClass`)
— a clean, neutral theme with no brand opinion.

## What this is

- A [vanilla-extract](https://vanilla-extract.style/) `createThemeContract` (`vars`)
  describing every token a Vesture component may reference: color, space, radius,
  shadow, border, font, and motion.
- One `createTheme` implementation of that contract (`defaultThemeClass` /
  `defaultThemeVars`) with restrained, neutral values suitable as a fallback or
  starting point.
- Framework-agnostic. No React (or any UI framework) import anywhere in this
  package. `@vesture/react`, `@vesture/angular`, and every `@vesture/theme-*`
  package depend on this contract, not the other way around.

## What this is *not*

This package has **zero runtime styling opinion of its own** beyond the one
reference theme. It doesn't render anything, doesn't ship components, and isn't
where "brand" decisions (like `@vesture/theme-retro`) live. Its only job is to
define the token contract and provide a neutral default.

## Usage

```ts
import { vars, defaultThemeClass } from "@vesture/tokens";

// apply the default theme's CSS class to a root element
document.documentElement.classList.add(defaultThemeClass);

// reference tokens from any vanilla-extract stylesheet
import { style } from "@vanilla-extract/css";

export const button = style({
  background: vars.color.primary,
  color: vars.color.primaryText,
  borderRadius: vars.radius.md
});
```

## Implementing a new theme

A theme package (e.g. `@vesture/theme-retro`) implements the same contract with
its own values:

```ts
import { createTheme } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";

export const [retroThemeClass, retroThemeVars] = createTheme(vars, {
  color: {
    background: "#fdf6e3",
    // ...every other token in the contract, fully implemented
  },
  space: { /* ... */ },
  radius: { /* ... */ },
  shadow: { /* ... */ },
  border: { /* ... */ },
  font: { /* ... */ },
  motion: { /* ... */ }
});
```

`createTheme` requires every token in the contract to be provided — TypeScript
and vanilla-extract will error on any missing value, so a theme package can't
drift from the contract silently.

## Consuming raw CSS

If your build doesn't run vanilla-extract itself, import the pre-compiled
stylesheet directly:

```ts
import "@vesture/tokens/styles.css";
```
