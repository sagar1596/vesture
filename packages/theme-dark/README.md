# @vesture/theme-dark

A high-contrast dark theme implementing the [`@vesture/tokens`](../tokens)
contract. Every color pair a component actually renders text on top of
(body text on background, `primaryText` on primary/success/warning/danger,
`textInverse` on Tooltip/Timeline/chart-series fills) was checked against
WCAG 2.1 AA (4.5:1) using relative-luminance contrast math, not eyeballed.

## Usage

```ts
import "@vesture/theme-dark/styles.css";
import { darkThemeClass } from "@vesture/theme-dark";

document.documentElement.classList.add(darkThemeClass);
```

Apply the class to `document.documentElement` (or another true ancestor of
`document.body`), not an inner `<div>` — see the
[`@vesture/react` README](../react/README.md#applying-the-theme-class-to-html-not-an-inner-div)
for why this matters when components render through portals (Modal, Tooltip,
Popover, DropdownMenu, Toast).

## A note on `textInverse`

The default and retro themes both set `color.textInverse` to a light/white
value, because in a light theme every surface `textInverse` is drawn against
(Tooltip's background, which is `vars.color.text`; Timeline's marker
background, `vars.color.textMuted`; chart series fills) is dark or
mid-toned. In this theme `text` is near-white, so Tooltip's background
resolves to a **light** surface instead — a real pattern in dark-mode UIs
(macOS and GitHub's dark-mode tooltips are lighter than the surrounding
chrome, not darker). `textInverse` here is dark to stay legible against that,
and the chart palette below was chosen bright enough (6.6:1+ against
`textInverse`) that the same dark value still works everywhere else it's
used.

## What's different from the default theme

- Near-black background/surfaces instead of white, with an indigo primary
  color (`#4f46e5`) instead of near-black-on-white
- A brighter, more saturated 8-slot chart palette suited to a dark
  background instead of the default theme's darker/deeper hues
- Slightly larger border radius; every other structural decision (spacing
  scale, font size scale, line heights) matches the default theme so layout
  holds across all three themes
